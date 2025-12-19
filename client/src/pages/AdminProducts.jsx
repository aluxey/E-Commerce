import ProductManager from '@/components/Admin/ProductManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminProducts = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.products.eyebrow', 'Catalogue')}</span>
          <h1>{t('admin.products.title', 'Produits')}</h1>
          <p className="admin-subtitle">
            {t('admin.products.subtitle', 'Gérez votre catalogue de produits avec un assistant de création simplifié.')}
          </p>
        </div>
      </div>
      <div className="admin-card">
        <ProductManager />
      </div>
    </div>
  );
};

export default AdminProducts;
