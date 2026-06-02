import { useState, useEffect } from "react";
import { useParams, Routes, Route, Navigate, useLocation } from "react-router-dom";
import useSchool from "../../../../../api_call/useSchool";
import useSchoolGallery from "../../../../../api_call/useSchoolGallery";
import useSchoolResource from "../../../../../api_call/useSchoolResource";
import StudentDetailTopTab from "../../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import CenterModal from "../../../../../components/CenterModal/CenterModal";
import ResourceCard from "../../../../../components/ResourceCard/ResourceCard";
import Button from "../../../../../components/Button/Button";
import "../../../../AdminSec/AdminPages/Communication/Notifications/Notifications.css";
import "../../../../TeacherSec/pages/SubjectDashboard/pages/SubjectInfo/SubjectInfo.css";
import "./SchoolInfo.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

/** Gallery `file_url` may be absolute (Cloudinary) or a relative API path */
const resolveGalleryImageUrl = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") return "";
  const u = fileUrl.trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("/")) return `${API}${u}`;
  return `${API}/${u}`;
};

const EmptyState = ({ message }) => (
  <div className="shi-empty">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="shi-empty-icon">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <p>{message}</p>
  </div>
);

/* ── School Info tab ── */
const InfoTab = ({ schoolId }) => {
  const { getProfile } = useSchool();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    getProfile(schoolId).then((res) => {
      if (res.success) setProfile(res.data);
      setLoading(false);
    });
  }, [schoolId]);

  if (loading) return <LoadingData message="Loading school info..." />;

  const logo = typeof profile?.logo_url === "string" ? profile.logo_url : null;

  return (
    <InnerTabCon>
      <div className="si-overview">
        <div className="si-card">
          {/* Banner */}
          <div className="si-banner">
            <span className="si-banner-deco" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="si-header">
            <div className="si-header-left">
              <div className="si-icon-wrap">
                {logo ? (
                  <img src={logo} alt={profile?.school_name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 17 }} />
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="si-header-text">
                <h3>{profile?.school_name || "School"}</h3>
                <p className="si-subtitle">{profile?.school_id}</p>
                <div className="si-badges">
                  <span className={`si-badge ${profile?.is_active ? "active" : "inactive"}`}>
                    {profile?.is_active ? "✓ Active" : "✗ Inactive"}
                  </span>
                  {profile?.state && <span className="si-badge">{profile.state}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="si-body">
            <div>
              <span className="si-section-title">Contact & Location</span>
              <div className="si-grid">
                {profile?.email        && <div><span className="si-label-text">Email</span><span className="si-value-text">{profile.email}</span></div>}
                {profile?.phone_number && <div><span className="si-label-text">Phone</span><span className="si-value-text">{profile.phone_number}</span></div>}
                {profile?.website      && <div><span className="si-label-text">Website</span><span className="si-value-text">{profile.website}</span></div>}
                {profile?.instagram    && <div><span className="si-label-text">Instagram</span><span className="si-value-text">{profile.instagram}</span></div>}
                {profile?.address      && <div><span className="si-label-text">Address</span><span className="si-value-text">{profile.address}</span></div>}
                {profile?.state        && <div><span className="si-label-text">State</span><span className="si-value-text">{profile.state}</span></div>}
                {profile?.country      && <div><span className="si-label-text">Country</span><span className="si-value-text">{profile.country}</span></div>}
              </div>
            </div>

            {profile?.motto && (
              <div>
                <span className="si-section-title">Motto</span>
                <p className="si-description">"{profile.motto}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

/* ── About (Bio) tab ── */
const BioTab = ({ schoolId }) => {
  const { getBio } = useSchool();
  const [bio, setBio]         = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    getBio(schoolId).then((res) => {
      if (res.success) setBio(res.bio || "");
      setLoading(false);
    });
  }, [schoolId]);

  if (loading) return <LoadingData message="Loading bio..." />;

  return (
    <InnerTabCon>
      {bio ? (
        <div className="shi-card">
          <span className="sc-section-label">About the School</span>
          <div className="shi-bio-content" dangerouslySetInnerHTML={{ __html: bio }} />
        </div>
      ) : (
        <EmptyState message="No bio available for this school yet." />
      )}
    </InnerTabCon>
  );
};

/* ── Resources tab ── */
const ResourcesTab = ({ schoolId }) => {
  const { getBySchool } = useSchoolResource();
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    getBySchool(schoolId, { visibility: "public", limit: 100 }).then((res) => {
      if (res.success) setResources(res.data || []);
      setLoading(false);
    });
  }, [schoolId]);

  const handleDownload = (doc) => {
    window.open(`${API}${doc.file_url}`, "_blank");
  };

  if (loading) return <LoadingData message="Loading resources..." />;

  return (
    <InnerTabCon>
      <div className="notif-header">
        <div className="notif-header-left">
          <h2 className="notif-title">School Resources</h2>
          <p className="notif-subtitle">{resources.length} public file{resources.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {resources.length === 0 ? (
        <EmptyState message="No public resources available yet." />
      ) : (
        <div className="shi-resource-grid">
          {resources.map((doc) => (
            <ResourceCard
              key={doc.resource_id}
              doc={doc}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </InnerTabCon>
  );
};

/* ── Gallery tab ── */
const GalleryTab = ({ schoolId }) => {
  const { getBySchool } = useSchoolGallery();
  const [gallery, setGallery]           = useState([]);
  const [galleryPage, setGalleryPage]   = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [lightbox, setLightbox]         = useState(null);

  const loadGallery = async (page = 1) => {
    setLoading(true);
    const res = await getBySchool(schoolId, { page, limit: 20 });
    if (res.success) {
      setGallery(res.data || []);
      setGalleryTotal(res.pagination?.totalRecords || 0);
      setGalleryPage(page);
    }
    setLoading(false);
  };

  useEffect(() => { if (schoolId) loadGallery(1); }, [schoolId]);

  if (loading) return <LoadingData message="Loading gallery..." />;

  return (
    <InnerTabCon>
      <div className="notif-header">
        <div className="notif-header-left">
          <h2 className="notif-title">School Gallery</h2>
          <p className="notif-subtitle">{galleryTotal} photo{galleryTotal !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {gallery.length === 0 ? (
        <EmptyState message="No gallery images yet." />
      ) : (
        <>
          <div className="shi-gallery-grid">
            {gallery.map((item) => (
              <div key={item.gallery_id} className="shi-gallery-item" onClick={() => setLightbox(item)}>
                <img
                  src={resolveGalleryImageUrl(item.file_url)}
                  alt={item.caption || "Gallery"}
                  className="shi-gallery-img"
                  loading="lazy"
                  decoding="async"
                />
                {item.caption && <p className="shi-gallery-caption">{item.caption}</p>}
              </div>
            ))}
          </div>

          {galleryTotal > 20 && (
            <div className="shi-pagination">
              <Button variant="secondary" onClick={() => loadGallery(galleryPage - 1)} disabled={galleryPage === 1}>
                ← Previous
              </Button>
              <span className="shi-page-info">Page {galleryPage} · {galleryTotal} photos</span>
              <Button variant="secondary" onClick={() => loadGallery(galleryPage + 1)} disabled={gallery.length < 20}>
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      <CenterModal isShow={!!lightbox} onClose={() => setLightbox(null)} size="large">
        {lightbox && (
          <div className="shi-lightbox">
            <img
              src={resolveGalleryImageUrl(lightbox.file_url)}
              alt={lightbox.caption || "Gallery"}
              className="shi-lightbox-img"
            />
            {lightbox.caption && <p className="shi-lightbox-caption">{lightbox.caption}</p>}
            {lightbox.category && <span className="ev-badge ev-badge-grey">{lightbox.category}</span>}
          </div>
        )}
      </CenterModal>
    </InnerTabCon>
  );
};

/* ── Main ── */
const SchoolInfo = () => {
  const { schoolId } = useParams();
  const location = useLocation();
  const { getProfile } = useSchool();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    getProfile(schoolId).then((res) => { if (res.success) setProfile(res.data); });
  }, [schoolId]);

  const basePath = location.pathname.includes("/teacher/")
    ? `/teacher/${schoolId}/school`
    : location.pathname.split("/school/")[0] + `/school/${schoolId}/school`;

  return (
    <StudentDetailTopTab
      title={profile?.school_name || "School"}
      subtitle={profile?.motto ? `"${profile.motto}"` : "School information, resources and gallery"}
      route={[
        { label: "School Info", link: "/info" },
        { label: "About",       link: "/bio" },
        { label: "Resources",   link: "/resources" },
        { label: "Gallery",     link: "/gallery" },
      ]}
    >
      <Routes>
        <Route path="/" element={<Navigate to={`${basePath}/info`} replace />} />
        <Route path="/info"      element={<InfoTab      schoolId={schoolId} />} />
        <Route path="/bio"       element={<BioTab       schoolId={schoolId} />} />
        <Route path="/resources" element={<ResourcesTab schoolId={schoolId} />} />
        <Route path="/gallery"   element={<GalleryTab   schoolId={schoolId} />} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default SchoolInfo;
