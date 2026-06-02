import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../../../components/infoField/InfoField";
import Button from "../../../../../../components/Button/Button";
import { useSubjectBooks } from "../../../../../../api_call/useSubjectBooks";
import "../../../../../../pages/AdminSec/AdminPages/subjectProfile/SubjectClasses/SubjectClasses.css";

const StatusBadge = ({ active }) => (
  <span className={`sc-status-badge ${active ? "active" : "inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const SubjectBooks = ({ subjectData }) => {
  const { subjectId } = useParams();
  const { getBooksBySubject } = useSubjectBooks();

  const [books, setBooks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("active");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetail, setShowDetail]     = useState(false);

  const subjectName = subjectData?.subject?.subject_name || "Subject";

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    getBooksBySubject(subjectId).then((res) => {
      setBooks(res.success ? res.data || [] : []);
      setLoading(false);
    });
  }, [subjectId]);

  const counts = {
    all:      books.length,
    active:   books.filter((b) => b.is_active).length,
    inactive: books.filter((b) => !b.is_active).length,
  };

  const filtered = books.filter((b) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && b.is_active) ||
      (filter === "inactive" && !b.is_active);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (b.title || "").toLowerCase().includes(q) ||
      (b.author || "").toLowerCase().includes(q) ||
      (b.isbn || "").toLowerCase().includes(q) ||
      (b.publisher || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  if (loading) return <InnerTabCon><LoadingData message="Loading books..." /></InnerTabCon>;

  return (
    <InnerTabCon>
      <div className="subjectClasses">
        {/* Header */}
        <div className="scHeader">
          <div className="scHeaderLeft">
            <h2 className="scTitle">Books — {subjectName}</h2>
            <p className="scSubtitle">
              {counts.active} active · {counts.inactive} inactive · {counts.all} total
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="scSearchContainer">
          <div className="scSearchInputWrapper">
            <input
              type="text"
              placeholder="Search by title, author, ISBN or publisher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="scSearchInput"
            />
            {search && (
              <button onClick={() => setSearch("")} className="scClearSearch">×</button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="scFilterTabs">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              className={`scFilterTab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scEmptyState">
            <h3>No books found</h3>
            <p>{search ? `No results for "${search}"` : "No books added to this subject yet."}</p>
          </div>
        ) : (
          <div className="scClassesList">
            {filtered.map((book) => (
              <div
                key={book.book_id}
                className={`scClassCard ${!book.is_active ? "inactive" : ""}`}
                onClick={() => { setSelectedBook(book); setShowDetail(true); }}
              >
                <div className="scClassHeader">
                  <div className="scClassInfo">
                    <div className="scClassTitleRow">
                      <h3 className="scClassName">{book.title}</h3>
                      <StatusBadge active={book.is_active} />
                    </div>
                    <p className="scClassId">
                      {book.type}
                      {book.author ? ` · by ${book.author}` : ""}
                      {book.isbn ? ` · ISBN: ${book.isbn}` : ""}
                    </p>
                  </div>
                </div>
                <div className="scClassBody">
                  <div className="scClassDetails">
                    {book.publisher  && <div className="scDetailItem"><span className="scDetailLabel">Publisher:</span><span className="scDetailValue">{book.publisher}</span></div>}
                    {book.edition    && <div className="scDetailItem"><span className="scDetailLabel">Edition:</span><span className="scDetailValue">{book.edition}</span></div>}
                    {book.level      && <div className="scDetailItem"><span className="scDetailLabel">Level:</span><span className="scDetailValue">{book.level}</span></div>}
                    {book.price      && <div className="scDetailItem"><span className="scDetailLabel">Price:</span><span className="scDetailValue">{book.price}</span></div>}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <SlideInMenu isShow={showDetail} onClose={() => setShowDetail(false)} width="600px">
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
                  <InfoField label="Author"           value={selectedBook.author           || "—"} />
                  <InfoField label="ISBN"             value={selectedBook.isbn             || "—"} />
                  <InfoField label="Publisher"        value={selectedBook.publisher        || "—"} />
                  <InfoField label="Edition"          value={selectedBook.edition          || "—"} />
                  <InfoField label="Publication Year" value={selectedBook.publication_year || "—"} />
                  <InfoField label="Language"         value={selectedBook.language         || "—"} />
                  <InfoField label="Level"            value={selectedBook.level            || "—"} />
                  <InfoField label="Price"            value={selectedBook.price            || "—"} />
                  <InfoField label="Type"             value={selectedBook.type             || "—"} />
                  <InfoField label="Class"            value={selectedBook.class_name       || "—"} />
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
            <Button variant="secondary" onClick={() => setShowDetail(false)}>Close</Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SubjectBooks;
