import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { userData, session } = useAuth();

  return (
    <nav>
      <h1>Mon E-commerce</h1>
      {session && userData && (
        <div>
          Connecté en tant que : <strong>{userData.email}</strong> (<em>{userData.role}</em>)
        </div>
      )}
    </nav>
  );
}
