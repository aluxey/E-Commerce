import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import ProductFilters from '../components/ProductFilters';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { fetchCategories, fetchItemRatings, fetchItemsWithRelations } from '../services/items';
import '../styles/ProductList.css';
import { useTranslation } from 'react-i18next';

export default function ProductList() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');

  // UI States
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Ratings Data
  const [avgRatings, setAvgRatings] = useState({});
  const [reviewCounts, setReviewCounts] = useState({});
  const { t } = useTranslation();

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    setError(false);

    try {
      const [itemsResp, categoriesResp] = await Promise.all([
        fetchItemsWithRelations(),
        fetchCategories()
      ]);

      if (itemsResp.error || categoriesResp.error) {
        throw new Error(itemsResp.error?.message || categoriesResp.error?.message || 'Erreur de chargement');
      }

      const safeItems = itemsResp.data || [];
      setItems(safeItems);
      setCategories(categoriesResp.data || []);

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
      setError(true);
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

  const translateCategoryName = useCallback(cat => {
    const key = (cat?.slug || cat?.name || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    return t(`categoryNames.${key}`, { defaultValue: cat?.name || '' });
  }, [t]);

  const listDescendants = useCallback((id) => {
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
  }, [categoryMeta.children]);

  const formatCategoryPath = (cat) => {
    if (!cat) return '';
    const parent = cat.parent_id ? categoryMeta.byId.get(cat.parent_id) : null;
    const name = translateCategoryName(cat);
    const parentName = parent ? translateCategoryName(parent) : null;
    return parentName ? `${parentName} › ${name}` : name;
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

    // 4. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        default: return a.name.localeCompare(b.name);
      }
    });

    setFilteredItems(result);
  }, [items, searchTerm, selectedCategory, priceRange, sortBy, categoryMeta, listDescendants]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('name');
  };

  if (isLoading) return <div className="page-loading"><LoadingMessage /></div>;
  if (error) return <div className="page-error"><ErrorMessage message={t('status.error')} onRetry={loadData} /></div>;

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
                {t('productList.filtersButton')}
              </button>
              <span className="result-count">
                {t('productList.resultCount', { count: filteredItems.length })}
              </span>
            </div>

            <div className="header-right">
              <div className="search-box">
                <input
                  type="text"
                  placeholder={t('productList.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="icon"><Search size={18} /></span>
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">{t('productList.sortName')}</option>
                <option value="price">{t('productList.sortPrice')}</option>
                <option value="price-desc">{t('productList.sortPriceDesc')}</option>
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
              <div className="icon"><Package size={48} /></div>
              <h3>{t('productList.noResultsTitle')}</h3>
              <p>{t('productList.noResultsText')}</p>
              <button onClick={handleClearFilters} className="btn primary">
                {t('productList.clearAll')}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
