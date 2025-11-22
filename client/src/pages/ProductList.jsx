import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import '../styles/ProductList.css';
import { fetchCategories, fetchItemsWithRelations, fetchItemRatings } from '../services/items';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export default function ProductList() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [avgRatings, setAvgRatings] = useState({}); // { [itemId]: number }
  const [reviewCounts, setReviewCounts] = useState({}); // { [itemId]: number }

  // Charger les items et catégories
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const [itemsResp, categoriesResp] = await Promise.all([fetchItemsWithRelations(), fetchCategories()]);

    if (itemsResp.error || categoriesResp.error) {
      setError('Impossible de charger les produits pour le moment.');
      setIsLoading(false);
      return;
    }

    const safeItems = itemsResp.data || [];
    setItems(safeItems);
    setCategories(categoriesResp.data || []);
    setFilteredItems(safeItems || []);

    // Charger les ratings moyens pour les items chargés
    try {
      const ids = safeItems.map(i => i.id);
      if (ids.length) {
        const { data: ratingsData, error: ratingsError } = await fetchItemRatings(ids);

        if (!ratingsError && ratingsData) {
          const sums = {};
          const counts = {};
          for (const r of ratingsData) {
            sums[r.item_id] = (sums[r.item_id] || 0) + r.rating;
            counts[r.item_id] = (counts[r.item_id] || 0) + 1;
          }
          const averages = {};
          const reviewsCount = {};
          ids.forEach(id => {
            const c = counts[id] || 0;
            const s = sums[id] || 0;
            averages[id] = c ? s / c : 0;
            reviewsCount[id] = c;
          });
          setAvgRatings(averages);
          setReviewCounts(reviewsCount);
        }
      }
    } catch (e) {
      console.warn('Impossible de charger les ratings moyens:', e);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryMeta = useMemo(() => {
    const byId = new Map();
    const parents = [];
    const children = new Map();

    categories.forEach(cat => {
      byId.set(cat.id, cat);
      if (!cat.parent_id) {
        parents.push(cat);
        return;
      }
      const arr = children.get(cat.parent_id) || [];
      arr.push(cat);
      children.set(cat.parent_id, arr);
    });

    parents.sort((a, b) => a.name.localeCompare(b.name));
    children.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));

    return { byId, parents, children };
  }, [categories]);

  const formatCategoryPath = cat => {
    if (!cat) return '';
    const parent =
      cat.parent_id != null
        ? categoryMeta.byId.get(cat.parent_id) || cat.parent || null
        : null;
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  };

  const listDescendants = id => {
    const stack = [id];
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

  const categoryOptions = useMemo(() => {
    const options = [];
    const seen = new Set();

    categoryMeta.parents.forEach(parent => {
      options.push({ value: String(parent.id), label: parent.name });
      seen.add(parent.id);

      const subs = categoryMeta.children.get(parent.id) || [];
      subs.forEach(sub => {
        options.push({
          value: String(sub.id),
          label: `${parent.name} › ${sub.name}`,
        });
        seen.add(sub.id);
      });
    });

    // Catégories orphelines ou non triées
    categories.forEach(cat => {
      if (seen.has(cat.id)) return;
      const parent =
        cat.parent_id != null
          ? categoryMeta.byId.get(cat.parent_id) || cat.parent || null
          : null;
      const label = parent ? `${parent.name} › ${cat.name}` : cat.name;
      options.push({ value: String(cat.id), label });
    });

    return options;
  }, [categories, categoryMeta]);

  const activeCategoryLabel = useMemo(() => {
    if (!selectedCategory) return '';
    const cat = categoryMeta.byId.get(Number(selectedCategory));
    return cat ? formatCategoryPath(cat) : '';
  }, [categoryMeta, selectedCategory]);

  // Synchroniser la recherche depuis l'URL (?search=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    setSearchTerm(q);
  }, [location.search]);

  // Appliquer une catégorie à partir des query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryIdParam = params.get('categoryId');
    const categoryName = params.get('category');

    if (!categories.length || (!categoryIdParam && !categoryName)) return;

    const byId = categoryMeta.byId;
    let cat = null;

    if (categoryIdParam && byId.has(Number(categoryIdParam))) {
      cat = byId.get(Number(categoryIdParam));
    } else if (categoryName) {
      cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    }

    if (cat) setSelectedCategory(String(cat.id));
  }, [categories, location.search, categoryMeta]);

  // Filtrer et trier les items
  useEffect(() => {
    let filtered = [...items];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (selectedCategory) {
      const selectedId = Number(selectedCategory);
      const scopedCategories = [selectedId, ...listDescendants(selectedId)];
      filtered = filtered.filter(item => scopedCategories.includes(item.category_id));
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'name':
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        default:
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory, sortBy, location.search, categoryMeta]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('name');
  };

  // Suppression des filtres obsolètes (promo/mois) non supportés par le schéma

  if (isLoading) {
    return (
      <div className="products-loading">
        <LoadingMessage message="Chargement des produits... / Produkte werden geladen..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-loading">
        <ErrorMessage title="Chargement impossible / Laden fehlgeschlagen" message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="products-page simple">
      {/* En-tête simplifié */}
      <div className="products-header">
        <h1>Notre Collection</h1>
        <p className="products-subtitle">{items.length} produits disponibles</p>
      </div>

      {/* Mini‑navbar: recherche + filtres */}
      <div className="products-controls">
        <nav className="products-subnav" aria-label="Navigation des filtres produits">
          <div className="subnav-left">
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Rechercher"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
          <div className="subnav-right">
            <ul className="sort-list" aria-label="Tri">
              <li>
                <button
                  className={`sort-chip${sortBy === 'name' ? ' active' : ''}`}
                  onClick={() => setSortBy('name')}
                >
                  Nom
                </button>
              </li>
              <li>
                <button
                  className={`sort-chip${sortBy === 'price' ? ' active' : ''}`}
                  onClick={() => setSortBy('price')}
                >
                  Prix ↑
                </button>
              </li>
              <li>
                <button
                  className={`sort-chip${sortBy === 'price-desc' ? ' active' : ''}`}
                  onClick={() => setSortBy('price-desc')}
                >
                  Prix ↓
                </button>
              </li>
            </ul>
            <div className="subnav-selects">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="category-select"
                aria-label="Catégorie"
              >
                <option value="">Toutes catégories</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {(searchTerm || selectedCategory) && (
                <button onClick={handleClearFilters} className="clear-btn">
                  Effacer
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Résultats */}
      <div className="products-results">
        {(searchTerm || selectedCategory) && (
          <div className="results-info">
            {filteredItems.length} produit{filteredItems.length !== 1 ? 's' : ''} trouvé
            {filteredItems.length !== 1 ? 's' : ''}
            {activeCategoryLabel && ` dans "${activeCategoryLabel}"`}
            {searchTerm && ` pour "${searchTerm}"`}
          </div>
        )}

        {filteredItems.length > 0 ? (
          <div className="products-grid">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                categoryLabel={formatCategoryPath(item.categories || categoryMeta.byId.get(item.category_id))}
                avgRating={avgRatings[item.id] || 0}
                reviewCount={reviewCounts[item.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">📦</div>
            <h3>Aucun produit trouvé / Kein Produkt gefunden</h3>
            <p>Essayez de modifier vos critères de recherche / Bitte passe Filter oder Suche an.</p>
            <button onClick={handleClearFilters} className="btn primary">
              Voir tous les produits / Alle Produkte anzeigen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
