import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import "../UnifiedLayout.css";

const Admin_detail_Layout = ({
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

export default Admin_detail_Layout;
