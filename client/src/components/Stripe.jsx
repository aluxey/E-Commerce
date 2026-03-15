import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import CheckoutForm from './CheckoutForm';
import AppImage from './ui/AppImage';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContextObject';

import '../styles/Stripe.css';

const stripePublicKey =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const StripeCheckout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { session, userData } = useAuth();
  const { t } = useTranslation();
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState(null);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.unit_price) || 0) * item.quantity, 0);
  }, [cart]);

  const createPaymentIntent = useCallback(async () => {
    if (!session?.access_token || cart.length === 0) return;

    setLoadingIntent(true);
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
      if (!data?.clientSecret) {
        throw new Error(t('stripe.error', 'Client secret manquant.'));
      }
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId || null);
    } catch (e) {
      console.error('Stripe checkout init error:', e);
      setError(e.message || t('checkout.paymentError'));
    } finally {
      setLoadingIntent(false);
    }
  }, [cart, session?.access_token, t, userData?.email]);

  useEffect(() => {
    setClientSecret('');
    setOrderId(null);
    if (!cart.length || !session?.access_token) return;
    createPaymentIntent();
  }, [cart, session?.access_token, createPaymentIntent]);

  const handlePaymentSuccess = () => {
    clearCart();
  };

  const elementsOptions = useMemo(() => {
    if (!clientSecret) return null;
    return {
      clientSecret,
      appearance: { theme: 'stripe' },
    };
  }, [clientSecret]);

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
              <div className="payment-info-box">
                <p className="payment-description">
                  {t('stripe.description', 'Paiement sécurisé par Stripe. Votre commande est confirmée dès validation du paiement.')}
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

              {loadingIntent && (
                <div className="payment-info">{t('stripe.preparing', 'Préparation du paiement...')}</div>
              )}
              {!stripePromise && (
                <div className="payment-info error">
                  Clé Stripe manquante (`VITE_STRIPE_PUBLIC_KEY`).
                </div>
              )}
              {error && <div className="payment-info error">{error}</div>}

              {elementsOptions && stripePromise && (
                <div className="stripe-form-wrapper">
                  {orderId ? (
                    <p className="payment-order-reference">{t('payment.orderReference', { id: orderId.slice(0, 8) })}</p>
                  ) : null}
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <CheckoutForm onSuccess={handlePaymentSuccess} orderId={orderId} />
                  </Elements>
                </div>
              )}
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
                      <AppImage src={item.image_url} alt={item.name} sizes="64px" />
                    </div>
                    <div className="item-details-mini">
                      <span className="name">{item.name}</span>
                      <span className="variant">
                        {item.size && `${item.size} • `}{item.color}
                        {item.hook_type && ` • ${t(`productDetail.hookTypes.${item.hook_type}`)}`}
                      </span>
                      <span className="qty">{t('orders.quantity', { count: item.quantity })}</span>
                    </div>
                    <span className="price">{(unit * item.quantity).toFixed(2)}€</span>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span>{t('cart.totalLabel')}</span>
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
