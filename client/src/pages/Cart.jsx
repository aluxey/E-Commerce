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
      return total + item.price * item.quantity;
    }, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Votre panier est vide</h2>
        <Link to="/items" className="btn-shop">
          Continuer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Mon Panier</h1>

      <div className="cart-items">
        {cart.map(item => (
          <div key={item.id} className="cart-item">
            <img src={item.item_images?.[0]?.image_url} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{item.price}€</p>
            </div>
            <div className="quantity-controls">
              <button onClick={() => decreaseItem(item.id)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => addItem(item)}>+</button>
            </div>
            <div className="item-total">{(item.price * item.quantity).toFixed(2)}€</div>
            <button onClick={() => removeItem(item.id)} className="remove-btn">
              Supprimer
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="total">
          <strong>Total: {calculateTotal().toFixed(2)}€</strong>
        </div>

        {session ? (
          <Link to="/checkout" className="checkout-btn">
            Procéder au paiement
          </Link>
        ) : (
          <div className="auth-required">
            <p>Connectez-vous pour finaliser votre commande</p>
            <Link to="/login" className="login-btn">
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
