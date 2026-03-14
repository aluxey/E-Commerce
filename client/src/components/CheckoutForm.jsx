import { useState } from 'react';
import { PaymentElement, AddressElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOCUMENTS } from '../config/legalDocuments';
import { useAuth } from '../context/AuthContext';

const CheckoutForm = ({ onSuccess, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { session, userData } = useAuth();

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [isAddressComplete, setIsAddressComplete] = useState(false);
  const defaultCountry = i18n.language === 'fr' ? 'FR' : 'DE';

  const rawApiUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_URL_PROD ||
    import.meta.env.VITE_API_URL_LOCAL ||
    'http://localhost:3000';
  const apiUrl = rawApiUrl
    .replace(/\/api\/(health)?\/?$/i, '')
    .replace(/\/$/, '');

  const normalizeShippingPayload = value => ({
    name: value?.name || '',
    phone: value?.phone || '',
    line1: value?.address?.line1 || '',
    line2: value?.address?.line2 || '',
    city: value?.address?.city || '',
    state: value?.address?.state || '',
    postal_code: value?.address?.postal_code || '',
    country: value?.address?.country || '',
  });

  const persistShippingAddress = async payload => {
    if (!orderId || !session?.access_token) {
      throw new Error(t('checkout.unexpectedError'));
    }

    const response = await fetch(`${apiUrl}/api/orders/${orderId}/shipping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ shippingAddress: payload }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || t('checkout.shippingSaveError'));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }
    if (!orderId) {
      setMessage(t('checkout.paymentSetupError'));
      setMessageType('error');
      return;
    }
    if (!isAddressComplete || !shippingAddress) {
      setMessage(t('checkout.addressRequired'));
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const normalizedShipping = normalizeShippingPayload(shippingAddress);
      await persistShippingAddress(normalizedShipping);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?order_id=${orderId}`,
          receipt_email: userData?.email || undefined,
          shipping: {
            name: normalizedShipping.name,
            phone: normalizedShipping.phone || undefined,
            address: {
              line1: normalizedShipping.line1,
              line2: normalizedShipping.line2 || undefined,
              city: normalizedShipping.city,
              state: normalizedShipping.state || undefined,
              postal_code: normalizedShipping.postal_code,
              country: normalizedShipping.country,
            },
          },
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
          navigate(cs ? `/payment-success?payment_intent_client_secret=${cs}&order_id=${orderId}` : `/payment-success?order_id=${orderId}`);
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
          onChange={event => {
            setShippingAddress(event.value || null);
            setIsAddressComplete(Boolean(event.complete));
            if (event.complete && messageType === 'error') {
              setMessage(null);
              setMessageType(null);
            }
          }}
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

      <div className="checkout-lead-time" role="note" aria-label={t('checkout.leadTime.title')}>
        <span className="checkout-lead-time__badge">{t('checkout.leadTime.badge')}</span>
        <p className="checkout-lead-time__text">{t('checkout.leadTime.text')}</p>
      </div>

      <button
        disabled={isLoading || !stripe || !elements || !orderId}
        id="submit"
        className="pay-button"
        type="submit"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : t('checkout.reviewAndPay')}
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
