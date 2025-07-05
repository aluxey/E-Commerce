import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/navbar.css';

function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/">Accueil</Link>
      {user ? (
        <>
          <span>Bonjour {user.firstname}</span>
          <button onClick={logout}>Déconnexion</button>
        </>
      ) : (
        <Link to="/login">Se connecter</Link>
      )}
    </nav>
  );
}

export default Navbar;
