import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useState, useEffect, useContext, useCallback } from 'react';
import { CartContext } from '../context/CartContextObject'; // Correction du chemin
import { useAuth } from '../context/AuthContext'; // Correction du chemin
import CheckoutForm from './CheckoutForm';
import { useTranslation } from 'react-i18next';

import '../styles/Stripe.css';
// Initialize Stripe (utilise ta clé publique)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeCheckout = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cart, clearCart } = useContext(CartContext);
  const { userData, session } = useAuth();
  const { t } = useTranslation();

  // Calculer le total du panier
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      return total + (Number(item.unit_price) || 0) * item.quantity;
    }, 0);
  }, [cart]);

  // Créer le PaymentIntent
  const createPaymentIntent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const total = calculateTotal();

      if (total <= 0) {
        setError(t('cart.emptyTitle'));
        setLoading(false);
        return;
      }

      const rawApiUrl =
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_URL_PROD ||
        import.meta.env.VITE_API_URL_LOCAL ||
        'http://localhost:3000';
      const apiUrl = rawApiUrl
        .replace(/\/api\/health\/?$/i, '') // tolère une URL fournie vers /api/health
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
        const errorData = await response.json();
        throw new Error(errorData.error || t('checkout.paymentError'));
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Erreur payment intent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cart, session, t, userData, calculateTotal]);

  useEffect(() => {
    if (cart.length > 0 && session) {
      createPaymentIntent();
    }
  }, [cart.length, session, createPaymentIntent]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#719a99',
      colorBackground: '#fdf0d6',
      colorText: '#2f3a3a',
      colorDanger: '#d46a63',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (loading) {
    return (
      <div className="stripe-loading">
        <div className="loading-spinner"></div>
        <p>{t('stripe.preparing')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stripe-error">
        <p>{t('stripe.error')}: {error}</p>
        <button onClick={createPaymentIntent} className="retry-btn">
          {t('stripe.retry')}
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="stripe-waiting">
        <div className="loading-spinner"></div>
        <p>{t('stripe.initializing')}</p>
      </div>
    );
  }

  return (
    <div className="stripe-checkout">
      <h2>{t('stripe.title')}</h2>

      {/* Résumé de la commande */}
      <div className="order-summary">
        <h3>{t('stripe.summary')}</h3>
        {cart.map(item => {
          const unit = Number(item.unit_price) || 0;
          return (
            <div key={item.variantId} className="order-item">
              <div className="order-item-main">
                <span className="item-name">{item.name}</span>
                <span className="item-variant">
                  {t('stripe.size')}: {item.size || '—'} | {t('stripe.color')}: {item.color || '—'}
                  {item.customization?.hook_type && (
                    <span> | {t('stripe.hookType')}: {t(`productDetail.hookTypes.${item.customization.hook_type}`)}</span>
                  )}
                </span>
              </div>
              <span className="item-quantity">{item.quantity}x</span>
              <span className="item-total">{(unit * item.quantity).toFixed(2)}€</span>
            </div>
          );
        })}
        <div className="order-total">
          <strong>{t('stripe.total', { total: calculateTotal().toFixed(2) })}</strong>
        </div>
      </div>

      {/* Formulaire de paiement Stripe */}
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm onSuccess={() => clearCart()} />
      </Elements>
    </div>
  );
};

export default StripeCheckout;
