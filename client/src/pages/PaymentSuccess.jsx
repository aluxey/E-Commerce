import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const stripe = useStripe();
  const [status, setStatus] = useState('loading');
  const [paymentIntent, setPaymentIntent] = useState(null);

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = searchParams.get('payment_intent_client_secret');

    if (!clientSecret) {
      setStatus('error');
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      setPaymentIntent(paymentIntent);

      switch (paymentIntent.status) {
        case 'succeeded':
          setStatus('succeeded');
          break;
        case 'processing':
          setStatus('processing');
          break;
        case 'requires_payment_method':
          setStatus('requires_payment_method');
          break;
        default:
          setStatus('error');
          break;
      }
    });
  }, [stripe, searchParams]);

  if (status === 'loading') {
    return (
      <div className="payment-status loading">
        <div className="loading-spinner"></div>
        <p>Vérification du paiement...</p>
      </div>
    );
  }

  if (status === 'succeeded') {
    return (
      <div className="payment-status success">
        <div className="success-icon">✅</div>
        <h1>Paiement réussi !</h1>
        <p>Merci pour votre commande. Vous recevrez bientôt un email de confirmation.</p>
        <p className="transaction-id">Numéro de transaction : {paymentIntent?.id}</p>
        <Link to="/client" className="btn-return">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="payment-status processing">
        <div className="processing-icon">⏳</div>
        <h1>Paiement en cours</h1>
        <p>
          Votre paiement est en cours de traitement. Nous vous enverrons un email de confirmation
          une fois terminé.
        </p>
        <Link to="/client" className="btn-return">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="payment-status error">
      <div className="error-icon">❌</div>
      <h1>Erreur de paiement</h1>
      <p>Une erreur est survenue lors du paiement. Veuillez réessayer.</p>
      <Link to="/cart" className="btn-return">
        Retour au panier
      </Link>
    </div>
  );
};

export default PaymentSuccess;
