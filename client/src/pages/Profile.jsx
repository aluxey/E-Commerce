import { Mail, ShieldCheck, ShoppingBag, User, Clock3, ChevronRight } from 'lucide-react';
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../context/AuthContext";
import "../styles/profile.css";

export default function Profile() {
  const { session, userData } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'de-DE';
  const displayName =
    userData?.full_name ||
    userData?.username ||
    session?.user?.email?.split("@")?.[0] ||
    "Gast";
  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      })
    : null;

  const actions = [
    {
      to: '/orders',
      title: t('profile.orders'),
      desc: t('profile.ordersDesc', 'Suivre mes commandes et leurs statuts'),
      icon: <Clock3 size={18} />,
    },
    {
      to: '/cart',
      title: t('profile.viewCart'),
      desc: t('profile.cartDesc', 'Valider mon panier actuel'),
      icon: <ShoppingBag size={18} />,
    },
    {
      to: '/items',
      title: t('profile.shop'),
      desc: t('profile.shopDesc', 'Découvrir les nouvelles pièces'),
      icon: <ChevronRight size={18} />,
    },
  ];

  if (!session) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--empty">
          <span className="eyebrow">{t('profile.eyebrow')}</span>
          <h1>{t('profile.welcome')}</h1>
          <p className="profile-lead">
            {t('profile.leadLoggedOut')}
          </p>
          <div className="profile-actions">
            <Link to="/login" className="btn btn-primary">{t('profile.login')}</Link>
            <Link to="/signup" className="btn btn-secondary">{t('profile.signup')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__text">
          <span className="eyebrow">{t('profile.eyebrow')}</span>
          <h1>{t('profile.hello', { name: displayName })}</h1>
          <p className="profile-lead">{t('profile.lead')}</p>
          <div className="profile-tags">
            {memberSince && <span className="profile-tag">{t('profile.memberSince', { date: memberSince })}</span>}
            <span className="profile-tag profile-tag--ghost">{t('profile.accountStatus', 'Compte actif')}</span>
          </div>
        </div>
        <div className="profile-hero__cta">
          <Link to="/items" className="btn btn-secondary">{t('profile.shop')}</Link>
          <Link to="/cart" className="btn btn-primary">{t('profile.viewCart')}</Link>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-main">
          <div className="profile-card profile-card--grid">
            <div className="profile-info">
              <div className="profile-info__icon">
                <User size={22} />
              </div>
              <div>
                <p className="profile-info__label">{t('profile.fullName')}</p>
                <p className="profile-info__value">{userData?.full_name || displayName}</p>
              </div>
            </div>

            <div className="profile-info">
              <div className="profile-info__icon">
                <Mail size={22} />
              </div>
              <div>
                <p className="profile-info__label">{t('profile.email')}</p>
                <p className="profile-info__value">{userData?.email || session.user?.email}</p>
              </div>
            </div>

            {memberSince && (
              <div className="profile-info">
                <div className="profile-info__icon">
                  <Clock3 size={22} />
                </div>
                <div>
                  <p className="profile-info__label">{t('profile.memberSinceShort', 'Membre depuis')}</p>
                  <p className="profile-info__value">{memberSince}</p>
                </div>
              </div>
            )}

            {userData?.role && (
              <div className="profile-info">
                <div className="profile-info__icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <p className="profile-info__label">{t('profile.roleLabel')}</p>
                  <p className="profile-info__value">{userData.role}</p>
                </div>
              </div>
            )}
          </div>

          <div className="profile-card">
            <div className="profile-card__header">
              <div>
                <h2>{t('profile.actionsTitle', 'Actions rapides')}</h2>
                <p className="profile-muted">{t('profile.actionsSubtitle', 'Gagne du temps sur les tâches courantes')}</p>
              </div>
            </div>
            <div className="profile-action-list">
              {actions.map(action => (
                <Link key={action.to} to={action.to} className="profile-action">
                  <div className="profile-action__icon">{action.icon}</div>
                  <div className="profile-action__body">
                    <span className="profile-action__title">{action.title}</span>
                    <span className="profile-action__desc">{action.desc}</span>
                  </div>
                  <ChevronRight size={18} className="profile-action__chevron" />
                </Link>
              ))}
            </div>
          </div>

          <div className="profile-card profile-card--two">
            <div className="profile-pane">
              <h3>{t('profile.securityTitle', 'Sécurité du compte')}</h3>
              <p className="profile-muted">{t('profile.securityDesc', 'Authentification sécurisée et données protégées.')}</p>
            </div>
            <div className="profile-pane">
              <h3>{t('profile.supportTitle', 'Aide & support')}</h3>
              <p className="profile-muted">{t('profile.supportDesc', 'Besoin d’aide ? Consulte la FAQ ou contacte-nous.')}</p>
              <div className="profile-support-links">
                <Link to="/orders" className="support-link">{t('profile.orders')}</Link>
                <Link to="/client#faq" className="support-link">FAQ</Link>
                <Link to="/items" className="support-link">{t('profile.collection')}</Link>
              </div>
            </div>
          </div>
        </div>

        <aside className="profile-side">
          <div className="profile-card profile-card--accent">
            <h2>{t('profile.account')}</h2>
            <div className="profile-rows">
              <div className="profile-row">
                <span className="profile-label">{t('profile.email')}</span>
                <span className="profile-value">{userData?.email || session.user?.email}</span>
              </div>
              {userData?.username && (
                <div className="profile-row">
                  <span className="profile-label">{t('profile.username')}</span>
                  <span className="profile-value">{userData.username}</span>
                </div>
              )}
              {userData?.full_name && (
                <div className="profile-row">
                  <span className="profile-label">{t('profile.fullName')}</span>
                  <span className="profile-value">{userData.full_name}</span>
                </div>
              )}
              {userData?.role && (
                <div className="profile-row">
                  <span className="profile-label">{t('profile.roleLabel')}</span>
                  <span className="profile-value">{userData.role}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-card profile-card--highlight">
            <h3>{t('profile.historyTitle', 'Historique de commandes')}</h3>
            <p className="profile-muted">{t('profile.historyDesc', 'Retrouve tes commandes passées et leurs statuts')}</p>
            <Link to="/orders" className="btn btn-primary btn-full">{t('profile.orders')}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
