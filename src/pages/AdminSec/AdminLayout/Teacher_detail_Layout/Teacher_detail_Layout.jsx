import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";

const Teacher_detail_Layout = ({
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
  );
};

export default Teacher_detail_Layout;
