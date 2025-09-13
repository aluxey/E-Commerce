import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

const Navbar = () => {
  const { session, userData } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link to="/" className="navbar-link navbar-brand">
          Sabbels Handmade
        </Link>
      </div>
      <div>
        <div className="dropdown">
          <span className="navbar-link">Boutique</span>
          <div className="dropdown-content">
            <Link to="/items?filter=month">Article du mois</Link>
            <Link to="/items?filter=promo">Promotions</Link>
            {categories.map(c => (
              <Link key={c.id} to={`/items?category=${encodeURIComponent(c.name)}`}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
        <Link to="/cart" className="navbar-link">
          Panier
        </Link>
        {userData?.role === "admin" && (
          <Link to="/admin" className="navbar-link">
            Admin
          </Link>
        )}
        {session ? (
          <>
            <span className="navbar-user">{userData?.email || "Connecté"}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-login">
              Login
            </Link>
            <Link to="/signup" className="btn-login">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
