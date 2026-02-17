import { ArrowRight, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContextObject';

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
      <div className="cart-page-empty">
        <div className="empty-state-content">
          <div className="empty-icon">
            <ShoppingBag size={64} strokeWidth={1.5} />
          </div>
          <h2>{t('cart.emptyTitle')}</h2>
          <p>{t('cart.emptyMessage', 'Votre panier est vide pour le moment.')}</p>
          <Link to="/items" className="btn-primary">
            {t('cart.emptyCta')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <header className="cart-header">
        <h1>{t('cart.title')}</h1>
        <p className="cart-count">
          {cart.reduce((acc, item) => acc + item.quantity, 0)} {t('cart.items', 'articles')}
        </p>
      </header>

      <div className="cart-layout">
        <div className="cart-items-section">
          <div className="cart-items-list">
            {cart.map(item => {
              const unitPrice = Number(item.unit_price) || 0;
              const stock = item.stock ?? null;
              const cannotIncrease = stock != null && item.quantity >= stock;

              return (
                <div key={`${item.variantId}`} className="cart-item-card">
                  <div className="item-image-container">
                    <img src={item.image_url} alt={item.name} />
                  </div>

                  <div className="item-info">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <button
                        onClick={() => removeItem(item)}
                        className="btn-remove-mobile"
                        aria-label={t('cart.remove')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="item-specs">
                      <span className="spec-tag">{t('cart.size')}: {item.size || '—'}</span>
                      <span className="spec-tag">{t('cart.color')}: {item.color || '—'}</span>
                      {item.hook_type && (
                        <span className="spec-tag">
                          {t('cart.hookType')}: {t(`productDetail.hookTypes.${item.hook_type}`)}
                        </span>
                      )}
                    </div>

                    <div className="item-pricing-row">
                      <div className="quantity-controls-wrapper">
                        <button
                          onClick={() => decreaseItem(item)}
                          aria-label={t('cart.quantityDecrease')}
                          className="qty-btn"
                        >
                          -
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item)}
                          disabled={cannotIncrease}
                          aria-label={t('cart.quantityIncrease')}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>

                      <div className="price-display">
                        <span className="unit-price">{unitPrice.toFixed(2)}€</span>
                        <span className="total-price">{(unitPrice * item.quantity).toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item)}
                    className="btn-remove-desktop"
                    aria-label={t('cart.remove')}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-features">
            <Link to="/client#faq" className="feature-item">
              <Truck size={24} />
              <div>
                <h4>{t('cart.shipping.title', 'Livraison rapide')}</h4>
                <p>{t('cart.shipping.desc', 'Expédition sous 24-48h')}</p>
              </div>
            </Link>
            <Link to="/client#faq" className="feature-item">
              <ShieldCheck size={24} />
              <div>
                <h4>{t('cart.secure.title', 'Paiement sécurisé')}</h4>
                <p>{t('cart.secure.desc', 'Transactions chiffrées SSL')}</p>
              </div>
            </Link>
          </div>
        </div>

        <aside className="cart-summary-section">
          <div className="summary-card">
            <h2>{t('cart.summaryTitle', 'Récapitulatif')}</h2>

            <div className="summary-row">
              <span>{t('cart.subtotal', 'Sous-total')}</span>
              <span>{calculateTotal().toFixed(2)}€</span>
            </div>

            <div className="summary-row shipping">
              <span>{t('cart.shippingLabel', 'Livraison')}</span>
              <span>{t('cart.shippingCalculated', 'Calculé à l\'étape suivante')}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>{t('cart.totalLabel', 'Total')}</span>
              <span className="total-amount">{calculateTotal().toFixed(2)}€</span>
            </div>

            {session ? (
              <Link to="/checkout" className="btn-checkout">
                <span>{t('cart.checkout')}</span>
                <ArrowRight size={20} />
              </Link>
            ) : (
              <div className="auth-prompt">
                <p>{t('cart.loginPrompt')}</p>
                <Link to="/login" className="btn-secondary">
                  {t('cart.login')}
                </Link>
              </div>
            )}

            <Link to="/items" className="continue-shopping-link">
              {t('cart.continueShopping', 'Continuer mes achats')}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
