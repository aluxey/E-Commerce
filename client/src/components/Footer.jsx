import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import '../styles/footer.css';
import { LEGAL_DOCUMENTS } from "../config/legalDocuments";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-section">
          <h4>{t('footer.shop')}</h4>
          <ul>
            <li>
              <Link to="/items?sort=name">{t('footer.collections')}</Link>
            </li>
            <li>
              <Link to="/items?sort=newest">{t('footer.new')}</Link>
            </li>
            <li>
              <Link to="/items?sort=top-rated">{t('footer.best')}</Link>
            </li>
            <li>
              <Link to="/photos">{t('footer.gallery')}</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('footer.about')}</h4>
          <ul>
            <li>
              <Link to="/client#about-me">{t('footer.who')}</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('footer.support')}</h4>
          <ul>
            <li>
              <Link to="/client#faq">{t('footer.faq')}</Link>
            </li>
            <li>
              <Link to="/legal/cancellation">{t('footer.shipping')}</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('footer.contact')}</h4>
          <ul>
            <li>
              <a href="mailto:sabbelshandmade@gmail.com">{t('footer.email')}</a>
            </li>
            <li>
              <a href="tel:+491636063872">+49 163 6063872</a>
            </li>
          </ul>
        </div>
        <div className="footer-section footer-instagram">
          <h4>{t('footer.followUs')}</h4>
          <a 
            href="https://instagram.com/sabbels_handmade" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-instagram-link"
          >
            {t('footer.instagramHandle')}
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} {t('nav.brandName')}. {t('footer.copyright')}</p>
        <p className="footer-legal-links">
          {LEGAL_DOCUMENTS.map((document, index) => (
            <span key={document.id}>
              {index > 0 ? <span aria-hidden="true"> • </span> : null}
              <Link to={document.path}>{t(`footer.${document.footerKey}`)}</Link>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
