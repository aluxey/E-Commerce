import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContextObject';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

import '../styles/cart.css';

const Cart = () => {
  const { cart, removeItem, decreaseItem, addItem } = useContext(CartContext);
  const { session } = useAuth();
  const { t } = useTranslation();

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (Number(item.unit_price) || 0) * item.quantity;
    }, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>{t('cart.emptyTitle')}</h2>
        <Link to="/items" className="btn-shop">
          {t('cart.emptyCta')}
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>{t('cart.title')}</h1>

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
                {t('cart.size')}: {item.size || '—'} | {t('cart.color')}: {item.color || '—'}
                {item.hook_type && (
                  <span> | {t('cart.hookType')}: {t(`productDetail.hookTypes.${item.hook_type}`)}</span>
                )}
              </p>
              {stock != null && <p className="item-stock">{t('cart.stock', { count: stock })}</p>}
            </div>
            <div className="quantity-controls">
              <button onClick={() => decreaseItem(item)} aria-label={t('cart.quantityDecrease')}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => addItem(item)} disabled={cannotIncrease} aria-label={t('cart.quantityIncrease')}>
                +
              </button>
            </div>
            <div className="item-total">{(unitPrice * item.quantity).toFixed(2)}€</div>
            <button onClick={() => removeItem(item)} className="remove-btn" aria-label={t('cart.remove')}>
              {t('cart.remove')}
            </button>
            </div>
          );
        })}
      </div>

      <div className="cart-summary">
        <div className="total">
          <strong>{t('cart.total', { total: calculateTotal().toFixed(2) })}</strong>
        </div>

        {session ? (
          <Link to="/checkout" className="checkout-btn">
            {t('cart.checkout')}
          </Link>
        ) : (
          <div className="auth-required">
            <p>{t('cart.loginPrompt')}</p>
            <Link to="/login" className="login-btn">
              {t('cart.login')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
