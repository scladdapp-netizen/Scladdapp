import { useState, useEffect } from "react";
import CenterModal from "../../../../../../components/CenterModal/CenterModal";
import "./StudentDocuments.css";

const StudentDocuments = () => {
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sample documents data
  const documentsData = [
    {
      id: 1,
      name: "Birth Certificate",
      type: "pdf",
      size: "2.4 MB",
      uploadDate: "2025-01-15",
      url: "/documents/birth-certificate.pdf",
    },
    {
      id: 2,
      name: "Student Photo",
      type: "jpg",
      size: "1.2 MB",
      uploadDate: "2025-01-10",
      url: "/documents/student-photo.jpg",
    },
    {
      id: 3,
      name: "Medical Report",
      type: "docx",
      size: "856 KB",
      uploadDate: "2025-01-08",
      url: "/documents/medical-report.docx",
    },
    {
      id: 4,
      name: "Previous School Certificate",
      type: "pdf",
      size: "1.8 MB",
      uploadDate: "2025-01-05",
      url: "/documents/previous-school-cert.pdf",
    },
    {
      id: 5,
      name: "Vaccination Record",
      type: "png",
      size: "3.2 MB",
      uploadDate: "2025-01-03",
      url: "/documents/vaccination-record.png",
    },
    {
      id: 6,
      name: "Parent ID Copy",
      type: "pdf",
      size: "1.5 MB",
      uploadDate: "2025-01-01",
      url: "/documents/parent-id.pdf",
    },
    {
      id: 7,
      name: "Introduction Video",
      type: "mp4",
      size: "15.6 MB",
      uploadDate: "2024-12-28",
      url: "/documents/intro-video.mp4",
    },
  ];

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#dc2626"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="white"
              fontSize="6"
              fontWeight="bold"
            >
              PDF
            </text>
          </svg>
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              ry="2"
              fill="#10b981"
              stroke="#10b981"
              strokeWidth="2"
            />
            <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
            <polyline
              points="21,15 16,10 5,21"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        );
      case "mp4":
      case "avi":
      case "mov":
      case "wmv":
      case "flv":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#8b5cf6"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polygon points="10,11 10,17 16,14" fill="white" />
          </svg>
        );
      case "doc":
      case "docx":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#2563eb"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="white"
              fontSize="5"
              fontWeight="bold"
            >
              DOC
            </text>
          </svg>
        );
      case "xls":
      case "xlsx":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#059669"
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="white"
              fontSize="5"
              fontWeight="bold"
            >
              XLS
            </text>
          </svg>
        );
      case "ppt":
      case "pptx":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#ea580c"
              stroke="#ea580c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="white"
              fontSize="5"
              fontWeight="bold"
            >
              PPT
            </text>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#6b7280"
              stroke="#6b7280"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="14,2 14,8 20,8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  const getDownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="7,10 12,15 17,10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="15"
        x2="12"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = (document) => {
    // Simulate download - replace with actual download logic
    console.log(`Downloading: ${document.name}`);
    // window.open(document.url, '_blank');
  };

  const handleSeeMoreClick = () => {
    setShowAllDocumentsModal(true);
  };

  // Show first 4 documents on both desktop and mobile
  const displayCount = 4;
  const displayedDocuments = documentsData.slice(0, displayCount);
  const remainingDocumentsCount = documentsData.length - displayCount;

  return (
    <>
      <div className="studentDocuments">
        <div className="documentsHeader">
          <h3 className="documentsTitle">Student Documents</h3>
        </div>

        <div className="documentsList">
          {displayedDocuments.map((document) => (
            <div key={document.id} className="documentCard">
              <div className="documentIcon">{getFileIcon(document.type)}</div>

              <div className="documentInfo">
                <div className="documentName">{document.name}</div>
                <div className="documentMeta">
                  <span className="documentSize">{document.size}</span>
                  <span className="documentDate">
                    {formatDate(document.uploadDate)}
                  </span>
                </div>
              </div>

              <button
                className="downloadButton"
                onClick={() => handleDownload(document)}
                title="Download"
              >
                {getDownloadIcon()}
              </button>
            </div>
          ))}
        </div>

        {remainingDocumentsCount > 0 && (
          <button className="seeMoreButton" onClick={handleSeeMoreClick}>
            <span>See More ({remainingDocumentsCount} more documents)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* All Documents Modal */}
      <CenterModal
        isShow={showAllDocumentsModal}
        onClose={() => setShowAllDocumentsModal(false)}
        size="medium"
      >
        <div className="allDocumentsModal">
          <div className="modalHeader">
            <h2 className="modalTitle">All Student Documents</h2>
            <p className="modalSubtitle">
              {documentsData.length} documents available
            </p>
          </div>

          <div className="modalDocumentsList">
            {documentsData.map((document) => (
              <div key={document.id} className="modalDocumentItem">
                <div className="modalDocumentLeft">
                  <div className="modalDocumentIcon">
                    {getFileIcon(document.type)}
                  </div>
                  <div className="modalDocumentInfo">
                    <div className="modalDocumentName">{document.name}</div>
                    <div className="modalDocumentMeta">
                      <span className="modalDocumentType">
                        {document.type.toUpperCase()}
                      </span>
                      <span className="modalDocumentSize">{document.size}</span>
                      <span className="modalDocumentDate">
                        {formatDate(document.uploadDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="modalDownloadButton"
                  onClick={() => handleDownload(document)}
                  title="Download"
                >
                  {getDownloadIcon()}
                </button>
              </div>
            ))}
          </div>
        </div>
      </CenterModal>
    </>
  );
};

export default StudentDocuments;
