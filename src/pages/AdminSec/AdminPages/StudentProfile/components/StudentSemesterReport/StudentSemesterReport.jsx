import "./StudentSemesterReport.css";

const StudentSemesterReport = () => {
  // Assessment types configuration - can be easily modified
  const assessmentTypes = [
    { key: "firstTest", label: "1ST TEST", maxScore: 20, className: "test" },
    { key: "secondTest", label: "2ND TEST", maxScore: 20, className: "test" },
    { key: "exam", label: "EXAM", maxScore: 60, className: "exam" },
  ];

  // Sample data structure
  const reportData = {
    semester: "First Semester",
    academicYear: "2025/2026",
    subjects: [
      {
        id: 1,
        name: "Mathematics",
        teacher: "Mr. Johnson",
        firstTest: 18,
        secondTest: 17,
        exam: 50,
        total: 85,
        totalMax: 100,
        grade: "A",
        remarks: "Excellent performance",
      },
      {
        id: 2,
        name: "English Language",
        teacher: "Ms. Smith",
        firstTest: 16,
        secondTest: 15,
        exam: 47,
        total: 78,
        totalMax: 100,
        grade: "B+",
        remarks: "Good progress",
      },
      {
        id: 3,
        name: "Science",
        teacher: "Dr. Brown",
        firstTest: 19,
        secondTest: 18,
        exam: 55,
        total: 92,
        totalMax: 100,
        grade: "A+",
        remarks: "Outstanding work",
      },
      {
        id: 4,
        name: "Social Studies",
        teacher: "Mrs. Davis",
        firstTest: 15,
        secondTest: 14,
        exam: 47,
        total: 76,
        totalMax: 100,
        grade: "B",
        remarks: "Satisfactory",
      },
      {
        id: 5,
        name: "Physical Education",
        teacher: "Coach Wilson",
        firstTest: 18,
        secondTest: 17,
        exam: 53,
        total: 88,
        totalMax: 100,
        grade: "A",
        remarks: "Very active",
      },
    ],
    overallGPA: 3.8,
    totalScore: 419,
    maxScore: 500,
    percentage: 83.8,
    position: 5,
    totalStudents: 45,
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A+":
        return "#10b981";
      case "A":
        return "#059669";
      case "B+":
        return "#3b82f6";
      case "B":
        return "#6366f1";
      case "C+":
        return "#f59e0b";
      case "C":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="studentSemesterReport">
      <div className="reportHeader">
        <div className="reportTitle">
          <h2>Semester Report</h2>
          <p>
            {reportData.semester} • {reportData.academicYear}
          </p>
        </div>

        <div className="reportSummary">
          <div className="summaryCard">
            <div className="summaryLabel">Overall GPA</div>
            <div className="summaryValue">{reportData.overallGPA}</div>
          </div>
          <div className="summaryCard">
            <div className="summaryLabel">Percentage</div>
            <div className="summaryValue">{reportData.percentage}%</div>
          </div>
          <div className="summaryCard">
            <div className="summaryLabel">Position</div>
            <div className="summaryValue">
              {reportData.position}/{reportData.totalStudents}
            </div>
          </div>
        </div>
      </div>

      <div className="subjectsTable">
        <div className="table-wrap">
          <table className="smart-table">
            <thead>
              <tr>
                <th>SUBJECT</th>
                <th>TEACHER</th>
                {assessmentTypes.map((assessment) => (
                  <th key={assessment.key}>{assessment.label}</th>
                ))}
                <th>TOTAL</th>
                <th>GRADE</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>
                    <div className="subjectName">{subject.name}</div>
                  </td>
                  <td>
                    <div className="teacherName">{subject.teacher}</div>
                  </td>
                  {assessmentTypes.map((assessment) => (
                    <td key={assessment.key}>
                      <div className="testScore">
                        {subject[assessment.key]}/{assessment.maxScore}
                      </div>
                    </td>
                  ))}
                  <td>
                    <div className="totalScore">
                      {subject.total}/{subject.totalMax}
                    </div>
                  </td>
                  <td>
                    <div
                      className="gradeValue"
                      style={{
                        backgroundColor: getGradeColor(subject.grade),
                        color: "white",
                      }}
                    >
                      {subject.grade}
                    </div>
                  </td>
                  <td>
                    <div className="remarksText">{subject.remarks}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reportFooter">
        <div className="footerStats">
          <div className="statItem">
            <span className="statLabel">Total Score:</span>
            <span className="statValue">
              {reportData.totalScore}/{reportData.maxScore}
            </span>
          </div>
          <div className="statItem">
            <span className="statLabel">Class Average:</span>
            <span className="statValue">78.5%</span>
          </div>
          <div className="statItem">
            <span className="statLabel">Subjects Passed:</span>
            <span className="statValue">
              {reportData.subjects.length}/{reportData.subjects.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSemesterReport;
