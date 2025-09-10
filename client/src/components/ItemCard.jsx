import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import '../styles/Item.css';

export default function ItemCard({ item }) {
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

  return (
    <div className="item-card">
      <Link to={`/item/${item.id}`} className="card-link">
        <div className="image-container">
          {imageUrl ? (
            <img src={imageUrl} alt={item.name} className="card-img" />
          ) : (
            <div className="placeholder-img">Image indisponible</div>
          )}
        </div>
        <div className="card-body">
          <h2 className="item-title">{item.name}</h2>
          <p className="item-price">{item.price?.toLocaleString()} €</p>
        </div>
      </Link>
      <button className="add-cart-btn" onClick={handleAddToCart}>
        Ajouter au panier
      </button>
    </div>
  );
}
