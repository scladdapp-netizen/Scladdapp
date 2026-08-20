import { useState, useEffect, useRef } from "react";
import useSupportTicket from "../../api_call/useSupportTicket";
import "./FeedbackPanel.css";

/* ── tiny helpers ── */
const STATUS_META = {
  open:          { label: "Open",          color: "#2563eb" },
  in_progress:   { label: "In Progress",   color: "#d97706" },
  waiting_reply: { label: "Waiting Reply", color: "#7c3aed" },
  resolved:      { label: "Resolved",      color: "#16a34a" },
  closed:        { label: "Closed",        color: "#6b7280" },
};

const TYPE_LABELS = {
  bug:         "Bug / Issue",
  improvement: "Improvement Idea",
  question:    "Question",
  other:       "Other",
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

/* ── ImagePreview: click to enlarge ── */
const ImagePreview = ({ src, alt = "attachment" }) => {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <img
        src={src} alt={alt}
        className="fbp_msg_img"
        onClick={() => setLightbox(true)}
      />
      {lightbox && (
        <div className="fbp_lightbox" onClick={() => setLightbox(false)}>
          <img src={src} alt={alt} className="fbp_lightbox_img" />
        </div>
      )}
    </>
  );
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
const FeedbackPanel = ({
  isOpen, onClose,
  userType, userId, userName, userEmail,
  schoolId, schoolName,
}) => {
  const { createTicket, getMyTickets, getTicketDetail, addMessage } = useSupportTicket();

  /* ── tabs: "new" | "list" | "detail" ── */
  const [view,      setView]      = useState("new");
  const [tickets,   setTickets]   = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  /* ── create form ── */
  const [type,        setType]        = useState("bug");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [attachment,  setAttachment]  = useState(null);   // File | null
  const [attachPreview, setAttachPreview] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);

  /* ── detail / chat view ── */
  const [activeTicket,   setActiveTicket]   = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [loadingDetail,  setLoadingDetail]  = useState(false);
  const [replyBody,      setReplyBody]      = useState("");
  const [replyFile,      setReplyFile]      = useState(null);
  const [replyPreview,   setReplyPreview]   = useState(null);
  const [sendingReply,   setSendingReply]   = useState(false);

  const fileInputRef  = useRef(null);
  const replyFileRef  = useRef(null);
  const chatBottomRef = useRef(null);

  /* ── load list when switching to list tab ── */
  useEffect(() => {
    if (view === "list" && userId) {
      loadTickets();
    }
  }, [view]);

  /* ── scroll chat to bottom on new messages ── */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadTickets = async () => {
    setLoadingList(true);
    const res = await getMyTickets({ user_id: userId, user_type: userType });
    if (res.success) setTickets(res.data);
    setLoadingList(false);
  };

  const openTicket = async (ticket) => {
    setActiveTicket(ticket);
    setView("detail");
    setLoadingDetail(true);
    const res = await getTicketDetail(ticket._id);
    if (res.success) {
      setActiveTicket(res.data.ticket);
      setMessages(res.data.messages);
    }
    setLoadingDetail(false);
  };

  /* ── attachment helpers ── */
  const handleAttachChange = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearAttach = (setFile, setPreview) => {
    setFile(null);
    setPreview(null);
  };

  /* ── submit new ticket ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const res = await createTicket({
      user_type: userType, user_id: userId, user_name: userName,
      user_email: userEmail, school_id: schoolId, school_name: schoolName,
      type, title: title.trim(), description: description.trim(),
      attachment,
    });
    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
      setTitle(""); setDescription(""); setAttachment(null); setAttachPreview(null); setType("bug");
    }
  };

  /* ── send reply ── */
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() && !replyFile) return;
    setSendingReply(true);
    const res = await addMessage(activeTicket._id, {
      sender_type: "user",
      sender_name: userName,
      body: replyBody.trim(),
      attachment: replyFile,
    });
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      setReplyBody(""); setReplyFile(null); setReplyPreview(null);
      // Refresh ticket to get updated status
      const detail = await getTicketDetail(activeTicket._id);
      if (detail.success) setActiveTicket(detail.data.ticket);
    }
    setSendingReply(false);
  };

  /* ── reset and close ── */
  const handleClose = () => {
    setView("new");
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="fbp_overlay" onClick={handleClose}>
      <div className="fbp_panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="fbp_header">
          <div className="fbp_header_icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C7.58 3 4 6.58 4 11v1" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M20 11v1" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
              <rect x="2" y="12" width="4" height="6" rx="2" fill="white" opacity="0.9"/>
              <rect x="18" y="12" width="4" height="6" rx="2" fill="white" opacity="0.9"/>
              <path d="M20 17.5C20 19.43 18.43 21 16.5 21H13" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
              <circle cx="12" cy="21" r="1.3" fill="white"/>
            </svg>
          </div>
          <div className="fbp_header_text">
            {view === "detail" && activeTicket ? (
              <>
                <p className="fbp_title" title={activeTicket.title}>
                  {activeTicket.title.length > 30
                    ? activeTicket.title.slice(0, 30) + "…"
                    : activeTicket.title}
                </p>
                <p className="fbp_subtitle">
                  <span
                    className="fbp_status_dot"
                    style={{ background: STATUS_META[activeTicket.status]?.color }}
                  />
                  {STATUS_META[activeTicket.status]?.label}
                </p>
              </>
            ) : (
              <>
                <p className="fbp_title">Help &amp; Report</p>
                <p className="fbp_subtitle">Support center</p>
              </>
            )}
          </div>
          <button className="fbp_close" onClick={handleClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Tab bar (only when not in detail view) ── */}
        {view !== "detail" && (
          <div className="fbp_tabs">
            <button
              className={`fbp_tab ${view === "new" ? "active" : ""}`}
              onClick={() => { setSubmitted(false); setView("new"); }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5v3.5M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Report Issue
            </button>
            <button
              className={`fbp_tab ${view === "list" ? "active" : ""}`}
              onClick={() => { setView("list"); }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              My Issues
            </button>
          </div>
        )}

        {/* ── Back button in detail view ── */}
        {view === "detail" && (
          <button
            className="fbp_back_btn"
            onClick={() => { setView("list"); loadTickets(); }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to my issues
          </button>
        )}

        {/* ════════════════
            VIEW: NEW TICKET
        ════════════════ */}
        {view === "new" && (
          submitted ? (
            <div className="fbp_success">
              <div className="fbp_success_icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
                  <path d="M13 20l5 5 10-10" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="fbp_success_title">Ticket submitted!</p>
              <p className="fbp_success_msg">
                We've received your report. You can track the status under "My Issues".
              </p>
              <div className="fbp_success_actions">
                <button className="fbp_btn_secondary" onClick={() => { setSubmitted(false); setView("list"); }}>
                  View My Issues
                </button>
                <button className="fbp_btn_primary" onClick={() => setSubmitted(false)}>
                  New Report
                </button>
              </div>
            </div>
          ) : (
            <form className="fbp_body" onSubmit={handleSubmit}>
              {/* Type */}
              <div className="fbp_field">
                <label className="fbp_label">Issue Type</label>
                <div className="fbp_type_grid">
                  {Object.entries(TYPE_LABELS).map(([val, lbl]) => (
                    <button
                      key={val} type="button"
                      className={`fbp_type_btn ${type === val ? "active" : ""}`}
                      onClick={() => setType(val)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="fbp_field">
                <label className="fbp_label" htmlFor="fbp_title">Title</label>
                <input
                  id="fbp_title"
                  className="fbp_input"
                  placeholder="Short summary of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="fbp_field">
                <label className="fbp_label" htmlFor="fbp_desc">Description</label>
                <textarea
                  id="fbp_desc"
                  className="fbp_textarea"
                  placeholder="Describe what happened, steps to reproduce, expected vs actual behaviour…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              {/* Attachment */}
              <div className="fbp_field">
                <label className="fbp_label">Screenshot (optional)</label>
                {attachPreview ? (
                  <div className="fbp_attach_preview">
                    <img src={attachPreview} alt="preview" className="fbp_attach_img" />
                    <button
                      type="button" className="fbp_attach_remove"
                      onClick={() => clearAttach(setAttachment, setAttachPreview)}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button" className="fbp_attach_btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Add screenshot
                  </button>
                )}
                <input
                  ref={fileInputRef} type="file" accept="image/*" hidden
                  onChange={(e) => handleAttachChange(e.target.files[0], setAttachment, setAttachPreview)}
                />
              </div>

              {/* From */}
              <div className="fbp_from">
                <span className="fbp_from_label">From</span>
                <span className="fbp_from_value">{userName}</span>
                {schoolName && (
                  <>
                    <span className="fbp_from_sep">·</span>
                    <span className="fbp_from_value">{schoolName}</span>
                  </>
                )}
              </div>

              <button type="submit" className="fbp_btn_primary" disabled={submitting || !title.trim() || !description.trim()}>
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
            </form>
          )
        )}

        {/* ════════════════
            VIEW: MY ISSUES LIST
        ════════════════ */}
        {view === "list" && (
          <div className="fbp_list_view">
            {loadingList ? (
              <div className="fbp_list_empty">
                <div className="fbp_spinner" />
                <p>Loading your tickets…</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="fbp_list_empty">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5"/>
                  <path d="M13 20h14M20 13v14" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <p>No tickets yet</p>
                <span>Report an issue using the "Report Issue" tab</span>
              </div>
            ) : (
              <ul className="fbp_ticket_list">
                {tickets.map((t) => (
                  <li key={t._id} className="fbp_ticket_item" onClick={() => openTicket(t)}>
                    <div className="fbp_ticket_meta">
                      <span
                        className="fbp_status_badge"
                        style={{ background: STATUS_META[t.status]?.color + "18", color: STATUS_META[t.status]?.color }}
                      >
                        {STATUS_META[t.status]?.label}
                      </span>
                      <span className="fbp_ticket_type">{TYPE_LABELS[t.type] || t.type}</span>
                    </div>
                    <p className="fbp_ticket_title">{t.title}</p>
                    <p className="fbp_ticket_date">{fmtDate(t.updatedAt)}</p>
                    {t.user_unread > 0 && (
                      <span className="fbp_unread_badge">{t.user_unread}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ════════════════
            VIEW: TICKET DETAIL / CHAT
        ════════════════ */}
        {view === "detail" && (
          <div className="fbp_chat_view">
            {loadingDetail ? (
              <div className="fbp_list_empty">
                <div className="fbp_spinner" />
                <p>Loading ticket…</p>
              </div>
            ) : (
              <>
                <div className="fbp_chat_messages">

                  {/* ── First message = original description ── */}
                  {activeTicket && (
                    <div className="fbp_chat_msg fbp_chat_msg--user fbp_chat_msg--first">
                      <div className="fbp_msg_bubble">
                        <div className="fbp_msg_first_header">
                          <span className="fbp_msg_type_tag">{TYPE_LABELS[activeTicket.type]}</span>
                          <span className="fbp_msg_date">{fmtDate(activeTicket.createdAt)}</span>
                        </div>
                        <p className="fbp_msg_body">{activeTicket.description}</p>
                        {activeTicket.attachment_url && (
                          <ImagePreview src={activeTicket.attachment_url} alt="screenshot" />
                        )}
                        <span className="fbp_msg_time">{fmtTime(activeTicket.createdAt)}</span>
                      </div>
                    </div>
                  )}

                  {/* ── Follow-up messages ── */}
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`fbp_chat_msg ${msg.sender_type === "user" ? "fbp_chat_msg--user" : "fbp_chat_msg--support"}`}
                    >
                      {msg.sender_type === "support" && (
                        <div className="fbp_chat_avatar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3C7.58 3 4 6.58 4 11v1" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
                            <path d="M20 11v1" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
                            <rect x="2" y="12" width="4" height="6" rx="2" fill="white" opacity="0.9"/>
                            <rect x="18" y="12" width="4" height="6" rx="2" fill="white" opacity="0.9"/>
                            <path d="M20 17.5C20 19.43 18.43 21 16.5 21H13" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
                            <circle cx="12" cy="21" r="1.3" fill="white"/>
                          </svg>
                        </div>
                      )}
                      <div className="fbp_msg_bubble">
                        {msg.sender_type === "support" && (
                          <span className="fbp_msg_sender_name">Support Team</span>
                        )}
                        {msg.body && <p className="fbp_msg_body">{msg.body}</p>}
                        {msg.attachment_url && (
                          <ImagePreview src={msg.attachment_url} alt="attachment" />
                        )}
                        <span className="fbp_msg_time">{fmtTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))}

                  <div ref={chatBottomRef} />
                </div>

                {/* ── Reply box ── */}
                {activeTicket?.status !== "closed" && activeTicket?.status !== "resolved" ? (
                  <form className="fbp_reply_form" onSubmit={handleReply}>
                    {replyPreview && (
                      <div className="fbp_reply_preview">
                        <img src={replyPreview} alt="preview" className="fbp_reply_preview_img" />
                        <button
                          type="button" className="fbp_attach_remove"
                          onClick={() => clearAttach(setReplyFile, setReplyPreview)}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="fbp_reply_row">
                      <button
                        type="button" className="fbp_reply_attach_btn"
                        onClick={() => replyFileRef.current?.click()}
                        title="Attach image"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <input
                        ref={replyFileRef} type="file" accept="image/*" hidden
                        onChange={(e) => handleAttachChange(e.target.files[0], setReplyFile, setReplyPreview)}
                      />
                      <textarea
                        className="fbp_reply_input"
                        placeholder="Add a message…"
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        className="fbp_reply_send_btn"
                        disabled={sendingReply || (!replyBody.trim() && !replyFile)}
                      >
                        {sendingReply ? (
                          <div className="fbp_spinner fbp_spinner--sm" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M10 16V4M4 10l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="fbp_chat_closed">
                    Ticket is {STATUS_META[activeTicket?.status]?.label?.toLowerCase()} — no further replies.
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FeedbackPanel;
