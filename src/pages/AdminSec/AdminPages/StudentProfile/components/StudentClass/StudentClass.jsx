import "./StudentClass.css";

const StudentClass = () => {
  // Sample data - you can replace with real data from props
  const classData = {
    name: "Primary 4",
    section: "A",
    teacher: "Ms. Anderson",
    studentCount: 23,
    session: "2025/2026",
  };

  return (
    <div className="studentClass">
      <div className="classHeader">
        <h3 className="classTitle">Current Class</h3>
        <div className="sessionBadge">{classData.session}</div>
      </div>

      <div className="classMainInfo">
        <div className="classIconContainer">
          <div className="classIcon">🎓</div>
        </div>

        <div className="classDetails">
          <h2 className="gradeName">{classData.name}</h2>
        </div>
      </div>

      <div className="performanceCard">
        <div className="performanceItem">
          <div className="performanceLabel">Section</div>
          <div className="performanceValue">{classData.section}</div>
        </div>

        <div className="performanceItem">
          <div className="performanceLabel">Teacher</div>
          <div className="performanceValue">{classData.teacher}</div>
        </div>

        <div className="performanceItem">
          <div className="performanceLabel">Students</div>
          <div className="performanceValue">{classData.studentCount}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentClass;
