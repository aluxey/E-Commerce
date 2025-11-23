import React from 'react';
import '../styles/ProductFilters.css';

export default function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  colors,
  selectedColor,
  onColorChange,
  onClearFilters,
  isOpen,
  onClose
}) {
  // Helper to render categories recursively
  const renderCategories = (cats, level = 0) => {
    return cats.map(cat => (
      <React.Fragment key={cat.id}>
        <div
          className={`filter-category-item level-${level} ${selectedCategory === String(cat.id) ? 'active' : ''}`}
          onClick={() => onCategoryChange(String(cat.id))}
        >
          {cat.name}
        </div>
        {cat.children && cat.children.length > 0 && (
          <div className="filter-category-children">
            {renderCategories(cat.children, level + 1)}
          </div>
        )}
      </React.Fragment>
    ));
  };

  // Organize categories into a tree for display
  const categoryTree = React.useMemo(() => {
    const tree = [];
    const map = new Map();

    // First pass: create nodes
    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: link parents and children
    categories.forEach(cat => {
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(map.get(cat.id));
        }
      } else {
        tree.push(map.get(cat.id));
      }
    });

    return tree;
  }, [categories]);

  return (
    <>
      {/* Mobile Overlay */}
      <div className={`filter-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`product-filters ${isOpen ? 'open' : ''}`}>
        <div className="filter-header">
          <h3>Filtres / Filter</h3>
          <button className="close-filters-btn" onClick={onClose}>×</button>
        </div>

        <div className="filter-section">
          <h4>Catégories / Kategorien</h4>
          <div className="filter-categories">
            <div
              className={`filter-category-item ${!selectedCategory ? 'active' : ''}`}
              onClick={() => onCategoryChange('')}
            >
              Tout / Alle
            </div>
            {renderCategories(categoryTree)}
          </div>
        </div>

        <div className="filter-section">
          <h4>Prix / Preis</h4>
          <div className="price-inputs">
            <div className="price-group">
              <label>Min (€)</label>
              <input
                type="number"
                min="0"
                value={priceRange.min}
                onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="price-group">
              <label>Max (€)</label>
              <input
                type="number"
                min="0"
                value={priceRange.max}
                onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {colors && colors.length > 0 && (
          <div className="filter-section">
            <h4>Couleurs / Farben</h4>
            <div className="color-options">
              <button
                className={`color-swatch all ${!selectedColor ? 'active' : ''}`}
                onClick={() => onColorChange('')}
                title="Toutes les couleurs"
              >
                <span className="swatch-inner"></span>
              </button>
              {colors.map(color => (
                <button
                  key={color.id}
                  className={`color-swatch ${selectedColor === String(color.id) ? 'active' : ''}`}
                  onClick={() => onColorChange(String(color.id))}
                  title={color.name}
                >
                  <span
                    className="swatch-inner"
                    style={{ backgroundColor: color.hex_code }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="filter-actions">
          <button className="btn secondary full-width" onClick={onClearFilters}>
            Réinitialiser / Zurücksetzen
          </button>
        </div>
      </aside>
    </>
  );
}
