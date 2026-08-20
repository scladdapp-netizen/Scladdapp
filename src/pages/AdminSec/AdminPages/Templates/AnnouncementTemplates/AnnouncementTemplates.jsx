import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import { useAnnouncementTemplate } from "../../../../../api_call";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SubAdminGuard from "../../../../../components/SubAdminGuard/SubAdminGuard";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { FaPlus, FaEdit, FaCopy, FaTrash } from "react-icons/fa";

// ── Email layout helpers (mirrors EditAnnouncementTemplatePage) ───────────────

const isDarkColor = (hex = "#000000") => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2)||"00",16);
  const g = parseInt(h.slice(2,4)||"00",16);
  const b = parseInt(h.slice(4,6)||"00",16);
  return (r*0.299 + g*0.587 + b*0.114) < 128;
};

const renderEmailNode = (node) => {
  if (!node) return "";
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
    const w = node.attrs?.width  ? ` width="${node.attrs.width}"`  : "";
    const h2 = node.attrs?.height ? ` height="${node.attrs.height}"` : "";
    return `<img src="${node.attrs?.src||""}" alt="${node.attrs?.alt||""}"${w}${h2} style="max-width:100%;height:auto;border-radius:4px;display:block;margin:6px auto"/>`;
  }
  const inner = (node.content||[]).map(renderEmailNode).join("");
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

const docToHtmlStr = (doc) => {
  if (!doc?.content) return "";
  return (doc.content||[]).map(renderEmailNode).join("");
};

const buildEmailSectionHtml = (html, bg, bgImg, overlay) => {
  if (bgImg) {
    const tint = overlay > 0
      ? `rgba(0,0,0,${overlay})`
      : overlay < 0
        ? `rgba(255,255,255,${Math.abs(overlay)})`
        : "transparent";
    return `<div style="position:relative;background-image:url(${bgImg});background-size:cover;background-position:center;padding:22px 28px">
      <div style="position:absolute;inset:0;background:${tint};pointer-events:none"></div>
      <div style="position:relative;z-index:1;color:#ffffff">${html}</div>
    </div>`;
  }
  return `<div style="background:${bg};padding:22px 28px;color:${isDarkColor(bg)?"#ffffff":"#1e293b"}">${html}</div>`;
};

const parseStoredLayout = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
};

const buildFullEmailPreviewHtml = (template, schoolName) => {
  const stored = parseStoredLayout(template.html_template);
  if (!stored?.top_doc && !stored?.bottom_doc) return null;

  const topHtml    = docToHtmlStr(stored.top_doc    || { type:"doc", content:[] });
  const bottomHtml = docToHtmlStr(stored.bottom_doc || { type:"doc", content:[] });

  const topBg       = stored.top_bg       || "#1e293b";
  const topBgImg    = stored.top_bg_img   || null;
  const topOverlay  = stored.top_overlay  ?? 0.4;
  const bottomBg    = stored.bottom_bg    || "#f9fafb";
  const bottomBgImg = stored.bottom_bg_img || null;
  const bottomOver  = stored.bottom_overlay ?? 0;

  const sampleContent = template.content
    ? `<p style="margin:0 0 8px;color:#374151;font-size:14px">${template.content}</p>`
    : `<p style="color:#9ca3af;font-style:italic;font-size:13px">Announcement content will appear here.</p>`;

  return `
    <div style="max-width:540px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      ${buildEmailSectionHtml(topHtml, topBg, topBgImg, topOverlay)}
      <div style="padding:24px 28px;background:#ffffff;border-top:2px dashed #e5e7eb;border-bottom:2px dashed #e5e7eb">${sampleContent}</div>
      ${buildEmailSectionHtml(bottomHtml, bottomBg, bottomBgImg, bottomOver)}
    </div>`;
};

