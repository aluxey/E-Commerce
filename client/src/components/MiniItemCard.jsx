import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function MiniItemCard({ item }) {
  const { addItem } = useContext(CartContext);
  const imageUrl = item?.item_images?.[0]?.image_url;
  const variants = item?.item_variants || [];
  const preferredVariant = variants.find(v => (v.stock ?? 0) > 0) || variants[0] || null;
  const displayPrice = item?.price != null ? Number(item.price) : preferredVariant?.price != null ? Number(preferredVariant.price) : 0;

  const handleAdd = e => {
    e.preventDefault();
    if (!preferredVariant) return;
    addItem({ item, variant: preferredVariant });
  };

  return (
    <div className="mini-card">
      <div className="mini-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt={item?.name || 'Produit'} />
        ) : (
          <div className="mini-card__placeholder">Image indisponible</div>
        )}
      </div>
      <div className="mini-card__body">
        <div className="mini-card__info">
          <h3 className="mini-card__title" title={item?.name}>{item?.name}</h3>
          <div className="mini-card__price">{displayPrice.toFixed(2)} €</div>
        </div>
        <div className="mini-card__actions">
          <Link to={`/item/${item?.id}`} className="btn btn-ghost" aria-label="Details anzeigen / Voir le détail">
            Details / Détails
          </Link>
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            aria-label="In den Warenkorb / Ajouter au panier"
            disabled={!preferredVariant || (preferredVariant.stock != null && preferredVariant.stock <= 0)}
          >
            In den Warenkorb / Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
