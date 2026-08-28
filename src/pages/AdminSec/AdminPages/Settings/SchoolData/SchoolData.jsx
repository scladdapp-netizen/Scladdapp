import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../components/Button/Button";
import FormInput from "../../../../../components/FormInput";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import ResourceCard from "../../../../../components/ResourceCard/ResourceCard";
import DeleteConfirmPanel from "../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import useSchool from "../../../../../api_call/useSchool";
import useSchoolResource from "../../../../../api_call/useSchoolResource";
import useSchoolGallery from "../../../../../api_call/useSchoolGallery";
import { FaSchool, FaUpload, FaSave, FaBook, FaFileAlt, FaImages, FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaImage, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink } from "react-icons/fa";
import "./SchoolData.css";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";

import downloadFile from "../../../../../utils/downloadFile";
import {
  SOCIAL_PLATFORMS,
  normalizeSocialHandle,
  normalizeSocialLinks,
  socialPlatformLabel,
  socialProfileUrl,
} from "../../../../../utils/schoolSocialLinks";

// ── Resource upload/edit panel ────────────────────────────────────────────
const SchoolResourceFormPanel = ({ isShow, onClose, resourceData, onSubmit, isEditMode }) => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: "", category: "General", description: "", visibility: "public" });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isEditMode && resourceData) {
      setForm({ name: resourceData.name || "", category: resourceData.category || "General", description: resourceData.description || "", visibility: resourceData.visibility || "public" });
    } else {
      setForm({ name: "", category: "General", description: "", visibility: "public" });
      setSelectedFile(null);
    }
  }, [isEditMode, resourceData, isShow]);

  const set = (field) => (value) => setForm(p => ({ ...p, [field]: value }));

  return (
    <SlideInMenu isShow={isShow} onClose={onClose} width="520px">
      <div className="sd-panel">
        <div className="sd-panel-header">
          <span className="sd-panel-deco" aria-hidden="true" />
          <div className="sd-panel-header-content">
            <div className="sd-panel-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="sd-panel-header-text">
              <h2>{isEditMode ? "Edit Resource" : "Upload Resource"}</h2>
              <p>{isEditMode ? "Update resource details" : "Add a new school resource"}</p>
            </div>
          </div>
        </div>
        <div className="sd-panel-body">
          {!isEditMode && (
            <div className="sd-drop-zone" onClick={() => fileInputRef.current?.click()}>
              {selectedFile ? (
                <>
                  <div className="sd-drop-icon">📎</div>
                  <p className="sd-drop-filename">{selectedFile.name}</p>
                  <p className="sd-drop-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <div className="sd-drop-icon">📁</div>
                  <p className="sd-drop-text">Click to browse file</p>
                  <p className="sd-drop-hint">PDF, DOC, XLS, PPT, ZIP, Images</p>
                </>
              )}
              <input ref={fileInputRef} type="file" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setSelectedFile(f); if (!form.name) set("name")(f.name.split(".")[0]); }
              }} style={{ display: "none" }} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png" />
            </div>
          )}
          <FormInput label="Resource Name *" type="text" value={form.name} onChange={set("name")} placeholder="e.g. School Handbook" />
          <FormInput label="Category" type="text" value={form.category} onChange={set("category")} placeholder="e.g. Policy, Curriculum..." />
          <FormInput label="Description" type="textarea" value={form.description} onChange={set("description")} placeholder="Brief description..." height="80px" />
          <div>
            <span className="sd-field-label">Visibility</span>
            <div className="sd-visibility-row">
              {["public", "private"].map((v) => (
                <button key={v} type="button" onClick={() => set("visibility")(v)}
                  className={`sd-visibility-btn ${form.visibility === v ? "active-" + v : ""}`}>
                  {v === "public" ? "🌐 Public" : "🔒 Private"}
                </button>
              ))}
            </div>
            <p className="sd-visibility-hint">
              {form.visibility === "public" ? "Visible to all students and staff" : "Only visible to admins and staff"}
            </p>
          </div>
        </div>
        <div className="sd-panel-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(form, selectedFile)}>{isEditMode ? "Save Changes" : "Upload Resource"}</Button>
        </div>
      </div>
    </SlideInMenu>
  );
};

