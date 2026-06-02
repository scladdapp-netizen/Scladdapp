import { useState, useRef, useEffect } from "react";
import "./SearchableSelect.css";

const SearchableSelect = ({
  label,
  placeholder = "Search...",
  options = [],
  value,
  onChange,
  displayKey = "label",
  valueKey = "value",
  searchKeys = ["label"],
  maxDisplayItems = 10,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options.slice(0, maxDisplayItems));
    } else {
      const filtered = options.filter((option) => {
        return searchKeys.some((key) => {
          const fieldValue = option[key]?.toString().toLowerCase() || "";
          return fieldValue.includes(searchTerm.toLowerCase());
        });
      });
      setFilteredOptions(filtered.slice(0, maxDisplayItems));
    }
  }, [searchTerm, maxDisplayItems]); // Removed options and searchKeys from dependencies

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected option display text
  const getSelectedDisplay = () => {
    if (!value) return "";
    const selectedOption = options.find((option) => option[valueKey] === value);
    return selectedOption ? selectedOption[displayKey] : "";
  };

  const handleInputClick = () => {
    setIsOpen(true);
    // Always refresh filtered options when opening dropdown
    if (!searchTerm.trim()) {
      setFilteredOptions(options.slice(0, maxDisplayItems));
    } else {
      const filtered = options.filter((option) => {
        return searchKeys.some((key) => {
          const fieldValue = option[key]?.toString().toLowerCase() || "";
          return fieldValue.includes(searchTerm.toLowerCase());
        });
      });
      setFilteredOptions(filtered.slice(0, maxDisplayItems));
    }
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onChange(option[valueKey]);
    setSearchTerm("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="searchable-select-container" ref={dropdownRef}>
      {label && (
        <label className="searchable-select-label">
          {label}
          {required && <span className="required-asterisk"> *</span>}
        </label>
      )}

      <div className="searchable-select-wrapper">
        <div className="searchable-select-input-container">
          <input
            ref={inputRef}
            type="text"
            className={`searchable-select-input${value && !searchTerm ? " has-value" : ""}`}
            placeholder={placeholder}
            value={searchTerm || (value ? getSelectedDisplay() : "")}
            onChange={handleInputChange}
            onClick={handleInputClick}
            autoComplete="off"
          />

          <div className="searchable-select-icons">
            {value && (
              <button
                type="button"
                className="searchable-select-clear"
                onClick={handleClear}
                title="Clear selection"
              >
                ×
              </button>
            )}
            <div
              className={`searchable-select-arrow ${isOpen ? "open" : ""}`}
              onClick={handleInputClick}
            >
              ▼
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="searchable-select-dropdown">
            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((option, index) => (
                  <div
                    key={`${option[valueKey]}-${index}`}
                    className={`searchable-select-option ${
                      option[valueKey] === value ? "selected" : ""
                    }`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="option-content">
                      <div className="option-main">{option[displayKey]}</div>
                      {option.subtitle && (
                        <div className="option-subtitle">{option.subtitle}</div>
                      )}
                    </div>
                  </div>
                ))}
                {options.length > maxDisplayItems && (
                  <div className="searchable-select-info">
                    Showing {filteredOptions.length} of {options.length} results
                    {searchTerm && " for '" + searchTerm + "'"}
                  </div>
                )}
              </>
            ) : (
              <div className="searchable-select-no-results">
                {searchTerm
                  ? `No results found for "${searchTerm}"`
                  : "No options available"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
