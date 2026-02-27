import VariantManager from '@/components/Admin/VariantManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminVariants = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.variants.eyebrow')}</span>
          <h1>{t('admin.variants.title')}</h1>
          <p className="admin-subtitle">{t('admin.variants.subtitle')}</p>
        </div>
      </div>
      <div className="admin-card">
        <VariantManager />
      </div>
    </div>
  );
};

export default AdminVariants;
