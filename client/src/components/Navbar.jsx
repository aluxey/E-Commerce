import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/navbar.css";
import { signOut } from "../services/auth";

const Navbar = () => {
  const { session, userData } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navLinks = useMemo(() => {
    const links = [
      { to: "/", label: "Home" },
      { to: "/items", label: "Shop" },
      { href: "mailto:contact@sabbels-handmade.com", label: "Kontakt" },
    ];
    if (userData?.role === "admin") {
      links.push({ to: "/admin", label: "Admin" });
    }
    return links;
  }, [userData]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const toggleMenu = () => setIsMenuOpen(open => !open);
  const closeMenu = () => setIsMenuOpen(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isActive = path =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__container">
          <Link to="/" className="navbar__brand" onClick={closeMenu}>
            <div className="navbar__logo">
              <img src={logo} alt="Sabbels Handmade" className="navbar__logo-img" />
            </div>
            <div className="navbar__brand-text">
              <span className="navbar__brand-title">Sabbels Handmade</span>
              <span className="navbar__brand-subtitle">Handgestricktes aus Schleswig</span>
            </div>
          </Link>

          <div className={`navbar__links ${isMenuOpen ? 'is-open' : ''}`} id="main-navigation">
            {navLinks.map(link =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`navbar__link ${isActive(link.to) ? 'is-active' : ''}`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="navbar__link"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              )
            )}

            <div className="navbar__mobile-actions">
              {session ? (
                <>
                  <Link to="/profile" className="navbar__pill" onClick={closeMenu}>
                    Mein Profil
                  </Link>
                  <button className="navbar__pill navbar__pill--ghost" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <div className="navbar__pill-group">
                  <Link to="/signup" className="navbar__pill navbar__pill--ghost" onClick={closeMenu}>
                    Inscription
                  </Link>
                  <Link to="/login" className="navbar__pill navbar__pill--primary" onClick={closeMenu}>
                    Login
                  </Link>
                </div>
              )}
              <a className="navbar__mobile-contact" href="mailto:contact@sabbels-handmade.com" onClick={closeMenu}>
                Schreib uns eine Mail
              </a>
            </div>
          </div>

          <div className="navbar__actions">
            <Link to="/items" className="navbar__icon-btn" aria-label="Produkte durchsuchen / Parcourir les produits">
              🔍
            </Link>

            <Link to="/cart" className="navbar__icon-btn navbar__icon-btn--cart" aria-label="Warenkorb / Panier">
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {session ? (
              <div className="navbar__profile">
                <Link to="/profile" className="navbar__pill navbar__pill--ghost" title={userData?.full_name || 'Profil'}>
                  👤 Profil
                </Link>
                <button onClick={handleLogout} className="navbar__pill navbar__pill--ghost">
                  Logout
                </button>
              </div>
            ) : (
              <div className="navbar__profile">
                <Link to="/signup" className="navbar__pill navbar__pill--ghost">
                  Inscription
                </Link>
                <Link to="/login" className="navbar__pill navbar__pill--primary">
                  Login
                </Link>
              </div>
            )}
          </div>

          <button
            className={`navbar__toggle ${isMenuOpen ? 'is-open' : ''}`}
            onClick={toggleMenu}
            aria-label="Navigation öffnen oder schließen"
            aria-expanded={isMenuOpen}
            aria-controls="main-navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
      <div className={`navbar__backdrop ${isMenuOpen ? 'show' : ''}`} onClick={closeMenu} />
    </>
  );
};

export default Navbar;
