import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Profile() {
  const { session, userData } = useAuth();

  if (!session) {
    return (
      <div style={{ maxWidth: 800, margin: '4rem auto', padding: '1rem' }}>
        <h1>Profil</h1>
        <p>Veuillez vous connecter pour accéder à votre profil.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '4rem auto', padding: '1rem' }}>
      <h1>Mon Profil</h1>
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <p><strong>Email:</strong> {userData?.email || session.user?.email}</p>
        {userData?.username && <p><strong>Nom d'utilisateur:</strong> {userData.username}</p>}
        {userData?.role && <p><strong>Rôle:</strong> {userData.role}</p>}
      </div>
      <div style={{ marginTop: 16 }}>
        <Link to="/orders" className="btn btn--primary">Voir mes commandes</Link>
      </div>
    </div>
  );
}
