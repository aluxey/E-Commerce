import { ArrowLeft, CreditCard, ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContextObject';

import '../styles/Stripe.css';

const SUMUP_LINK = 'https://pay.sumup.com/b2c/Q3U6OT1W';

const StripeCheckout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { session, userData } = useAuth();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.unit_price) || 0) * item.quantity, 0);
  }, [cart]);

  const createOrderAndRedirect = useCallback(async () => {
    setSubmitting(true);
    setInfo(null);
    setError(null);

    try {
      const rawApiUrl =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_URL_PROD ||
        import.meta.env.VITE_API_URL_LOCAL ||
        'http://localhost:3000';
      const apiUrl = rawApiUrl
        .replace(/\/api\/(health)?\/?$/i, '')
        .replace(/\/$/, '');

      const minimalCart = cart.map(i => ({
        item_id: i.itemId || i.id,
        quantity: i.quantity,
        variant_id: i.variant_id ?? i.variantId,
        customization: i.customization || {},
      }));

      const response = await fetch(`${apiUrl}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          currency: 'eur',
          cartItems: minimalCart,
          customerEmail: userData?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('checkout.paymentError'));
      }

      const data = await response.json();
      setInfo(t('payment.orderCreated', { id: data.orderId }));
      clearCart();

      window.open(SUMUP_LINK, '_blank', 'noopener');
    } catch (e) {
      console.error('SumUp create order error:', e);
      setError(e.message || t('checkout.paymentError'));
    } finally {
      setSubmitting(false);
    }
  }, [cart, clearCart, session?.access_token, t, userData?.email]);

  if (cart.length === 0) {
    return (
      <div className="checkout-empty-state">
        <p>{t('cart.emptyTitle')}</p>
        <Link to="/items" className="btn-secondary">{t('cart.emptyCta')}</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-header">
        <Link to="/cart" className="back-link">
          <ArrowLeft size={20} />
          {t('payment.backToCart', 'Retour au panier')}
        </Link>
        <h1>{t('stripe.title', 'Paiement')}</h1>
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          <div className="payment-method-card">
            <div className="card-header">
              <CreditCard size={24} className="icon-accent" />
              <h2>{t('payment.methodTitle', 'Moyen de paiement')}</h2>
            </div>

            <div className="sumup-section">
              <div className="sumup-info-box">
                <p className="payment-description">
                  {t('payment.sumupInfo', 'Vous allez être redirigé vers SumUp, notre partenaire de paiement sécurisé, pour finaliser votre commande.')}
                </p>

                <div className="secure-badges">
                  <Link to="/client#faq" className="badge">
                    <Lock size={16} />
                    {t('payment.secure', 'Paiement sécurisé')}
                  </Link>
                  <Link to="/client#faq" className="badge">
                    <ShieldCheck size={16} />
                    {t('payment.encrypted', 'Données chiffrées')}
                  </Link>
                </div>
              </div>

              <button
                type="button"
                className="btn-pay-sumup"
                onClick={createOrderAndRedirect}
                disabled={submitting}
              >
                <span>{submitting ? t('payment.verifying', 'Préparation...') : t('payment.sumupPay', 'Payer avec SumUp')}</span>
                {!submitting && <ExternalLink size={20} />}
              </button>

              <p className="sumup-note">
                {t('payment.sumupReturn', 'Une fois le paiement effectué, vous pourrez revenir sur le site.')}
              </p>

              {info && <div className="payment-info success">{info}</div>}
              {error && <div className="payment-info error">{error}</div>}
            </div>
          </div>
        </div>

        <div className="checkout-sidebar">
          <div className="order-summary-card">
            <h3>{t('stripe.summary', 'Résumé de la commande')}</h3>

            <div className="summary-items">
              {cart.map(item => {
                const unit = Number(item.unit_price) || 0;
                return (
                  <div key={item.variantId} className="summary-item">
                    <div className="item-image-small">
                      <img src={item.image_url} alt={item.name} />
                    </div>
                    <div className="item-details-mini">
                      <span className="name">{item.name}</span>
                      <span className="variant">
                        {item.size && `${item.size} • `}{item.color}
                        {item.hook_type && ` • ${t(`productDetail.hookTypes.${item.hook_type}`)}`}
                      </span>
                      <span className="qty">Qté: {item.quantity}</span>
                    </div>
                    <span className="price">{(unit * item.quantity).toFixed(2)}€</span>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span>Total</span>
              <strong className="total-amount">{total.toFixed(2)}€</strong>
            </div>

            <div className="security-notice">
              <Lock size={14} />
              <small>{t('payment.securityNotice', 'Paiement 100% sécurisé')}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;
