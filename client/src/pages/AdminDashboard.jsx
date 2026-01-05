import { ErrorMessage, LoadingMessage } from '@/components/StatusMessage';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Link } from 'react-router-dom';
import { ShoppingBasket, Package, Users, Palette, FolderKanban, Target, Euro, ShoppingCart, BarChart3, Clock } from 'lucide-react';
import '../styles/Admin.css';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const shortcuts = [
    { to: '/admin/products', title: t('admin.dashboard.shortcuts.products.title'), desc: t('admin.dashboard.shortcuts.products.desc'), icon: <ShoppingBasket size={24} /> },
    { to: '/admin/orders', title: t('admin.dashboard.shortcuts.orders.title'), desc: t('admin.dashboard.shortcuts.orders.desc'), icon: <Package size={24} /> },
    { to: '/admin/users', title: t('admin.dashboard.shortcuts.users.title'), desc: t('admin.dashboard.shortcuts.users.desc'), icon: <Users size={24} /> },
    { to: '/admin/colors', title: t('admin.dashboard.shortcuts.colors.title'), desc: t('admin.dashboard.shortcuts.colors.desc'), icon: <Palette size={24} /> },
    { to: '/admin/categories', title: t('admin.dashboard.shortcuts.categories.title'), desc: t('admin.dashboard.shortcuts.categories.desc'), icon: <FolderKanban size={24} /> },
    { to: '/admin/variants', title: t('admin.dashboard.shortcuts.variants.title'), desc: t('admin.dashboard.shortcuts.variants.desc'), icon: <Target size={24} /> },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.dashboard.eyebrow')}</span>
          <h1>{t('admin.dashboard.title')}</h1>
          <p className="admin-subtitle">
            {t('admin.dashboard.subtitle')}
          </p>
        </div>
      </div>

      <section className="section">
        {isLoading && <LoadingMessage message={t('admin.dashboard.loading')} />}
        {stats.error && !isLoading && <ErrorMessage title={t('status.error')} message={stats.error} />}

        {!isLoading && !stats.error && (
          <div className="dashboard-widgets">
            <Widget
              title={t('admin.dashboard.widgets.revenue')}
              value={stats.revenue}
              delta={stats.revenueDeltaPct ? `${stats.revenueDeltaPct > 0 ? '+' : ''}${stats.revenueDeltaPct}%` : null}
              deltaType={stats.revenueDeltaPct > 0 ? 'positive' : 'negative'}
              icon={<Euro size={20} />}
            />
            <Widget
              title={t('admin.dashboard.widgets.orders')}
              value={stats.orders}
              delta={stats.ordersDeltaPct ? `${stats.ordersDeltaPct > 0 ? '+' : ''}${stats.ordersDeltaPct}%` : null}
              deltaType={stats.ordersDeltaPct > 0 ? 'positive' : 'negative'}
              icon={<ShoppingCart size={20} />}
            />
            <Widget
              title={t('admin.dashboard.widgets.avgOrder')}
              value={stats.avgOrder}
              icon={<BarChart3 size={20} />}
            />
            <Widget
              title={t('admin.dashboard.widgets.pending')}
              value={stats.pendingOrders}
              delta={stats.pendingOrders > 0 ? t('admin.dashboard.widgets.pendingDelta', { count: stats.pendingOrders }) : t('admin.dashboard.widgets.pendingDone')}
              deltaType={stats.pendingOrders > 0 ? 'negative' : 'positive'}
              icon={<Clock size={20} />}
            />
          </div>
        )}

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontFamily: 'Cormorant Garamond, serif' }}>{t('admin.dashboard.quickAccess')}</h2>
        <div className="admin-shortcuts">
          {shortcuts.map(card => (
            <Link key={card.to} to={card.to} className="shortcut-card">
              <span className="shortcut-icon" aria-hidden="true">{card.icon}</span>
              <div>
                <p className="shortcut-title">{card.title}</p>
                <p className="shortcut-desc">{card.desc}</p>
                <span className="shortcut-cta">{t('admin.dashboard.manageCta')}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
