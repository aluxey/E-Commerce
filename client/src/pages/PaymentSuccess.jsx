import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import '../styles/Stripe.css';

const stripePublicKey =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  '';
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState('loading');
  const [intentId, setIntentId] = useState(null);
  const orderId = searchParams.get('order_id');

  const clientSecret = useMemo(() => {
    const fromStripe = searchParams.get('payment_intent_client_secret');
    const fromLegacy = searchParams.get('client_secret');
    return fromStripe || fromLegacy || '';
  }, [searchParams]);

  const fallbackStatus = useMemo(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus === 'error') return 'error';
    return 'manual';
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const checkPaymentStatus = async () => {
      if (!clientSecret || !stripePromise) {
        setStatus(fallbackStatus);
        return;
      }

      try {
        const stripe = await stripePromise;
        if (!stripe) {
          setStatus(fallbackStatus);
          return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        if (!paymentIntent) {
          setStatus('error');
          return;
        }
        if (cancelled) return;
        setIntentId(paymentIntent.id);

        switch (paymentIntent.status) {
          case 'succeeded':
            setStatus('success');
            break;
          case 'processing':
          case 'requires_capture':
            setStatus('processing');
            break;
          case 'requires_payment_method':
          case 'canceled':
            setStatus('error');
            break;
          default:
            setStatus('manual');
            break;
        }
      } catch (error) {
        console.error('Failed to retrieve payment intent status:', error);
        if (!cancelled) setStatus('error');
      }
    };

    checkPaymentStatus();
    return () => {
      cancelled = true;
    };
  }, [clientSecret, fallbackStatus]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="payment-status loading">
            <div className="loading-spinner" />
            <h1>{t('payment.verifying')}</h1>
            <p>{t('stripe.initializing')}</p>
          </div>
        );
      case 'success':
        return (
          <div className="payment-status success">
            <div className="success-icon">
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>
            <h1>{t('payment.successTitle')}</h1>
            <p>{t('payment.successText')}</p>
            {orderId ? <div className="transaction-id">{t('payment.orderReference', { id: orderId.slice(0, 8) })}</div> : null}
            {intentId ? <div className="transaction-id">{t('payment.transaction', { id: intentId })}</div> : null}
            <Link to="/items" className="btn-return">
              <span>{t('payment.continueShopping')}</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        );
      case 'processing':
        return (
          <div className="payment-status processing">
            <div className="processing-icon">
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>
            <h1>{t('payment.processingTitle')}</h1>
            <p>{t('payment.processingText')}</p>
            <Link to="/orders" className="btn-return">
              <span>{t('orders.title')}</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        );
      case 'manual':
        return (
          <div className="payment-status success">
            <div className="success-icon">
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>
            <h1>{t('payment.manualTitle')}</h1>
            <p>{t('payment.manualText')}</p>
            {orderId ? <div className="transaction-id">{t('payment.orderReference', { id: orderId.slice(0, 8) })}</div> : null}
            <Link to="/items" className="btn-return">
              <span>{t('payment.continueShopping')}</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="payment-status error">
            <div className="error-icon">
              <XCircle size={64} strokeWidth={1.5} />
            </div>
            <h1>{t('payment.errorTitle')}</h1>
            <p>{t('payment.errorText')}</p>
            <Link to="/cart" className="btn-return">
              <ArrowRight size={20} transform="rotate(180)" />
              <span>{t('payment.backToCart')}</span>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="checkout-page-container">
      {renderContent()}
    </div>
  );
};

export default PaymentSuccess;
