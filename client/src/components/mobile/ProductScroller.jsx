import { useContext } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CartContext } from "../../context/CartContextObject";

/**
 * ProductScroller - Horizontal card scroller for mobile
 * Features: snap scrolling, lazy loading, touch-optimized cards
 */
export default function ProductScroller({ items, loading, emptyMessage }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="mh-scroller">
        <div className="mh-scroller__track">
          {[1, 2, 3].map(i => (
            <div key={i} className="mh-product-card mh-product-card--skeleton">
              <div className="mh-product-card__image mh-skeleton" />
              <div className="mh-product-card__body">
                <div className="mh-skeleton mh-skeleton--text" />
                <div className="mh-skeleton mh-skeleton--text mh-skeleton--short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="mh-scroller-empty">
        <p>{emptyMessage || t("status.noResults", "No items available")}</p>
      </div>
    );
  }

  return (
    <div className="mh-scroller" role="region" aria-label="Product carousel">
      <div className="mh-scroller__track">
        {items.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual product card for the scroller
 */
function ProductCard({ item }) {
  const { addItem } = useContext(CartContext);
  const { t } = useTranslation();
  
  const imageUrl = item?.item_images?.[0]?.image_url;
  const variants = item?.item_variants || [];
  const preferredVariant = variants.find(v => (v.stock ?? 0) > 0) || variants[0] || null;
  const displayPrice = item?.price != null 
    ? Number(item.price) 
    : preferredVariant?.price != null 
      ? Number(preferredVariant.price) 
      : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!preferredVariant) return;
    addItem({ item, variant: preferredVariant });
  };

  const isOutOfStock = !preferredVariant || (preferredVariant.stock != null && preferredVariant.stock <= 0);

  return (
    <article className="mh-product-card">
      <Link to={`/item/${item.id}`} className="mh-product-card__link">
        <div className="mh-product-card__image">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={item.name || "Product"} 
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="mh-product-card__placeholder">
              {t("itemCard.imageUnavailable", "No image")}
            </div>
          )}
        </div>
        <div className="mh-product-card__body">
          <h3 className="mh-product-card__title">{item.name}</h3>
          <div className="mh-product-card__price">{displayPrice.toFixed(2)} €</div>
        </div>
      </Link>
      <button
        className="mh-product-card__add"
        onClick={handleAdd}
        disabled={isOutOfStock}
        aria-label={t("miniCard.addAria", "Add to cart")}
      >
        {isOutOfStock ? t("productDetail.outOfStock", "Sold out") : "+"}
      </button>
    </article>
  );
}
