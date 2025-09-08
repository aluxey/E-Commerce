import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useState, useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext'; // Correction du chemin
import { useAuth } from '../context/AuthContext'; // Correction du chemin
import CheckoutForm from './CheckoutForm';

// Initialize Stripe (utilise ta clé publique)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeCheckout = () => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cart, clearCart } = useContext(CartContext);
  const { userData, session } = useAuth();

  // Calculer le total du panier
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  // Créer le PaymentIntent
  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const total = calculateTotal();

      if (total <= 0) {
        setError('Le panier est vide');
        setLoading(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const minimalCart = cart.map(i => ({ item_id: i.id, quantity: i.quantity, variant_id: i.variant_id }));
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
        throw new Error(errorData.error || 'Erreur lors de la création du paiement');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error('Erreur payment intent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cart.length > 0 && session) {
      // Ajout de la vérification de session
      createPaymentIntent();
    }
  }, [cart, session]); // Ajout de session dans les dépendances

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#b56730',
      colorBackground: '#e5ddc7',
      colorText: '#2d2d2d',
      colorDanger: '#df1b41',
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
        <p>Préparation du paiement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stripe-error">
        <p>Erreur: {error}</p>
        <button onClick={createPaymentIntent} className="retry-btn">
          Réessayer
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="stripe-waiting">
        <div className="loading-spinner"></div>
        <p>Initialisation du paiement...</p>
      </div>
    );
  }

  return (
    <div className="stripe-checkout">
      <h2>Finaliser votre commande</h2>

      {/* Résumé de la commande */}
      <div className="order-summary">
        <h3>Résumé de votre commande</h3>
        {cart.map(item => (
          <div key={item.id} className="order-item">
            <span className="item-name">{item.name}</span>
            <span className="item-quantity">{item.quantity}x</span>
            <span className="item-total">{(item.price * item.quantity).toFixed(2)}€</span>
          </div>
        ))}
        <div className="order-total">
          <strong>Total: {calculateTotal().toFixed(2)}€</strong>
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
