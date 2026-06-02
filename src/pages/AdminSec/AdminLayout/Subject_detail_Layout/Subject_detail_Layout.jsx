import { useState, useRef } from "react";
import { SubjectSidebar } from "../../Admin_components/UnifiedDetailSidebar/index.jsx";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import "../UnifiedLayout.css";

const Subject_detail_Layout = ({
  title,
  subtitle,
  buttonText,
  fields,
  route,
  data,
  onSubmit,
  onButtonClick,
  children,
}) => {
  console.log("Subject_detail_Layout rendered", { title, subtitle });
  const [open, setOpen] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    if (startX.current < 20 && currentX > 80) {
      setOpen(true);
    }
  };

  const handleTouchEnd = () => {
    startX.current = 0;
  };

  // Extract sessions from data
  const sessionData = data?.sessions || [];

  return (
    <div
      className="apt_main"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle (mobile only via CSS) */}
      <div className="apt_drag_handle" onClick={() => setOpen(true)}>
        <div className="apt_mb"></div>
      </div>

      <div className={`apt_left ${open ? "open" : ""}`}>
        <SubjectSidebar sessionData={sessionData} />
      </div>
      <div className="apt_right" onClick={() => setOpen(false)}>
        <StudentDetailTopTab
          title={title}
          subtitle={subtitle}
          buttonText={buttonText}
          fields={fields}
          route={route}
          data={data}
          onSubmit={onSubmit}
          onButtonClick={onButtonClick}
        >
          {children}
        </StudentDetailTopTab>
      </div>
    </div>
  );
};

export default Subject_detail_Layout;
