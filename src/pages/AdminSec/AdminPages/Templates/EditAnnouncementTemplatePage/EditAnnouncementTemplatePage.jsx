/**
 * EditAnnouncementTemplatePage — TipTap email layout editor
 *
 * Sections:
 *   1. TOP    — editable (header, logo, school name, subject)
 *   2. LOCKED — announcement content, read-only
 *   3. BOTTOM — editable (footer / sign-off)
 *
 * Section background: solid colour OR image (uploaded to Cloudinary)
 * with an adjustable dark/light overlay so text stays readable.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate }                    from "react-router-dom";
import { useEditor, EditorContent }                  from "@tiptap/react";
import StarterKit                                    from "@tiptap/starter-kit";
import Underline                                     from "@tiptap/extension-underline";
import TextAlign                                     from "@tiptap/extension-text-align";
import { TextStyle }                                 from "@tiptap/extension-text-style";
import { Color }                                     from "@tiptap/extension-color";
import { useAnnouncementTemplate } from "../../../../../api_call/useAnnouncementTemplate";
import { useAuth }                  from "../../../../../context/AuthContext/AuthContext";
import { useNotification }          from "../../../../../context/NotificationProvider/NotificationProvider";
import ResizableImage               from "./ResizableImage";
import "./EditAnnouncementTemplatePage.css";

// ── TipTap extensions ─────────────────────────────────────────────────────────
const EXTENSIONS = [
  StarterKit,
  Underline,
  TextStyle,
  Color,
  ResizableImage.configure({
    inline: false,
    allowBase64: true,
    resize: {
      enabled: true,
      minWidth: 48,
      minHeight: 48,
      alwaysPreserveAspectRatio: true,
    },
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];

// ── Default docs ──────────────────────────────────────────────────────────────
const defaultTopDoc = (name = "", schoolName = "", logoUrl = "") => ({
  type: "doc",
  content: [
    ...(logoUrl ? [{
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "image", attrs: { src: logoUrl, alt: "School Logo", title: null, width: 64, height: 64 } }],
    }] : []),
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", marks: [{ type: "bold" }], text: schoolName || "SCHOOL NAME" }],
    },
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", text: "Official School Communication" }],
    },
    { type: "paragraph", content: [] },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Subject: " },
        { type: "text", text: name || "Announcement Subject" },
      ],
    },
  ],
});

const defaultBottomDoc = (schoolName = "") => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", marks: [{ type: "bold" }], text: "Warm regards," }],
    },
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", text: `${schoolName || "School"} Administration` }],
    },
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [{ type: "text", text: "This is an official communication." }],
    },
  ],
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseStoredDoc = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
};

const useDebounce = (fn, delay) => {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
};

// Is a hex colour dark?
const isDark = (hex = "#000000") => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2)||"00",16);
  const g = parseInt(h.slice(2,4)||"00",16);
  const b = parseInt(h.slice(4,6)||"00",16);
  return (r*0.299 + g*0.587 + b*0.114) < 128;
};

// Build the CSS background style for a section
const sectionStyle = (bg, bgImg, overlay) => {
  const base = {
    padding: "22px 28px",
    position: "relative",
    cursor: "text",
  };
  if (bgImg) {
    return {
      ...base,
      backgroundImage: `url(${bgImg})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { ...base, background: bg };
};

// Build the overlay div style (dark/light tint over bg image)
const overlayStyle = (overlay) => ({
  position: "absolute",
  inset: 0,
  background: overlay > 0
    ? `rgba(0,0,0,${overlay})`
    : overlay < 0
      ? `rgba(255,255,255,${Math.abs(overlay)})`
      : "none",
  pointerEvents: "none",
  zIndex: 0,
});

// ── TipTap JSON → HTML for preview ───────────────────────────────────────────
const docToHtml = (doc) => {
  if (!doc?.content) return "";
  const renderNode = (node) => {
    if (node.type === "text") {
      let t = (node.text || "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      const marks = node.marks || [];
      if (marks.find(m=>m.type==="bold"))      t = `<strong>${t}</strong>`;
      if (marks.find(m=>m.type==="italic"))     t = `<em>${t}</em>`;
      if (marks.find(m=>m.type==="underline"))  t = `<u>${t}</u>`;
      if (marks.find(m=>m.type==="strike"))     t = `<s>${t}</s>`;
      const ts = marks.find(m=>m.type==="textStyle");
      if (ts?.attrs?.color) t = `<span style="color:${ts.attrs.color}">${t}</span>`;
      return t;
    }
    if (node.type === "image") {
      const align = node.attrs?.align || "center";
      const w = node.attrs?.width ? `width:${node.attrs.width}px;` : "max-width:100%;";
      let extra = "display:block;";
      let margin = "6px auto";
      if (align === "left") margin = "6px auto 6px 0";
      else if (align === "right") margin = "6px 0 6px auto";
      else if (align === "float-left") { extra = "float:left;"; margin = "0 8px 0 0"; }
      else if (align === "float-right") { extra = "float:right;"; margin = "0 0 0 8px"; }
      return `<img src="${node.attrs?.src||""}" alt="${node.attrs?.alt||""}" data-align="${align}" style="${w}height:auto;${extra}margin:${margin};border-radius:4px;max-width:100%"/>`;
    }
    const inner = (node.content||[]).map(renderNode).join("");
    const align = node.attrs?.textAlign;
    const aStyle = align ? `text-align:${align};` : "";
    if (node.type==="paragraph")   return `<p style="margin:0 0 6px;${aStyle}">${inner||"&nbsp;"}</p>`;
    if (node.type==="heading")     return `<h${node.attrs?.level||2} style="margin:0 0 8px;${aStyle}">${inner}</h${node.attrs?.level||2}>`;
    if (node.type==="bulletList")  return `<ul style="margin:4px 0 4px 18px;padding:0">${inner}</ul>`;
    if (node.type==="orderedList") return `<ol style="margin:4px 0 4px 18px;padding:0">${inner}</ol>`;
    if (node.type==="listItem")    return `<li style="margin-bottom:3px">${inner}</li>`;
    if (node.type==="hardBreak")   return `<br/>`;
    return inner;
  };
  return (doc.content||[]).map(renderNode).join("");
};

// ── Toolbar button ────────────────────────────────────────────────────────────
const TbBtn = ({ active, disabled, onClick, title, children }) => (
  <button
    className={`eat-tb-btn${active ? " active" : ""}`}
    disabled={disabled}
    onClick={onClick}
    title={title}
    type="button"
  >
    {children}
  </button>
);

// ── Section background panel (replaces the old colour picker) ─────────────────
const BgPanel = ({ label, bg, onBgChange, bgImg, onBgImgChange, overlay, onOverlayChange, uploading, onUpload, onRemoveImg }) => (
  <div className="eat-bg-panel">
    <span className="eat-bg-panel-label">{label} background</span>

    {/* Solid colour (only shown when no image) */}
    {!bgImg && (
      <div className="eat-bg-row">
        <span className="eat-bg-hint">Colour</span>
        <input
          type="color"
          className="eat-tb-color"
          value={bg}
          title="Section background colour"
          onChange={(e) => onBgChange(e.target.value)}
        />
      </div>
    )}

    {/* Background image */}
    <div className="eat-bg-row">
      <span className="eat-bg-hint">Image</span>
      {bgImg
        ? (
          <div className="eat-bg-img-preview-wrap">
            <img src={bgImg} alt="bg" className="eat-bg-img-thumb" />
            <button className="eat-bg-remove-btn" onClick={onRemoveImg} title="Remove image">✕</button>
          </div>
        )
        : (
          <button
            className="eat-bg-upload-btn"
            onClick={onUpload}
            disabled={uploading}
            title="Upload background image"
          >
            {uploading ? "⏳ Uploading…" : "📁 Upload Image"}
          </button>
        )
      }
    </div>

    {/* Overlay slider — only shown when image is set */}
    {bgImg && (
      <div className="eat-bg-row eat-bg-overlay-row">
        <span className="eat-bg-hint">
          {overlay > 0 ? `Dark ${Math.round(overlay*100)}%` : overlay < 0 ? `Light ${Math.round(Math.abs(overlay)*100)}%` : "No overlay"}
        </span>
        <input
          type="range"
          min="-0.8"
          max="0.8"
          step="0.05"
          value={overlay}
          className="eat-overlay-slider"
          title="Adjust overlay darkness/lightness"
          onChange={(e) => onOverlayChange(parseFloat(e.target.value))}
        />
      </div>
    )}
  </div>
);

