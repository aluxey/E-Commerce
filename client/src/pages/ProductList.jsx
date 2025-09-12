import { useEffect, useState } from 'react';
import ItemCard from '../components/ItemCard';
import '../styles/ProductList.css';
import { supabase } from '../supabase/supabaseClient';

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');

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
        setItems(itemsData || []);
        setCategories(categoriesData || []);
        setFilteredItems(itemsData || []);
      } else {
        console.error('Erreur lors du chargement :', itemsError || categoriesError);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

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
  }, [items, searchTerm, selectedCategory, sortBy]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('name');
  };

  if (isLoading) {
    return (
      <div className="products-loading">
        <div className="loading-spinner-large"></div>
        <p>Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* En-tête simplifié */}
      <div className="products-header">
        <h1>Notre Collection</h1>
        <p className="products-subtitle">{items.length} produits disponibles</p>
      </div>

      {/* Barre de recherche et filtres simplifiés */}
      <div className="products-controls">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="filters-section">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-select">
            <option value="name">Trier par nom</option>
            <option value="price">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>

          {(searchTerm || selectedCategory) && (
            <button onClick={handleClearFilters} className="clear-btn">
              Effacer les filtres
            </button>
          )}
        </div>
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
              <ItemCard key={item.id} item={item} />
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
