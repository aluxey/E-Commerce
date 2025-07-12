import { Link } from "react-router-dom";
import "../styles/navbar.css";
import { useAuth } from "../context/AuthContext";
import { FaShoppingCart } from "react-icons/fa";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">MonShop</Link>
        {user && <Link to="/shop">Produits</Link>}
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/cart" className="cart-link">
              <FaShoppingCart />
              <span className="cart-text">Panier</span>
            </Link>
            <span className="user-text">Bonjour {user.username}</span>
            <button onClick={logout} className="logout-btn">Déconnexion</button>
          </>
        ) : (
          <Link to="/login" className="login-link">Se connecter</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
