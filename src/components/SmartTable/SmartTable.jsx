import React, { useState, useMemo, useEffect } from "react";
import "./SmartTable.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Button from "../Button/Button";
import { useSubscriptionAccess } from "../../hooks/useSubscriptionAccess";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../context/AuthContext/AuthContext";

export default function SmartTable({
  columns = [],
  data = [],
  onRowClick,
  enableSelect = false,
  onSelectChange,
  onBulkDelete, // (selectedIds) => Promise / void
  onExport, // (opts) => Promise / void
  onCreate, // () => void
  exportDefaults = { includeColumns: [], format: "csv" },
  maxRowsPerPage = 6,
  creattext = "Create",
  showcreatbut = true,
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

  // UI state
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [page, setPage] = useState(0);

  // Export settings inside modal
  const [exportFormat, setExportFormat] = useState(exportDefaults.format);
  const [exportColumns, setExportColumns] = useState(
    exportDefaults.includeColumns.length
      ? exportDefaults.includeColumns
      : columns.map((c) => c.accessor)
  );

  // compute filtered data (search + field)
  const filteredData = useMemo(() => {
    const normalized = (v) => {
      if (v === undefined || v === null) return "";

      if (typeof v === "object") {
        return Object.values(v)
          .map((x) => String(x).toLowerCase())
          .join(" ");
      }

      return String(v).toLowerCase();
    };
    const s = search.trim().toLowerCase();
    if (!s) return data;
    return data.filter((row) => {
      if (!filterField) {
        return Object.values(row).some((val) => normalized(val).includes(s));
      }
      return normalized(row[filterField]).includes(s);
    });
  }, [data, search, filterField]);

  // pagination: pages of filteredData
  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / maxRowsPerPage)
  );
  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [totalPages, page]);

  const pagedData = useMemo(() => {
    const start = page * maxRowsPerPage;
    return filteredData.slice(start, start + maxRowsPerPage);
  }, [filteredData, page, maxRowsPerPage]);

  // Helper to get unique id for a row
  const getRowId = (row, idx) => row.$id ?? row.id ?? idx;

  // selection logic: select only visible rows (pagedData)
  const toggleRow = (rowId) => {
    setSelectedIds((prev) => {
      const has = prev.includes(rowId);
      const next = has ? prev.filter((x) => x !== rowId) : [...prev, rowId];
      onSelectChange && onSelectChange(next);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = pagedData.map((r, i) => getRowId(r, i));
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    let next;
    if (allSelected) {
      next = selectedIds.filter((id) => !visibleIds.includes(id));
    } else {
      // merge unique
      next = Array.from(new Set([...selectedIds, ...visibleIds]));
    }
    setSelectedIds(next);
    onSelectChange && onSelectChange(next);
  };

  // show delete modal automatically when selection count > 0? we will show a floating delete bar
  const clearSelection = () => {
    setSelectedIds([]);
    onSelectChange && onSelectChange([]);
  };

  // bulk delete confirm
  const confirmDelete = async () => {
    if (isAdminOrStaff && !canMutate) {
      addNotification(subscriptionMessage, "error");
      setShowDeleteModal(false);
      return;
    }
    setShowDeleteModal(false);
    if (onBulkDelete) {
      await onBulkDelete(selectedIds);
    }
    clearSelection();
  };

  // export confirm
  const triggerExport = async () => {
    setShowExportModal(false);
    if (onExport) {
      const opts = {
        format: exportFormat,
        columns: exportColumns,
        selectedIds, // may be empty meaning export filtered/paged?
        filter: { search, filterField },
      };
      await onExport(opts);
    }
  };

  // UI small helpers
  const anySelected = selectedIds.length > 0;
  const allVisibleSelected =
    pagedData.length > 0 &&
    pagedData.every((r, i) => selectedIds.includes(getRowId(r, i)));

  return (
    <div className="smart-table-container">
      {/* Top control bar */}
      <div className="table-topbar">
        <div className="right-controls">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="filter-select"
          >
            <option value="">Search by fields</option>
            {columns
              .filter((col) => col.searchable !== false)
              .map((col) => (
                <option key={col.accessor} value={col.accessor}>
                  {col.label}
                </option>
              ))}
          </select>

          <input
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="left-controls">
          {onExport && (
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
            >
              Export
            </Button>
          )}
          {showcreatbut && (
            <>
              {onCreate && (
                <Button variant="primary" onClick={() => guardMutation(onCreate)}>
                  {creattext}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating bulk action area when selection exists */}
      {enableSelect && anySelected && (
        <div className="bulk-action-bar">
          <div>{selectedIds.length} selected</div>
          <div className="bulk-actions">
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </button>
            <button
              className="btn btn-export"
              onClick={() => setShowExportModal(true)}
            >
              Export selection
            </button>
            <button className="btn" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table className="smart-table">
          <thead>
            <tr>
              {enableSelect && (
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    onChange={toggleAllVisible}
                    checked={allVisibleSelected}
                    aria-label="select all visible"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.accessor}>{col.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pagedData.map((row, idx) => {
              const rid = getRowId(row, page * maxRowsPerPage + idx);
              const selected = selectedIds.includes(rid);

              return (
                <tr
                  key={rid}
                  className={selected ? "row-selected" : ""}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {enableSelect && (
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="col-checkbox"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(rid)}
                        aria-label={`select row ${rid}`}
                      />
                    </td>
                  )}

                  {columns.map((col) => (
                    <td key={col.accessor} data-label={col.label}>
                      {col.render
                        ? col.render(row[col.accessor], row)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* no rows */}
            {pagedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (enableSelect ? 1 : 0)}
                  style={{ textAlign: "center", padding: 30 }}
                >
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-footer">
        <div className="pagination-info">
          Showing {page * maxRowsPerPage + 1} -{" "}
          {Math.min((page + 1) * maxRowsPerPage, filteredData.length)} of{" "}
          {filteredData.length}
        </div>

        <div className="pagination-controls">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <FaChevronLeft />
          </button>

          <div className="page-number">
            Page {page + 1} / {totalPages}
          </div>

          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm delete</h3>
            <p>
              Delete {selectedIds.length} selected item(s)? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowExportModal(false)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Export settings</h3>

            <label className="label">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="full"
            >
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
              <option value="json">JSON</option>
            </select>

            <label className="label">Columns</label>
            <div className="export-columns">
              {columns.map((c) => (
                <label key={c.accessor} className="col-checkbox-row">
                  <input
                    type="checkbox"
                    checked={exportColumns.includes(c.accessor)}
                    onChange={() => {
                      setExportColumns((prev) =>
                        prev.includes(c.accessor)
                          ? prev.filter((x) => x !== c.accessor)
                          : [...prev, c.accessor]
                      );
                    }}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowExportModal(false)}>
                Cancel
              </button>
              <button className="btn btn-export" onClick={triggerExport}>
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