const AnnouncementTemplates = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const {
    createAnnouncementTemplate,
    getAnnouncementTemplatesBySchool,
    getAnnouncementTemplateById,
    updateAnnouncementTemplate,
    deleteAnnouncementTemplate,
    duplicateAnnouncementTemplate,
    updateTemplateStatus,
    saveHtmlDraft,
    publishHtmlDraft,
  } = useAnnouncementTemplate();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.announcement_template?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.announcement_template?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.announcement_template?.delete;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [announcementTemplates, setAnnouncementTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentEditorRef = useRef(null);

  // Full template detail (includes html_template from API)
  const [fullTemplate, setFullTemplate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Track whether the rich-text editor is empty (for placeholder visibility)
  const [editorIsEmpty, setEditorIsEmpty] = useState(true);

  // Link insertion modal
  const [linkModal, setLinkModal] = useState(null); // null | { mode:"new"|"edit", label:"", url:"", anchorNode: el|null }
  const savedRangeRef = useRef(null); // saved selection before modal opens

  // Fetch templates on mount
  useEffect(() => {
    loadTemplates();
  }, [schoolId]);

  const loadTemplates = async () => {
    setDataLoading(true);
    try {
      const result = await getAnnouncementTemplatesBySchool(schoolId);
      if (result.success) {
        // Transform backend data to frontend format
        const transformedTemplates = result.data.map((template) => ({
          id: template.template_id,
          name: template.name,
          description: template.description,
          status: template.status,
          lastModified: new Date(template.last_modified).toLocaleDateString(),
          createdBy: template.created_by || "System",
          category: template.category,
          subject: template.subject,
          content: template.content,
          channels: template.channels,
          placeholders: template.placeholders,
        }));
        setAnnouncementTemplates(transformedTemplates);
      } else {
        addNotification(result.message || "Failed to load templates", "error");
      }
    } catch (error) {
      console.error("Load templates error:", error);
      addNotification("Failed to load announcement templates", "error");
    } finally {
      setDataLoading(false);
    }
  };

  // Sample announcement templates data (removed - now using API)
  const sampleTemplates = [];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general",
    subject: "",
    content: "",
    channels: ["Email"],
    placeholders: [],
  });

  const [newPlaceholder, setNewPlaceholder] = useState("");

  const categoryOptions = [
    { value: "general", label: "General Announcement" },
    { value: "emergency", label: "Emergency Alert" },
    { value: "event", label: "Event Invitation" },
    { value: "academic", label: "Academic Update" },
    { value: "administrative", label: "Administrative Notice" },
    { value: "seasonal", label: "Seasonal/Holiday" },
  ];

  const channelOptions = [
    { value: "Email", label: "Email", disabled: false },
    { value: "SMS", label: "SMS", disabled: true },
    { value: "App Push", label: "App Push Notification", disabled: false },
    { value: "Website", label: "Website Banner", disabled: true },
    { value: "Social Media", label: "Social Media", disabled: true },
  ];

  // Available placeholders that reflect to content and subject templates
  const availablePlaceholders = [
    "{school_name}",
    "{date}",
    "{time}",
    "{recipient_name}",
    "{student_name}",
    "{parent_name}",
    "{session}",
    "{subsession}",
    "{subject}",
    "{class}",
    "{section}",
    "{teacher_name}",
    "{grade}",
    "{academic_year}",
  ];

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChannelToggle = (channel) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handlePlaceholderToggle = (placeholder) => {
    setFormData((prev) => ({
      ...prev,
      placeholders: prev.placeholders.includes(placeholder)
        ? prev.placeholders.filter((p) => p !== placeholder)
        : [...prev.placeholders, placeholder],
    }));
  };

  const handleAddCustomPlaceholder = () => {
    if (!newPlaceholder.trim()) {
      return;
    }

    // Format the placeholder with curly braces if not already present
    let formattedPlaceholder = newPlaceholder.trim();
    if (!formattedPlaceholder.startsWith("{")) {
      formattedPlaceholder = "{" + formattedPlaceholder;
    }
    if (!formattedPlaceholder.endsWith("}")) {
      formattedPlaceholder = formattedPlaceholder + "}";
    }

    // Check if placeholder already exists
    if (formData.placeholders.includes(formattedPlaceholder)) {
      alert("This placeholder already exists!");
      return;
    }

    // Add the new placeholder
    setFormData((prev) => ({
      ...prev,
      placeholders: [...prev.placeholders, formattedPlaceholder],
    }));

    // Clear the input
    setNewPlaceholder("");
  };

  const handleRemoveCustomPlaceholder = (placeholder) => {
    // Only allow removal of custom placeholders (not default ones)
    if (availablePlaceholders.includes(placeholder)) {
      alert("Cannot remove default placeholders. You can only uncheck them.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      placeholders: prev.placeholders.filter((p) => p !== placeholder),
    }));
  };

  const insertPlaceholder = (placeholder, field = "content") => {
    if (field === "subject") {
      // For subject line (text input)
      const input = document.querySelector(
        'input[placeholder*="Important Update"]'
      );
      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentContent = formData[field] || "";
        const newContent =
          currentContent.substring(0, start) +
          placeholder +
          currentContent.substring(end);

        handleInputChange(field)(newContent);

        // Set cursor position after the inserted placeholder
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
        }, 0);
      }
    } else {
      // For content (textarea)
      const textarea = document.querySelector(
        'textarea[placeholder*="announcement content"]'
      );
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const currentContent = formData[field] || "";
        const newContent =
          currentContent.substring(0, start) +
          placeholder +
          currentContent.substring(end);

        handleInputChange(field)(newContent);

        // Set cursor position after the inserted placeholder
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + placeholder.length,
            start + placeholder.length
          );
        }, 0);
      }
    }
  };

  // Format text functions for rich text editing
  const formatText = (command, value = null) => {
    if (contentEditorRef.current) {
      contentEditorRef.current.focus();
      document.execCommand(command, false, value);

      // Update the latest content reference and form data
      const newContent = contentEditorRef.current.innerHTML;
      contentEditorRef.current.latestContent = newContent;
      handleInputChange("content")(newContent);
    }
  };

  // Wrap selected text (or insert) in a heading tag
  const insertHeading = (level) => {
    if (!contentEditorRef.current) return;
    contentEditorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // Check if we're already inside this heading — if so, unwrap
    let node = range.commonAncestorContainer;
    while (node && node !== contentEditorRef.current) {
      if (node.nodeName === `H${level}`) {
        // Unwrap: replace heading with its inner content
        const frag = document.createDocumentFragment();
        while (node.firstChild) frag.appendChild(node.firstChild);
        node.parentNode.replaceChild(frag, node);
        const newContent = contentEditorRef.current.innerHTML;
        contentEditorRef.current.latestContent = newContent;
        handleInputChange("content")(newContent);
        return;
      }
      node = node.parentNode;
    }
    // Wrap selection in heading
    const heading = document.createElement(`h${level}`);
    try {
      range.surroundContents(heading);
    } catch {
      // Selection spans multiple blocks — just insert a heading with selected text
      const selectedText = range.extractContents();
      heading.appendChild(selectedText);
      range.insertNode(heading);
    }
    const newContent = contentEditorRef.current.innerHTML;
    contentEditorRef.current.latestContent = newContent;
    handleInputChange("content")(newContent);
  };

  // Insert / edit a hyperlink — opens inline modal
  const insertLink = () => {
    if (!contentEditorRef.current) return;
    contentEditorRef.current.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Save the selection so we can restore it when modal confirms
    savedRangeRef.current = sel.getRangeAt(0).cloneRange();

    // Check if cursor is inside an existing link
    let node = sel.getRangeAt(0).commonAncestorContainer;
    while (node && node !== contentEditorRef.current) {
      if (node.nodeName === "A") {
        setLinkModal({ mode: "edit", label: node.textContent, url: node.href, anchorNode: node });
        return;
      }
      node = node.parentNode;
    }

    // New link — pre-fill label from selected text
    const selectedText = sel.getRangeAt(0).toString();
    setLinkModal({ mode: "new", label: selectedText, url: "https://", anchorNode: null });
  };

  const confirmLink = () => {
    if (!linkModal) return;
    const { mode, label, url, anchorNode } = linkModal;
    const cleanUrl = url.trim();
    const cleanLabel = label.trim();

    if (mode === "edit" && anchorNode) {
      if (!cleanUrl || cleanUrl === "https://") {
        // Remove link
        const frag = document.createDocumentFragment();
        while (anchorNode.firstChild) frag.appendChild(anchorNode.firstChild);
        anchorNode.parentNode.replaceChild(frag, anchorNode);
      } else {
        anchorNode.href = cleanUrl;
        if (cleanLabel) anchorNode.textContent = cleanLabel;
      }
    } else {
      // Restore saved selection
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
      if (!cleanUrl || cleanUrl === "https://") {
        setLinkModal(null);
        return;
      }
      // If there's selected text, createLink wraps it; otherwise insert label as text
      const sel = window.getSelection();
      const hasSelection = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
      if (hasSelection) {
        document.execCommand("createLink", false, cleanUrl);
      } else {
        // Insert label text as a link
        const a = document.createElement("a");
        a.href = cleanUrl;
        a.textContent = cleanLabel || cleanUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(a);
          range.setStartAfter(a);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }

    // Ensure all links open in new tab
    contentEditorRef.current?.querySelectorAll("a").forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });

    const newContent = contentEditorRef.current?.innerHTML || "";
    contentEditorRef.current.latestContent = newContent;
    handleInputChange("content")(newContent);
    setLinkModal(null);
  };

  const cancelLink = () => setLinkModal(null);

  // Insert placeholder into rich text editor
  const insertPlaceholderIntoEditor = (placeholder) => {
    if (contentEditorRef.current) {
      contentEditorRef.current.focus();

      // Save current selection
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);

      // Create placeholder element
      const placeholderSpan = document.createElement("span");
      placeholderSpan.className = "placeholder-tag";
      placeholderSpan.style.cssText =
        "background: #dbeafe !important; color: #1e40af !important; padding: 2px 6px !important; border-radius: 4px !important; font-weight: 600 !important; margin: 0 2px !important; display: inline-block !important;";
      placeholderSpan.textContent = placeholder;

      // Create a space after the placeholder to prevent style inheritance
      const spaceNode = document.createTextNode("\u00A0");

      // Insert the placeholder and space
      range.deleteContents();
      range.insertNode(spaceNode);
      range.insertNode(placeholderSpan);

      // Position cursor after the space
      range.setStartAfter(spaceNode);
      range.setEndAfter(spaceNode);
      selection.removeAllRanges();
      selection.addRange(range);

      // Update the latest content reference and form data
      const newContent = contentEditorRef.current.innerHTML;
      contentEditorRef.current.latestContent = newContent;
      handleInputChange("content")(newContent);
    }
  };

  // Handle content editor changes with debouncing to avoid cursor issues
  const handleContentEditorChange = () => {
    // Don't update state immediately to avoid cursor jumping
  };

  // Handle content editor input with proper debouncing
  const handleContentEditorInput = (e) => {
    // Update state only on blur or after a delay
    const newContent = e.target.innerHTML;

    // Use a ref to store the latest content without triggering re-renders
    if (contentEditorRef.current) {
      contentEditorRef.current.latestContent = newContent;
    }
    // Update placeholder visibility based on actual DOM content
    setEditorIsEmpty(e.target.innerText.trim() === "" && e.target.innerHTML.trim() === "");
  };

  // Handle content editor blur to save content
  const handleContentEditorBlur = () => {
    if (
      contentEditorRef.current &&
      contentEditorRef.current.latestContent !== undefined
    ) {
      handleInputChange("content")(contentEditorRef.current.latestContent);
    }
  };

  // Save and restore cursor position
  const saveCursorPosition = () => {
    if (contentEditorRef.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(contentEditorRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
      }
    }
    return 0;
  };

  const restoreCursorPosition = (position) => {
    if (contentEditorRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      let charCount = 0;
      let nodeStack = [contentEditorRef.current];
      let node,
        foundStart = false;

      while (!foundStart && (node = nodeStack.pop())) {
        if (node.nodeType === Node.TEXT_NODE) {
          const nextCharCount = charCount + node.textContent.length;
          if (
            !foundStart &&
            position >= charCount &&
            position <= nextCharCount
          ) {
            range.setStart(node, position - charCount);
            range.setEnd(node, position - charCount);
            foundStart = true;
          }
          charCount = nextCharCount;
        } else {
          let i = node.childNodes.length;
          while (i--) {
            nodeStack.push(node.childNodes[i]);
          }
        }
      }

      if (foundStart) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  // Get only selected placeholders for display
  const getSelectedPlaceholders = () => {
    return formData.placeholders || [];
  };

  const generatePreviewContent = (template) => {
    const sampleData = {
      "{school_name}": "Greenwood International School",
      "{date}": new Date().toLocaleDateString(),
      "{time}": new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      "{recipient_name}": "John Smith",
      "{student_name}": "Emma Smith",
      "{parent_name}": "John Smith",
      "{session}": "2024-2025",
      "{subsession}": "First Term",
      "{subject}": "Mathematics",
      "{class}": "Grade 10",
      "{section}": "A",
      "{teacher_name}": "Ms. Johnson",
      "{grade}": "A+",
      "{academic_year}": "2024-2025",
    };

    let previewSubject = template.subject || "";
    let previewContent = template.content || "";

    // Replace placeholders with sample data
    Object.entries(sampleData).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g");
      previewSubject = previewSubject.replace(regex, value);
      previewContent = previewContent.replace(regex, value);
    });

    // Convert HTML content to formatted text for preview
    const formatHtmlForPreview = (htmlContent) => {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;

      // Remove placeholder styling but keep the text
      const placeholderTags = tempDiv.querySelectorAll(".placeholder-tag");
      placeholderTags.forEach((tag) => {
        const textNode = document.createTextNode(tag.textContent);
        tag.parentNode.replaceChild(textNode, tag);
      });

      // Remove any empty spans that might have been left behind
      const emptySpans = tempDiv.querySelectorAll("span:empty");
      emptySpans.forEach((span) => span.remove());

      return tempDiv.innerHTML;
    };

    return {
      subject: previewSubject,
      content: formatHtmlForPreview(previewContent),
    };
  };

  const handleCreateTemplate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create announcement templates.", "error");
      return;
    }
    setIsCreateMenuOpen(true);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      category: "general",
      subject: "",
      content: "",
      channels: ["Email"],
      placeholders: [],
    });

    // Clear the rich text editor
    setTimeout(() => {
      if (contentEditorRef.current) {
        contentEditorRef.current.innerHTML = "";
      }
      setEditorIsEmpty(true);
    }, 100);
  };

  const handleEditTemplate = (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit announcement templates.", "error");
      return;
    }
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      subject: template.subject,
      content: template.content,
      channels: template.channels,
      placeholders: template.placeholders,
    });
    setIsCreateMenuOpen(true);
    setIsDetailMenuOpen(false);

    // Set the rich text editor content
    setTimeout(() => {
      if (contentEditorRef.current) {
        contentEditorRef.current.innerHTML = template.content || "";
      }
      setEditorIsEmpty(!template.content || template.content.trim() === "");
    }, 100);
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setFullTemplate(null);
    setIsDetailMenuOpen(true);
    // Fetch full template to get html_template for email preview
    (async () => {
      setDetailLoading(true);
      const res = await getAnnouncementTemplateById(template.id);
      if (res.success && res.data) {
        setFullTemplate(res.data);
      }
      setDetailLoading(false);
    })();
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.subject || !formData.content) {
      addNotification("Please fill in all required fields", "error");
      return;
    }

    if (formData.channels.length === 0) {
      addNotification("Please select at least one delivery channel", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get content from rich text editor
      const editorContent = contentEditorRef.current
        ? contentEditorRef.current.innerHTML
        : formData.content;

      // Transform formData to backend format
      const backendData = {
        school_id: schoolId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subject: formData.subject,
        content: editorContent,
        channels: formData.channels,
        placeholders: formData.placeholders,
        created_by: user?.admin?.admin_id || user?.user_id,
        modified_by: user?.admin?.admin_id || user?.user_id,
      };

      let result;
      if (selectedTemplate) {
        // Update existing template
        result = await updateAnnouncementTemplate(
          selectedTemplate.id,
          backendData
        );
      } else {
        // Create new template
        result = await createAnnouncementTemplate(backendData);
      }

      if (result.success) {
        addNotification(
          result.message ||
            `Announcement template ${
              selectedTemplate ? "updated" : "created"
            } successfully`,
          "success"
        );
        setIsCreateMenuOpen(false);
        if (!selectedTemplate && result.data?.template_id) {
          // Build and save the default email layout before opening the editor
          const schoolName = user?.school?.school_name || "";
          const logoUrl    = user?.school?.logo_url    || "";
          const templateName = backendData.name || "";

          const defaultTopDoc = {
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
                  { type: "text", text: templateName || "Announcement Subject" },
                ],
              },
            ],
          };

          const defaultBottomDoc = {
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
                content: [{ type: "text", text: "This is an official communication. Please do not reply directly." }],
              },
            ],
          };

          const defaultLayout = JSON.stringify({
            top_doc:        defaultTopDoc,
            bottom_doc:     defaultBottomDoc,
            top_bg:         "#1e293b",
            top_bg_img:     null,
            top_overlay:    0.4,
            bottom_bg:      "#f9fafb",
            bottom_bg_img:  null,
            bottom_overlay: 0,
          });

          await saveHtmlDraft(result.data.template_id, defaultLayout);
          await publishHtmlDraft(result.data.template_id);

          navigate(`/admin/${schoolId}/templates/announcement/edit/${result.data.template_id}`);
        } else {
          await loadTemplates();
        }
      } else {
        addNotification(result.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      addNotification("Failed to save announcement template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template) => {
    if (!canCreate) {
      addNotification("You do not have permission to duplicate announcement templates.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await duplicateAnnouncementTemplate(template.id, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(
          "Announcement template duplicated successfully",
          "success"
        );
        await loadTemplates(); // Reload templates
      } else {
        addNotification(
          result.message || "Failed to duplicate template",
          "error"
        );
      }
    } catch (error) {
      console.error("Duplicate error:", error);
      addNotification("Failed to duplicate announcement template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    if (!canDelete) {
      addNotification("You do not have permission to delete announcement templates.", "error");
      return;
    }
    if (
      !window.confirm(`Are you sure you want to delete "${template.name}"?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteAnnouncementTemplate(template.id, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(
          "Announcement template deleted successfully",
          "success"
        );
        setIsDetailMenuOpen(false);
        await loadTemplates(); // Reload templates
      } else {
        addNotification(result.message || "Failed to delete template", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      addNotification("Failed to delete announcement template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (template, newStatus) => {
    setIsSubmitting(true);
    try {
      const result = await updateTemplateStatus(template.id, newStatus, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(`Template ${newStatus} successfully`, "success");
        await loadTemplates(); // Reload templates
      } else {
        addNotification(result.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Status update error:", error);
      addNotification("Failed to update template status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SubAdminGuard permission="announcement_template">
    <InnerTabCon>
      {dataLoading ? (
        <LoadingData />
      ) : (
        <div className="templates-container">
          <div className="templates-header">
            <div className="templates-header-left">
              <h2>Announcement Templates</h2>
              <p>
                Create and manage templates for school announcements and
                communications
              </p>
            </div>
            <div className="templates-actions">
              <Button onClick={handleCreateTemplate}>
                <FaPlus size={14} style={{ marginRight: "8px" }} />
                Create Template
              </Button>
            </div>
          </div>

          <div className="template-section">
            <h3>Available Announcement Templates</h3>
            {announcementTemplates.length === 0 ? (
              <div className="kk-template-empty-state">
                <p>No announcement templates found</p>
                <p style={{ fontSize: "14px" }}>Create your first announcement template to get started</p>
                <Button onClick={handleCreateTemplate}><FaPlus size={14} style={{ marginRight: "8px" }} />Create Template</Button>
              </div>
            ) : (
            <div className="template-grid">
              {announcementTemplates.map((template) => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => handleViewTemplate(template)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="template-card-header">
                    <h4 className="template-card-title">{template.name}</h4>
                    <span className={`template-card-status ${template.status}`}>
                      {template.status}
                    </span>
                  </div>
                  <p className="template-card-description">
                    {template.description}
                  </p>
                  <div className="template-details">
                    <div className="template-detail-item">
                      <strong>Category:</strong> {template.category}
                    </div>
                    <div className="template-detail-item">
                      <strong>Channels:</strong> {template.channels.join(", ")}
                    </div>
                    <div className="template-detail-item">
                      <strong>Placeholders:</strong>{" "}
                      {template.placeholders.length}
                    </div>
                  </div>
                  <div className="template-card-meta">
                    <span>Modified: {template.lastModified}</span>
                    <span>By: {template.createdBy}</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Create/Edit Template SlideInMenu */}
          <SlideInMenu
            isShow={isCreateMenuOpen}
            onClose={() => setIsCreateMenuOpen(false)}
            width="800px"
          >
            <div className="create-template-container">
              <div className="create-template-header">
                <h2>
                  {selectedTemplate ? "Edit" : "Create"} Announcement Template
                </h2>
                <p>Design your announcement template with dynamic content</p>
              </div>

              <div className="create-template-form">
                <div className="form-row">
                  <FormInput
                    label="Template Name *"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="e.g., General School Announcement"
                  />

                  <FormInput
                    label="Category"
                    type="select"
                    value={formData.category}
                    onChange={handleInputChange("category")}
                    options={categoryOptions}
                  />
                </div>

                <FormInput
                  label="Description"
                  type="textarea"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  placeholder="Describe this announcement template..."
                  height="60px"
                />

                <div className="placeholders-section">
                  <h3>Available Placeholders</h3>
                  <p>
                    Select default placeholders or create custom ones for your
                    Subject Line Template and Announcement Content Template:
                  </p>

                  {/* Default Placeholders */}
                  <div className="placeholders-subsection">
                    <h4
                      style={{
                        marginBottom: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Default Placeholders
                    </h4>
                    <div className="placeholders-grid">
                      {availablePlaceholders.map((placeholder) => (
                        <label
                          key={placeholder}
                          className="placeholder-checkbox"
                        >
                          <input
                            type="checkbox"
                            checked={formData.placeholders.includes(
                              placeholder
                            )}
                            onChange={() =>
                              handlePlaceholderToggle(placeholder)
                            }
                          />
                          <span>{placeholder}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Placeholders */}
                  <div
                    className="placeholders-subsection"
                    style={{ marginTop: "20px" }}
                  >
                    <h4
                      style={{
                        marginBottom: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Custom Placeholders
                    </h4>
                    <div
                      className="custom-placeholder-input"
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <FormInput
                          type="text"
                          value={newPlaceholder}
                          onChange={(value) => setNewPlaceholder(value)}
                          placeholder="e.g., event_name or {event_name}"
                        />
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleAddCustomPlaceholder}
                        disabled={!newPlaceholder.trim()}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <FaPlus size={12} style={{ marginRight: "6px" }} />
                        Add
                      </Button>
                    </div>

                    {/* Display custom placeholders */}
                    {formData.placeholders.filter(
                      (p) => !availablePlaceholders.includes(p)
                    ).length > 0 && (
                      <div
                        className="custom-placeholders-list"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          padding: "12px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "6px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {formData.placeholders
                          .filter((p) => !availablePlaceholders.includes(p))
                          .map((placeholder) => (
                            <div
                              key={placeholder}
                              className="custom-placeholder-item"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "6px 12px",
                                backgroundColor: "#dbeafe",
                                color: "#1e40af",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                              }}
                            >
                              <span className="placeholder-name">
                                {placeholder}
                              </span>
                              <button
                                type="button"
                                className="remove-placeholder-btn"
                                onClick={() =>
                                  handleRemoveCustomPlaceholder(placeholder)
                                }
                                title="Remove custom placeholder"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  padding: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: "4px",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#fee2e2")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "transparent")
                                }
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

    <div className="content-section">
                  <div className="content-header">
                    <label className="form-label">
                      Subject Line Template *
                    </label>
                    <div className="placeholder-buttons">
                      {getSelectedPlaceholders().map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          className="placeholder-btn"
                          onClick={() =>
                            insertPlaceholder(placeholder, "subject")
                          }
                        >
                          {placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormInput
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange("subject")}
                    placeholder="e.g., Important Update from {school_name}"
                  />
                </div>
                <div className="content-section">
                  <div className="content-header">
                    <label className="form-label">
                      Announcement Content Template *
                    </label>
                    <div className="placeholder-buttons">
                      {getSelectedPlaceholders().map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          className="placeholder-btn"
                          onClick={() =>
                            insertPlaceholderIntoEditor(placeholder)
                          }
                        >
                          {placeholder}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rich-text-editor-container">
                    <div className="formatting-toolbar">
                      <button
                        type="button"
                        className="format-btn"
                        title="Bold"
                        onClick={() => formatText("bold")}
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        className="format-btn"
                        title="Italic"
                        onClick={() => formatText("italic")}
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        className="format-btn"
                        title="Underline"
                        onClick={() => formatText("underline")}
                      >
                        <u>U</u>
                      </button>

                      <span className="format-sep" />

                      <button
                        type="button"
                        className="format-btn format-btn-heading"
                        title="Heading 1"
                        onClick={() => insertHeading(1)}
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        className="format-btn format-btn-heading"
                        title="Heading 2"
                        onClick={() => insertHeading(2)}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        className="format-btn format-btn-heading"
                        title="Heading 3"
                        onClick={() => insertHeading(3)}
                      >
                        H3
                      </button>

                      <span className="format-sep" />

                      <button
                        type="button"
                        className="format-btn"
                        title="Bullet List"
                        onClick={() => formatText("insertUnorderedList")}
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        className="format-btn"
                        title="Numbered List"
                        onClick={() => formatText("insertOrderedList")}
                      >
                        1. List
                      </button>

                      <span className="format-sep" />

                      <button
                        type="button"
                        className="format-btn"
                        title="Insert / edit link"
                        onClick={insertLink}
                      >
                        🔗 Link
                      </button>
                    </div>

                    <div className="editor-wrapper">
                      <div
                        ref={contentEditorRef}
                        className="rich-text-editor"
                        contentEditable
                        suppressContentEditableWarning={true}
                        onInput={handleContentEditorInput}
                        onBlur={handleContentEditorBlur}
                        onKeyDown={(e) => {
                          // Walk up from a DOM node to find an ancestor <li>
                          // that is inside the editor
                          const findLi = () => {
                            const sel = window.getSelection();
                            if (!sel || sel.rangeCount === 0) return null;
                            let node = sel.getRangeAt(0).startContainer;
                            while (node && node !== contentEditorRef.current) {
                              if (node.nodeType === 1 && node.nodeName === "LI") return node;
                              node = node.parentNode;
                            }
                            return null;
                          };

                          // An li counts as empty if it has no real text
                          const isEmpty = (li) =>
                            (li.textContent || "").replace(/[\u00a0\n]/g, "").trim() === "";

                          // Remove li, exit the list, place cursor after
                          const exitList = (li) => {
                            const sel = window.getSelection();
                            const list = li.parentNode;
                            const afterList = list.nextSibling;
                            li.remove();
                            // Drop a text node after the list so cursor has somewhere to go
                            const textNode = document.createTextNode("\u200b");
                            if (afterList) {
                              list.parentNode.insertBefore(textNode, afterList);
                            } else {
                              list.parentNode.appendChild(textNode);
                            }
                            // Clean up empty list
                            if (list.children.length === 0) list.remove();
                            // Move cursor to the text node
                            const r = document.createRange();
                            r.setStart(textNode, 1);
                            r.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(r);
                          };

                          if (e.key === "Enter" && !e.shiftKey) {
                            const li = findLi();
                            if (li) {
                              if (isEmpty(li)) {
                                e.preventDefault();
                                exitList(li);
                              }
                              // non-empty li: browser adds next li naturally
                            } else {
                              e.preventDefault();
                              document.execCommand("insertHTML", false, "<br><br>");
                            }
                          }

                          if (e.key === "Backspace") {
                            const li = findLi();
                            if (li && isEmpty(li)) {
                              e.preventDefault();
                              exitList(li);
                            }
                          }

                          // Reset span formatting inherited from placeholder tags
                          if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
                            setTimeout(() => {
                              const sel = window.getSelection();
                              if (!sel || sel.rangeCount === 0) return;
                              const container = sel.getRangeAt(0).commonAncestorContainer;
                              if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
                                const parent = container.parentElement;
                                if (parent.tagName === "SPAN" && !parent.classList.contains("placeholder-tag")) {
                                  parent.style.background = "";
                                  parent.style.color = "";
                                  parent.style.fontWeight = "";
                                }
                              }
                            }, 0);
                          }
                        }}
                      />

                      {editorIsEmpty && (
                        <div className="editor-placeholder">
                          Write your announcement content template here. Use
                          placeholders and formatting...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Preview Section */}
              {isPreviewOpen && (
                <div className="template-preview-section">
                  <div className="preview-header">
                    <h3>📧 Announcement Preview</h3>
                    <button
                      className="close-preview-btn"
                      onClick={() => setIsPreviewOpen(false)}
                    >
                      ✕ Close Preview
                    </button>
                  </div>
                  <div className="preview-content">
                    <div className="announcement-preview">
                      {(() => {
                        const preview = generatePreviewContent(formData);
                        return (
                          <div className="email-preview">
                            <div className="email-header">
                              <div className="email-field">
                                <strong>Subject:</strong>{" "}
                                {preview.subject || "No subject"}
                              </div>
                              <div className="email-field">
                                <strong>From:</strong> Greenwood International
                                School
                              </div>
                              <div className="email-field">
                                <strong>To:</strong> John Smith
                              </div>
                            </div>
                            <div className="email-body">
                              <div className="email-content">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: preview.content,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <div className="create-template-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateMenuOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={isSubmitting}
                >
                  Preview
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.name ||
                    !formData.content ||
                    !formData.subject ||
                    formData.channels.length === 0 ||
                    isSubmitting
                  }
                >
                  {isSubmitting
                    ? "Saving..."
                    : selectedTemplate
                    ? "Update"
                    : "Create"}{" "}
                  Template
                </Button>
              </div>

              {/* Link insertion modal */}
              {linkModal && (
                <div className="at-link-modal-overlay" onClick={cancelLink}>
                  <div className="at-link-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="at-link-modal-title">
                      {linkModal.mode === "edit" ? "Edit Link" : "Insert Link"}
                    </div>
                    <div className="at-link-modal-field">
                      <label className="at-link-modal-label">Label</label>
                      <input
                        className="at-link-modal-input"
                        type="text"
                        placeholder="e.g. Click here"
                        value={linkModal.label}
                        onChange={(e) => setLinkModal((m) => ({ ...m, label: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div className="at-link-modal-field">
                      <label className="at-link-modal-label">URL</label>
                      <input
                        className="at-link-modal-input"
                        type="url"
                        placeholder="https://example.com"
                        value={linkModal.url}
                        onChange={(e) => setLinkModal((m) => ({ ...m, url: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") confirmLink(); if (e.key === "Escape") cancelLink(); }}
                      />
                    </div>
                    <div className="at-link-modal-actions">
                      {linkModal.mode === "edit" && (
                        <button
                          className="at-link-modal-remove"
                          onClick={() => {
                            // Remove the link
                            const { anchorNode } = linkModal;
                            if (anchorNode) {
                              const frag = document.createDocumentFragment();
                              while (anchorNode.firstChild) frag.appendChild(anchorNode.firstChild);
                              anchorNode.parentNode.replaceChild(frag, anchorNode);
                              const newContent = contentEditorRef.current?.innerHTML || "";
                              contentEditorRef.current.latestContent = newContent;
                              handleInputChange("content")(newContent);
                            }
                            setLinkModal(null);
                          }}
                        >
                          Remove Link
                        </button>
                      )}
                      <button className="at-link-modal-cancel" onClick={cancelLink}>Cancel</button>
                      <button className="at-link-modal-confirm" onClick={confirmLink}>
                        {linkModal.mode === "edit" ? "Save" : "Insert"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SlideInMenu>

          {/* Template Detail SlideInMenu */}
          <SlideInMenu
            isShow={isDetailMenuOpen}
            onClose={() => setIsDetailMenuOpen(false)}
            width="800px"
          >
            {selectedTemplate && (
              <div className="template-detail-container">
                <div className="template-detail-header">
                  <div className="template-detail-title">
                    <h2>{selectedTemplate.name}</h2>
                    <span
                      className={`template-card-status ${selectedTemplate.status}`}
                    >
                      {selectedTemplate.status}
                    </span>
                  </div>
                  <p className="template-detail-description">
                    {selectedTemplate.description}
                  </p>
                  <div className="template-detail-meta">
                    <div className="template-meta-item">
                      <strong>Last Modified:</strong>{" "}
                      {selectedTemplate.lastModified}
                    </div>
                    <div className="template-meta-item">
                      <strong>Created By:</strong> {selectedTemplate.createdBy}
                    </div>
                    <div className="template-meta-item">
                      <strong>Category:</strong> {selectedTemplate.category}
                    </div>
                  </div>
                </div>

                <div className="template-detail-content">
                  {/* Content Template */}
                  <div className="detail-section">
                    <h3>Content Template</h3>
                    <div className="content-template-display">
                      <div
                        className="template-content"
                        dangerouslySetInnerHTML={{
                          __html: selectedTemplate.content,
                        }}
                      />
                    </div>
                  </div>

                  {/* Available Placeholders */}
                  <div className="detail-section">
                    <h3>
                      Available Placeholders (
                      {selectedTemplate.placeholders.length})
                    </h3>
                    <div className="placeholders-overview">
                      {selectedTemplate.placeholders.map(
                        (placeholder, index) => (
                          <div
                            key={index}
                            className="placeholder-overview-item"
                          >
                            <span className="placeholder-number">
                              {index + 1}
                            </span>
                            <span className="placeholder-name">
                              {placeholder}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Announcement Preview */}
                  <div className="detail-section">
                    <h3>Announcement Preview</h3>

                    {/* Edit Email Layout button — above the preview */}
                    <div style={{ marginBottom: "14px" }}>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/admin/${schoolId}/templates/announcement/edit/${selectedTemplate.id}`)}
                      >
                        <FaEdit size={14} style={{ marginRight: "8px" }} />
                        Edit Email Layout
                      </Button>
                    </div>

                    {/* Full email layout preview */}
                    {detailLoading ? (
                      <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        Loading email preview…
                      </div>
                    ) : (() => {
                      const schoolName = user?.school?.school_name || "";
                      const previewHtml = fullTemplate
                        ? buildFullEmailPreviewHtml({ ...fullTemplate, content: selectedTemplate.content }, schoolName)
                        : null;

                      if (previewHtml) {
                        return (
                          <div
                            className="at-email-full-preview"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                          />
                        );
                      }

                      // Fallback: plain text preview if no layout saved yet
                      const preview = generatePreviewContent(selectedTemplate);
                      return (
                        <div className="announcement-preview-container">
                          <div className="email-preview">
                            <div className="email-header">
                              <div className="email-field">
                                <strong>Subject:</strong> {preview.subject}
                              </div>
                              <div className="email-field">
                                <strong>From:</strong> Greenwood International School
                              </div>
                              <div className="email-field">
                                <strong>To:</strong> John Smith
                              </div>
                            </div>
                            <div className="email-body">
                              <div className="email-content">
                                <div dangerouslySetInnerHTML={{ __html: preview.content }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="template-detail-actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleEditTemplate(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaEdit size={14} style={{ marginRight: "8px" }} />
                    Edit Content
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDuplicate(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaCopy size={14} style={{ marginRight: "8px" }} />
                    Duplicate
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaTrash size={14} style={{ marginRight: "8px" }} />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </SlideInMenu>
        </div>
      )}
    </InnerTabCon>
    </SubAdminGuard>
  );
};

export default AnnouncementTemplates;

