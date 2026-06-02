import { useParams } from "react-router-dom";
import "./SubjectBooks.css";
import { useState, useEffect } from "react";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import InfoField from "../../../../../components/infoField/InfoField";
import { useSubjectBooks } from "../../../../../api_call/useSubjectBooks";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";

const StatusBadge = ({ active }) => (
  <span className={`sc-status-badge ${active ? "active" : "inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const emptyForm = () => ({
  title: "", author: "", isbn: "", publisher: "", edition: "",
  publication_year: "", type: "Textbook", level: "", price: "",
  language: "English", description: "", class_id: "", class_name: "",
});

const SubjectBooks = ({ subjectData }) => {
  const { subjectId, schoolId } = useParams();
  const { getBooksBySubject, createBook, updateBook, deleteBook, getActiveClassesBySubject } = useSubjectBooks();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.subject?.edit;

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeClasses, setActiveClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const subjectName = subjectData?.subject?.subject_name || "Subject";

  const loadBooks = () => {
    if (!subjectId) return;
    setLoading(true);
    getBooksBySubject(subjectId).then((res) => {
      if (res.success) setBooks(res.data || []);
      else setError(res.message || "Failed to load books");
      setLoading(false);
    });
  };

  useEffect(() => { loadBooks(); }, [subjectId]);

  const filtered = books.filter((b) => {
    const matchesFilter =
      filter === "all" || (filter === "active" && b.is_active) || (filter === "inactive" && !b.is_active);
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (b.title || "").toLowerCase().includes(q) ||
      (b.author || "").toLowerCase().includes(q) ||
      (b.isbn || "").toLowerCase().includes(q) ||
      (b.publisher || "").toLowerCase().includes(q) ||
      (b.type || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: books.length,
    active: books.filter((b) => b.is_active).length,
    inactive: books.filter((b) => !b.is_active).length,
  };

  const loadClasses = () => {
    setLoadingClasses(true);
    getActiveClassesBySubject(subjectId).then((res) => {
      setActiveClasses(res.data || []);
      setLoadingClasses(false);
    });
  };

  const openAddPanel = () => {
    if (!canEdit) { addNotification("You do not have permission to add books.", "error"); return; }
    setEditingBook(null);
    setForm(emptyForm());
    setFormError(null);
    setShowFormPanel(true);
    loadClasses();
  };

  const openEditPanel = (e, book) => {
    e.stopPropagation();
    if (!canEdit) { addNotification("You do not have permission to edit books.", "error"); return; }
    setEditingBook(book);
    setForm({
      title: book.title || "", author: book.author || "", isbn: book.isbn || "",
      publisher: book.publisher || "", edition: book.edition || "",
      publication_year: book.publication_year || "", type: book.type || "Textbook",
      level: book.level || "", price: book.price || "", language: book.language || "English",
      description: book.description || "", class_id: book.class_id || "", class_name: book.class_name || "",
    });
    setFormError(null);
    setShowFormPanel(true);
    loadClasses();
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setFormError("Title is required"); return; }
    setSaving(true);
    setFormError(null);
    const selectedClass = activeClasses.find((c) => c.class_id === form.class_id);
    const payload = {
      ...form,
      subject_id: subjectId,
      school_id: schoolId,
      class_id: form.class_id || null,
      class_name: selectedClass?.class_name || form.class_name || null,
      entered_by_id: user?.admin?.admin_id || null,
      entered_by_name: user?.admin?.full_name || null,
    };
    const res = editingBook ? await updateBook(editingBook.book_id, payload) : await createBook(payload);
    setSaving(false);
    if (res.success) {
      setShowFormPanel(false);
      addNotification(editingBook ? "Book updated" : "Book added", "success");
      loadBooks();
    } else {
      setFormError(res.message || "Failed to save book");
    }
  };

  const openDeletePanel = (e, book) => {
    e.stopPropagation();
    if (!canEdit) { addNotification("You do not have permission to delete books.", "error"); return; }
    setDeleteTarget(book);
    setShowDeletePanel(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteBook(deleteTarget.book_id);
    setDeleting(false);
    if (res.success) {
      setShowDeletePanel(false);
      setDeleteTarget(null);
      addNotification("Book deleted", "success");
      loadBooks();
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  const handleToggleActive = async (e, book) => {
    e.stopPropagation();
    if (!canEdit) { addNotification("You do not have permission to change book status.", "error"); return; }
    const res = await updateBook(book.book_id, { is_active: !book.is_active });
    if (res.success) {
      addNotification(book.is_active ? "Book deactivated" : "Book reactivated", "success");
      loadBooks();
    } else {
      addNotification(res.message || "Failed to update", "error");
    }
  };

  const setField = (key, val) => { setForm((f) => ({ ...f, [key]: val })); setFormError(null); };

  if (loading) return <InnerTabCon><LoadingData message="Loading books..." /></InnerTabCon>;
  if (error) return <InnerTabCon><div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div></InnerTabCon>;

  return (
    <InnerTabCon>
      <div className="subjectClasses">
        <div className="scHeader">
          <div className="scHeaderLeft">
            <h2 className="scTitle">Books — {subjectName}</h2>
            <p className="scSubtitle">{counts.active} active · {counts.inactive} inactive · {counts.all} total</p>
          </div>
          <div className="scHeaderRight">
            <Button variant="primary" onClick={openAddPanel}>Add Book</Button>
          </div>
        </div>

        <div className="scSearchContainer">
          <div className="scSearchInputWrapper">
            <input type="text" placeholder="Search by title, author, ISBN or publisher..."
              value={search} onChange={(e) => setSearch(e.target.value)} className="scSearchInput" />
            {search && <button onClick={() => setSearch("")} className="scClearSearch">×</button>}
          </div>
        </div>

        <div className="scFilterTabs">
          {["all", "active", "inactive"].map((f) => (
            <button key={f} className={`scFilterTab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="scEmptyState">
            <h3>No books found</h3>
            <p>{search ? `No results for "${search}"` : "No books added to this subject yet."}</p>
          </div>
        ) : (
          <div className="scClassesList">
            {filtered.map((book) => (
              <div key={book.book_id} className={`scClassCard ${!book.is_active ? "inactive" : ""}`}
                onClick={() => { setSelectedBook(book); setShowDetailPanel(true); }}>
                <div className="scClassHeader">
                  <div className="scClassInfo">
                    <div className="scClassTitleRow">
                      <h3 className="scClassName">{book.title}</h3>
                      <StatusBadge active={book.is_active} />
                    </div>
                    <p className="scClassId">
                      {book.type}{book.author ? ` · by ${book.author}` : ""}{book.isbn ? ` · ISBN: ${book.isbn}` : ""}
                    </p>
                  </div>
                </div>
                <div className="scClassBody">
                  <div className="scClassDetails">
                    {book.publisher && <div className="scDetailItem"><span className="scDetailLabel">Publisher:</span><span className="scDetailValue">{book.publisher}</span></div>}
                    {book.edition && <div className="scDetailItem"><span className="scDetailLabel">Edition:</span><span className="scDetailValue">{book.edition}</span></div>}
                    {book.level && <div className="scDetailItem"><span className="scDetailLabel">Level:</span><span className="scDetailValue">{book.level}</span></div>}
                    {book.price && <div className="scDetailItem"><span className="scDetailLabel">Price:</span><span className="scDetailValue">{book.price}</span></div>}
                    {book.class_name && <div className="scDetailItem"><span className="scDetailLabel">Class:</span><span className="scDetailValue">{book.class_name}</span></div>}
                  </div>
                </div>
                <div className="scClassFooter">
                  <div className="scViewDetails">
                    <span>View Book Details</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    <button className="sc-action-btn edit" onClick={(e) => openEditPanel(e, book)}>Edit</button>
                    {book.is_active ? (
                      <button className="sc-action-btn deactivate" onClick={(e) => handleToggleActive(e, book)}>Deactivate</button>
                    ) : (
                      <>
                        <button className="sc-action-btn reactivate" onClick={(e) => handleToggleActive(e, book)}>Reactivate</button>
                        <button className="sc-action-btn delete" onClick={(e) => openDeletePanel(e, book)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Detail Panel */}
      <SlideInMenu isShow={showDetailPanel} onClose={() => setShowDetailPanel(false)} width="600px">
        <div className="sc-panel">
          <div className="sc-panel-header default">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>{selectedBook?.title}</h2>
                <p>{selectedBook?.type}{selectedBook?.author ? ` · by ${selectedBook.author}` : ""}</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            {selectedBook && (
              <>
                <span className="sc-section-label">Book Information</span>
                <div className="sc-detail-grid">
                  <InfoField label="Author"           value={selectedBook.author || "—"} />
                  <InfoField label="ISBN"             value={selectedBook.isbn || "—"} />
                  <InfoField label="Publisher"        value={selectedBook.publisher || "—"} />
                  <InfoField label="Edition"          value={selectedBook.edition || "—"} />
                  <InfoField label="Publication Year" value={selectedBook.publication_year || "—"} />
                  <InfoField label="Language"         value={selectedBook.language || "—"} />
                  <InfoField label="Level"            value={selectedBook.level || "—"} />
                  <InfoField label="Price"            value={selectedBook.price || "—"} />
                  <InfoField label="Type"             value={selectedBook.type || "—"} />
                  <InfoField label="Class"            value={selectedBook.class_name || "—"} />
                </div>
                {selectedBook.description && (
                  <>
                    <span className="sc-section-label">Description</span>
                    <p className="sc-panel-desc">{selectedBook.description}</p>
                  </>
                )}
              </>
            )}
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => setShowDetailPanel(false)}>Close</Button>
            <Button onClick={(e) => { setShowDetailPanel(false); openEditPanel(e, selectedBook); }}>Edit Book</Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Add / Edit Panel */}
      <SlideInMenu isShow={showFormPanel} onClose={() => setShowFormPanel(false)} width="520px">
        <div className="sc-panel">
          <div className="sc-panel-header default">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>{editingBook ? "Edit Book" : "Add Book"}</h2>
                <p>{editingBook ? "Update book details" : `Add a book to ${subjectName}`}</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-field">
              <label className="sc-field-label">Title *</label>
              <input className="sc-field-input" value={form.title}
                onChange={(e) => setField("title", e.target.value)} placeholder="Book title" />
            </div>
            <div className="sc-field">
              <label className="sc-field-label">Class</label>
              <SearchableSelect
                options={activeClasses.map((c) => ({ value: c.class_id, label: c.class_name }))}
                value={form.class_id}
                onChange={(v) => setField("class_id", v)}
                placeholder={loadingClasses ? "Loading classes..." : "Select a class (optional)"}
                disabled={loadingClasses}
              />
            </div>
            <div className="sc-form-grid">
              <div className="sc-field">
                <label className="sc-field-label">Author</label>
                <input className="sc-field-input" value={form.author} onChange={(e) => setField("author", e.target.value)} placeholder="Author name" />
              </div>
              <div className="sc-field">
                <label className="sc-field-label">ISBN</label>
                <input className="sc-field-input" value={form.isbn} onChange={(e) => setField("isbn", e.target.value)} placeholder="978-..." />
              </div>
              <div className="sc-field">
                <label className="sc-field-label">Publisher</label>
                <input className="sc-field-input" value={form.publisher} onChange={(e) => setField("publisher", e.target.value)} placeholder="Publisher" />
              </div>
              <div className="sc-field">
                <label className="sc-field-label">Edition</label>
                <input className="sc-field-input" value={form.edition} onChange={(e) => setField("edition", e.target.value)} placeholder="e.g. 3rd Edition" />
              </div>
              <div className="sc-field">
                <label className="sc-field-label">Publication Year</label>
                <input className="sc-field-input" value={form.publication_year} onChange={(e) => setField("publication_year", e.target.value)} placeholder="2024" />
              </div>
              <div className="sc-field">
                <label className="sc-field-label">Type</label>
                <select className="sc-field-select" value={form.type} onChange={(e) => setField("type", e.target.value)}>
                  {["Textbook", "Workbook", "Reference", "Supplementary", "Digital"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sc-field">
                <label className="sc-field-label">Level</label>
                <input className="sc-field-input" value={form.level} onChange={(e) => setField("level", e.target.value)} placeholder="e.g. Grade 10" />
              </div>
              <div className="sc-field">
                <label className="sc-field-label">Price</label>
                <input className="sc-field-input" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="₦15,000" />
              </div>
            </div>
            <div className="sc-field">
              <label className="sc-field-label">Language</label>
              <input className="sc-field-input" value={form.language} onChange={(e) => setField("language", e.target.value)} placeholder="English" />
            </div>
            <div className="sc-field">
              <label className="sc-field-label">Description</label>
              <textarea className="sc-field-textarea" value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Brief description of the book..." rows={3} />
            </div>
            {formError && <p className="sc-panel-error">{formError}</p>}
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => setShowFormPanel(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingBook ? "Update Book" : "Add Book"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Delete Panel */}
      <SlideInMenu isShow={showDeletePanel} onClose={() => { setShowDeletePanel(false); setDeleteTarget(null); }} width="420px">
        <div className="sc-panel">
          <div className="sc-panel-header danger">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>Delete Book</h2>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-panel-name">{deleteTarget?.title}</div>
            <div className="sc-panel-danger">This will permanently remove the book record.</div>
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => { setShowDeletePanel(false); setDeleteTarget(null); }} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SubjectBooks;
