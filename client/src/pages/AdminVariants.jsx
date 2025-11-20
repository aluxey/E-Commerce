import VariantManager from '@/components/Admin/VariantManager';
import '../styles/Admin.css';

const AdminVariants = () => (
  <div className="admin-page">
    <div className="admin-page__header">
      <div>
        <span className="eyebrow">Options</span>
        <h1>Variantes</h1>
        <p className="admin-subtitle">Tailles, couleurs et stocks pour chaque produit.</p>
      </div>
    </div>
    <div className="admin-card">
      <VariantManager />
    </div>
  </div>
);

export default AdminVariants;
