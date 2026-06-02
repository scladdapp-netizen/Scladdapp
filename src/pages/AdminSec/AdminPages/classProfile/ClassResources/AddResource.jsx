import { useState } from "react";
import { Icons } from "../../../../../utils/icons";
import Button from "../../../../../components/Button/Button";
import { useClassResource } from "../../../../../api_call/useClassResource";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";
import "./AddResource.css";

const CATEGORIES = ["Academic", "Administrative", "Assignment", "Safety", "Photos", "Meeting", "Reports", "Forms", "General"];

const AddResource = ({ classData, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const { createResource, loading } = useClassResource();

  const [formData, setFormData] = useState({ name: "", description: "", category: "Academic", file: null });
  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");

  const set = (field) => (value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((p) => ({ ...p, file, name: p.name || file.name.split(".")[0] }));
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return "📁";
    const ext = fileName.split(".").pop().toLowerCase();
    switch (ext) {
      case "pdf": return "📄";
      case "docx": case "doc": return "📝";
      case "xlsx": case "xls": return "📊";
      case "pptx": case "ppt": return "📋";
      case "jpg": case "jpeg": case "png": case "gif": return "🖼️";
      case "zip": case "rar": return "🗜️";
      default: return "📁";
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return addNotification("Resource name is required", "error");
    if (!formData.file) return addNotification("Please select a file", "error");

    const fd = new FormData();
    fd.append("file", formData.file);
    fd.append("class_id", classData?.class_id || "");
    fd.append("school_id", classData?.school_id || "");
    fd.append("name", formData.name.trim());
    fd.append("description", formData.description.trim());
    fd.append("category", formData.category);

    const result = await createResource(fd);
    if (result.success) {
      addNotification("Resource added successfully", "success");
      onSave?.();
    } else {
      if (result.message && result.message.includes("Storage limit")) {
        setStorageLimitMsg(result.message);
        setStorageLimitOpen(true);
      } else {
        addNotification(result.message || "Failed to add resource", "error");
      }
    }
  };

  return (
    <div className="add-resource">
      <div className="ar-header">
        <div className="ar-header-content">
          <Icons.Plus size={24} color="#4f46e5" />
          <div>
            <h2 className="ar-title">Add New Resource</h2>
            <p className="ar-subtitle">Upload a file for {classData?.class_name || "this class"}</p>
          </div>
        </div>
        <button className="ar-close-btn" onClick={onClose}><Icons.X size={20} /></button>
      </div>

      <div className="ar-content">
        {/* File Upload */}
        <div className="ar-form-section">
          <label className="ar-form-label">Select File</label>
          <div className="ar-file-upload">
            <input type="file" id="resource-file" onChange={handleFileChange} className="ar-file-input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar" />
            <label htmlFor="resource-file" className="ar-file-label">
              <div className="ar-file-upload-content">
                {formData.file ? (
                  <div className="ar-file-selected">
                    <span className="ar-file-icon">{getFileIcon(formData.file.name)}</span>
                    <div className="ar-file-info">
                      <div className="ar-file-name">{formData.file.name}</div>
                    </div>
                  </div>
                ) : (
                  <div className="ar-file-placeholder">
                    <Icons.Plus size={32} color="#6b7280" />
                    <div className="ar-upload-text">
                      <div className="ar-upload-title">Click to upload file</div>
                      <div className="ar-upload-subtitle">PDF, DOC, XLS, PPT, Images, ZIP supported</div>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="ar-form-section">
          <label className="ar-form-label">Resource Name</label>
          <input type="text" value={formData.name} onChange={(e) => set("name")(e.target.value)}
            placeholder="Enter a descriptive name..." className="ar-form-input" />
        </div>

        {/* Category */}
        <div className="ar-form-section">
          <label className="ar-form-label">Category</label>
          <select value={formData.category} onChange={(e) => set("category")(e.target.value)} className="ar-form-select">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="ar-form-section">
          <label className="ar-form-label">Description (Optional)</label>
          <textarea value={formData.description} onChange={(e) => set("description")(e.target.value)}
            placeholder="Brief description of this resource..." className="ar-form-textarea" rows={4} />
        </div>
      </div>

      <div className="ar-actions">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!formData.name.trim() || !formData.file || loading}>
          {loading ? "Uploading..." : "Add Resource"}
        </Button>
      </div>

      <SubscriptionLimitModal
        isOpen={storageLimitOpen}
        onClose={() => setStorageLimitOpen(false)}
        message={storageLimitMsg}
      />
    </div>
  );
};

export default AddResource;
