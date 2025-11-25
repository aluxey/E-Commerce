import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../styles/profile.css";
import { useTranslation } from "react-i18next";

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
          <p className="profile-lead">
            {t('profile.lead')}
          </p>
          <div className="profile-tags">
            {memberSince && <span className="profile-tag">{t('profile.memberSince', { date: memberSince })}</span>}
            {userData?.role && <span className="profile-tag profile-tag--ghost">{t('profile.role', { role: userData.role })}</span>}
          </div>
        </div>
        <div className="profile-hero__cta">
          <Link to="/items" className="btn btn-secondary">{t('profile.shop')}</Link>
          <Link to="/cart" className="btn btn-primary">{t('profile.viewCart')}</Link>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
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

        <div className="profile-card profile-card--accent">
          <h2>{t('profile.actions')}</h2>
          <p className="profile-lead">{t('profile.lead')}</p>
          <div className="profile-actions">
            <Link to="/orders" className="btn btn-primary">{t('profile.orders')}</Link>
            <Link to="/items" className="btn btn-secondary">{t('profile.collection')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
