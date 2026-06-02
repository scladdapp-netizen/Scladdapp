import React, { useState } from "react";
import "./SelectionTable.css";

const SelectionTable = ({
  columns,
  data,
  selectedIds = [],
  onSelectChange,
  maxRowsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectAll, setSelectAll] = useState(false);

  const totalPages = Math.ceil(data.length / maxRowsPerPage);
  const startIndex = (currentPage - 1) * maxRowsPerPage;
  const endIndex = startIndex + maxRowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = data.map((item) => item.id);
      onSelectChange(allIds);
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    let newSelectedIds;
    if (checked) {
      newSelectedIds = [...selectedIds, itemId];
    } else {
      newSelectedIds = selectedIds.filter((id) => id !== itemId);
      setSelectAll(false);
    }
    onSelectChange(newSelectedIds);
  };

  const isSelected = (itemId) => selectedIds.includes(itemId);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="selection-table-container">
      <div className="table-wrapper">
        <table className="selection-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              {columns.map((column, index) => (
                <th key={index}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.id} className={isSelected(row.id) ? "selected" : ""}>
                <td className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={isSelected(row.id)}
                    onChange={(e) => handleSelectItem(row.id, e.target.checked)}
                  />
                </td>
                {columns.map((column, index) => (
                  <td key={index}>
                    {column.render
                      ? column.render(row[column.accessor], row)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of{" "}
            {data.length} items
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`page-btn ${
                      currentPage === page ? "active" : ""
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <div className="selection-summary">
          {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}{" "}
          selected
        </div>
      )}
    </div>
  );
};

export default SelectionTable;
