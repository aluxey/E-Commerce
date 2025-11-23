import { ErrorMessage, LoadingMessage } from '@/components/StatusMessage';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Link } from 'react-router-dom';
import '../styles/Admin.css';

/* Widget KPI minimal (aucune dépendance, accessible) */
const Widget = ({ title, value, delta, deltaType = 'neutral', icon }) => {
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
          {delta}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const stats = useAdminStats();
  const isLoading = stats.loading;

  const shortcuts = [
    { to: '/admin/products', title: 'Produits', desc: 'Gérer le catalogue et les stocks', icon: '🧺' },
    { to: '/admin/orders', title: 'Commandes', desc: 'Suivi des expéditions', icon: '📦' },
    { to: '/admin/users', title: 'Clients', desc: 'Base de données utilisateurs', icon: '👥' },
    { to: '/admin/colors', title: 'Couleurs', desc: 'Palette de couleurs', icon: '🎨' },
    { to: '/admin/categories', title: 'Catégories', desc: 'Organisation du site', icon: '🗂️' },
    { to: '/admin/variants', title: 'Variantes', desc: 'Gestion des déclinaisons', icon: '🎯' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Vue d'ensemble</span>
          <h1>Tableau de bord</h1>
          <p className="admin-subtitle">
            Bienvenue sur votre espace d'administration. Voici ce qu'il se passe aujourd'hui.
          </p>
        </div>
      </div>

      <section className="section">
        {isLoading && <LoadingMessage message="Chargement des indicateurs..." />}
        {stats.error && !isLoading && <ErrorMessage title="Erreur" message={stats.error} />}

        {!isLoading && !stats.error && (
          <div className="dashboard-widgets">
            <Widget
              title="Chiffre d'affaires (30j)"
              value={stats.revenue}
              delta={stats.revenueDeltaPct ? `${stats.revenueDeltaPct > 0 ? '+' : ''}${stats.revenueDeltaPct}%` : null}
              deltaType={stats.revenueDeltaPct > 0 ? 'positive' : 'negative'}
              icon="💶"
            />
            <Widget
              title="Commandes (30j)"
              value={stats.orders}
              delta={stats.ordersDeltaPct ? `${stats.ordersDeltaPct > 0 ? '+' : ''}${stats.ordersDeltaPct}%` : null}
              deltaType={stats.ordersDeltaPct > 0 ? 'positive' : 'negative'}
              icon="🛒"
            />
            <Widget
              title="Panier moyen"
              value={stats.avgOrder}
              icon="📊"
            />
            <Widget
              title="À traiter"
              value={stats.pendingOrders}
              delta={stats.pendingOrders > 0 ? `${stats.pendingOrders} en attente` : 'Tout est à jour'}
              deltaType={stats.pendingOrders > 0 ? 'negative' : 'positive'}
              icon="⏳"
            />
          </div>
        )}

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Cormorant Garamond, serif' }}>Accès Rapide</h2>
        <div className="admin-shortcuts">
          {shortcuts.map(card => (
            <Link key={card.to} to={card.to} className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">{card.icon}</span>
              <div>
                <p className="shortcut-title">{card.title}</p>
                <p className="shortcut-desc">{card.desc}</p>
                <span className="shortcut-cta">Gérer →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
