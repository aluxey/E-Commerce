import OrderManager from '@/components/Admin/OrderManager';
import '../styles/Admin.css';

const AdminOrders = () => (
  <div className="admin-page">
    <div className="admin-page__header">
      <div>
        <span className="eyebrow">Logistique</span>
        <h1>Commandes</h1>
        <p className="admin-subtitle">Suivi, préparation et expédition des commandes.</p>
      </div>
    </div>
    <div className="admin-card">
      <OrderManager />
    </div>
  </div>
);

export default AdminOrders;
