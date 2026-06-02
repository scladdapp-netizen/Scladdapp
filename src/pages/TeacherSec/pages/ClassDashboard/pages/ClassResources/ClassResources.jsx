import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import ResourceCard from "../../../../../../components/ResourceCard/ResourceCard";
import { useClassResource } from "../../../../../../api_call/useClassResource";
import downloadFile from "../../../../../../utils/downloadFile";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassResources/ClassResources.css";

const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];

const ClassResources = ({ classData }) => {
  const { classId } = useParams();
  const { getByClass, incrementDownload, loading } = useClassResource();

  const className = classData?.class?.class_name || "this class";

  const [resources, setResources]     = useState([]);
  const [filterType, setFilterType]   = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!classId) return;
    getByClass(classId).then((res) => {
      if (res.success) setResources(res.data);
    });
  }, [classId]);

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources((prev) => prev.map((r) =>
        r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r
      ));
    } catch (err) {
      console.error("Download failed:", err.message);
    }
  };

  const typeCount = (type) => resources.filter((d) =>
    (type === "all" || (d.file_type || "").toLowerCase() === type) &&
    (!searchQuery || (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;

  const filtered = resources.filter((doc) => {
    const matchType = filterType === "all" || (doc.file_type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    return matchType && (!q ||
      (doc.name || "").toLowerCase().includes(q) ||
      (doc.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <InnerTabCon>
      <div className="classResourceskk">

        {/* Header */}
        <div className="cr-header">
          <div className="cr-header-left">
            <h2 className="cr-title">Resources</h2>
            <p className="cr-subtitle">
              {resources.length} {resources.length === 1 ? "file" : "files"} for {className}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="cr-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="cr-search"
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cr-clear" onClick={() => setSearchQuery("")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="cr-tabs">
          {FILE_TYPES.map((type) => (
            <button
              key={type}
              className={`cr-tab ${filterType === type ? "active" : ""}`}
              onClick={() => setFilterType(type)}
            >
              {type === "all" ? `All (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <LoadingData message="Loading resources..." />}

        {!loading && (filtered.length === 0 ? (
          <div className="cr-empty">
            <h3>No resources found</h3>
            <p>{searchQuery ? `No results for "${searchQuery}"` : "No resources uploaded yet."}</p>
            {searchQuery && (
              <button className="cr-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>
            )}
          </div>
        ) : (
          <div className="cr-grid">
            {filtered.map((doc) => (
              <ResourceCard
                key={doc.resource_id}
                doc={doc}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ))}
      </div>
    </InnerTabCon>
  );
};

export default ClassResources;
