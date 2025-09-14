import { Link } from 'react-router-dom';
import { useContext, useMemo } from 'react';
import { CartContext } from '../context/CartContext';
import '../styles/Item.css';

export default function ItemCard({ item, avgRating = 0, reviewCount = 0 }) {
  const { addItem } = useContext(CartContext); // ✅ utilisation directe
  const imageUrl = item.item_images?.[0]?.image_url;

  const handleAddToCart = e => {
    e.preventDefault();
    addItem({
      ...item,
      selectedSize: item.sizes?.[0] || 'S',
      selectedColor: item.colors?.[0] || 'BLEU',
    });
  };

  const roundedRating = useMemo(() => {
    if (!avgRating) return 0;
    return Math.round(avgRating * 10) / 10;
  }, [avgRating]);

  const renderStars = value => {
    const full = Math.floor(value);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= full ? 'star full' : 'star'}>
          {i <= full ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="item-card">
      <Link to={`/item/${item.id}`} className="card-link">
        <div className="item-image">
          {imageUrl ? (
            <img src={imageUrl} alt={item.name} className="card-img" />
          ) : (
            <div className="placeholder-img">Image indisponible</div>
          )}
        </div>
        <div className="item-content">
          <h2 className="item-title">{item.name}</h2>
          
          <div className="item-meta">
            <div className="item-price">{item.price?.toLocaleString()} €</div>
            <div className="item-rating" aria-label={`Note moyenne ${roundedRating} sur 5`}>
              <span className="stars">{renderStars(roundedRating)}</span>
              <span className="rating-value">{roundedRating || 0}</span>
              {typeof reviewCount === 'number' && (
                <span className="rating-count">({reviewCount})</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="item-actions">
        <button className="item-cta" onClick={handleAddToCart}>
          Acheter
        </button>
        <Link to={`/item/${item.id}`} className="item-cta secondary" aria-label="Voir le détail">
          Détail
        </Link>
      </div>
    </div>
  );
}
