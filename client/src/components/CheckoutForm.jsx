import { useState } from 'react';
import { PaymentElement, AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

const CheckoutForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message);
        } else {
          setMessage('Une erreur inattendue est survenue.');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Paiement réussi
        setMessage('Paiement réussi ! Redirection...');
        onSuccess?.();

        // Rediriger vers une page de confirmation
        setTimeout(() => {
          const cs = paymentIntent.client_secret;
          navigate(cs ? `/payment-success?payment_intent_client_secret=${cs}` : '/payment-success');
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      setMessage('Une erreur est survenue lors du paiement.');
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: 'tabs',
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="checkout-form">
      {/* Adresse de livraison */}
      <div className="address-section">
        <h4>Adresse de livraison</h4>
        <AddressElement
          options={{
            mode: 'shipping',
            defaultCountry: 'FR',
          }}
        />
      </div>

      {/* Informations de paiement */}
      <div className="payment-section">
        <h4>Informations de paiement</h4>
        <PaymentElement id="payment-element" options={paymentElementOptions} />
      </div>

      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="pay-button"
        type="submit"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : 'Payer maintenant'}
        </span>
      </button>

      {/* Message d'erreur ou de succès */}
      {message && (
        <div
          id="payment-message"
          className={`payment-message ${message.includes('réussi') ? 'success' : 'error'}`}
        >
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;
