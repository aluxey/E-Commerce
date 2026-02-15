import { useState } from 'react';
import { PaymentElement, AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOCUMENTS } from '../config/legalDocuments';

const CheckoutForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const defaultCountry = i18n.language === 'fr' ? 'FR' : 'DE';

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
          setMessage(t('checkout.unexpectedError'));
        }
        setMessageType('error');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Paiement réussi
        setMessage(t('checkout.successMessage'));
        setMessageType('success');
        onSuccess?.();

        // Rediriger vers une page de confirmation
        setTimeout(() => {
          const cs = paymentIntent.client_secret;
          navigate(cs ? `/payment-success?payment_intent_client_secret=${cs}` : '/payment-success');
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
      setMessage(t('checkout.paymentError'));
      setMessageType('error');
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
        <h4>{t('checkout.shippingAddress')}</h4>
        <AddressElement
          options={{
            mode: 'shipping',
            defaultCountry,
          }}
        />
      </div>

      {/* Informations de paiement */}
      <div className="payment-section">
        <h4>{t('checkout.paymentInfo')}</h4>
        <PaymentElement id="payment-element" options={paymentElementOptions} />
      </div>

      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="pay-button"
        type="submit"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : t('checkout.payNow')}
        </span>
      </button>

      <div className="checkout-legal" role="note" aria-label={t('checkout.legalLinksLabel')}>
        <p>{t('checkout.legalPrefix')}</p>
        <div className="checkout-legal-links">
          {LEGAL_DOCUMENTS.map((document, index) => (
            <span key={document.id}>
              {index > 0 ? <span className="checkout-legal-separator" aria-hidden="true">•</span> : null}
              <Link to={document.path}>{t(`footer.${document.footerKey}`)}</Link>
            </span>
          ))}
        </div>
      </div>

      {/* Message d'erreur ou de succès */}
      {message && (
        <div
          id="payment-message"
          className={`payment-message ${messageType === 'success' ? 'success' : 'error'}`}
        >
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckoutForm;
