import PrivateRoute from '@/components/PrivateRoute';
// Remplacé: ancien DashboardStats -> widgets locaux
import ProductManager from '@/components/Admin/ProductManager';
import VariantManager from '@/components/Admin/VariantManager';
import CategoryManager from '@/components/Admin/CategoryManager';
import OrderManager from '@/components/Admin/OrderManager';
import UserManager from '@/components/Admin/UserManager';
import { useAdminStats } from '@/hooks/useAdminStats';
import '../styles/Admin.css';

/* Widget KPI minimal (aucune dépendance, accessible) */
const Widget = ({ title, value, delta, deltaType = 'neutral', progress, icon = '📈' }) => (
  <div className="widget" role="group" aria-label={title}>
    <div className="widget-header">
      <span className="widget-title">{title}</span>
      <div className="widget-icon" aria-hidden="true">
        {icon}
      </div>
    </div>

    <div className="widget-value">{value}</div>

    {delta && (
      <div className={`widget-delta ${deltaType}`}>
        <span className="marker" aria-hidden="true"></span>
        {delta}
      </div>
    )}

    {typeof progress === 'number' && (
      <div className="widget-progress" aria-label="progression">
        <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    )}
  </div>
);

const AdminPage = () => {
  const stats = useAdminStats();
  const isLoading = stats.loading;

  return (
    <PrivateRoute role="admin">
      <main className="admin-container">
        <h1>Panneau d’administration</h1>
        <p className="admin-subtitle">
          Suivi des indicateurs et gestion du catalogue, des commandes et des utilisateurs.
        </p>

        {/* DASHBOARD — Widgets KPI */}
        <section aria-labelledby="stats-heading" className="dashboard-widgets">
          <h2 id="stats-heading" className="sr-only">
            Indicateurs clés
          </h2>
          <Widget
            title="Revenus (30 j)"
            value={isLoading ? '...' : stats.revenue}
            delta={
              isLoading || stats.revenueDeltaPct === null
                ? null
                : `${(stats.revenueDeltaPct > 0 ? '+' : '')}${stats.revenueDeltaPct.toFixed(1)} %`
            }
            deltaType={stats.revenueDeltaPct > 0 ? 'positive' : stats.revenueDeltaPct < 0 ? 'negative' : 'neutral'}
            icon="💶"
          />
          <Widget
            title="Commandes (30 j)"
            value={isLoading ? '...' : String(stats.orders)}
            delta={
              isLoading || stats.ordersDeltaPct === null
                ? null
                : `${(stats.ordersDeltaPct > 0 ? '+' : '')}${stats.ordersDeltaPct.toFixed(1)} %`
            }
            deltaType={stats.ordersDeltaPct > 0 ? 'positive' : stats.ordersDeltaPct < 0 ? 'negative' : 'neutral'}
            icon="🛒"
          />
          <Widget
            title="Panier moyen (30 j)"
            value={isLoading ? '...' : stats.avgOrder}
            icon="📊"
          />
          <Widget
            title="Commandes en attente"
            value={isLoading ? '...' : String(stats.pendingOrders)}
            icon="⏳"
          />
        </section>

        {/* PRODUITS */}
        <section aria-labelledby="products-heading" className="section section--products">
          <div className="section-header">
            <h2 id="products-heading" className="section-title">Produits</h2>
          </div>
          <ProductManager />
        </section>

        {/* VARIANTES */}
        <section aria-labelledby="variants-heading" className="section section--variants">
          <div className="section-header">
            <h2 id="variants-heading" className="section-title">Variantes</h2>
          </div>
          <VariantManager />
        </section>

        {/* CATÉGORIES */}
        <section aria-labelledby="categories-heading" className="section section--categories">
          <div className="section-header">
            <h2 id="categories-heading" className="section-title">Catégories</h2>
          </div>
          <CategoryManager />
        </section>

        {/* COMMANDES */}
        <section aria-labelledby="orders-heading" className="section section--orders">
          <div className="section-header">
            <h2 id="orders-heading" className="section-title">Commandes</h2>
          </div>
          <OrderManager />
        </section>

        {/* UTILISATEURS */}
        <section aria-labelledby="users-heading" className="section section--users">
          <div className="section-header">
            <h2 id="users-heading" className="section-title">Utilisateurs</h2>
          </div>
          <UserManager />
        </section>
      </main>
    </PrivateRoute>
  );
};

export default AdminPage;
