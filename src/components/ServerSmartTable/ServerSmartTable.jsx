import { useState, useEffect, useCallback } from "react";
import "../SmartTable/SmartTable.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Button from "../Button/Button";
import { jsPDF } from "jspdf";
import { useSubscriptionAccess } from "../../hooks/useSubscriptionAccess";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../context/AuthContext/AuthContext";

export default function ServerSmartTable({
  columns = [],
  fetchData,
  onRowClick,
  enableSelect = false,
  onSelectChange,
  onBulkDelete,
  onExport,           // optional override — if not provided, built-in export runs
  onCreate,
  bulkActions,
  exportDefaults = { includeColumns: [], format: "csv" },
  initialPageSize = 20,
  creattext = "Create",
  showcreatbut = true,
  reloadKey = 0,
}) {
  const { user } = useAuth();
  const { canMutate, message: subscriptionMessage } = useSubscriptionAccess();
  const { addNotification } = useNotification();
  const isAdminOrStaff = !!(user?.admin || user?.staff || user?.teacher);
  const guardMutation = (fn) => {
    if (isAdminOrStaff && !canMutate) {
      addNotification(subscriptionMessage, "error");
      return;
    }
    fn?.();
  };

  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(() => {
    const saved = sessionStorage.getItem("serverSmartTablePageSize");
    if (saved) { const p = parseInt(saved); if (p >= 5 && p <= 30) return p; }
    return initialPageSize;
  });

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalRecords: 0,
    recordsPerPage: initialPageSize,
    hasNextPage: false, hasPrevPage: false, startIndex: 0, endIndex: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    sessionStorage.setItem("serverSmartTablePageSize", pageSize.toString());
  }, [pageSize]);

  // Export state
  const [exportFormat, setExportFormat] = useState(exportDefaults.format || "csv");
  const [exportColumns, setExportColumns] = useState(
    exportDefaults.includeColumns?.length
      ? exportDefaults.includeColumns
      : columns.map((c) => c.accessor)
  );

  // Keep exportColumns in sync when columns change (e.g. dynamic score columns loaded after fetch)
  useEffect(() => {
    if (!exportDefaults.includeColumns?.length) {
      setExportColumns(columns.map((c) => c.accessor));
    }
  }, [columns]);

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearchDebounce(search); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    if (!fetchData) return;
    setLoading(true); setError(null);
    try {
      const result = await fetchData({ page, limit: pageSize, search: searchDebounce, searchField: filterField });
      if (result.success) { setData(result.data || []); setPagination(result.pagination || {}); }
      else { setError(result.message || "Failed to load data"); setData([]); }
    } catch (err) { setError(err.message || "Failed to load data"); setData([]); }
    finally { setLoading(false); }
  }, [page, pageSize, searchDebounce, filterField, reloadKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const getRowId = (row, idx) =>
    row.studentId || row.$id || row.id || row.student_id || `row-${idx}`;

  const toggleRow = (rowId) => {
    setSelectedIds((prev) => {
      const next = prev.includes(rowId) ? prev.filter((x) => x !== rowId) : [...prev, rowId];
      onSelectChange?.(next); return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = data.map((r, i) => getRowId(r, i));
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    const next = allSelected
      ? selectedIds.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...selectedIds, ...visibleIds]));
    setSelectedIds(next); onSelectChange?.(next);
  };

  const clearSelection = () => { setSelectedIds([]); onSelectChange?.([]); };

  const confirmDelete = async () => {
    if (isAdminOrStaff && !canMutate) {
      addNotification(subscriptionMessage, "error");
      setShowDeleteModal(false);
      return;
    }
    setShowDeleteModal(false);
    if (onBulkDelete) await onBulkDelete(selectedIds);
    clearSelection(); loadData();
  };

  // ── Built-in export ────────────────────────────────────────────────────────
  const doExport = (fmt) => {
    const cols = exportColumns.length ? exportColumns : columns.map((c) => c.accessor);
    const colDefs = cols.map((acc) => columns.find((c) => c.accessor === acc) || { accessor: acc, label: acc });

    const rows = selectedIds.length > 0
      ? data.filter((r, i) => selectedIds.includes(getRowId(r, i)))
      : data;

    const getValue = (row, col) => {
      // Support dot-notation accessors like "scores.ca"
      const raw = col.accessor.split(".").reduce((obj, key) => obj?.[key], row);
      if (raw === undefined || raw === null) return "";
      return String(raw);
    };

    if (fmt === "json") {
      const json = rows.map((row) => {
        const obj = {};
        colDefs.forEach((col) => { obj[col.label] = getValue(row, col); });
        return obj;
      });
      download(JSON.stringify(json, null, 2), "export.json", "application/json");
    } else if (fmt === "pdf") {
      doExportPdf(rows, colDefs);
    } else {
      // CSV
      const header = colDefs.map((c) => `"${c.label}"`).join(",");
      const body = rows.map((row) =>
        colDefs.map((col) => `"${getValue(row, col).replace(/"/g, '""')}"`).join(",")
      );
      download([header, ...body].join("\n"), "export.csv", "text/csv");
    }
  };

  const download = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const doExportPdf = (rows, colDefs) => {
    const getValue = (row, col) => {
      // Support dot-notation accessors like "scores.ca"
      const raw = col.accessor.split(".").reduce((obj, key) => obj?.[key], row);
      if (raw === undefined || raw === null) return "";
      return String(raw);
    };

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 32;
    const usableW = pageW - margin * 2;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(17, 17, 17);
    doc.text("Export", margin, 40);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136);
    doc.text(
      `${rows.length} rows · ${colDefs.length} columns · ${new Date().toLocaleDateString()}`,
      margin, 54
    );

    // Table setup
    const colW = usableW / colDefs.length;
    const rowH = 22;
    const headerH = 28;
    let y = 70;

    // Header row
    doc.setFillColor(244, 244, 244);
    doc.rect(margin, y, usableW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    colDefs.forEach((col, i) => {
      doc.text(col.label.toUpperCase(), margin + i * colW + 8, y + 18);
    });
    y += headerH;

    // Data rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(34, 34, 34);

    rows.forEach((row, ri) => {
      // new page if needed
      if (y + rowH > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      // alternating row bg
      if (ri % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, usableW, rowH, "F");
      }

      // border line
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + rowH, margin + usableW, y + rowH);

      colDefs.forEach((col, i) => {
        const val = getValue(row, col);
        const maxW = colW - 16;
        const truncated = doc.getTextWidth(val) > maxW
          ? val.substring(0, Math.floor(val.length * maxW / doc.getTextWidth(val))) + "…"
          : val;
        doc.text(truncated, margin + i * colW + 8, y + 15);
      });

      y += rowH;
    });

    doc.save("export.pdf");
  };

  const triggerExport = (fmt) => {
    setShowExportModal(false);
    if (onExport) {
      // caller handles export
      onExport({ format: fmt, columns: exportColumns, selectedIds, data, filter: { search: searchDebounce, filterField } });
    } else {
      doExport(fmt);
    }
  };

  const anySelected = selectedIds.length > 0;
  const allVisibleSelected = data.length > 0 && data.every((r, i) => selectedIds.includes(getRowId(r, i)));

  const exportRowCount = selectedIds.length > 0
    ? selectedIds.length
    : pagination.totalRecords || data.length;
  const exportColCount = exportColumns.length || columns.length;

  return (
    <div className="smart-table-container">
      {/* Top bar */}
      <div className="table-topbar">
        <div className="right-controls">
          <select value={filterField} onChange={(e) => { setFilterField(e.target.value); setPage(1); }} className="filter-select">
            <option value="">Search by fields</option>
            {columns.filter((c) => c.searchable !== false).map((c) => (
              <option key={c.accessor} value={c.accessor}>{c.label}</option>
            ))}
          </select>
          <input className="search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="left-controls">
          {(onExport !== undefined || true) && (
            <Button variant="secondary" onClick={() => setShowExportModal(true)}>
              Export
            </Button>
          )}
          {showcreatbut && onCreate && (
            <Button variant="primary" onClick={() => guardMutation(onCreate)}>
              {creattext}
            </Button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {enableSelect && anySelected && (
        <div className="bulk-action-bar">
          <div>{selectedIds.length} selected</div>
          <div className="bulk-actions">
            {bulkActions?.map((action, i) => (
              <button key={i} className={`btn ${action.className || ""}`}
                onClick={() => action.onClick(selectedIds, clearSelection, loadData)}
                disabled={action.disabled}>
                {action.label}
              </button>
            ))}
            <button className="btn btn-export" onClick={() => setShowExportModal(true)}>Export selected</button>
            <button className="btn" onClick={clearSelection}>Clear</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="st-loading"><span className="st-spinner" /><span>Loading...</span></div>}

      {/* Error */}
      {error && !loading && (
        <div className="st-error"><p>Error: {error}</p><Button variant="secondary" onClick={loadData}>Retry</Button></div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="table-wrap">
            <table className="smart-table">
              <thead>
                <tr>
                  {enableSelect && (
                    <th className="col-checkbox">
                      <input type="checkbox" onChange={toggleAllVisible} checked={allVisibleSelected} aria-label="select all" />
                    </th>
                  )}
                  {columns.map((col) => <th key={col.accessor}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => {
                  const rid = getRowId(row, idx);
                  const selected = selectedIds.includes(rid);
                  return (
                    <tr key={rid} className={selected ? "row-selected" : ""} onClick={() => onRowClick?.(row)}>
                      {enableSelect && (
                        <td onClick={(e) => e.stopPropagation()} className="col-checkbox">
                          <input type="checkbox" checked={selected} onChange={() => toggleRow(rid)} />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.accessor} data-label={col.label}>
                          {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr><td colSpan={columns.length + (enableSelect ? 1 : 0)} style={{ textAlign: "center", padding: 30 }}>No records</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="table-footer">
            <div className="pagination-info">
              <span>Showing {pagination.startIndex} – {pagination.endIndex} of {pagination.totalRecords}</span>
              <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}>
                {[5,10,15,20,25,30].map((n) => <option key={n} value={n}>{n} per page</option>)}
              </select>
            </div>
            <div className="pagination-controls">
              <button className="page-btn" onClick={() => setPage((p) => p - 1)} disabled={!pagination.hasPrevPage}><FaChevronLeft /></button>
              <div className="page-number">Page {pagination.currentPage} / {pagination.totalPages}</div>
              <button className="page-btn" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage}><FaChevronRight /></button>
            </div>
          </div>
        </>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm delete</h3>
            <p>Delete {selectedIds.length} selected item(s)? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Export modal */}
      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="modal-dialog export-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="export-modal-header">
              <div className="export-modal-header-content">
                <h3>Export Data</h3>
                <p>
                  {selectedIds.length > 0
                    ? `${selectedIds.length} selected rows`
                    : `${exportRowCount} rows`}
                  {" · "}
                  {exportColCount} columns
                </p>
              </div>
              <button className="export-modal-close" onClick={() => setShowExportModal(false)}>
                <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                  <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Columns */}
            <div className="export-modal-body">
              <p className="export-section-label">Columns to export</p>
              <div className="export-columns">
                {columns.map((c) => (
                  <label key={c.accessor} className={`col-checkbox-row ${exportColumns.includes(c.accessor) ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={exportColumns.includes(c.accessor)}
                      onChange={() => setExportColumns((prev) =>
                        prev.includes(c.accessor) ? prev.filter((x) => x !== c.accessor) : [...prev, c.accessor]
                      )}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>

              {/* Format buttons */}
              <p className="export-section-label" style={{ marginTop: 16 }}>Choose format</p>
              <div className="export-format-btns">
                <button className="export-fmt-btn" onClick={() => triggerExport("csv")}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="2" width="16" height="18" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 8h8M7 12h5M7 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  CSV
                </button>
                <button className="export-fmt-btn" onClick={() => triggerExport("json")}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <path d="M6 4C4.9 4 4 4.9 4 6v2c0 1.1-.9 2-2 2s2 .9 2 2v2c0 1.1.9 2 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M16 4c1.1 0 2 .9 2 2v2c0 1.1.9 2 2 2s-2 .9-2 2v2c0 1.1-.9 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
                  </svg>
                  JSON
                </button>
                <button className="export-fmt-btn" onClick={() => triggerExport("pdf")}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="2" width="16" height="18" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 7h4c1.1 0 2 .9 2 2s-.9 2-2 2H7V7z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
