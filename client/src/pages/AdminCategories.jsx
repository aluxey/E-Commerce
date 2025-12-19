import CategoryManager from '@/components/Admin/CategoryManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminCategories = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.categories.eyebrow', 'Organisation')}</span>
          <h1>{t('admin.categories.title', 'Catégories')}</h1>
          <p className="admin-subtitle">{t('admin.categories.subtitle', 'Organisez vos produits par catégories et sous-catégories.')}</p>
        </div>
      </div>
      <div className="admin-card">
        <CategoryManager />
      </div>
    </div>
  );
};

export default AdminCategories;
