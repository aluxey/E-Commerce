import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import '../styles/Item.css';
import { useTranslation } from 'react-i18next';

export default function ItemCard({ item, avgRating = 0, reviewCount = 0, categoryLabel = '' }) {
  const { addItem } = useContext(CartContext);
  const imageUrl = item.item_images?.[0]?.image_url;
  const variants = useMemo(() => item.item_variants || [], [item.item_variants]);
  const { t } = useTranslation();

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
          <Star size={14} fill={i <= full ? 'currentColor' : 'none'} />
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
            <div className="placeholder-img">{t('itemCard.imageUnavailable')}</div>
          )}
          {/* Quick Add Button Overlay */}
          <button
            className="quick-add-btn"
            onClick={handleAddToCart}
            disabled={!preferredVariant || (preferredVariant.stock != null && preferredVariant.stock <= 0)}
            title={t('itemCard.quickAdd')}
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="item-content">
          <div className="item-header">
            <h2 className="item-title">{item.name}</h2>
            <div className="item-price">{displayPrice.toFixed(2)} €</div>
          </div>

          {categoryLabel && <div className="item-category-label">{categoryLabel}</div>}

          <div className="item-meta">
            <div className="item-rating" aria-label={t('itemCard.ratingLabel', { rating: roundedRating })}>
              <span className="stars">{renderStars(roundedRating)}</span>
              <span className="rating-count">({reviewCount})</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
