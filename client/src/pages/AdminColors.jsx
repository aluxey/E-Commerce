import ColorManager from '@/components/Admin/ColorManager';
import '../styles/Admin.css';

const AdminColors = () => (
  <div className="admin-page">
    <div className="admin-page__header">
      <div>
        <span className="eyebrow">Palette</span>
        <h1>Couleurs</h1>
        <p className="admin-subtitle">Gestion du référentiel de couleurs affichées sur le site.</p>
      </div>
    </div>
    <div className="admin-card">
      <ColorManager />
    </div>
  </div>
);

export default AdminColors;
