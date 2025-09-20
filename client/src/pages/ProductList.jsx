import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import '../styles/ProductList.css';
import { supabase } from '../supabase/supabaseClient';

export default function ProductList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [avgRatings, setAvgRatings] = useState({}); // { [itemId]: number }
  const [reviewCounts, setReviewCounts] = useState({}); // { [itemId]: number }

  // Charger les items et catégories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Charger les items
      const { data: itemsData, error: itemsError } = await supabase.from('items').select(`
          *,
          item_images (
            image_url
          ),
          item_variants (
            id,
            size,
            color,
            price,
            stock
          ),
          categories (
            id,
            name
          )
        `);

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (!itemsError && !categoriesError) {
        const safeItems = itemsData || [];
        setItems(safeItems);
        setCategories(categoriesData || []);
        setFilteredItems(safeItems || []);

        // Charger les ratings moyens pour les items chargés
        try {
          const ids = safeItems.map(i => i.id);
          if (ids.length) {
            const { data: ratingsData, error: ratingsError } = await supabase
              .from('item_ratings')
              .select('item_id, rating')
              .in('item_id', ids);

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
      } else {
        console.error('Erreur lors du chargement :', itemsError || categoriesError);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Synchroniser la recherche depuis l'URL (?search=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    setSearchTerm(q);
  }, [location.search]);

  // Appliquer une catégorie à partir des query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get('category');
    if (categoryName && categories.length) {
      const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (cat) setSelectedCategory(String(cat.id));
    }
  }, [categories, location.search]);

  // Filtrer et trier les items
  useEffect(() => {
    const params = new URLSearchParams(location.search);
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
      filtered = filtered.filter(item => item.category_id === parseInt(selectedCategory));
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
  }, [items, searchTerm, selectedCategory, sortBy, location.search]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('name');
  };

  // Suppression des filtres obsolètes (promo/mois) non supportés par le schéma

  if (isLoading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner-large"></div>
        <p>Chargement des produits...</p>
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
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
            {selectedCategory && ' dans cette catégorie'}
            {searchTerm && ` pour "${searchTerm}"`}
          </div>
        )}

        {filteredItems.length > 0 ? (
          <div className="products-grid">
            {filteredItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                avgRating={avgRatings[item.id] || 0}
                reviewCount={reviewCounts[item.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">📦</div>
            <h3>Aucun produit trouvé</h3>
            <p>Essayez de modifier vos critères de recherche</p>
            <button onClick={handleClearFilters} className="btn primary">
              Voir tous les produits
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
