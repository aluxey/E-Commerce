import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import '../styles/cart.css';

const Cart = () => {
  const { cart, removeItem, decreaseItem, addItem } = useContext(CartContext);
  const { session } = useAuth();

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (Number(item.unit_price) || 0) * item.quantity;
    }, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Votre panier est vide / Dein Warenkorb ist leer</h2>
        <Link to="/items" className="btn-shop">
          Continuer mes achats / Weiter einkaufen
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Mon Panier / Mein Warenkorb</h1>

      <div className="cart-items">
        {cart.map(item => {
          const unitPrice = Number(item.unit_price) || 0;
          const stock = item.stock ?? null;
          const cannotIncrease = stock != null && item.quantity >= stock;
          return (
            <div
              key={`${item.variantId}`}
              className="cart-item"
            >
              <img src={item.image_url} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{unitPrice.toFixed(2)}€</p>
              <p>
                Taille: {item.size || '—'} | Couleur: {item.color || '—'}
              </p>
              {stock != null && <p className="item-stock">Stock: {stock}</p>}
            </div>
            <div className="quantity-controls">
              <button onClick={() => decreaseItem(item)} aria-label="Réduire la quantité / Menge verringern">-</button>
              <span>{item.quantity}</span>
              <button onClick={() => addItem(item)} disabled={cannotIncrease} aria-label="Augmenter la quantité / Menge erhöhen">
                +
              </button>
            </div>
            <div className="item-total">{(unitPrice * item.quantity).toFixed(2)}€</div>
            <button onClick={() => removeItem(item)} className="remove-btn" aria-label="Supprimer l'article / Artikel entfernen">
              Supprimer / Entfernen
            </button>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <div className="total">
          <strong>Total: {calculateTotal().toFixed(2)}€</strong>
        </div>

        {session ? (
          <Link to="/checkout" className="checkout-btn">
            Procéder au paiement / Zur Kasse
          </Link>
        ) : (
          <div className="auth-required">
            <p>Connectez-vous pour finaliser votre commande / Bitte anmelden, um zu bezahlen</p>
            <Link to="/login" className="login-btn">
              Se connecter / Anmelden
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
