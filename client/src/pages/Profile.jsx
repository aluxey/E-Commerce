import { useAuth } from "../context/AuthContext";

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
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p><strong>Email:</strong> {userData?.email || session.user?.email}</p>
        {userData?.username && <p><strong>Nom d'utilisateur:</strong> {userData.username}</p>}
        {userData?.role && <p><strong>Rôle:</strong> {userData.role}</p>}
      </div>
    </div>
  );
}

