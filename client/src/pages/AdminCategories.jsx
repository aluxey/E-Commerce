import CategoryManager from '@/components/Admin/CategoryManager';
import '../styles/Admin.css';

const AdminCategories = () => (
  <div className="admin-page">
    <div className="admin-page__header">
      <div>
        <span className="eyebrow">Structure</span>
        <h1>Catégories</h1>
        <p className="admin-subtitle">Organise le catalogue pour guider les clients.</p>
      </div>
    </div>
    <div className="admin-card">
      <CategoryManager />
    </div>
  </div>
);

export default AdminCategories;
