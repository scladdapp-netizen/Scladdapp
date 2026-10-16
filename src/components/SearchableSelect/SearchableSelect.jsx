import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  // Fixed-position coordinates of the dropdown (null until measured)
  const [menuPos, setMenuPos] = useState(null);

  // The menu is rendered in a portal with fixed positioning so scrolling
  // parents and sticky footers can't clip it. It flips upward when there is
  // not enough room below the input.
  const updateMenuPosition = () => {
    const wrapper = wrapperRef.current;
    const menu = menuRef.current;
    if (!wrapper || !menu) return;

    const rect = wrapper.getBoundingClientRect();
    const gap = 4;
    const margin = 12;
    const cap = window.innerWidth <= 480 ? 220 : 280;
    const needed = Math.min(menu.scrollHeight, cap);
    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const openUp = spaceBelow < needed && spaceAbove > spaceBelow;
    const room = Math.max(120, openUp ? spaceAbove : spaceBelow);

    const next = {
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      maxHeight: Math.round(Math.min(cap, room)),
      top: openUp ? "auto" : Math.round(rect.bottom + gap),
      bottom: openUp ? Math.round(window.innerHeight - rect.top + gap) : "auto",
    };

    // only re-render when something actually moved
    setMenuPos((prev) =>
      prev &&
      prev.left === next.left &&
      prev.width === next.width &&
      prev.maxHeight === next.maxHeight &&
      prev.top === next.top &&
      prev.bottom === next.bottom
        ? prev
        : next
    );
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return undefined;
    }
    // Follow the field every frame: the field can move while open (scrolling
    // parents, slide-in panel animation, window resize).
    let raf = 0;
    const tick = () => {
      updateMenuPosition();
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

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
      const inside =
        dropdownRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target);
      if (!inside) {
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

      <div className="searchable-select-wrapper" ref={wrapperRef}>
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

        {isOpen &&
          createPortal(
          <div
            className="searchable-select-dropdown is-floating"
            ref={menuRef}
            style={
              menuPos
                ? { position: "fixed", right: "auto", ...menuPos }
                : { position: "fixed", visibility: "hidden", top: 0, bottom: "auto", left: 0, right: "auto" }
            }
          >
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
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
