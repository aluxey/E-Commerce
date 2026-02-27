import UserManager from '@/components/Admin/UserManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminUsers = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.users.eyebrow')}</span>
          <h1>{t('admin.users.title')}</h1>
          <p className="admin-subtitle">{t('admin.users.subtitle')}</p>
        </div>
      </div>
      <div className="admin-card">
        <UserManager />
      </div>
    </div>
  );
};

export default AdminUsers;
