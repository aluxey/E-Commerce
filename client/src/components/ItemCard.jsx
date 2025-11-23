import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import '../styles/Item.css';

export default function ItemCard({ item, avgRating = 0, reviewCount = 0, categoryLabel = '' }) {
  const { addItem } = useContext(CartContext);
  const imageUrl = item.item_images?.[0]?.image_url;
  const variants = useMemo(() => item.item_variants || [], [item.item_variants]);

  // Get unique colors from variants or item_colors
  const availableColors = useMemo(() => {
    const colors = [];
    const seen = new Set();

    // Check item_colors first (direct relation)
    if (item.item_colors) {
      item.item_colors.forEach(ic => {
        if (ic.colors && !seen.has(ic.colors.id)) {
          colors.push(ic.colors);
          seen.add(ic.colors.id);
        }
      });
    }

    return colors;
  }, [item.item_colors]);

  const preferredVariant = useMemo(() => {
    if (!variants.length) return null;
    const inStock = variants.find(v => (v.stock ?? 0) > 0);
    return inStock || variants[0];
  }, [variants]);

  const displayPrice = useMemo(() => {
    if (item.price != null) return Number(item.price);
    if (preferredVariant?.price != null) return Number(preferredVariant.price);
    return 0;
  }, [item.price, preferredVariant]);

  const handleAddToCart = e => {
    e.preventDefault();
    if (!preferredVariant) return;
    addItem({ item, variant: preferredVariant });
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
          {/* Quick Add Button Overlay */}
          <button
            className="quick-add-btn"
            onClick={handleAddToCart}
            disabled={!preferredVariant || (preferredVariant.stock != null && preferredVariant.stock <= 0)}
            title="Ajouter au panier"
          >
            +
          </button>
        </div>

        <div className="item-content">
          <div className="item-header">
            <h2 className="item-title">{item.name}</h2>
            <div className="item-price">{displayPrice.toFixed(2)} €</div>
          </div>

          {categoryLabel && <div className="item-category-label">{categoryLabel}</div>}

          {availableColors.length > 0 && (
            <div className="item-colors-preview">
              {availableColors.slice(0, 5).map(color => (
                <span
                  key={color.id}
                  className="color-dot"
                  style={{ backgroundColor: color.hex_code }}
                  title={color.name}
                />
              ))}
              {availableColors.length > 5 && <span className="more-colors">+{availableColors.length - 5}</span>}
            </div>
          )}

          <div className="item-meta">
            <div className="item-rating" aria-label={`Note moyenne ${roundedRating} sur 5`}>
              <span className="stars">{renderStars(roundedRating)}</span>
              <span className="rating-count">({reviewCount})</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
