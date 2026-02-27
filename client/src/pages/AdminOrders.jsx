import OrderManager from '@/components/Admin/OrderManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminOrders = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.orders.eyebrow')}</span>
          <h1>{t('admin.orders.title')}</h1>
          <p className="admin-subtitle">{t('admin.orders.subtitle')}</p>
        </div>
      </div>
      <div className="admin-card">
        <OrderManager />
      </div>
    </div>
  );
};

export default AdminOrders;
