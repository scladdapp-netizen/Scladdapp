import { useState, useRef } from "react";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import "../UnifiedLayout.css";

const Staff_detail_Layout = ({
  children,
  title,
  subtitle,
  buttonText,
  fields,
  route,
  data,
  onSubmit,
  onButtonClick,
}) => {
  return (
    <div className="apt_main">
      <div className="apt_right" style={{ width: "100%" }}>
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

export default Staff_detail_Layout;
