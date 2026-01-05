import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentIntent, setPaymentIntent] = useState(null);
  const { t } = useTranslation();

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
        <p>{t('payment.verifying')}</p>
      </div>
    );
  }

  if (status === 'succeeded') {
    return (
      <div className="payment-status success">
        <div className="success-icon"><CheckCircle size={64} /></div>
        <h1>{t('payment.successTitle')}</h1>
        <p>{t('payment.successText')}</p>
        <p className="transaction-id">{t('payment.transaction', { id: paymentIntent?.id })}</p>
        <Link to="/client" className="btn-return">
          {t('payment.backHome')}
        </Link>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="payment-status processing">
        <div className="processing-icon"><Clock size={64} /></div>
        <h1>{t('payment.processingTitle')}</h1>
        <p>{t('payment.processingText')}</p>
        <Link to="/client" className="btn-return">
          {t('payment.backHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="payment-status error">
      <div className="error-icon"><XCircle size={64} /></div>
      <h1>{t('payment.errorTitle')}</h1>
      <p>{t('payment.errorText')}</p>
      <Link to="/cart" className="btn-return">
        {t('payment.backToCart')}
      </Link>
    </div>
  );
};

export default PaymentSuccess;
