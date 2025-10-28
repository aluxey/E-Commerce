import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

import logo from '../assets/logo.jpg';

const Navbar = () => {
  const { session, userData } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    closeMenu();
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate({ pathname: "/items", search: q ? `?search=${encodeURIComponent(q)}` : "" });
    closeMenu();
  };

  const handleNavLinkClick = () => {
    closeMenu();
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="navbar-left">
          <img src={logo} className="logoNav" alt="Logo Sabbels Handmade" />
          <Link
            to="/"
            className="navbar-link navbar-brand navbar-logo"
            aria-label="Accueil Sabbels Handmade"
            onClick={handleNavLinkClick}
          >
            Sabbels Handmade
          </Link>
        </div>
        <button
          type="button"
          className={`navbar-toggle${isMenuOpen ? ' active' : ''}`}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
          <span className="visually-hidden">Menu</span>
        </button>
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

      <div className={`navbar-nav${isMenuOpen ? ' active' : ''}`} id="primary-navigation">
        <Link to="/items" className="navbar-link" onClick={handleNavLinkClick}>
          Alle Produkte
        </Link>
        <a
          href="mailto:contact@sabbels-handmade.com?subject=Feedback%20ou%20Demande"
          className="navbar-link"
          onClick={handleNavLinkClick}
        >
          Feedbacks
        </a>
        <Link to="/cart" className="navbar-link" onClick={handleNavLinkClick}>
          Einkaufswagen
        </Link>
        {!session && (
          <Link to="/login" className="btn-login" onClick={handleNavLinkClick}>
            Login
          </Link>
        )}
        {!session && (
          <Link to="/signup" className="btn-login" onClick={handleNavLinkClick}>
            Sign in
          </Link>
        )}
        {session && (
          <>
            <Link
              to="/profile"
              className="navbar-link navbar-user"
              title={userData?.email || 'Profil'}
              onClick={handleNavLinkClick}
            >
              {userData?.username || userData?.email || 'Profil'}
            </Link>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
