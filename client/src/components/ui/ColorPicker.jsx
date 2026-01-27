import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search, X } from "lucide-react";
import "./ColorPicker.css";

/**
 * ColorPicker - A dropdown-based color selector with search functionality
 * Designed for large color palettes (40+ colors)
 * 
 * @param {Object} props
 * @param {Array} props.colors - Array of color options: { value, label, hex }
 * @param {string} props.selectedColor - Currently selected color value
 * @param {function} props.onChange - Callback when color is selected
 * @param {string} props.label - Label text for the picker
 */
export default function ColorPicker({ colors = [], selectedColor, onChange, label }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const maxVisibleSwatches = 8;
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Find the currently selected color object
  const selectedColorObj = useMemo(() => 
    colors.find(c => c.value === selectedColor) || null,
    [colors, selectedColor]
  );

  // Filter colors based on search query
  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) return colors;
    const query = searchQuery.toLowerCase().trim();
    return colors.filter(color => 
      color.label.toLowerCase().includes(query)
    );
  }, [colors, searchQuery]);

  const visibleSwatches = useMemo(
    () => colors.slice(0, maxVisibleSwatches),
    [colors, maxVisibleSwatches]
  );
  const remainingCount = colors.length - visibleSwatches.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlight when filtered colors change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredColors.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.color-picker-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = useCallback((colorValue) => {
    onChange(colorValue);
    setIsOpen(false);
    setSearchQuery("");
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredColors.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredColors.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredColors[highlightedIndex]) {
          handleSelect(filteredColors[highlightedIndex].value);
        }
        break;
      default:
        break;
    }
  }, [isOpen, filteredColors, highlightedIndex, handleSelect]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    setSearchQuery("");
  }, []);

  // Group colors by first letter for better organization (optional feature)
  const colorGroups = useMemo(() => {
    const groups = {};
    filteredColors.forEach(color => {
      const firstLetter = color.label.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(color);
    });
    return groups;
  }, [filteredColors]);

  const showGroupHeaders = filteredColors.length > 15 && !searchQuery;

  return (
    <div 
      className="color-picker-container" 
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="color-picker-label">{label}:</label>
      )}

      {colors.length > 0 && (
        <div
          className="color-picker-swatches"
          role="listbox"
          aria-label={t("colorPicker.swatchLabel")}
        >
          {visibleSwatches.map(color => {
            const isSelected = selectedColor === color.value;
            return (
              <button
                key={color.value}
                type="button"
                className={`color-picker-swatch ${isSelected ? "is-selected" : ""}`}
                onClick={() => handleSelect(color.value)}
                role="option"
                aria-selected={isSelected}
                aria-label={color.label}
                title={color.label}
              >
                <span
                  className="color-picker-swatch-fill"
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && <Check size={14} className="color-picker-swatch-check" />}
                </span>
              </button>
            );
          })}
          {remainingCount > 0 && (
            <button
              type="button"
              className="color-picker-swatch color-picker-swatch--more"
              onClick={openDropdown}
              aria-label={t("colorPicker.moreColors", { count: remainingCount })}
            >
              +{remainingCount}
            </button>
          )}
        </div>
      )}
      
      {/* Trigger button showing selected color */}
      <button
        type="button"
        className={`color-picker-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedColorObj ? (
          <div className="color-picker-selected">
            <span 
              className="color-picker-dot" 
              style={{ backgroundColor: selectedColorObj.hex }}
            />
            <span className="color-picker-selected-label">
              {selectedColorObj.label}
            </span>
          </div>
        ) : (
          <span className="color-picker-placeholder">
            {t("colorPicker.selectColor")}
          </span>
        )}
        <ChevronDown 
          size={18} 
          className={`color-picker-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="color-picker-dropdown" role="listbox">
          {/* Search input */}
          <div className="color-picker-search">
            <Search size={16} className="color-picker-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("colorPicker.searchPlaceholder")}
              className="color-picker-search-input"
              aria-label={t("colorPicker.searchLabel")}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="color-picker-search-clear"
                onClick={clearSearch}
                aria-label={t("colorPicker.clearSearch")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Color count */}
          <div className="color-picker-count">
            {filteredColors.length === colors.length ? (
              t("colorPicker.totalColors", { count: colors.length })
            ) : (
              t("colorPicker.filteredColors", { 
                filtered: filteredColors.length, 
                total: colors.length 
              })
            )}
          </div>

          {/* Color grid */}
          <div className="color-picker-list" ref={listRef}>
            {filteredColors.length === 0 ? (
              <div className="color-picker-empty">
                {t("colorPicker.noResults")}
              </div>
            ) : showGroupHeaders ? (
              // Grouped view for many colors
              Object.entries(colorGroups).sort(([a], [b]) => a.localeCompare(b)).map(([letter, groupColors]) => (
                <div key={letter} className="color-picker-group">
                  <div className="color-picker-group-header">{letter}</div>
                  <div className="color-picker-grid">
                    {groupColors.map((color) => (
                      <ColorItem
                        key={color.value}
                        color={color}
                        isSelected={selectedColor === color.value}
                        isHighlighted={filteredColors.indexOf(color) === highlightedIndex}
                        onClick={() => handleSelect(color.value)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Flat grid view
              <div className="color-picker-grid">
                {filteredColors.map((color, index) => (
                  <ColorItem
                    key={color.value}
                    color={color}
                    isSelected={selectedColor === color.value}
                    isHighlighted={index === highlightedIndex}
                    onClick={() => handleSelect(color.value)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual color item in the picker
 */
function ColorItem({ color, isSelected, isHighlighted, onClick }) {
  return (
    <button
      type="button"
      className={`color-picker-item ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      title={color.label}
    >
      <span 
        className="color-picker-item-dot"
        style={{ backgroundColor: color.hex }}
      >
        {isSelected && <Check size={12} className="color-picker-check" />}
      </span>
      <span className="color-picker-item-label">{color.label}</span>
    </button>
  );
}
