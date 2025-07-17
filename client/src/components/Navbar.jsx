import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css"; // Assurez-vous d'avoir ce fichier CSS pour le style

const Navbar = () => {
  const { session, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/client" className="navbar-link navbar-brand">Accueil</Link>
        <Link to="/items" className="navbar-link">Boutique</Link>
        <Link to="/cart" className="navbar-link">Panier</Link>
        {userData?.user_metadata?.role === "admin" && (
          <Link to="/admin" className="navbar-link">Admin</Link>
        )}
      </div>

      <div className="navbar-right">
        {session ? (
          <>
            <span className="navbar-user">
              {userData?.email || "Connecté"}
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-login">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
