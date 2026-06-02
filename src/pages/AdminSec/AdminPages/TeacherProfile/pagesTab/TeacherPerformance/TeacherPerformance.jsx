import { useState } from "react";
import "./TeacherPerformance.css";
import SmartTable from "../../../../../../components/SmartTable/SmartTable";
import Button from "../../../../../../components/Button/Button";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import { Icons } from "../../../../../../utils/icons";

const TeacherPerformance = () => {
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showEvaluationDetailMenu, setShowEvaluationDetailMenu] =
    useState(false);

  // Sample performance evaluation data
  const performanceData = [
    {
      id: 1,
      evaluationType: "Annual Review",
      evaluationPeriod: "2024-2025 Academic Year",
      evaluator: "Dr. Sarah Johnson",
      evaluatorRole: "Principal",
      evaluationDate: "2024-12-01",
      status: "Completed",
      overallRating: "Excellent",
      overallScore: 4.6,
      maxScore: 5.0,
      categories: {
        teachingEffectiveness: {
          score: 4.8,
          rating: "Excellent",
          comments:
            "Demonstrates exceptional teaching methods and student engagement techniques.",
        },
        classroomManagement: {
          score: 4.5,
          rating: "Very Good",
          comments:
            "Maintains excellent discipline and creates a positive learning environment.",
        },
        studentProgress: {
          score: 4.7,
          rating: "Excellent",
          comments:
            "Students show significant improvement in test scores and understanding.",
        },
        professionalism: {
          score: 4.6,
          rating: "Excellent",
          comments:
            "Highly professional in all interactions with students, parents, and colleagues.",
        },
        collaboration: {
          score: 4.4,
          rating: "Very Good",
          comments:
            "Works well with team members and contributes to school initiatives.",
        },
        innovation: {
          score: 4.8,
          rating: "Excellent",
          comments:
            "Consistently introduces new teaching methods and educational technologies.",
        },
      },
      strengths: [
        "Exceptional student engagement",
        "Innovative teaching methods",
        "Strong subject knowledge",
        "Excellent communication skills",
      ],
      areasForImprovement: [
        "Could increase parent communication frequency",
        "Consider more differentiated instruction techniques",
      ],
      goals: [
        "Implement more technology-based learning activities",
        "Attend professional development workshop on inclusive education",
        "Mentor new teachers in the department",
      ],
      comments:
        "Outstanding performance throughout the academic year. Consistently exceeds expectations and serves as a role model for other faculty members.",
    },
    {
      id: 2,
      evaluationType: "Mid-Year Review",
      evaluationPeriod: "2024-2025 First Semester",
      evaluator: "Mr. David Wilson",
      evaluatorRole: "Department Head",
      evaluationDate: "2024-06-15",
      status: "Completed",
      overallRating: "Very Good",
      overallScore: 4.2,
      maxScore: 5.0,
      categories: {
        teachingEffectiveness: {
          score: 4.3,
          rating: "Very Good",
          comments:
            "Good teaching methods with room for incorporating more interactive elements.",
        },
        classroomManagement: {
          score: 4.1,
          rating: "Good",
          comments:
            "Generally good classroom control, occasional minor disruptions.",
        },
        studentProgress: {
          score: 4.4,
          rating: "Very Good",
          comments:
            "Students are making good progress, test scores are improving.",
        },
        professionalism: {
          score: 4.5,
          rating: "Very Good",
          comments: "Professional demeanor and punctual attendance.",
        },
        collaboration: {
          score: 4.0,
          rating: "Good",
          comments:
            "Participates in team meetings, could be more proactive in initiatives.",
        },
        innovation: {
          score: 3.9,
          rating: "Good",
          comments:
            "Uses traditional methods effectively, could explore more modern approaches.",
        },
      },
      strengths: [
        "Strong subject expertise",
        "Reliable and punctual",
        "Good rapport with students",
        "Effective lesson planning",
      ],
      areasForImprovement: [
        "Incorporate more interactive teaching methods",
        "Increase use of educational technology",
        "Improve classroom management techniques",
      ],
      goals: [
        "Attend workshop on interactive teaching methods",
        "Implement at least 2 new technology tools",
        "Reduce classroom disruptions by 50%",
      ],
      comments:
        "Solid performance with clear potential for growth. Recommended for professional development opportunities.",
    },
    {
      id: 3,
      evaluationType: "Probationary Review",
      evaluationPeriod: "2023-2024 Academic Year",
      evaluator: "Dr. Sarah Johnson",
      evaluatorRole: "Principal",
      evaluationDate: "2024-03-20",
      status: "Completed",
      overallRating: "Good",
      overallScore: 3.8,
      maxScore: 5.0,
      categories: {
        teachingEffectiveness: {
          score: 3.9,
          rating: "Good",
          comments:
            "Shows promise in teaching abilities, needs more experience with diverse learning styles.",
        },
        classroomManagement: {
          score: 3.6,
          rating: "Satisfactory",
          comments:
            "Working on establishing consistent classroom routines and discipline.",
        },
        studentProgress: {
          score: 4.0,
          rating: "Good",
          comments: "Students are learning, though pace could be improved.",
        },
        professionalism: {
          score: 4.1,
          rating: "Good",
          comments: "Professional attitude and willingness to learn.",
        },
        collaboration: {
          score: 3.8,
          rating: "Good",
          comments:
            "Participates well in team activities and seeks guidance when needed.",
        },
        innovation: {
          score: 3.4,
          rating: "Satisfactory",
          comments:
            "Relies mainly on traditional methods, encouraged to try new approaches.",
        },
      },
      strengths: [
        "Eager to learn and improve",
        "Good subject knowledge",
        "Positive attitude",
        "Receptive to feedback",
      ],
      areasForImprovement: [
        "Develop stronger classroom management skills",
        "Increase student engagement techniques",
        "Build confidence in teaching delivery",
      ],
      goals: [
        "Complete classroom management training",
        "Shadow experienced teachers",
        "Implement student engagement strategies",
      ],
      comments:
        "Shows good potential as a new teacher. With continued support and professional development, expected to become a strong educator.",
    },
    {
      id: 4,
      evaluationType: "Peer Review",
      evaluationPeriod: "2024-2025 Second Quarter",
      evaluator: "Ms. Lisa Anderson",
      evaluatorRole: "Senior Teacher",
      evaluationDate: "2024-11-10",
      status: "Completed",
      overallRating: "Very Good",
      overallScore: 4.3,
      maxScore: 5.0,
      categories: {
        teachingEffectiveness: {
          score: 4.4,
          rating: "Very Good",
          comments: "Excellent lesson structure and clear explanations.",
        },
        classroomManagement: {
          score: 4.2,
          rating: "Very Good",
          comments: "Well-organized classroom with good student behavior.",
        },
        studentProgress: {
          score: 4.5,
          rating: "Very Good",
          comments: "Students demonstrate clear understanding and improvement.",
        },
        professionalism: {
          score: 4.3,
          rating: "Very Good",
          comments: "Collaborative and supportive colleague.",
        },
        collaboration: {
          score: 4.4,
          rating: "Very Good",
          comments:
            "Actively contributes to department meetings and initiatives.",
        },
        innovation: {
          score: 4.0,
          rating: "Good",
          comments:
            "Uses some innovative methods, could explore more creative approaches.",
        },
      },
      strengths: [
        "Clear communication",
        "Well-prepared lessons",
        "Good student relationships",
        "Team player",
      ],
      areasForImprovement: [
        "Experiment with more creative teaching methods",
        "Increase use of multimedia resources",
      ],
      goals: [
        "Try at least 3 new teaching techniques this semester",
        "Create multimedia presentations for key topics",
      ],
      comments:
        "Consistently delivers quality education and is a valued team member.",
    },
  ];

  // Define columns for SmartTable
  const columns = [
    {
      accessor: "evaluationType",
      label: "Evaluation Type",
      searchable: true,
      render: (value, row) => (
        <div className="evaluationInfo">
          <div className="evaluationType">{value}</div>
          <div className="evaluationPeriod">{row.evaluationPeriod}</div>
        </div>
      ),
    },
    {
      accessor: "evaluator",
      label: "Evaluator",
      searchable: true,
      render: (value, row) => (
        <div className="evaluatorInfo">
          <div className="evaluatorName">{value}</div>
          <div className="evaluatorRole">{row.evaluatorRole}</div>
        </div>
      ),
    },
    {
      accessor: "evaluationDate",
      label: "Date",
      searchable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      accessor: "overallRating",
      label: "Overall Rating",
      render: (value, row) => (
        <div className="ratingInfo">
          <span
            className="ratingBadge"
            style={{ backgroundColor: getRatingColor(value) }}
          >
            {value}
          </span>
          <div className="ratingScore">
            {row.overallScore}/{row.maxScore}
          </div>
        </div>
      ),
    },
    {
      accessor: "status",
      label: "Status",
      searchable: true,
      render: (value) => (
        <span className="statusBadge" style={{ color: getStatusColor(value) }}>
          {value}
        </span>
      ),
    },
    {
      accessor: "actions",
      label: "Actions",
      render: (_, row) => (
        <span
          className="viewDetails"
          onClick={(e) => {
            e.stopPropagation();
            handleEvaluationClick(row);
          }}
        >
          View Details →
        </span>
      ),
    },
  ];

  const getRatingColor = (rating) => {
    switch (rating) {
      case "Excellent":
        return "rgba(16, 185, 129, 0.2)";
      case "Very Good":
        return "rgba(59, 130, 246, 0.2)";
      case "Good":
        return "rgba(245, 158, 11, 0.2)";
      case "Satisfactory":
        return "rgba(156, 163, 175, 0.2)";
      case "Needs Improvement":
        return "rgba(239, 68, 68, 0.2)";
      default:
        return "rgba(107, 114, 128, 0.2)";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#10b981";
      case "In Progress":
        return "#f59e0b";
      case "Scheduled":
        return "#3b82f6";
      case "Overdue":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getCategoryRatingColor = (rating) => {
    switch (rating) {
      case "Excellent":
        return "#10b981";
      case "Very Good":
        return "#3b82f6";
      case "Good":
        return "#f59e0b";
      case "Satisfactory":
        return "#9ca3af";
      case "Needs Improvement":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const handleEvaluationClick = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowEvaluationDetailMenu(true);
  };

  const handleRowClick = (evaluation) => {
    handleEvaluationClick(evaluation);
  };

  const handleCreateEvaluation = () => {
    console.log("Create new evaluation");
  };

  const handleExport = async (options) => {
    console.log("Export evaluations", options);
  };

  return (
    <InnerTabCon>
      <div className="teacherPerformance">
        <div className="performanceHeader">
          <div className="performanceHeaderLeft">
            <h2 className="performanceTitle">Performance Evaluations</h2>
            <p className="performanceSubtitle">
              Teacher performance reviews, feedback, and professional
              development tracking
            </p>
          </div>
          <div className="performanceHeaderRight">
            <Button variant="secondary">Schedule Review</Button>
          </div>
        </div>

        {/* SmartTable */}
        <SmartTable
          columns={columns}
          data={performanceData}
          onRowClick={handleRowClick}
          onCreate={handleCreateEvaluation}
          onExport={handleExport}
          creattext="New Evaluation"
          maxRowsPerPage={8}
          exportDefaults={{
            includeColumns: [
              "evaluationType",
              "evaluator",
              "evaluationDate",
              "overallRating",
              "status",
            ],
            format: "csv",
          }}
        />

        {/* Evaluation Detail SlideInMenu */}
        <SlideInMenu
          isShow={showEvaluationDetailMenu}
          onClose={() => setShowEvaluationDetailMenu(false)}
          width="900px"
        >
          <div className="slideMenuContent">
            <div className="slideMenuHeader">
              <div>
                <h2>{selectedEvaluation?.evaluationType}</h2>
                <p>Performance Evaluation Details</p>
              </div>
              <button
                className="closeButton"
                onClick={() => setShowEvaluationDetailMenu(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="slideMenuBody">
              {selectedEvaluation && (
                <div className="evaluationDetailContent">
                  <div className="detailSection">
                    <h3>Evaluation Overview</h3>
                    <div className="detailGrid">
                      <div className="detailItem">
                        <span className="detailLabel">Evaluation Type</span>
                        <span className="detailValue">
                          {selectedEvaluation.evaluationType}
                        </span>
                      </div>
                      <div className="detailItem">
                        <span className="detailLabel">Period</span>
                        <span className="detailValue">
                          {selectedEvaluation.evaluationPeriod}
                        </span>
                      </div>
                      <div className="detailItem">
                        <span className="detailLabel">Evaluator</span>
                        <span className="detailValue">
                          {selectedEvaluation.evaluator} (
                          {selectedEvaluation.evaluatorRole})
                        </span>
                      </div>
                      <div className="detailItem">
                        <span className="detailLabel">Date</span>
                        <span className="detailValue">
                          {new Date(
                            selectedEvaluation.evaluationDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="detailItem">
                        <span className="detailLabel">Overall Rating</span>
                        <span
                          className="detailValue ratingValue"
                          style={{
                            color: getCategoryRatingColor(
                              selectedEvaluation.overallRating
                            ),
                          }}
                        >
                          {selectedEvaluation.overallRating} (
                          {selectedEvaluation.overallScore}/
                          {selectedEvaluation.maxScore})
                        </span>
                      </div>
                      <div className="detailItem">
                        <span className="detailLabel">Status</span>
                        <span
                          className="detailValue statusValue"
                          style={{
                            color: getStatusColor(selectedEvaluation.status),
                          }}
                        >
                          {selectedEvaluation.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detailSection">
                    <h3>Category Ratings</h3>
                    <div className="categoryRatings">
                      {Object.entries(selectedEvaluation.categories).map(
                        ([category, data]) => (
                          <div key={category} className="categoryItem">
                            <div className="categoryHeader">
                              <h4 className="categoryName">
                                {category
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (str) => str.toUpperCase())}
                              </h4>
                              <div className="categoryRating">
                                <span
                                  className="categoryScore"
                                  style={{
                                    color: getCategoryRatingColor(data.rating),
                                  }}
                                >
                                  {data.rating} ({data.score}/5.0)
                                </span>
                              </div>
                            </div>
                            <p className="categoryComments">{data.comments}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="detailSection">
                    <h3>Strengths</h3>
                    <div className="strengthsList">
                      {selectedEvaluation.strengths.map((strength, index) => (
                        <div key={index} className="strengthItem">
                          <Icons.Report size={16} color="#10b981" />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detailSection">
                    <h3>Areas for Improvement</h3>
                    <div className="improvementsList">
                      {selectedEvaluation.areasForImprovement.map(
                        (area, index) => (
                          <div key={index} className="improvementItem">
                            <Icons.Report size={16} color="#f59e0b" />
                            <span>{area}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="detailSection">
                    <h3>Goals & Action Items</h3>
                    <div className="goalsList">
                      {selectedEvaluation.goals.map((goal, index) => (
                        <div key={index} className="goalItem">
                          <Icons.Class size={16} color="#3b82f6" />
                          <span>{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detailSection">
                    <h3>Overall Comments</h3>
                    <div className="overallComments">
                      <p>{selectedEvaluation.comments}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="slideMenuFooter">
              <Button
                variant="secondary"
                onClick={() => setShowEvaluationDetailMenu(false)}
              >
                Close
              </Button>
              <Button variant="secondary">Print Evaluation</Button>
              <Button>Edit Evaluation</Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default TeacherPerformance;
