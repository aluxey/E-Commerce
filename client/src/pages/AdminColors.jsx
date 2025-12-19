import ColorManager from '@/components/Admin/ColorManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminColors = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.colors.eyebrow', 'Personnalisation')}</span>
          <h1>{t('admin.colors.title', 'Couleurs')}</h1>
          <p className="admin-subtitle">{t('admin.colors.subtitle', 'Gérez la palette de couleurs disponibles pour vos produits.')}</p>
        </div>
      </div>
      <div className="admin-card">
        <ColorManager />
      </div>
    </div>
  );
};

export default AdminColors;
