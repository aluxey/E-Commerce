import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentIntent, setPaymentIntent] = useState(null);

  useEffect(() => {
    const clientSecret = searchParams.get('payment_intent_client_secret');

    if (!clientSecret) {
      setStatus('error');
      return;
    }

    (async () => {
      try {
        const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) throw new Error('Stripe not initialized');
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
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
      } catch {
        setStatus('error');
      }
    })();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="payment-status loading">
        <div className="loading-spinner"></div>
        <p>Vérification du paiement... / Zahlung wird geprüft...</p>
      </div>
    );
  }

  if (status === 'succeeded') {
    return (
      <div className="payment-status success">
        <div className="success-icon">✅</div>
        <h1>Paiement réussi ! / Zahlung erfolgreich!</h1>
        <p>Merci pour votre commande. Vous recevrez bientôt un email de confirmation. / Vielen Dank für Ihre Bestellung. Eine Bestätigung folgt.</p>
        <p className="transaction-id">Numéro de transaction / Transaktionsnummer : {paymentIntent?.id}</p>
        <Link to="/client" className="btn-return">
          Retour à l'accueil / Zur Startseite
        </Link>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="payment-status processing">
        <div className="processing-icon">⏳</div>
        <h1>Paiement en cours / Zahlung läuft</h1>
        <p>
          Votre paiement est en cours de traitement. Nous vous enverrons un email de confirmation
          une fois terminé. / Zahlung wird verarbeitet. Bestätigung folgt.
        </p>
        <Link to="/client" className="btn-return">
          Retour à l'accueil / Zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="payment-status error">
      <div className="error-icon">❌</div>
      <h1>Erreur de paiement / Zahlungsfehler</h1>
      <p>Une erreur est survenue lors du paiement. Veuillez réessayer. / Ein Fehler ist aufgetreten. Bitte erneut versuchen.</p>
      <Link to="/cart" className="btn-return">
        Retour au panier / Zurück zum Warenkorb
      </Link>
    </div>
  );
};

export default PaymentSuccess;
