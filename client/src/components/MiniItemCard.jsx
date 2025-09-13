import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

export default function MiniItemCard({ item }) {
  const { addItem } = useContext(CartContext);
  const imageUrl = item?.item_images?.[0]?.image_url;

  const handleAdd = e => {
    e.preventDefault();
    addItem({
      ...item,
      selectedSize: item.sizes?.[0] || 'S',
      selectedColor: item.colors?.[0] || 'BLEU',
    });
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
          <div className="mini-card__price">{item?.price?.toLocaleString()} €</div>
        </div>
        <div className="mini-card__actions">
          <Link to={`/item/${item?.id}`} className="btn btn--ghost" aria-label="Voir le détail du produit">
            En savoir plus
          </Link>
          <button className="btn btn--primary" onClick={handleAdd} aria-label="Ajouter au panier">
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