// ── Toolbar ───────────────────────────────────────────────────────────────────
const Toolbar = ({
  editor, focusedSection,
  topBg, onTopBgChange, topBgImg, onTopBgImgChange, topOverlay, onTopOverlayChange,
  bottomBg, onBottomBgChange, bottomBgImg, onBottomBgImgChange, bottomOverlay, onBottomOverlayChange,
  onInsertContentImg, contentImgUploading,
  onBgUpload, bgUploading,
}) => {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => tick((n) => n + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  if (!editor) return null;

  const isTop = focusedSection === "top";
  const isBody = focusedSection === "content";
  const imageAlign = editor.getAttributes("image")?.align || "center";
  const imageActive = editor.isActive("image");
  const setImageAlign = (align) => editor.chain().focus().updateAttributes("image", { align }).run();

  return (
    <div className="eat-toolbar">
      {/* Section indicator */}
      <span className="eat-toolbar-section-label">
        {isTop ? "Header" : isBody ? "Body" : "Footer"} ▸
      </span>

      {/* Paragraph style */}
      <select
        className="eat-tb-select"
        title="Paragraph style"
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) }).run();
        }}
        value={
          editor.isActive("heading",{level:1}) ? "1" :
          editor.isActive("heading",{level:2}) ? "2" :
          editor.isActive("heading",{level:3}) ? "3" : "p"
        }
      >
        <option value="p">Normal</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div className="eat-tb-sep" />

      {/* Format */}
      <TbBtn active={editor.isActive("bold")}      onClick={()=>editor.chain().focus().toggleBold().run()}      title="Bold"><b>B</b></TbBtn>
      <TbBtn active={editor.isActive("italic")}    onClick={()=>editor.chain().focus().toggleItalic().run()}    title="Italic"><i>I</i></TbBtn>
      <TbBtn active={editor.isActive("underline")} onClick={()=>editor.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></TbBtn>
      <TbBtn active={editor.isActive("strike")}    onClick={()=>editor.chain().focus().toggleStrike().run()}    title="Strikethrough"><s>S</s></TbBtn>

      <div className="eat-tb-sep" />

      {/* Alignment */}
      <TbBtn active={editor.isActive({textAlign:"left"})}   onClick={()=>editor.chain().focus().setTextAlign("left").run()}   title="Align left">◀</TbBtn>
      <TbBtn active={editor.isActive({textAlign:"center"})} onClick={()=>editor.chain().focus().setTextAlign("center").run()} title="Align center">▬</TbBtn>
      <TbBtn active={editor.isActive({textAlign:"right"})}  onClick={()=>editor.chain().focus().setTextAlign("right").run()}  title="Align right">▶</TbBtn>

      <div className="eat-tb-sep" />

      {/* Lists */}
      <TbBtn active={editor.isActive("bulletList")}  onClick={()=>editor.chain().focus().toggleBulletList().run()}  title="Bullet list">• List</TbBtn>
      <TbBtn active={editor.isActive("orderedList")} onClick={()=>editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1. List</TbBtn>

      <div className="eat-tb-sep" />

      {/* Text colour */}
      <div className="eat-tb-color-wrap" title="Text colour">
        <span style={{fontSize:10,color:"#94a3b8"}}>A</span>
        <input
          type="color"
          className="eat-tb-color"
          title="Text colour"
          onChange={(e)=>editor.chain().focus().setColor(e.target.value).run()}
        />
      </div>

      <div className="eat-tb-sep" />

      <TbBtn onClick={onInsertContentImg} title="Upload image" disabled={contentImgUploading}>
        {contentImgUploading ? "⏳" : "🖼"} {contentImgUploading ? "Uploading…" : "Image"}
      </TbBtn>

      {imageActive && (
        <>
          <div className="eat-tb-sep" />
          <span className="eat-bg-hint">Position</span>
          <TbBtn active={imageAlign === "left"} onClick={() => setImageAlign("left")} title="Align left">◀</TbBtn>
          <TbBtn active={imageAlign === "center"} onClick={() => setImageAlign("center")} title="Align center">▬</TbBtn>
          <TbBtn active={imageAlign === "right"} onClick={() => setImageAlign("right")} title="Align right">▶</TbBtn>
          <TbBtn active={imageAlign === "float-left"} onClick={() => setImageAlign("float-left")} title="Float left — text wraps">↩ L</TbBtn>
          <TbBtn active={imageAlign === "float-right"} onClick={() => setImageAlign("float-right")} title="Float right — text wraps">R ↪</TbBtn>
        </>
      )}

      <div className="eat-tb-sep" />

      {/* Section background panel */}
      {isBody ? null : isTop
        ? <BgPanel
            label="Header"
            bg={topBg}               onBgChange={onTopBgChange}
            bgImg={topBgImg}         onBgImgChange={onTopBgImgChange}
            overlay={topOverlay}     onOverlayChange={onTopOverlayChange}
            uploading={bgUploading}  onUpload={()=>onBgUpload("top")}
            onRemoveImg={()=>onTopBgImgChange(null)}
          />
        : <BgPanel
            label="Footer"
            bg={bottomBg}               onBgChange={onBottomBgChange}
            bgImg={bottomBgImg}         onBgImgChange={onBottomBgImgChange}
            overlay={bottomOverlay}     onOverlayChange={onBottomOverlayChange}
            uploading={bgUploading}     onUpload={()=>onBgUpload("bottom")}
            onRemoveImg={()=>onBottomBgImgChange(null)}
          />
      }
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export default function EditAnnouncementTemplatePage() {
  const { schoolId, templateId } = useParams();
  const navigate                 = useNavigate();
  const { user }                 = useAuth();
  const { addNotification }      = useNotification();
  const { getAnnouncementTemplateById, saveHtmlDraft, publishHtmlDraft, uploadImage, updateAnnouncementTemplate } = useAnnouncementTemplate();

  const [template,   setTemplate]   = useState(null);
  const [loadError,  setLoadError]  = useState(null);
  const [hasDraft,   setHasDraft]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // ── Section background state ─────────────────────────────────────────────
  const [topBg,       setTopBg]       = useState("#1e293b");
  const [topBgImg,    setTopBgImg]    = useState(null);   // Cloudinary URL or null
  const [topOverlay,  setTopOverlay]  = useState(0.4);    // -0.8 to 0.8

  const [bottomBg,      setBottomBg]      = useState("#f9fafb");
  const [bottomBgImg,   setBottomBgImg]   = useState(null);
  const [bottomOverlay, setBottomOverlay] = useState(0);

  // ── Focus + upload state ──────────────────────────────────────────────────
  const [focusedSection,    setFocusedSection]    = useState("top");
  const [viewMode,          setViewMode]          = useState("edit");
  const [contentImgUploading, setContentImgUploading] = useState(false);
  const [bgUploading,         setBgUploading]         = useState(false);

  const contentImgRef = useRef(null);
  const bgImgRef      = useRef(null);
  const bgTargetRef   = useRef("top"); // which section the bg upload is for

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!templateId) return;
    (async () => {
      const res = await getAnnouncementTemplateById(templateId);
      if (res.success && res.data) setTemplate(res.data);
      else setLoadError(res.message || "Template not found");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // ── Build initial docs ────────────────────────────────────────────────────
  const [initialTop,    setInitialTop]    = useState(null);
  const [initialBottom, setInitialBottom] = useState(null);
  const [initialContent, setInitialContent] = useState(null);

  useEffect(() => {
    if (!template) return;
    const schoolName = user?.school?.school_name || "";
    const logoUrl    = user?.school?.logo_url    || "";
    const stored = parseStoredDoc(template.html_template_draft || template.html_template);

    if (stored?.top_doc || stored?.bottom_doc) {
      setHasDraft(!!template.html_template_draft);
      setInitialTop(stored.top_doc       || defaultTopDoc(template.name, schoolName, logoUrl));
      setInitialBottom(stored.bottom_doc || defaultBottomDoc(schoolName));
      setInitialContent(template.content || "<p></p>");
      if (stored.top_bg)       setTopBg(stored.top_bg);
      if (stored.top_bg_img)   setTopBgImg(stored.top_bg_img);
      if (stored.top_overlay   !== undefined) setTopOverlay(stored.top_overlay);
      if (stored.bottom_bg)    setBottomBg(stored.bottom_bg);
      if (stored.bottom_bg_img) setBottomBgImg(stored.bottom_bg_img);
      if (stored.bottom_overlay !== undefined) setBottomOverlay(stored.bottom_overlay);
    } else {
      setInitialTop(defaultTopDoc(template.name, schoolName, logoUrl));
      setInitialBottom(defaultBottomDoc(schoolName));
      setInitialContent(template.content || "<p></p>");
    }
  }, [template, user]);

  // ── Editors ───────────────────────────────────────────────────────────────
  // Guard: only allow auto-save after editors have been seeded with content
  const editorReadyRef = useRef(false);

  const topEditor = useEditor({
    extensions: EXTENSIONS,
    content: initialTop || { type: "doc", content: [] },
    editorProps: { attributes: { class: "eat-top-editor" } },
    onUpdate: () => { /* handled via .on("update") below */ },
  }, [initialTop]);

  const bottomEditor = useEditor({
    extensions: EXTENSIONS,
    content: initialBottom || { type: "doc", content: [] },
    editorProps: { attributes: { class: "eat-bottom-editor" } },
  }, [initialBottom]);

  const contentEditor = useEditor({
    extensions: EXTENSIONS,
    content: initialContent || "<p></p>",
    editorProps: { attributes: { class: "eat-content-editor" } },
  }, [initialContent]);

  // Mark editors as ready once both have been seeded with real initial content
  useEffect(() => {
    if (initialTop && initialBottom && initialContent != null && topEditor && bottomEditor && contentEditor) {
      const t = setTimeout(() => { editorReadyRef.current = true; }, 300);
      return () => clearTimeout(t);
    }
    editorReadyRef.current = false;
  }, [initialTop, initialBottom, initialContent, topEditor, bottomEditor, contentEditor]);

  const activeEditor =
    focusedSection === "top" ? topEditor
    : focusedSection === "content" ? contentEditor
    : bottomEditor;

  // ── Auto-save ─────────────────────────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    if (!editorReadyRef.current) return;
    if (!templateId || !topEditor || !bottomEditor || !contentEditor) return;
    setSaveStatus("Saving…");
    await saveHtmlDraft(templateId, JSON.stringify({
      top_doc: topEditor.getJSON(), bottom_doc: bottomEditor.getJSON(),
      top_bg: topBg, top_bg_img: topBgImg, top_overlay: topOverlay,
      bottom_bg: bottomBg, bottom_bg_img: bottomBgImg, bottom_overlay: bottomOverlay,
    }));
    await updateAnnouncementTemplate(templateId, {
      content: contentEditor.getHTML(),
      modified_by: user?.admin?.admin_id || user?.user_id,
    });
    setHasDraft(true);
    setSaveStatus("Draft saved");
    setTimeout(() => setSaveStatus(""), 2500);
  }, [templateId, topEditor, bottomEditor, contentEditor, topBg, topBgImg, topOverlay, bottomBg, bottomBgImg, bottomOverlay, saveHtmlDraft, updateAnnouncementTemplate, user]);

  const debouncedSave = useDebounce(doAutoSave, 2000);

  useEffect(() => { if (!topEditor)     return; topEditor.on("update",     debouncedSave); return () => topEditor.off("update",     debouncedSave); }, [topEditor,     debouncedSave]);
  useEffect(() => { if (!bottomEditor)  return; bottomEditor.on("update",  debouncedSave); return () => bottomEditor.off("update",  debouncedSave); }, [bottomEditor,  debouncedSave]);
  useEffect(() => { if (!contentEditor) return; contentEditor.on("update", debouncedSave); return () => contentEditor.off("update", debouncedSave); }, [contentEditor, debouncedSave]);
  // Auto-save when bg settings change — but only after editors are ready
  useEffect(() => {
    if (editorReadyRef.current) debouncedSave();
  }, [topBg, topBgImg, topOverlay, bottomBg, bottomBgImg, bottomOverlay]); // eslint-disable-line

  // ── Publish ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!templateId || !topEditor || !bottomEditor || !contentEditor) return;
    setSaving(true);
    await saveHtmlDraft(templateId, JSON.stringify({
      top_doc: topEditor.getJSON(), bottom_doc: bottomEditor.getJSON(),
      top_bg: topBg, top_bg_img: topBgImg, top_overlay: topOverlay,
      bottom_bg: bottomBg, bottom_bg_img: bottomBgImg, bottom_overlay: bottomOverlay,
    }));
    await updateAnnouncementTemplate(templateId, {
      content: contentEditor.getHTML(),
      modified_by: user?.admin?.admin_id || user?.user_id,
    });
    await publishHtmlDraft(templateId);
    setHasDraft(false);
    setSaving(false);
    addNotification("Email layout saved", "success");
  }, [templateId, topEditor, bottomEditor, contentEditor, topBg, topBgImg, topOverlay, bottomBg, bottomBgImg, bottomOverlay, saveHtmlDraft, publishHtmlDraft, updateAnnouncementTemplate, addNotification, user]);

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey||e.metaKey) && e.key==="s") { e.preventDefault(); handleSave(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleSave]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const [resetting, setResetting] = useState(false);
  const handleReset = useCallback(async () => {
    if (!window.confirm("Reset to default?\n\nThis will discard all edits and restore the original layout.")) return;
    setResetting(true);
    editorReadyRef.current = false; // block auto-save during reset
    const schoolName = user?.school?.school_name || "";
    const logoUrl    = user?.school?.logo_url    || "";
    const newTop    = defaultTopDoc(template.name, schoolName, logoUrl);
    const newBottom = defaultBottomDoc(schoolName);
    topEditor?.commands.setContent(newTop);
    bottomEditor?.commands.setContent(newBottom);
    setTopBg("#1e293b");    setTopBgImg(null);    setTopOverlay(0.4);
    setBottomBg("#f9fafb"); setBottomBgImg(null); setBottomOverlay(0);
    const draft = JSON.stringify({
      top_doc: newTop, bottom_doc: newBottom,
      top_bg: "#1e293b", top_bg_img: null, top_overlay: 0.4,
      bottom_bg: "#f9fafb", bottom_bg_img: null, bottom_overlay: 0,
    });
    await saveHtmlDraft(templateId, draft);
    await publishHtmlDraft(templateId);
    setHasDraft(false);
    setResetting(false);
    addNotification("Reset to default layout", "success");
  }, [template, user, templateId, topEditor, bottomEditor, saveHtmlDraft, publishHtmlDraft, addNotification]);

  // ── Content image upload ──────────────────────────────────────────────────
  const handleContentImgChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setContentImgUploading(true);
    const res = await uploadImage(file);
    setContentImgUploading(false);
    if (res.success && res.url) {
      activeEditor?.chain().focus().setImage({ src: res.url, align: "center" }).run();
      addNotification("Image inserted", "success");
    } else {
      addNotification(res.message || "Upload failed", "error");
    }
  };

  // ── Background image upload ───────────────────────────────────────────────
  const handleBgUpload = (section) => {
    bgTargetRef.current = section;
    bgImgRef.current?.click();
  };

  const handleBgImgChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBgUploading(true);
    const res = await uploadImage(file);
    setBgUploading(false);
    if (res.success && res.url) {
      if (bgTargetRef.current === "top") setTopBgImg(res.url);
      else setBottomBgImg(res.url);
      addNotification("Background image set", "success");
    } else {
      addNotification(res.message || "Upload failed", "error");
    }
  };

  // ── Preview HTML ──────────────────────────────────────────────────────────
  const topHtml    = topEditor    ? docToHtml(topEditor.getJSON())    : "";
  const bottomHtml = bottomEditor ? docToHtml(bottomEditor.getJSON()) : "";
  const bodyHtml   = contentEditor ? contentEditor.getHTML() : (template?.content || "");

  const buildPreviewSection = (html, bg, bgImg, overlay, extraStyle = "") => {
    if (bgImg) {
      const tint = overlay > 0
        ? `rgba(0,0,0,${overlay})`
        : overlay < 0
          ? `rgba(255,255,255,${Math.abs(overlay)})`
          : "transparent";
      return `<div style="position:relative;background-image:url(${bgImg});background-size:cover;background-position:center;padding:22px 28px${extraStyle}">
        <div style="position:absolute;inset:0;background:${tint};pointer-events:none"></div>
        <div style="position:relative;z-index:1;color:#ffffff">${html}</div>
      </div>`;
    }
    return `<div style="background:${bg};padding:22px 28px${extraStyle};color:${isDark(bg)?"#ffffff":"#1e293b"}">${html}</div>`;
  };

  const sampleContent = bodyHtml && bodyHtml !== "<p></p>"
    ? `<div style="color:#374151;font-size:14px;line-height:1.6">${bodyHtml}</div>`
    : `<p style="color:#9ca3af;font-style:italic;font-size:13px">Announcement content will appear here.</p>`;

  const previewHtml = `
    <div style="max-width:540px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      ${buildPreviewSection(topHtml, topBg, topBgImg, topOverlay)}
      <div style="padding:24px 28px;background:#ffffff;border-top:2px dashed #e5e7eb;border-bottom:2px dashed #e5e7eb">${sampleContent}</div>
      ${buildPreviewSection(bottomHtml, bottomBg, bottomBgImg, bottomOverlay)}
    </div>`;

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loadError) return (
    <div className="eat-page">
      <div className="eat-error">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        {loadError}
        <button className="eat-back-btn" onClick={()=>navigate(`/admin/${schoolId}/templates/announcement`)}>← Back</button>
      </div>
    </div>
  );

  if (!template || !initialTop) return (
    <div className="eat-page">
      <div className="eat-loading"><div className="eat-spinner"/>Loading editor…</div>
    </div>
  );

  const topTextColor    = (topBgImg || isDark(topBg))       ? "#ffffff" : "#1e293b";
  const bottomTextColor = (bottomBgImg || isDark(bottomBg)) ? "#ffffff" : "#1e293b";

  return (
    <div className="eat-page">

      {/* ── Top bar ── */}
      <div className="eat-topbar">
        <div className="eat-topbar-left">
          <button className="eat-back-btn" onClick={()=>navigate(`/admin/${schoolId}/templates/announcement`)}>← Templates</button>
          <span className="eat-name">{template.name}</span>
          {hasDraft && <span className="eat-draft-badge">Draft</span>}
        </div>
        <div className="eat-mode-switch" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "edit"}
            className={`eat-mode-btn${viewMode==="edit"?" active":""}`}
            onClick={()=>setViewMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "preview"}
            className={`eat-mode-btn${viewMode==="preview"?" active":""}`}
            onClick={()=>setViewMode("preview")}
          >
            Preview
          </button>
        </div>
        <div className="eat-topbar-right">
          {saveStatus && <span className="eat-save-status">{saveStatus}</span>}
          <button className="eat-reset-btn" onClick={handleReset} disabled={resetting||saving}>
            {resetting ? "Resetting…" : "↺ Reset"}
          </button>
          <button className="eat-save-btn" onClick={handleSave} disabled={saving||resetting}>
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="eat-body">

        <div className={`eat-editor-pane${viewMode==="preview"?" is-hidden":""}`}>

          <Toolbar
            editor={activeEditor}
            focusedSection={focusedSection}
            topBg={topBg}             onTopBgChange={setTopBg}
            topBgImg={topBgImg}       onTopBgImgChange={setTopBgImg}
            topOverlay={topOverlay}   onTopOverlayChange={setTopOverlay}
            bottomBg={bottomBg}           onBottomBgChange={setBottomBg}
            bottomBgImg={bottomBgImg}     onBottomBgImgChange={setBottomBgImg}
            bottomOverlay={bottomOverlay} onBottomOverlayChange={setBottomOverlay}
            onInsertContentImg={()=>contentImgRef.current?.click()}
            contentImgUploading={contentImgUploading}
            onBgUpload={handleBgUpload}
            bgUploading={bgUploading}
          />

          {/* Hidden file inputs */}
          <input ref={contentImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleContentImgChange} />
          <input ref={bgImgRef}      type="file" accept="image/*" style={{display:"none"}} onChange={handleBgImgChange} />

          <div className="eat-editor-scroll">
            <div className="eat-email-paper">

              {/* TOP */}
              <div
                className={`eat-section-wrap${focusedSection==="top"?" focused":""}`}
                style={{
                  ...sectionStyle(topBg, topBgImg, topOverlay),
                  color: topTextColor,
                }}
                onClick={()=>{ topEditor?.commands.focus(); setFocusedSection("top"); }}
                onFocus={()=>setFocusedSection("top")}
              >
                {topBgImg && <div style={overlayStyle(topOverlay)} />}
                <span className="eat-section-label" style={{color: topTextColor==="#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"}}>
                  Header — click to edit
                </span>
                <div style={{position:"relative", zIndex:1}}>
                  <EditorContent editor={topEditor} />
                </div>
              </div>

              {/* LOCKED */}
              <div
                className={`eat-locked-zone${focusedSection==="content"?" focused":""}`}
                onClick={()=>{ contentEditor?.commands.focus(); setFocusedSection("content"); }}
              >
                <span className="eat-locked-badge">Announcement body — click to edit</span>
                <EditorContent editor={contentEditor} />
              </div>

              {/* BOTTOM */}
              <div
                className={`eat-section-wrap${focusedSection==="bottom"?" focused":""}`}
                style={{
                  ...sectionStyle(bottomBg, bottomBgImg, bottomOverlay),
                  color: bottomTextColor,
                }}
                onClick={()=>{ bottomEditor?.commands.focus(); setFocusedSection("bottom"); }}
                onFocus={()=>setFocusedSection("bottom")}
              >
                {bottomBgImg && <div style={overlayStyle(bottomOverlay)} />}
                <span className="eat-section-label" style={{color: bottomTextColor==="#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"}}>
                  Footer — click to edit
                </span>
                <div style={{position:"relative", zIndex:1}}>
                  <EditorContent editor={bottomEditor} />
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className={`eat-preview-pane${viewMode==="edit"?" is-hidden":""}`}>
          <div className="eat-preview-scroll eat-preview-scroll--full">
            <div dangerouslySetInnerHTML={{__html: previewHtml}} />
          </div>
        </div>

      </div>
    </div>
  );
}
