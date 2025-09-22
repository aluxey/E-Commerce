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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate({ pathname: "/items", search: q ? `?search=${encodeURIComponent(q)}` : "" });
  };

  return (
    <nav className="navbar">
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

      <div className="navbar-nav">
        <Link to="/items" className="navbar-link">
          Alle Produkte
        </Link>
        <a
          href="mailto:contact@sabbels-handmade.com?subject=Feedback%20ou%20Demande"
          className="navbar-link"
        >
          Feedbacks
        </a>
        <Link to="/cart" className="navbar-link">
          Einkaufswagen
        </Link>
        {!session && (
          <Link to="/login" className="btn-login">
            Login
          </Link>
        )}
        {!session && (
          <Link to="/signup" className="btn-login">
            Sign in
          </Link>
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
    </nav>
  );
};

export default Navbar;
