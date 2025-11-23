import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import ProductFilters from '../components/ProductFilters';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { listColors } from '../services/adminColors';
import { fetchCategories, fetchItemRatings, fetchItemsWithRelations } from '../services/items';
import '../styles/ProductList.css';

export default function ProductList() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');

  // UI States
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Ratings Data
  const [avgRatings, setAvgRatings] = useState({});
  const [reviewCounts, setReviewCounts] = useState({});

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [itemsResp, categoriesResp, colorsResp] = await Promise.all([
        fetchItemsWithRelations(),
        fetchCategories(),
        listColors()
      ]);

      if (itemsResp.error || categoriesResp.error) {
        throw new Error(itemsResp.error?.message || categoriesResp.error?.message || 'Erreur de chargement');
      }

      const safeItems = itemsResp.data || [];
      setItems(safeItems);
      setCategories(categoriesResp.data || []);
      setColors(colorsResp.data || []);

      // Load ratings
      const ids = safeItems.map(i => i.id);
      if (ids.length) {
        const { data: ratingsData } = await fetchItemRatings(ids);
        if (ratingsData) {
          const sums = {};
          const counts = {};
          ratingsData.forEach(r => {
            sums[r.item_id] = (sums[r.item_id] || 0) + r.rating;
            counts[r.item_id] = (counts[r.item_id] || 0) + 1;
          });

          const averages = {};
          const reviewsCount = {};
          ids.forEach(id => {
            const c = counts[id] || 0;
            averages[id] = c ? sums[id] / c : 0;
            reviewsCount[id] = c;
          });
          setAvgRatings(averages);
          setReviewCounts(reviewsCount);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les produits. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    setSearchTerm(q);

    const catId = params.get('categoryId');
    if (catId) setSelectedCategory(catId);
  }, [location.search]);

  // Category Helpers
  const categoryMeta = useMemo(() => {
    const byId = new Map();
    const children = new Map();

    categories.forEach(cat => {
      byId.set(cat.id, cat);
      if (cat.parent_id) {
        const arr = children.get(cat.parent_id) || [];
        arr.push(cat);
        children.set(cat.parent_id, arr);
      }
    });

    return { byId, children };
  }, [categories]);

  const listDescendants = (id) => {
    const stack = [Number(id)];
    const collected = [];
    while (stack.length) {
      const current = stack.pop();
      const subs = categoryMeta.children.get(current) || [];
      for (const child of subs) {
        collected.push(child.id);
        stack.push(child.id);
      }
    }
    return collected;
  };

  const formatCategoryPath = (cat) => {
    if (!cat) return '';
    const parent = cat.parent_id ? categoryMeta.byId.get(cat.parent_id) : null;
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  };

  // Filtering Logic
  useEffect(() => {
    let result = [...items];

    // 1. Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower)
      );
    }

    // 2. Category (including subcategories)
    if (selectedCategory) {
      const catId = Number(selectedCategory);
      const validIds = new Set([catId, ...listDescendants(catId)]);
      result = result.filter(item => validIds.has(item.category_id));
    }

    // 3. Price
    if (priceRange.min !== '' || priceRange.max !== '') {
      const min = priceRange.min === '' ? 0 : Number(priceRange.min);
      const max = priceRange.max === '' ? Infinity : Number(priceRange.max);

      result = result.filter(item => {
        // Check base price
        if (item.price >= min && item.price <= max) return true;
        // Check variants prices
        if (item.item_variants?.length) {
          return item.item_variants.some(v => v.price >= min && v.price <= max);
        }
        return false;
      });
    }

    // 4. Color
    if (selectedColor) {
      const colorId = Number(selectedColor);
      result = result.filter(item =>
        item.item_colors?.some(ic => ic.colors?.id === colorId)
      );
    }

    // 5. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        default: return a.name.localeCompare(b.name);
      }
    });

    setFilteredItems(result);
  }, [items, searchTerm, selectedCategory, selectedColor, priceRange, sortBy, categoryMeta]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedColor('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
  };

  if (isLoading) return <div className="page-loading"><LoadingMessage /></div>;
  if (error) return <div className="page-error"><ErrorMessage message={error} onRetry={loadData} /></div>;

  return (
    <div className="product-list-page">
      <div className="product-list-container">
        {/* Filters Sidebar */}
        <ProductFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          colors={colors}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          onClearFilters={handleClearFilters}
          isOpen={isFiltersOpen}
          onClose={() => setIsFiltersOpen(false)}
        />

        {/* Main Content */}
        <main className="product-list-main">
          <div className="product-list-header">
            <div className="header-left">
              <button
                className="mobile-filter-btn"
                onClick={() => setIsFiltersOpen(true)}
              >
                Filtres / Filter
              </button>
              <span className="result-count">
                {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="header-right">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="icon">🔍</span>
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="price">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="products-grid">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  categoryLabel={formatCategoryPath(categoryMeta.byId.get(item.category_id))}
                  avgRating={avgRatings[item.id] || 0}
                  reviewCount={reviewCounts[item.id] || 0}
                />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="icon">📦</div>
              <h3>Aucun résultat</h3>
              <p>Essayez de modifier vos filtres</p>
              <button onClick={handleClearFilters} className="btn primary">
                Tout effacer
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
