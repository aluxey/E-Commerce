import PrivateRoute from '@/components/PrivateRoute';
// Remplacé: ancien DashboardStats -> widgets locaux
import ProductManager from '@/components/Admin/ProductManager';
import VariantManager from '@/components/Admin/VariantManager';
import CategoryManager from '@/components/Admin/CategoryManager';
import OrderManager from '@/components/Admin/OrderManager';
import UserManager from '@/components/Admin/UserManager';
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
          {/* TODO: remplace par tes données réelles */}
          <Widget
            title="Revenus (30 j)"
            value="12 480 €"
            delta="+8,2 %"
            deltaType="positive"
            progress={62}
            icon="💶"
          />
          <Widget
            title="Commandes"
            value="342"
            delta="+2,1 %"
            deltaType="positive"
            progress={48}
            icon="🛒"
          />
          <Widget
            title="Tickets ouverts"
            value="14"
            delta="-22 %"
            deltaType="negative"
            progress={30}
            icon="🎫"
          />
          <Widget
            title="Conversion"
            value="2,9 %"
            delta="+0,4 pt"
            deltaType="positive"
            progress={29}
            icon="📊"
          />
        </section>

        {/* PRODUITS */}
        <section aria-labelledby="products-heading" className="section section--products">
          <div className="section-header">
            <h2 id="products-heading" className="section-title">
              Produits
            </h2>
            <div className="section-toolbar">
              <div className="toolbar-search">
                <input className="form-control" placeholder="Rechercher un produit…" />
              </div>
              <div className="toolbar-filters">
                <button className="filter-pill is-active">Actifs</button>
                <button className="filter-pill">Brouillons</button>
              </div>
              <div className="btn-group">
                <button className="btn btn-outline">Exporter</button>
                <button className="btn btn-primary">
                  <span className="i">＋</span> Ajouter
                </button>
              </div>
            </div>
          </div>
          <ProductManager />
        </section>

        {/* VARIANTES */}
        <section aria-labelledby="variants-heading" className="section section--variants">
          <div className="section-header">
            <h2 id="variants-heading" className="section-title">
              Variantes
            </h2>
            <div className="btn-group">
              <button className="btn btn-outline">Exporter</button>
              <button className="btn btn-primary">
                <span className="i">＋</span> Nouvelle variante
              </button>
            </div>
          </div>
          <VariantManager />
        </section>

        {/* CATÉGORIES */}
        <section aria-labelledby="categories-heading" className="section section--categories">
          <div className="section-header">
            <h2 id="categories-heading" className="section-title">
              Catégories
            </h2>
            <div className="btn-group">
              <button className="btn btn-outline">Réordonner</button>
              <button className="btn btn-primary">
                <span className="i">＋</span> Nouvelle catégorie
              </button>
            </div>
          </div>
          <CategoryManager />
        </section>

        {/* COMMANDES */}
        <section aria-labelledby="orders-heading" className="section section--orders">
          <div className="section-header">
            <h2 id="orders-heading" className="section-title">
              Commandes
            </h2>
            <div className="section-toolbar">
              <div className="toolbar-filters">
                <button className="filter-pill is-active">En cours</button>
                <button className="filter-pill">Livrées</button>
                <button className="filter-pill">Remboursées</button>
              </div>
              <div className="btn-group">
                <button className="btn btn-outline">Exporter</button>
              </div>
            </div>
          </div>
          <OrderManager />
        </section>

        {/* UTILISATEURS */}
        <section aria-labelledby="users-heading" className="section section--users">
          <div className="section-header">
            <h2 id="users-heading" className="section-title">
              Utilisateurs
            </h2>
            <div className="section-toolbar">
              <div className="toolbar-search">
                <input className="form-control" placeholder="Rechercher un utilisateur…" />
              </div>
              <div className="btn-group">
                <button className="btn btn-outline">Inviter</button>
                <button className="btn btn-primary">
                  <span className="i">＋</span> Nouvel utilisateur
                </button>
              </div>
            </div>
          </div>
          <UserManager />
        </section>
      </main>
    </PrivateRoute>
  );
};

export default AdminPage;
