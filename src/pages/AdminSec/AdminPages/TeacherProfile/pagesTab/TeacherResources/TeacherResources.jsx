import "./TeacherResources.css";
import { useState, useEffect, useRef } from "react";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import ResourceCard from "../../../../../../components/ResourceCard/ResourceCard";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import FormInput from "../../../../../../components/FormInput";
import AddTeacherResource from "./AddTeacherResource";
import { useTeacherResource } from "../../../../../../api_call/useTeacherResource";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import downloadFile from "../../../../../../utils/downloadFile";

const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];

const TeacherResources = ({ teacherData }) => {
  const teacherId   = teacherData?.teacher?.teacher_id;
  const teacherName = teacherData?.teacher?.staff?.full_name || "this teacher";
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { getByTeacher, incrementDownload, deleteResource, loading } = useTeacherResource();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.teachers?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.teachers?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.teachers?.delete;

  const [resources, setResources]         = useState([]);
  const [docToDelete, setDocToDelete]     = useState(null);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [filterType, setFilterType]       = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");

  useEffect(() => { if (teacherId) fetchResources(); }, [teacherId]);

  const fetchResources = async () => {
    const result = await getByTeacher(teacherId);
    setResources(result.success ? result.data : []);
    if (!result.success) addNotification(result.message || "Failed to load resources", "error");
  };

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources(prev => prev.map(r =>
        r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r
      ));
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await deleteResource(docToDelete.resource_id);
    if (res.success) {
      addNotification("Resource deleted.", "success");
      setResources(prev => prev.filter(r => r.resource_id !== docToDelete.resource_id));
      setDocToDelete(null);
    } else {
      addNotification(res.message || "Failed to delete.", "error");
    }
  };

  const handleExportPDF = async () => {
    if (!resources.length) { addNotification("No resources to export.", "error"); return; }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18; let y = 20;

      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("Teacher Resources", margin, 12);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`Teacher: ${teacherName}`, margin, 20);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 20, { align: "right" });
      y = 38;

      const filtered = resources.filter(d =>
        (filterType === "all" || (d.file_type || "").toLowerCase() === filterType) &&
        (!searchQuery || (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
      );

      filtered.forEach((r) => {
        const cardH = 28;
        if (y + cardH > 275) { doc.addPage(); y = 20; }
        doc.setFillColor(247, 247, 247);
        doc.roundedRect(margin, y, pageW - margin * 2, cardH, 3, 3, "F");
        doc.setDrawColor(232, 232, 232);
        doc.roundedRect(margin, y, pageW - margin * 2, cardH, 3, 3, "S");
        doc.setTextColor(17, 17, 17); doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text(r.name || "—", margin + 4, y + 8);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(136, 136, 136);
        doc.text(`${(r.file_type || "").toUpperCase()}  ·  ${r.category || "—"}  ·  ${r.created_at?.split("T")[0] || "—"}  ·  ${r.download_count || 0} downloads`, margin + 4, y + 15);
        if (r.description) {
          doc.text(doc.splitTextToSize(r.description, pageW - margin * 2 - 8)[0], margin + 4, y + 21);
        }
        y += cardH + 6;
      });

      doc.save(`${teacherName.replace(/\s+/g, "_")}_Resources.pdf`);
      addNotification("Resources exported as PDF", "success");
    } catch {
      addNotification("Failed to export PDF", "error");
    }
  };

  const typeCount = (type) => resources.filter(d =>
    (type === "all" || (d.file_type || "").toLowerCase() === type) &&
    (!searchQuery || (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;

  const filtered = resources.filter(doc => {
    const matchType = filterType === "all" || (doc.file_type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    return matchType && (!q ||
      (doc.name || "").toLowerCase().includes(q) ||
      (doc.category || "").toLowerCase().includes(q) ||
      (doc.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <InnerTabCon>
      <div className="teacherResources">

        {/* Header */}
        <div className="tr-header">
          <div className="tr-header-left">
            <h2 className="tr-title">Resources</h2>
            <p className="tr-subtitle">{resources.length} {resources.length === 1 ? "file" : "files"} for {teacherName}</p>
          </div>
          <div className="tr-header-right">
            <Button variant="secondary" onClick={handleExportPDF}>Export PDF</Button>
            {canCreate && <Button onClick={() => setIsAddResourceOpen(true)}>Upload Resource</Button>}
          </div>
        </div>

        {/* Search */}
        <div className="tr-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="tr-search"
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="tr-clear" onClick={() => setSearchQuery("")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="tr-tabs">
          {FILE_TYPES.map(type => (
            <button key={type} className={`tr-tab ${filterType === type ? "active" : ""}`} onClick={() => setFilterType(type)}>
              {type === "all" ? `All (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {loading && <LoadingData message="Loading resources..." />}

        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div className="tr-empty">
                <h3>No resources found</h3>
                <p>{searchQuery ? `No results for "${searchQuery}"` : "No resources uploaded yet."}</p>
                {searchQuery && <button className="tr-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>}
              </div>
            ) : (
              <div className="tr-grid">
                {filtered.map(doc => (
                  <ResourceCard
                    key={doc.resource_id}
                    doc={doc}
                    onDownload={handleDownload}
                    onEdit={() => addNotification("Edit not available for teacher resources.", "info")}
                    onDelete={(d) => { if (!canDelete) { addNotification("No permission to delete.", "error"); return; } setDocToDelete(d); }}
                    canEdit={false}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Resource Panel */}
        <SlideInMenu isShow={isAddResourceOpen} onClose={() => setIsAddResourceOpen(false)} width="520px">
          <AddTeacherResource
            teacherData={teacherData}
            onClose={() => setIsAddResourceOpen(false)}
            onSave={() => { setIsAddResourceOpen(false); fetchResources(); }}
          />
        </SlideInMenu>

        {/* Delete Confirm */}
        <DeleteConfirmPanel
          isOpen={!!docToDelete}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Resource"
          description="You are about to permanently remove this file."
          itemName={docToDelete?.name}
        />
      </div>
    </InnerTabCon>
  );
};

export default TeacherResources;
