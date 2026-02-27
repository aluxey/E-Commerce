import { Search, ShoppingCart, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../hooks/useCart";
import { signOut } from "../services/auth";
import "../styles/navbar.css";

const Navbar = () => {
  const { session, userData } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, i18n } = useTranslation();
  const navLinks = useMemo(() => {
    const links = [
      { to: "/", label: t('nav.home') },
      { to: "/items", label: t('nav.shop') },
      { href: "mailto:sabbelshandmade@gmail.com", label: t('nav.contact') },
    ];
    if (userData?.role === "admin") {
      links.push({ to: "/admin", label: t('nav.admin') });
    }
    return links;
  }, [t, userData]);

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

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const toggleMenu = () => setIsMenuOpen(open => !open);
  const closeMenu = () => setIsMenuOpen(false);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isActive = path =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  const languages = [
    { code: "de", label: "DE", title: t('nav.languageDe') },
    { code: "fr", label: "FR", title: t('nav.languageFr') },
  ];
  const renderLanguageSwitcher = () => (
    <div className="navbar__lang-switch">
      {languages.map(lang => (
        <button
          key={lang.code}
          className={`navbar__pill navbar__pill--ghost ${i18n.language === lang.code ? 'is-active' : ''}`}
          onClick={() => {
            i18n.changeLanguage(lang.code);
            closeMenu();
          }}
          aria-label={`${t('nav.languageLabel')}: ${lang.title}`}
          aria-pressed={i18n.language === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__container">
          <Link to="/" className="navbar__brand" onClick={closeMenu}>
            <div className="navbar__logo">
              <img src={logo} alt={t('nav.brandName')} className="navbar__logo-img" />
            </div>
            <div className="navbar__brand-text">
              <span className="navbar__brand-title">{t('nav.brandName')}</span>
              <span className="navbar__brand-subtitle">{t('nav.brandSubtitle')}</span>
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
                    {t('nav.profile')}
                  </Link>
                  <button className="navbar__pill navbar__pill--ghost" onClick={handleLogout}>
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="navbar__pill-group">
                  <Link to="/signup" className="navbar__pill navbar__pill--ghost" onClick={closeMenu}>
                    {t('nav.signup')}
                  </Link>
                  <Link to="/login" className="navbar__pill navbar__pill--primary" onClick={closeMenu}>
                    {t('nav.login')}
                  </Link>
                </div>
              )}
              <a className="navbar__mobile-contact" href="mailto:sabbelshandmade@gmail.com" onClick={closeMenu}>
                {t('nav.emailUs')}
              </a>
              {renderLanguageSwitcher()}
            </div>
          </div>

          <div className="navbar__actions">
            <Link to="/items" className="navbar__icon-btn" aria-label={t('nav.searchLabel')}>
              <Search size={20} />
            </Link>

            <Link to="/cart" className="navbar__icon-btn navbar__icon-btn--cart" aria-label={t('nav.cartLabel')}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {session ? (
              <div className="navbar__profile">
                <Link to="/profile" className="navbar__pill navbar__pill--ghost" title={userData?.full_name || t('nav.profileTitle')}>
                  <User size={16} /> {t('nav.profile')}
                </Link>
                <button onClick={handleLogout} className="navbar__pill navbar__pill--ghost">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="navbar__profile">
                <Link to="/signup" className="navbar__pill navbar__pill--ghost">
                  {t('nav.signup')}
                </Link>
                <Link to="/login" className="navbar__pill navbar__pill--primary">
                  {t('nav.login')}
                </Link>
              </div>
            )}
            {renderLanguageSwitcher()}
          </div>

          <button
            className={`navbar__toggle ${isMenuOpen ? 'is-open' : ''}`}
            onClick={toggleMenu}
            aria-label={t('nav.menuToggle')}
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
