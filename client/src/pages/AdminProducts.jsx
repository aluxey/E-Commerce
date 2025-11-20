import ProductManager from '@/components/Admin/ProductManager';
import '../styles/Admin.css';

const AdminProducts = () => (
  <div className="admin-page">
    <div className="admin-page__header">
      <div>
        <span className="eyebrow">Catalogue</span>
        <h1>Produits</h1>
        <p className="admin-subtitle">Ajoute, mets à jour et organise les fiches produits.</p>
      </div>
      <div className="admin-page__actions">
        <a href="#product-form" className="admin-chip">Aller au formulaire</a>
      </div>
    </div>
    <div className="admin-card" id="product-form">
      <ProductManager />
    </div>
  </div>
);

export default AdminProducts;
