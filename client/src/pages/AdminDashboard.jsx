import { Link } from 'react-router-dom';
import { useAdminStats } from '@/hooks/useAdminStats';
import '../styles/Admin.css';

/* Widget KPI minimal (aucune dépendance, accessible) */
const Widget = ({ title, value, delta, deltaType = 'neutral', progress, icon = '📈' }) => {
  const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null;
  return (
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

      {pct !== null && (
        <div className="widget-progress" aria-label="progression">
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const stats = useAdminStats();
  const isLoading = stats.loading;
  const shortcuts = [
    { to: '/admin/products', title: 'Produits', desc: 'Créer et mettre à jour les fiches', icon: '🧺' },
    { to: '/admin/orders', title: 'Commandes', desc: 'Suivre et expédier', icon: '📦' },
    { to: '/admin/users', title: 'Utilisateurs', desc: 'Gérer les rôles et comptes', icon: '👥' },
    { to: '/admin/categories', title: 'Catégories', desc: 'Structurer le catalogue', icon: '🗂️' },
    { to: '/admin/variants', title: 'Variantes', desc: 'Tailles, couleurs et stocks', icon: '🎯' },
  ];

  return (
    <div className="admin-page">
      <header className="admin-hero admin-hero--lite">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Panneau d’administration</h1>
          <p className="admin-subtitle">
            Vue d’ensemble et accès rapide aux espaces de gestion.
          </p>
        </div>
      </header>

      <section aria-labelledby="stats-heading" className="section section--overview">
        <div className="section-header">
          <div>
            <h2 id="stats-heading" className="section-title">Récapitulatif</h2>
            <p className="section-subtitle">Indicateurs clés sur 30 jours.</p>
          </div>
        </div>
        <div className="dashboard-widgets">
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
            title="Panier moyen"
            value={isLoading ? '...' : stats.avgOrder}
            icon="📊"
          />
          <Widget
            title="Commandes en attente"
            value={isLoading ? '...' : String(stats.pendingOrders)}
            icon="⏳"
            delta={stats.pendingOrders > 0 ? 'A traiter' : 'RAS'}
            deltaType={stats.pendingOrders > 0 ? 'negative' : 'positive'}
            progress={stats.pendingOrders > 10 ? 90 : stats.pendingOrders * 8}
          />
        </div>

        <div className="admin-shortcuts">
          {shortcuts.map(card => (
            <Link key={card.to} to={card.to} className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">{card.icon}</span>
              <div>
                <p className="shortcut-title">{card.title}</p>
                <p className="shortcut-desc">{card.desc}</p>
              </div>
              <span className="shortcut-cta">Ouvrir →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
