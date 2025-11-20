import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../styles/profile.css";

export default function Profile() {
  const { session, userData } = useAuth();
  const displayName =
    userData?.full_name ||
    userData?.username ||
    session?.user?.email?.split("@")?.[0] ||
    "Gast";
  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      })
    : null;

  if (!session) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--empty">
          <span className="eyebrow">Profil</span>
          <h1>Willkommen bei Sabbels Handmade</h1>
          <p className="profile-lead">
            Melde dich an, um deine Bestellungen zu sehen und Lieblingsstücke zu speichern.
          </p>
          <div className="profile-actions">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/signup" className="btn btn-secondary">Konto erstellen</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__text">
          <span className="eyebrow">Profil</span>
          <h1>Hallo {displayName}</h1>
          <p className="profile-lead">
            Verwalte dein Konto, prüfe Bestellungen und gönn dir neue handgemachte Stücke.
          </p>
          <div className="profile-tags">
            {memberSince && <span className="profile-tag">Mitglied seit {memberSince}</span>}
            {userData?.role && <span className="profile-tag profile-tag--ghost">Rolle: {userData.role}</span>}
          </div>
        </div>
        <div className="profile-hero__cta">
          <Link to="/items" className="btn btn-secondary">Shop entdecken</Link>
          <Link to="/cart" className="btn btn-primary">Warenkorb ansehen</Link>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h2>Kontodaten</h2>
          <div className="profile-rows">
            <div className="profile-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{userData?.email || session.user?.email}</span>
            </div>
            {userData?.username && (
              <div className="profile-row">
                <span className="profile-label">Benutzername</span>
                <span className="profile-value">{userData.username}</span>
              </div>
            )}
            {userData?.full_name && (
              <div className="profile-row">
                <span className="profile-label">Name</span>
                <span className="profile-value">{userData.full_name}</span>
              </div>
            )}
            {userData?.role && (
              <div className="profile-row">
                <span className="profile-label">Rolle</span>
                <span className="profile-value">{userData.role}</span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-card profile-card--accent">
          <h2>Aktionen</h2>
          <p className="profile-lead">Behalte deine Bestellungen im Blick oder stöbere weiter.</p>
          <div className="profile-actions">
            <Link to="/orders" className="btn btn-primary">Meine Bestellungen</Link>
            <Link to="/items" className="btn btn-secondary">Zur Kollektion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