const SchoolData = ({ defaultTab = "profile", hideInternalTabs = false }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolId } = useParams();
  const school = user?.school || {};

  const getTab = () => {
    const t = new URLSearchParams(location.search).get("school-tab");
    return ["profile", "bio", "resources", "gallery"].includes(t) ? t : defaultTab;
  };

  const [activeTab, setActiveTab] = useState(getTab);
  useEffect(() => { setActiveTab(getTab()); }, [location.search, defaultTab]);
  const handleTabChange = (tab) => { navigate(`?school-tab=${tab}`, { replace: true }); };

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileEditing, setProfileEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const logoInputRef = useRef(null);
  const { saveBio, getBio, saveProfile, getProfile, loading: schoolLoading } = useSchool();
  const [profile, setProfile] = useState({
    name: school.school_name || "", slogan: school.motto || "",
    address: school.address || "", phone: school.phone_number || "",
    email: school.email || "", website: school.website || "",
    state: school.state || "",
    country: school.country || "", logo: typeof school.logo_url === "string" ? school.logo_url : null,
    social_links: normalizeSocialLinks(school),
  });
  const [socialDraft, setSocialDraft] = useState({ platform: "instagram", handle: "" });

  useEffect(() => {
    if (!schoolId) return;
    getProfile(schoolId).then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        setProfile({
          name: d.school_name || "",
          slogan: d.motto || "",
          address: d.address || "",
          phone: d.phone_number || "",
          email: d.email || "",
          website: d.website || "",
          state: d.state || "",
          country: d.country || "",
          logo: typeof d.logo_url === "string" ? d.logo_url : (d.logo_url?.url || d.logo_url?.secure_url || null),
          social_links: normalizeSocialLinks(d),
        });
      }
    });
  }, [schoolId]);

  const addSocialLink = () => {
    const platform = socialDraft.platform;
    const handle = normalizeSocialHandle(socialDraft.handle);
    if (!platform || !handle) {
      addNotification("Select a platform and enter a handle.", "error");
      return;
    }
    setProfile((p) => {
      const without = (p.social_links || []).filter((s) => s.platform !== platform);
      return { ...p, social_links: [...without, { platform, handle }] };
    });
    setSocialDraft((d) => ({ ...d, handle: "" }));
  };

  const removeSocialLink = (platform) => {
    setProfile((p) => ({
      ...p,
      social_links: (p.social_links || []).filter((s) => s.platform !== platform),
    }));
  };

  // ── Bio ───────────────────────────────────────────────────────────────────
  const bioImageRef = useRef();
  const [bioEditing, setBioEditing] = useState(false);
  const [, forceUpdate] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit, Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ HTMLAttributes: { style: "max-width:400px;max-height:300px;width:auto;height:auto;border-radius:6px;margin:8px 0;object-fit:contain;" } }),
      Link.configure({ openOnClick: false }),
    ],
    content: school.bio || "",
    onUpdate: () => forceUpdate(n => n + 1),
    onSelectionUpdate: () => forceUpdate(n => n + 1),
  });

  useEffect(() => {
    if (!editor || !schoolId) return;
    getBio(schoolId).then((res) => { if (res.success && res.bio) editor.commands.setContent(res.bio); });
  }, [editor, schoolId]);

  const insertBioImage = () => {
    const file = bioImageRef.current?.files[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (e) => { editor.chain().focus().setImage({ src: e.target.result }).run(); if (bioImageRef.current) bioImageRef.current.value = ""; };
    reader.readAsDataURL(file);
  };
  const insertBioLink = () => { const url = window.prompt("Enter URL:"); if (url && editor) editor.chain().focus().setLink({ href: url }).run(); };

  // ── Resources ─────────────────────────────────────────────────────────────
  const { loading: resourceLoading, getBySchool, createResource, updateResource, incrementDownload, deleteResource } = useSchoolResource();
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [resourceFilter, setResourceFilter] = useState("all");
  const [resourceSearch, setResourceSearch] = useState("");
  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");

  const loadResources = useCallback(async () => {
    if (!schoolId) return;
    const res = await getBySchool(schoolId);
    if (res.success) setResources(res.data);
  }, [schoolId]);

  useEffect(() => { if (activeTab === "resources") loadResources(); }, [activeTab]);

  const handleResourceDownload = async (doc) => {
    if (!doc) return;
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources(prev => prev.map(r => r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r));
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const handleSubmitResource = async (form, file) => {
    if (!form.name) return;
    if (isEditMode) {
      const res = await updateResource(selectedResource.resource_id, { name: form.name, description: form.description, category: form.category, visibility: form.visibility || "public" });
      if (res.success) { setResources(prev => prev.map(r => r.resource_id === selectedResource.resource_id ? res.data : r)); setIsFormOpen(false); setSelectedResource(null); }
    } else {
      const fd = new FormData();
      fd.append("file", file); fd.append("school_id", schoolId); fd.append("name", form.name);
      fd.append("description", form.description || ""); fd.append("category", form.category);
      fd.append("visibility", form.visibility || "public");
      const res = await createResource(fd);
      if (res.success) { setResources(prev => [res.data, ...prev]); setIsFormOpen(false); }
      else if (res.message?.includes("Storage limit")) { setStorageLimitMsg(res.message); setStorageLimitOpen(true); }
      else addNotification(res.message || "Failed to upload", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedResource) return;
    const res = await deleteResource(selectedResource.resource_id);
    if (res.success) { setResources(prev => prev.filter(r => r.resource_id !== selectedResource.resource_id)); setIsDeleteOpen(false); setSelectedResource(null); }
  };

  const filteredResources = resources.filter((doc) => {
    const matchType = resourceFilter === "all" || (doc.file_type || "").toLowerCase() === resourceFilter;
    const q = resourceSearch.toLowerCase();
    return matchType && (!q || (doc.name || "").toLowerCase().includes(q) || (doc.category || "").toLowerCase().includes(q));
  });

  const fileTypes = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];

  // ── Gallery ───────────────────────────────────────────────────────────────
  const { loading: galleryLoading, getBySchool: getGallery, uploadImage, deleteImage } = useSchoolGallery();
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState("All");
  const [lightboxItem, setLightboxItem] = useState(null);
  const [galleryDeleteItem, setGalleryDeleteItem] = useState(null);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCategory, setUploadCategory] = useState("General");
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const galleryFileRef = useRef();

  const loadGallery = useCallback(async (page = 1) => {
    const res = await getGallery(schoolId, { page, limit: 20, search: gallerySearch });
    if (res.success) { setGalleryItems(res.data); setGalleryTotal(res.pagination?.totalRecords || 0); setGalleryPage(page); }
  }, [schoolId, gallerySearch]);

  useEffect(() => { if (activeTab === "gallery") loadGallery(1); }, [activeTab, gallerySearch]);

  const handleGalleryFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadPreviews(files.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) })));
  };

  const handleGalleryUpload = async () => {
    if (!uploadPreviews.length) return;
    for (const { file } of uploadPreviews) {
      const fd = new FormData();
      fd.append("file", file); fd.append("school_id", schoolId);
      fd.append("caption", uploadCaption); fd.append("category", uploadCategory);
      const res = await uploadImage(fd);
      if (!res?.success) {
        if (res?.message?.includes("Storage limit")) { setStorageLimitMsg(res.message); setStorageLimitOpen(true); }
        else addNotification(res?.message || "Failed to upload image", "error");
        return;
      }
    }
    setUploadPreviews([]); setUploadCaption(""); setUploadCategory("General");
    if (galleryFileRef.current) galleryFileRef.current.value = "";
    setIsUploadPanelOpen(false); loadGallery(1);
  };

  const handleGalleryDelete = async () => {
    if (!galleryDeleteItem) return;
    const res = await deleteImage(galleryDeleteItem.gallery_id);
    if (res.success) { setGalleryItems(prev => prev.filter(g => g.gallery_id !== galleryDeleteItem.gallery_id)); setGalleryDeleteItem(null); }
  };

  const galleryCategories = ["All", ...new Set(galleryItems.map(g => g.category).filter(Boolean))];
  const filteredGallery = galleryItems.filter(g =>
    (galleryCategoryFilter === "All" || g.category === galleryCategoryFilter) &&
    (!gallerySearch || (g.caption || "").toLowerCase().includes(gallerySearch.toLowerCase()))
  );

  return (
    <InnerTabCon>
      <div className="sd-wrap">

        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <div className="sd-tab-section">
            <div className="sd-profile-hero">
              <div className="sd-logo-wrap">
                {profile.logo ? (
                  <img src={profile.logo} alt="School Logo" className="sd-logo-img" />
                ) : (
                  <div className="sd-logo-placeholder"><FaSchool size={32} /></div>
                )}
              </div>
              <div className="sd-profile-hero-text">
                <h3 className="sd-school-name">{profile.name || "School Name"}</h3>
                <p className="sd-school-slogan">{profile.slogan || "—"}</p>
              </div>
              {!profileEditing && (
                <Button variant="secondary" onClick={() => setProfileEditing(true)}>Edit Profile</Button>
              )}
            </div>

            {!profileEditing ? (
              <>
                <div className="sd-info-grid">
                  {[
                    { label: "School Name", value: profile.name },
                    { label: "Slogan",      value: profile.slogan },
                    { label: "Email",       value: profile.email },
                    { label: "Phone",       value: profile.phone },
                    { label: "State",       value: profile.state },
                    { label: "Country",     value: profile.country },
                    { label: "Address",     value: profile.address },
                  ].map(({ label, value }) => (
                    <div key={label} className="sd-info-card">
                      <span className="sd-info-label">{label}</span>
                      <span className="sd-info-value">{value || "—"}</span>
                    </div>
                  ))}
                  <div className="sd-info-card">
                    <span className="sd-info-label">Website</span>
                    {profile.website ? (
                      <a
                        className="sd-info-link"
                        href={/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noreferrer"
                        title={profile.website}
                      >
                        {profile.website.replace(/^https?:\/\/(www\.)?/i, "")}
                      </a>
                    ) : (
                      <span className="sd-info-value">—</span>
                    )}
                  </div>
                </div>

                <div className="sd-social-section">
                  <h4 className="sd-social-title">Social</h4>
                  {(profile.social_links || []).length === 0 ? (
                    <p className="sd-social-empty">No social profiles added yet.</p>
                  ) : (
                    <div className="sd-social-list">
                      {(profile.social_links || []).map((item) => {
                        const href = socialProfileUrl(item.platform, item.handle);
                        return (
                          <a
                            key={item.platform}
                            className="sd-social-chip"
                            href={href || undefined}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="sd-social-chip-platform">{socialPlatformLabel(item.platform)}</span>
                            <span className="sd-social-chip-handle">@{item.handle}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="sd-edit-form">
                <div className="sd-form-grid">
                  {/* Logo upload */}
                  <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: "var(--sd-field-bg, #f9fafb)", border: "1px solid #e8e8e8", borderRadius: 10 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2px solid #e8e8e8", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f0f0" }}>
                      {logoFile ? (
                        <img src={URL.createObjectURL(logoFile)} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : profile.logo ? (
                        <img src={profile.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <FaSchool size={24} color="#aaa" />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>School Logo</p>
                      <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>JPG, PNG or WEBP · max 5MB · uploaded to Cloudinary</p>
                      <button type="button" style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "1px solid #e8e8e8", background: "#fff", cursor: "pointer" }}
                        onClick={() => logoInputRef.current?.click()}>
                        {logoFile ? "Change Logo" : "Upload Logo"}
                      </button>
                      {logoFile && (
                        <button type="button" style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff5f5", color: "#cc3333", cursor: "pointer", marginLeft: 8 }}
                          onClick={() => setLogoFile(null)}>Remove</button>
                      )}
                      <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size <= 5 * 1024 * 1024) setLogoFile(f); }} />
                    </div>
                  </div>
                  <FormInput label="School Name *" type="text" value={profile.name} onChange={(v) => setProfile(p => ({ ...p, name: v }))} />
                  <FormInput label="School Slogan" type="text" value={profile.slogan} onChange={(v) => setProfile(p => ({ ...p, slogan: v }))} />
                  <FormInput label="Phone Number" type="text" value={profile.phone} onChange={(v) => setProfile(p => ({ ...p, phone: v }))} />
                  <FormInput label="Email Address" type="email" value={profile.email} onChange={(v) => setProfile(p => ({ ...p, email: v }))} />
                  <FormInput label="Website URL" type="url" value={profile.website} onChange={(v) => setProfile(p => ({ ...p, website: v }))} placeholder="https://www.yourschool.com" />
                  <FormInput label="State" type="text" value={profile.state} onChange={(v) => setProfile(p => ({ ...p, state: v }))} />
                  <FormInput label="Country" type="text" value={profile.country} onChange={(v) => setProfile(p => ({ ...p, country: v }))} />
                </div>
                <FormInput label="Address" type="textarea" value={profile.address} onChange={(v) => setProfile(p => ({ ...p, address: v }))} height="80px" />

                <div className="sd-social-section sd-social-section--edit">
                  <h4 className="sd-social-title">Social</h4>
                  <p className="sd-social-hint">Add Facebook, Instagram, TikTok, or LinkedIn handles.</p>
                  {(profile.social_links || []).length > 0 && (
                    <div className="sd-social-list">
                      {(profile.social_links || []).map((item) => (
                        <div key={item.platform} className="sd-social-chip sd-social-chip--edit">
                          <span className="sd-social-chip-platform">{socialPlatformLabel(item.platform)}</span>
                          <span className="sd-social-chip-handle">@{item.handle}</span>
                          <button type="button" className="sd-social-remove" onClick={() => removeSocialLink(item.platform)}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="sd-social-add-row">
                    <select
                      className="sd-social-select"
                      value={socialDraft.platform}
                      onChange={(e) => setSocialDraft((d) => ({ ...d, platform: e.target.value }))}
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      className="sd-social-handle-input"
                      type="text"
                      value={socialDraft.handle}
                      onChange={(e) => setSocialDraft((d) => ({ ...d, handle: e.target.value }))}
                      placeholder={
                        SOCIAL_PLATFORMS.find((p) => p.id === socialDraft.platform)?.placeholder || "handle"
                      }
                    />
                    <Button type="button" variant="secondary" onClick={addSocialLink}>
                      Add
                    </Button>
                  </div>
                </div>

                <div className="sd-form-actions">
                  <Button variant="secondary" onClick={() => setProfileEditing(false)}>Cancel</Button>
                  <Button disabled={schoolLoading} onClick={async () => {
                    const res = await saveProfile(
                      schoolId,
                      {
                        school_name: profile.name,
                        motto: profile.slogan,
                        address: profile.address,
                        phone_number: profile.phone,
                        email: profile.email,
                        website: profile.website,
                        state: profile.state,
                        country: profile.country,
                        social_links: profile.social_links || [],
                      },
                      logoFile
                    );
                    if (res.success) {
                      setProfileEditing(false);
                      setLogoFile(null);
                      const logo =
                        typeof res.data?.logo_url === "string"
                          ? res.data.logo_url
                          : res.data?.logo_url?.url || res.data?.logo_url?.secure_url || null;
                      setProfile((p) => ({
                        ...p,
                        ...(logo ? { logo } : {}),
                        social_links: normalizeSocialLinks(res.data || p),
                      }));
                    }
                  }}>
                    {schoolLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bio Tab ── */}
        {activeTab === "bio" && (
          <div className="sd-tab-section">
            <div className="sd-tab-header">
              <div>
                <h3 className="sd-tab-title">School Bio</h3>
                <p className="sd-tab-subtitle">Your school's story and description</p>
              </div>
              {!bioEditing && (
                <Button variant="secondary" onClick={() => setBioEditing(true)}>Edit Bio</Button>
              )}
            </div>

            {editor && !bioEditing && (
              <div className="sd-bio-preview"
                dangerouslySetInnerHTML={{ __html: editor.isEmpty ? "<p class='sd-bio-empty'>No bio written yet. Click Edit to add one.</p>" : editor.getHTML() }}
              />
            )}

            {editor && bioEditing && (
              <>
                <div className="sd-editor-wrap">
                  <div className="sd-editor-toolbar">
                    {[
                      { icon: <FaBold />, title: "Bold", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
                      { icon: <FaItalic />, title: "Italic", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
                      { icon: <FaUnderline />, title: "Underline", action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
                    ].map(({ icon, title, action, active }) => (
                      <button key={title} type="button" title={title} onClick={action} className={`sd-toolbar-btn ${active ? "active" : ""}`}>{icon}</button>
                    ))}
                    <div className="sd-toolbar-sep" />
                    {[1, 2, 3].map((level) => (
                      <button key={level} type="button" title={`H${level}`} onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                        className={`sd-toolbar-btn ${editor.isActive("heading", { level }) ? "active" : ""}`}>H{level}</button>
                    ))}
                    <div className="sd-toolbar-sep" />
                    <button type="button" title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`sd-toolbar-btn ${editor.isActive("bulletList") ? "active" : ""}`}><FaListUl /></button>
                    <button type="button" title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`sd-toolbar-btn ${editor.isActive("orderedList") ? "active" : ""}`}><FaListOl /></button>
                    <div className="sd-toolbar-sep" />
                    {["left", "center", "right"].map((align) => (
                      <button key={align} type="button" title={`Align ${align}`} onClick={() => editor.chain().focus().setTextAlign(align).run()}
                        className={`sd-toolbar-btn ${editor.isActive({ textAlign: align }) ? "active" : ""}`}>
                        {align === "left" ? <FaAlignLeft /> : align === "center" ? <FaAlignCenter /> : <FaAlignRight />}
                      </button>
                    ))}
                    <div className="sd-toolbar-sep" />
                    <button type="button" title="Insert Link" onClick={insertBioLink} className={`sd-toolbar-btn ${editor.isActive("link") ? "active" : ""}`}><FaLink /></button>
                    <label title="Insert Image" className="sd-toolbar-btn">
                      <FaImage />
                      <input ref={bioImageRef} type="file" accept="image/*" style={{ display: "none" }} onChange={insertBioImage} />
                    </label>
                  </div>
                  <EditorContent editor={editor} className="sd-editor-content" />
                </div>
                <div className="sd-form-actions">
                  <Button variant="secondary" onClick={() => setBioEditing(false)}>Cancel</Button>
                  <Button onClick={async () => { const res = await saveBio(schoolId, editor.getHTML()); if (res.success) setBioEditing(false); }} disabled={schoolLoading}>
                    {schoolLoading ? "Saving..." : "Save Bio"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Resources Tab ── */}
        {activeTab === "resources" && (
          <div className="sd-tab-section">
            <div className="sd-tab-header">
              <div>
                <h3 className="sd-tab-title">School Resources</h3>
                <p className="sd-tab-subtitle">Administrative documents, policies, and school-wide files</p>
              </div>
              <Button onClick={() => { setIsEditMode(false); setSelectedResource(null); setIsFormOpen(true); }}>Upload Resource</Button>
            </div>

            <div className="sd-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input className="sd-search-input" type="text" placeholder="Search resources by name or category..."
                value={resourceSearch} onChange={(e) => setResourceSearch(e.target.value)} />
              {resourceSearch && (
                <button className="sd-search-clear" onClick={() => setResourceSearch("")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>

            <div className="sd-filter-tabs">
              {fileTypes.map((type) => {
                const count = resources.filter(d => type === "all" || (d.file_type || "").toLowerCase() === type).length;
                return (
                  <button key={type} className={`sd-filter-tab ${resourceFilter === type ? "active" : ""}`} onClick={() => setResourceFilter(type)}>
                    {type === "all" ? `All (${count})` : `${type.toUpperCase()} (${count})`}
                  </button>
                );
              })}
            </div>

            {resourceLoading && <div className="sd-loading">Loading resources...</div>}

            {!resourceLoading && (
              filteredResources.length === 0 ? (
                <div className="sd-empty">
                  <h3>No resources found</h3>
                  <p>{resourceSearch ? `No results for "${resourceSearch}"` : "No resources uploaded yet."}</p>
                </div>
              ) : (
                <div className="sd-resources-grid">
                  {filteredResources.map((doc) => (
                    <ResourceCard
                      key={doc.resource_id}
                      doc={doc}
                      onDownload={handleResourceDownload}
                      onEdit={(d) => { setSelectedResource(d); setIsEditMode(true); setIsFormOpen(true); }}
                      onDelete={(d) => { setSelectedResource(d); setIsDeleteOpen(true); }}
                      canEdit={true}
                      canDelete={true}
                    />
                  ))}
                </div>
              )
            )}

            <SchoolResourceFormPanel
              isShow={isFormOpen}
              onClose={() => { setIsFormOpen(false); setSelectedResource(null); }}
              resourceData={selectedResource}
              onSubmit={handleSubmitResource}
              isEditMode={isEditMode}
            />

            <DeleteConfirmPanel
              isOpen={isDeleteOpen}
              onClose={() => { setIsDeleteOpen(false); setSelectedResource(null); }}
              onConfirm={handleConfirmDelete}
              title="Delete Resource"
              description="You are about to permanently remove this school resource."
              itemName={selectedResource?.name}
            />
          </div>
        )}

        {/* ── Gallery Tab ── */}
        {activeTab === "gallery" && (
          <div className="sd-tab-section">
            <div className="sd-tab-header">
              <div>
                <h3 className="sd-tab-title">School Gallery</h3>
                <p className="sd-tab-subtitle">{galleryTotal} photo{galleryTotal !== 1 ? "s" : ""}</p>
              </div>
              <Button onClick={() => setIsUploadPanelOpen(true)}>
                <FaUpload style={{ marginRight: 6 }} /> Upload Photos
              </Button>
            </div>

            {/* Search + category filter */}
            <div className="sd-gallery-filters">
              <div className="sd-search-wrap" style={{ flex: 1 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input className="sd-search-input" type="text" placeholder="Search by caption..."
                  value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)} />
              </div>
              <div className="sd-gallery-cats">
                {galleryCategories.map(cat => (
                  <button key={cat} onClick={() => setGalleryCategoryFilter(cat)}
                    className={`sd-filter-tab ${galleryCategoryFilter === cat ? "active" : ""}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {galleryLoading ? (
              <div className="sd-loading">Loading gallery...</div>
            ) : filteredGallery.length === 0 ? (
              <div className="sd-empty sd-gallery-empty">
                <FaImages size={40} />
                <h3>No photos yet</h3>
                <p>Click "Upload Photos" to add your first image</p>
              </div>
            ) : (
              <>
                <div className="sd-gallery-grid">
                  {filteredGallery.map((item) => (
                    <div key={item.gallery_id} className="sd-gallery-item" onClick={() => setLightboxItem(item)}>
                      <img src={item.file_url} alt={item.caption || ""}
                        className="sd-gallery-img" onError={(e) => { e.target.style.display = "none"; }} />
                      <div className="sd-gallery-overlay">
                        {item.caption && <p className="sd-gallery-caption">{item.caption}</p>}
                        <p className="sd-gallery-cat">{item.category}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {galleryTotal > 20 && (
                  <div className="sd-gallery-pagination">
                    <Button variant="secondary" disabled={galleryPage === 1} onClick={() => loadGallery(galleryPage - 1)}>Prev</Button>
                    <span className="sd-gallery-page">Page {galleryPage}</span>
                    <Button variant="secondary" disabled={filteredGallery.length < 20} onClick={() => loadGallery(galleryPage + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}

            {/* Upload Panel */}
            <SlideInMenu isShow={isUploadPanelOpen} onClose={() => { setIsUploadPanelOpen(false); setUploadPreviews([]); }} width="560px">
              <div className="sd-panel">
                <div className="sd-panel-header">
                  <span className="sd-panel-deco" aria-hidden="true" />
                  <div className="sd-panel-header-content">
                    <div className="sd-panel-header-icon">
                      <FaUpload size={16} />
                    </div>
                    <div className="sd-panel-header-text">
                      <h2>Upload Photos</h2>
                      <p>Select one or multiple images to upload</p>
                    </div>
                  </div>
                </div>
                <div className="sd-panel-body">
                  <div className={`sd-drop-zone ${uploadPreviews.length ? "has-files" : ""}`} onClick={() => galleryFileRef.current?.click()}>
                    {uploadPreviews.length ? (
                      <>
                        <p className="sd-drop-filename">{uploadPreviews.length} image{uploadPreviews.length > 1 ? "s" : ""} selected</p>
                        <div className="sd-upload-previews">
                          {uploadPreviews.map(({ previewUrl }, i) => (
                            <img key={i} src={previewUrl} alt="" className="sd-upload-preview-thumb" />
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="sd-drop-icon"><FaImages size={28} /></div>
                        <p className="sd-drop-text">Click to select images</p>
                        <p className="sd-drop-hint">JPG, PNG, GIF, WEBP supported</p>
                      </>
                    )}
                    <input ref={galleryFileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleGalleryFilePick} />
                  </div>

                  <div className="sd-gallery-upload-fields">
                    <div className="sd-upload-field">
                      <label className="sd-field-label">Caption</label>
                      <input className="sd-field-input" type="text" value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} placeholder="e.g. Sports Day 2025" />
                    </div>
                    <FormInput label="Category" type="select" value={uploadCategory} onChange={v => setUploadCategory(v)}
                      options={[
                        { value: "General", label: "General" }, { value: "Events", label: "Events" },
                        { value: "Sports", label: "Sports" }, { value: "Academics", label: "Academics" },
                        { value: "Graduation", label: "Graduation" }, { value: "Facilities", label: "Facilities" },
                      ]}
                    />
                  </div>
                </div>
                <div className="sd-panel-footer">
                  <Button variant="secondary" onClick={() => { setIsUploadPanelOpen(false); setUploadPreviews([]); }}>Cancel</Button>
                  <Button onClick={handleGalleryUpload} disabled={!uploadPreviews.length || galleryLoading}>
                    {galleryLoading ? "Uploading..." : `Upload ${uploadPreviews.length || ""}`}
                  </Button>
                </div>
              </div>
            </SlideInMenu>

            {/* Lightbox */}
            {lightboxItem && (
              <div className="sd-lightbox" onClick={() => setLightboxItem(null)}>
                <div className="sd-lightbox-inner" onClick={e => e.stopPropagation()}>
                  <img src={lightboxItem.file_url} alt={lightboxItem.caption || ""} className="sd-lightbox-img" />
                  {lightboxItem.caption && <p className="sd-lightbox-caption">{lightboxItem.caption}</p>}
                  <p className="sd-lightbox-meta">{lightboxItem.category} · {new Date(lightboxItem.created_at).toLocaleDateString()}</p>
                  <div className="sd-lightbox-actions">
                    <button className="sd-lightbox-delete-btn" onClick={() => { setGalleryDeleteItem(lightboxItem); setLightboxItem(null); }}>Delete</button>
                    <button className="sd-lightbox-close-btn" onClick={() => setLightboxItem(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery delete confirm */}
            <DeleteConfirmPanel
              isOpen={!!galleryDeleteItem}
              onClose={() => setGalleryDeleteItem(null)}
              onConfirm={handleGalleryDelete}
              title="Delete Photo"
              description="This photo will be permanently removed from the gallery."
              itemName={galleryDeleteItem?.caption || "this photo"}
            />
          </div>
        )}

      </div>

      <SubscriptionLimitModal isOpen={storageLimitOpen} onClose={() => setStorageLimitOpen(false)} message={storageLimitMsg} />
    </InnerTabCon>
  );
};

export default SchoolData;
