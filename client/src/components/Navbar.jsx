import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

import logo from '../assets/logo.jpg';

const Navbar = () => {
  const { session, userData } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate({ pathname: "/items", search: q ? `?search=${encodeURIComponent(q)}` : "" });
  };

  const navLinks = useMemo(() => ([
    { type: "link", to: "/items", label: "Alle Produkte" },
    { type: "external", href: "mailto:contact@sabbels-handmade.com?subject=Feedback%20ou%20Demande", label: "Feedbacks" },
    { type: "link", to: "/cart", label: "Einkaufswagen" },
  ]), []);

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-left">
          <img src={logo} className="logoNav" alt="Logo Sabbels Handmade" />
          <Link
            to="/"
            className="navbar-link navbar-brand navbar-logo"
            aria-label="Accueil Sabbels Handmade"
          >
            Sabbels Handmade
          </Link>
        </div>

        <div className="navbar-actions">
          {!session && (
            <>
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/signup" className="btn-signup">
                Sign in
              </Link>
            </>
          )}
          {session && (
            <>
              <Link
                to="/profile"
                className="navbar-link navbar-user"
                title={userData?.email || 'Profil'}
              >
                {userData?.username || userData?.email || 'Profil'}
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <form
        className="navbar-search"
        role="search"
        onSubmit={onSubmitSearch}
        aria-label="Recherche"
      >
        <input
          type="search"
          placeholder="Suche ..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          aria-label="Rechercher"
        />
        <button type="submit" aria-label="Lancer la recherche">
          🔎
        </button>
      </form>

      <div className="navbar-links" id="primary-navigation">
        {navLinks.map(({ type, ...item }) => {
          if (type === "external") {
            return (
              <a
                key={item.label}
                className="navbar-chip"
                href={item.href}
              >
                {item.label}
              </a>
            );
          }
          return (
            <Link
              key={item.label}
              className="navbar-chip"
              to={item.to}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
