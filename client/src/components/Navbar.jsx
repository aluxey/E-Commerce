import { useContext } from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, login, logout } = useAuth();
  console.log("user in navbar:", user);
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">Accueil</Link>
        {user && (
          <>
            <Link to="/shop">Produits</Link>
            <Link to="/cart">Panier</Link>
            <Link to="/orders">Commandes</Link>
          </>
        )}
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <span>Bonjour {user.username}</span>
            <button onClick={logout}>Déconnexion</button>
          </>
        ) : (
          <Link to="/login">Se connecter</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
