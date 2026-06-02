import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import "./PublicHeader.css";

const getUserInfo = (user) => {
  if (!user) return null;

  // Admin — uses user.admin, photo comes from staff if they also have a staff record
  if (user.admin) {
    const admin = user.admin;
    const name = admin.username || admin.email || "Admin";
    // Admin may also have a staff record with a photo
    const staff = user.staff;
    const photo =
      (typeof staff?.staff_photo === "string" && staff.staff_photo.trim()) ||
      (typeof staff?.staffPhoto === "string" && staff.staffPhoto.trim()) ||
      "";
    return { name, photo, role: admin.admin_role || "Admin" };
  }

  // Teacher / Staff — both live under user.staff
  if (user.teacher || user.staff) {
    const staff = user.staff || user.teacher;
    const name = staff?.full_name || staff?.email || "Staff";
    const photo =
      (typeof staff?.staff_photo === "string" && staff.staff_photo.trim()) ||
      (typeof staff?.staffPhoto === "string" && staff.staffPhoto.trim()) ||
      "";
    const role = user.teacher ? (staff?.position || "Teacher") : (staff?.position || "Staff");
    return { name, photo, role };
  }

  // Student
  if (user.student) {
    const student = user.student;
    const name = student?.full_name || student?.email || "Student";
    const photo =
      (typeof student?.student_photo === "string" && student.student_photo.trim()) ||
      (typeof student?.studentPhoto === "string" && student.studentPhoto.trim()) ||
      "";
    return { name, photo, role: "Student" };
  }

  return null;
};

const getInitials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const PublicHeader = ({ dark = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const headerRef = useRef(null);

  const userInfo = getUserInfo(user);

  // Reset broken state when photo changes
  useEffect(() => { setAvatarBroken(false); }, [userInfo?.photo]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDropdownOpen(false);
  };

  const links = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/docs", label: "Docs" },
    { to: "/contact", label: "Contact Us" },
  ];

  return (
    <header ref={headerRef} className={`pub-header${dark ? " pub-header--white" : ""}`}>
      <div className="pub-header__inner">

        {/* Logo */}
        <button className="pub-header__logo" onClick={() => navigate("/")}>
          Scladapp
        </button>

        {/* Desktop nav */}
        <nav className="pub-header__nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                "pub-header__link" + (isActive ? " pub-header__link--active" : "")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="pub-header__actions">
          {isAuthenticated && userInfo ? (
            <div className="pub-header__profile" ref={dropdownRef}>
              <button
                className="pub-header__profile-btn"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                {userInfo.photo && !avatarBroken ? (
                  <img
                    src={userInfo.photo}
                    alt={userInfo.name}
                    className="pub-header__avatar-img"
                    onError={() => setAvatarBroken(true)}
                  />
                ) : (
                  <span className="pub-header__avatar-initials">
                    {getInitials(userInfo.name)}
                  </span>
                )}
                <div className="pub-header__profile-info">
                  <span className="pub-header__profile-name">{userInfo.name}</span>
                  <span className="pub-header__profile-role">{userInfo.role}</span>
                </div>
                <svg className="pub-header__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="pub-header__dropdown">
                  <div className="pub-header__dropdown-user">
                    <span className="pub-header__dropdown-name">{userInfo.name}</span>
                    <span className="pub-header__dropdown-role">{userInfo.role}</span>
                  </div>
                  <hr className="pub-header__dropdown-divider" />
                  <button
                    className="pub-header__dropdown-item"
                    onClick={() => { navigate(-1); setDropdownOpen(false); }}
                  >
                    Go to Dashboard
                  </button>
                  <button
                    className="pub-header__dropdown-item pub-header__dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="pub-header__btn-ghost" onClick={() => navigate("/login")}>
                Log in
              </button>
              <button className="pub-header__btn-primary" onClick={() => navigate("/setup/1")}>
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="pub-header__hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="pub-header__bar" />
          <span className="pub-header__bar" />
          <span className="pub-header__bar" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="pub-header__mobile-menu">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                "pub-header__mobile-link" + (isActive ? " pub-header__mobile-link--active" : "")
              }
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pub-header__mobile-actions">
            {isAuthenticated && userInfo ? (
              <button
                className="pub-header__btn-ghost"
                onClick={() => { handleLogout(); setMenuOpen(false); }}
              >
                Log out
              </button>
            ) : (
              <>
                <button className="pub-header__btn-ghost" onClick={() => { navigate("/login"); setMenuOpen(false); }}>
                  Log in
                </button>
                <button className="pub-header__btn-primary" onClick={() => { navigate("/setup/1"); setMenuOpen(false); }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
