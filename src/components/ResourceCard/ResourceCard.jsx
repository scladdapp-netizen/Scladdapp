import "./ResourceCard.css";

// Single document SVG, white on a colored bg square
const FileIcon = ({ type }) => {
  const t = (type || "").toLowerCase();
  const bgMap = {
    pdf: "#cc3333", doc: "#1e40af", docx: "#1e40af",
    xls: "#166534", xlsx: "#166534", ppt: "#c2410c", pptx: "#c2410c",
    jpg: "#6d28d9", jpeg: "#6d28d9", png: "#6d28d9", gif: "#6d28d9", webp: "#6d28d9",
    zip: "#374151", rar: "#374151",
  };
  const bg = bgMap[t] || "#111111";
  const label = t === "jpeg" ? "JPG" : t.toUpperCase().slice(0, 4);

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill={bg}/>
      <path d="M10 8h10l6 6v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
      <path d="M20 8v6h6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
      <text x="18" y="26" textAnchor="middle" fontSize="7" fontWeight="700"
        fill="white" fontFamily="Arial, sans-serif">{label}</text>
    </svg>
  );
};

/**
 * Reusable resource card.
 * Props: doc, onDownload, onEdit, onDelete, canEdit, canDelete
 */
const ResourceCard = ({ doc, onDownload, onEdit, onDelete, canEdit, canDelete }) => (
  <div className="rc-card">
    {/* Header */}
    <div className="rc-header">
      <div className="rc-icon-wrap">
        <FileIcon type={doc.file_type} />
      </div>
      <div className="rc-info">
        <h3 className="rc-name">{doc.name}</h3>
        <div className="rc-meta">
          <span className="rc-type-badge">{(doc.file_type || "file").toUpperCase()}</span>
          <span className="rc-category">{doc.category}</span>
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="rc-body">
      {doc.description && <p className="rc-desc">{doc.description}</p>}
      <div className="rc-details">
        <div className="rc-detail">
          <span className="rc-detail-label">Uploaded</span>
          <span className="rc-detail-value">{doc.created_at?.split("T")[0] || "—"}</span>
        </div>
        <div className="rc-detail">
          <span className="rc-detail-label">Downloads</span>
          <span className="rc-detail-value">{doc.download_count || 0}</span>
        </div>
        {doc.uploaded_by_name && (
          <div className="rc-detail">
            <span className="rc-detail-label">By</span>
            <span className="rc-detail-value">{doc.uploaded_by_name}</span>
          </div>
        )}
      </div>
    </div>

    {/* Footer actions */}
    <div className="rc-footer">
      <button className="rc-btn rc-btn-download" onClick={() => onDownload(doc)} title="Download">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Download
      </button>
      {canEdit && (
        <button className="rc-btn rc-btn-edit" onClick={() => onEdit(doc)} title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          Edit
        </button>
      )}
      {canDelete && (
        <button className="rc-btn rc-btn-delete" onClick={() => onDelete(doc)} title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </button>
      )}
    </div>
  </div>
);

export default ResourceCard;
