import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

const Navbar = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link to="/" className="navbar-link navbar-brand navbar-logo">
          Sabbels Handmade
        </Link>
      </div>
      <div className="navbar-nav">
        <Link to="/" className="navbar-link">Accueil</Link>
        <Link to="/items" className="navbar-link">Boutique</Link>
        <Link to="/cart" className="navbar-link">Panier</Link>
        {!session && (
          <Link to="/login" className="btn-login">Login</Link>
        )}
        {session && (
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
