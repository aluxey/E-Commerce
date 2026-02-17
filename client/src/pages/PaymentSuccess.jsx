import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import '../styles/Stripe.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const status = useMemo(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus === 'error') return 'error';
    return 'manual';
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case 'manual':
        // This state is hit when no client_secret is found, e.g. return from SumUp without params
        return (
          <div className="payment-status success">
            <div className="success-icon">
              <CheckCircle size={64} strokeWidth={1.5} />
            </div>
            <h1>{t('payment.manualTitle', 'Commande confirmée')}</h1>
            <p>{t('payment.manualText', 'Votre commande a bien été prise en compte.')}</p>
            <Link to="/items" className="btn-return">
              <span>{t('payment.continueShopping', 'Continuer mes achats')}</span>
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
            <h1>{t('payment.errorTitle', 'Échec du paiement')}</h1>
            <p>{t('payment.errorText', 'Une erreur est survenue lors du paiement. Veuillez réessayer.')}</p>
            <Link to="/cart" className="btn-return">
              <ArrowRight size={20} transform="rotate(180)" />
              <span>{t('payment.backToCart', 'Retour au panier')}</span>
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
