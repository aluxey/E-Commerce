import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-section">
          <h4>Boutique</h4>
          <ul>
            <li>
              <a href="/collections">Collections</a>
            </li>
            <li>
              <a href="/nouveautes">Nouveautés</a>
            </li>
            <li>
              <a href="/meilleures-ventes">Best Sellers</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>À propos</h4>
          <ul>
            <li>
              <a href="/qui-sommes-nous">Qui sommes-nous ?</a>
            </li>
            <li>
              <a href="/notre-histoire">Notre histoire</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/livraison-retours">Livraison &amp; Retours</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="mailto:contact@sabbels-handmade.com">contact@sabbels-handmade.com</a>
            </li>
            <li>
              <a href="tel:+33123456789">+33 1 23 45 67 89</a>
            </li>
          </ul>
        </div>
        <div className="footer-newsletter">
          <h4>Newsletter</h4>
          <form onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Votre e-mail" required />
            <button type="submit">OK</button>
          </form>
        </div>
      </div>

      

      <div className="footer-social">
        <a href="#" aria-label="Facebook" className="social-icon">
          {/* Remplace par tes SVG ou icônes */}
          <svg width="24" height="24">
            {/* … */}
          </svg>
        </a>
        <a href="#" aria-label="Instagram" className="social-icon">
          <svg width="24" height="24">
            {/* … */}
          </svg>
        </a>
        <a href="#" aria-label="Pinterest" className="social-icon">
          <svg width="24" height="24">
            {/* … */}
          </svg>
        </a>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Sabbels Handmade. Tous droits réservés.</p>
        <p>
          <a href="/cgv">CGV</a> • <a href="/politique-confidentialite">Privacy</a> •{' '}
          <a href="/mentions-legales">Mentions légales</a>
        </p>
      </div>
    </footer>
  );
}
