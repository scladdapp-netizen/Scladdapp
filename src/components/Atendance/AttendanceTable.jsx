import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AttendanceTable.css";
import Button from "../Button/Button";

/*
Data shape:
{
  dates: ["2025-12-01", ...],
  students: [
    { id: "S001", name: "Alice", attendance: { "2025-12-01": "present" } }
  ]
}

Props:
- value, onChange
- maxRowsPerPage, enableSelect
- onBulkDelete (optional)
- onExport (optional)
*/

const STATUSES = ["present", "absent", "excused"];
const STATUS_LABEL = { present: "P", absent: "A", excused: "E" };
const STATUS_CLASS = {
  present: "att_st-present",
  absent: "att_st-absent",
  excused: "att_st-excused",
};

export default function AttendanceTable({
  value = { dates: [], students: [] },
  onChange,
  maxRowsPerPage = 12,
  enableSelect = false,
  onBulkDelete,
  onExport,
  onRowClick,
}) {
  const wrapperRef = useRef(null);

  const extractDatesFromStudents = (students) => {
    const set = new Set();
    students.forEach((s) => {
      Object.keys(s.attendance || {}).forEach((d) => set.add(d));
    });
    return Array.from(set).sort((a, b) => new Date(a) - new Date(b));
  };
  const [data, setData] = useState(() => {
    const students = (value.students ?? []).map((s) => ({
      ...s,
      attendance: s.attendance ?? {},
    }));

    return {
      students,
      dates: extractDatesFromStudents(students),
    };
  });

  // UI state
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);

  // modals & export/delete UI
  const [cellModal, setCellModal] = useState(null); // { visible, studentId, date, status }
  const [att_showDeleteModal, set_att_showDeleteModal] = useState(false);
  const [att_showExportModal, set_att_showExportModal] = useState(false);
  const [att_exportFormat, set_att_exportFormat] = useState("csv");
  const [att_exportColumns, set_att_exportColumns] = useState(["id", "name"]);
  // sorting
  const [percentSort, setPercentSort] = useState("");

  // analytics per-student and totals
  const analytics = useMemo(() => {
    const dateCount = data.dates.length || 0;
    const perStudent = data.students.map((s) => {
      let present = 0,
        absent = 0,
        excused = 0,
        unmarked = 0;
      for (const d of data.dates) {
        const v = s.attendance?.[d];
        if (v === "present") present++;
        else if (v === "absent") absent++;
        else if (v === "excused") excused++;
        else unmarked++;
      }
      const percentPresent = dateCount
        ? Math.round((present / dateCount) * 100)
        : 0;
      return {
        id: s.id,
        name: s.name,
        present,
        absent,
        excused,
        unmarked,
        percentPresent,
      };
    });

    const totals = perStudent.reduce(
      (acc, p) => {
        acc.present += p.present;
        acc.absent += p.absent;
        acc.excused += p.excused;
        acc.unmarked += p.unmarked;
        return acc;
      },
      { present: 0, absent: 0, excused: 0, unmarked: 0 }
    );

    const avgPercent = perStudent.length
      ? Math.round(
          perStudent.reduce((a, b) => a + b.percentPresent, 0) /
            perStudent.length
        )
      : 0;

    return { perStudent, totals, dateCount, avgPercent };
  }, [data]);
  // "" | "asc" | "desc"

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = data.students.filter((s) => {
      if (!q) return true;
      if (!filterField) {
        return (
          String(s.id).toLowerCase().includes(q) ||
          String(s.name).toLowerCase().includes(q)
        );
      }
      return String(s[filterField] ?? "")
        .toLowerCase()
        .includes(q);
    });

    // 🔽 SORT BY % PRESENT
    if (percentSort) {
      const percentMap = new Map(
        analytics.perStudent.map((p) => [p.id, p.percentPresent])
      );

      list = [...list].sort((a, b) => {
        const pa = percentMap.get(a.id) ?? 0;
        const pb = percentMap.get(b.id) ?? 0;
        return percentSort === "asc" ? pa - pb : pb - pa;
      });
    }

    return list;
  }, [data.students, search, filterField, percentSort, analytics.perStudent]);

  const pagedStudents = useMemo(() => {
    const start = page * maxRowsPerPage;
    return filteredStudents.slice(start, start + maxRowsPerPage);
  }, [filteredStudents, page, maxRowsPerPage]);

  // sync incoming value
  useEffect(() => {
    const students = (value.students ?? []).map((s) => ({
      ...s,
      attendance: s.attendance ?? {},
    }));

    setData({
      students,
      dates: extractDatesFromStudents(students),
    });
  }, [value.students]);

  // auto-scroll to rightmost end when dates or rows change
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Use a timeout to ensure DOM is fully updated
    const timer = setTimeout(() => {
      el.scrollLeft = el.scrollWidth;
    }, 50); // Slightly longer delay for dual-table layout

    return () => clearTimeout(timer);
  }, [data.dates.length, data.students.length, page]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const el = wrapperRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollLeft = el.scrollWidth;
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Synchronize row heights between the two tables
  useEffect(() => {
    const syncRowHeights = () => {
      const stickyRows = document.querySelectorAll(
        ".att_sticky_table tbody tr"
      );
      const scrollableRows = document.querySelectorAll(
        ".att_scrollable_table tbody tr"
      );

      stickyRows.forEach((row, index) => {
        if (scrollableRows[index]) {
          const scrollableHeight = scrollableRows[index].offsetHeight;
          row.style.height = `${scrollableHeight}px`;
        }
      });
    };

    // Run after a short delay to ensure DOM is ready
    const timer = setTimeout(syncRowHeights, 100);
    return () => clearTimeout(timer);
  }, [pagedStudents]);

  // filtering & paging

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / maxRowsPerPage)
  );
  useEffect(() => {
    if (page >= totalPages) setPage(0);
  }, [totalPages, page]);

  // helpers to update and emit
  const setDataAndEmit = (next) => {
    setData(next);
    onChange && onChange(next);
  };

  const openCellModal = (studentId, date) => {
    const st = data.students.find((s) => s.id === studentId);
    const current = st?.attendance?.[date] ?? "";
    setCellModal({ visible: true, studentId, date, status: current || "" });
  };
  const closeCellModal = () => setCellModal(null);
  const saveCellModal = () => {
    if (!cellModal) return;
    const { studentId, date, status } = cellModal;
    setDataAndEmit({
      ...data,
      students: data.students.map((s) =>
        s.id === studentId
          ? { ...s, attendance: { ...s.attendance, [date]: status || "" } }
          : s
      ),
    });
    closeCellModal();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    const visibleIds = pagedStudents.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // bulk set visible page column
  const setColumnForPage = (date, status) => {
    setDataAndEmit({
      ...data,
      students: data.students.map((s) =>
        pagedStudents.find((p) => p.id === s.id)
          ? { ...s, attendance: { ...s.attendance, [date]: status } }
          : s
      ),
    });
  };

  // confirm delete selected
  const confirmDeleteSelected = () => {
    const toDelete = selectedIds.slice();
    const next = {
      ...data,
      students: data.students.filter((s) => !toDelete.includes(s.id)),
    };
    setDataAndEmit(next);
    setSelectedIds([]);
    set_att_showDeleteModal(false);
    onBulkDelete && onBulkDelete(toDelete);
  };

  // export function
  const doExport = (forSelected = false) => {
    const cols = att_exportColumns;
    const rows = [];
    const source = forSelected
      ? data.students.filter((s) => selectedIds.includes(s.id))
      : data.students;
    for (const s of source) {
      const base = { id: s.id, name: s.name };
      for (const d of data.dates) base[d] = s.attendance?.[d] ?? "";
      rows.push(base);
    }

    if (att_exportFormat === "json") {
      const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = forSelected
        ? "attendance_selection.json"
        : "attendance.json";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const header = [...cols, ...data.dates].join(",");
      const body = rows.map((r) =>
        [...cols, ...data.dates]
          .map((c) => `"${(r[c] ?? "").toString().replace(/"/g, '""')}"`)
          .join(",")
      );
      const csv = [header, ...body].join("\n");
      const mime =
        att_exportFormat === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv";
      const ext = att_exportFormat === "xlsx" ? "xlsx" : "csv";
      const blob = new Blob([csv], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = forSelected
        ? `attendance_selection.${ext}`
        : `attendance.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }

    set_att_showExportModal(false);
    onExport &&
      onExport({ format: att_exportFormat, rows, selected: forSelected });
  };

  const anySelected = selectedIds.length > 0;

  const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDateShort = (dateStr) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  };
  // → "01 Dec"

  const datesByYear = useMemo(() => {
    const map = {};
    for (const d of data.dates) {
      const year = parseLocalDate(d).getFullYear();
      if (!map[year]) map[year] = [];
      map[year].push(d);
    }
    return map;
  }, [data.dates]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div className="att_root">
        {/* LEGEND */}
        <div className="att_legend_row">
          {/* TOPBAR: only search/filter (meta removed per request) */}
          <div className="att_topbar">
            <div className="att_top_left" />
            <div className="att_top_center">
              <select
                className="att_filter"
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
              >
                <option value="">Search by id or name</option>
                <option value="id">ID</option>
                <option value="name">Name</option>
              </select>
              <input
                className="att_search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="att_top_right" />
          </div>
          {/* TOPBAR: only search/filter (meta removed per request) */}
          <div className="att_legend_right">
            <select
              className="att_filter"
              value={percentSort}
              onChange={(e) => {
                setPercentSort(e.target.value);
                setPage(0); // reset to first page when sorting
              }}
            >
              <option value="">Sort by % Present</option>
              <option value="desc">Highest → Lowest</option>
              <option value="asc">Lowest → Highest</option>
            </select>
            <div className="att_export_area">
              <Button
                variant="secondary"
                onClick={() => set_att_showExportModal(true)}
              >
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {enableSelect && anySelected && (
          <div className="att_bulk_action_bar">
            <div>{selectedIds.length} selected</div>
            <div className="att_bulk_actions">
              <Button
                variant="secondary"
                onClick={() => set_att_showExportModal(true)}
              >
                Export selection
              </Button>
              <Button className="att_btn" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* DUAL TABLE CONTAINER */}
        <div className="att_table_container">
          {/* Sticky columns table (left side) */}
          <div className="att_sticky_columns">
            <table className="att_sticky_table">
              <thead>
                <tr>
                  {enableSelect && (
                    <th className="att_select_col">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAllOnPage}
                        checked={
                          pagedStudents.length > 0 &&
                          pagedStudents.every((s) => selectedIds.includes(s.id))
                        }
                        aria-label="select all visible"
                      />
                    </th>
                  )}
                  <th className="att_col_id">ID</th>
                  <th className="att_col_name">Name</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map((st) => (
                  <tr
                    key={st.id}
                    className={
                      selectedIds.includes(st.id) ? "att_row_selected" : ""
                    }
                    onClick={() => onRowClick && onRowClick(st)}
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    {enableSelect && (
                      <td className="att_select_col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(st.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(st.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className="att_col_id">{st.id}</td>
                    <td className="att_col_name">{st.name}</td>
                  </tr>
                ))}
                {pagedStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={enableSelect ? 3 : 2}
                      style={{ textAlign: "center", padding: 20 }}
                    >
                      No students
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Scrollable columns table (right side) */}
          <div className="att_scrollable_columns" ref={wrapperRef}>
            <table className="att_scrollable_table">
              <thead>
                {/* YEAR ROW */}
                <tr>
                  {Object.entries(datesByYear).map(([year, dates]) => (
                    <th
                      key={year}
                      colSpan={dates.length}
                      className="att_year_header"
                    >
                      {year}
                    </th>
                  ))}

                  {/* analytics columns still belong to current year */}
                  <th
                    colSpan={5}
                    className="att_year_header att_year_analytics"
                  >
                    Analytics
                  </th>
                </tr>

                {/* DATE ROW */}
                <tr>
                  {data.dates.map((d) => (
                    <th key={d} className="att_date_col">
                      <div className="att_date_header">
                        <div className="att_date_label" title={d}>
                          {formatDateShort(d)}
                        </div>
                      </div>
                    </th>
                  ))}

                  <th className="att_analytics_col">Present</th>
                  <th className="att_analytics_col">Absent</th>
                  <th className="att_analytics_col">Excused</th>
                  <th className="att_analytics_col">Unmarked</th>
                  <th className="att_analytics_col">% Present</th>
                </tr>
              </thead>

              <tbody>
                {pagedStudents.map((st) => {
                  const per = analytics.perStudent.find(
                    (p) => p.id === st.id
                  ) || {
                    present: 0,
                    absent: 0,
                    excused: 0,
                    unmarked: 0,
                    percentPresent: 0,
                  };
                  return (
                    <tr
                      key={st.id}
                      className={
                        selectedIds.includes(st.id) ? "att_row_selected" : ""
                      }
                    >
                      {data.dates.map((d) => {
                        const s = st.attendance?.[d] || "";
                        return (
                          <td
                            key={d}
                            className={`att_date_cell ${
                              s ? STATUS_CLASS[s] : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCellModal(st.id, d);
                            }}
                            title={s || "not marked"}
                          >
                            <div className="att_cell_inner">
                              <span className="att_dot" />
                              <span className="att_label">
                                {s ? STATUS_LABEL[s] : ""}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      <td className="att_analytics_col">{per.present}</td>
                      <td className="att_analytics_col">{per.absent}</td>
                      <td className="att_analytics_col">{per.excused}</td>
                      <td className="att_analytics_col">{per.unmarked}</td>
                      <td className="att_analytics_col">
                        {per.percentPresent}%
                      </td>
                    </tr>
                  );
                })}

                {pagedStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={data.dates.length + 5}
                      style={{ textAlign: "center", padding: 20 }}
                    >
                      &nbsp;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="att_footer">
          {/* <div className="att_footer_left"></div> */}
          <div className="att_footer_center">
            Page {page + 1} / {totalPages}
            <div className="att_pager_controls">
              <Button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                variant="secondary"
              >
                ‹
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                variant="secondary"
              >
                ›
              </Button>
            </div>
          </div>
          <div className="att_footer_right">
            <div className="att_legend_chips">
              <div className="att_chip">
                <span className="att_dot att_green" /> Present (P)
              </div>
              <div className="att_chip">
                <span className="att_dot att_red" /> Absent (A)
              </div>
              <div className="att_chip">
                <span className="att_dot att_amber" /> Excused (E)
              </div>
            </div>
          </div>
        </div>

        {/* CELL EDIT MODAL */}
        {cellModal?.visible && (
          <div className="att_modal_backdrop" onClick={closeCellModal}>
            <div
              className="att_modal_dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit attendance</h3>
              <p>
                <strong>Student:</strong>{" "}
                {data.students.find((s) => s.id === cellModal.studentId)?.name}{" "}
                • <strong>ID:</strong> {cellModal.studentId}
              </p>
              <p>
                <strong>Date:</strong> {cellModal.date}
              </p>

              <div className="att_modal_controls">
                <label className="att_label">Status</label>
                <select
                  value={cellModal.status ?? ""}
                  onChange={(e) =>
                    setCellModal({ ...cellModal, status: e.target.value })
                  }
                  className="att_full"
                >
                  <option value="">Not marked</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="excused">Excused</option>
                </select>
              </div>

              <div className="att_modal_actions">
                <button className="att_btn" onClick={closeCellModal}>
                  Cancel
                </button>
                <button
                  className="att_btn att_btn-primary"
                  onClick={saveCellModal}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        {att_showDeleteModal && (
          <div
            className="att_modal_backdrop"
            onClick={() => set_att_showDeleteModal(false)}
          >
            <div
              className="att_modal_dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Confirm delete</h3>
              <p>
                Delete {selectedIds.length} selected student(s)? This action
                cannot be undone.
              </p>
              <div className="att_modal_actions">
                <button
                  className="att_btn"
                  onClick={() => set_att_showDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="att_btn att_btn-danger"
                  onClick={confirmDeleteSelected}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPORT MODAL */}
        {att_showExportModal && (
          <div
            className="att_modal_backdrop"
            onClick={() => set_att_showExportModal(false)}
          >
            <div
              className="att_modal_dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Export attendance</h3>

              <label className="att_label">Format</label>
              <select
                className="att_full"
                value={att_exportFormat}
                onChange={(e) => set_att_exportFormat(e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="xlsx">XLSX</option>
                <option value="json">JSON</option>
              </select>

              <label className="att_label">Columns</label>
              <div className="att_export_columns">
                <label>
                  <input
                    type="checkbox"
                    checked={att_exportColumns.includes("id")}
                    onChange={() =>
                      set_att_exportColumns((prev) =>
                        prev.includes("id")
                          ? prev.filter((x) => x !== "id")
                          : [...prev, "id"]
                      )
                    }
                  />{" "}
                  ID
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={att_exportColumns.includes("name")}
                    onChange={() =>
                      set_att_exportColumns((prev) =>
                        prev.includes("name")
                          ? prev.filter((x) => x !== "name")
                          : [...prev, "name"]
                      )
                    }
                  />{" "}
                  Name
                </label>
              </div>

              <div style={{ marginTop: 12 }}>
                <label className="att_label">Export scope</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="att_btn" onClick={() => doExport(false)}>
                    All rows
                  </button>
                  <button
                    className="att_btn"
                    onClick={() => doExport(true)}
                    disabled={!anySelected}
                  >
                    Selected rows
                  </button>
                </div>
              </div>

              <div className="att_modal_actions">
                <button
                  className="att_btn"
                  onClick={() => set_att_showExportModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// const sample = {
//   students: [
//     {
//       id: "S001",
//       name: "Alice",
//       attendance: {
//         "2025-12-10": "present",
//         "2025-12-11": "absent",
//       },
//     },
//     {
//       id: "S002",
//       name: "Bob",
//       attendance: {
//         "2025-12-11": "excused",
//         "2026-03-13": "excused",
//         "2026-03-19": "present",
//       },
//     },
//     {
//       id: "S003",
//       name: "Chin",
//       attendance: {},
//     },
//   ],
// };

// const [att, setAtt] = useState(sample);
// return (
//   <>
//     {" "}
//     <div className="asdttts">
//       <div className="asdtttstss">
//         <div className="asdtttstssts">
//           <div className="asdtttstssls">
//             <h1>
//               2025/2026 - First Term - Atendance{" "}
//               <span className="asdtttstsslsspn">Current Seasion</span>
//             </h1>
//           </div>
//           <p className="llm">
//             Sep 1, 2025 – Jul 31, 2026 • First Term Atendance
//           </p>
//         </div>
//       </div>
//     </div>
//     <AttendanceTable
//       value={att}
//       onChange={setAtt}
//       maxRowsPerPage={8}
//       enableSelect={true}
//     />
//   </>
