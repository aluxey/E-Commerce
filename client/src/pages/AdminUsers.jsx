import UserManager from '@/components/Admin/UserManager';
import '../styles/Admin.css';

const AdminUsers = () => (
  <div className="admin-page">
    <div className="admin-page__header">
      <div>
        <span className="eyebrow">Accès</span>
        <h1>Utilisateurs</h1>
        <p className="admin-subtitle">Gère les rôles, emails et comptes clients.</p>
      </div>
    </div>
    <div className="admin-card">
      <UserManager />
    </div>
  </div>
);

export default AdminUsers;
