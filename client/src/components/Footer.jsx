import { useTranslation } from "react-i18next";
import '../styles/footer.css';

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
              <a href="/collections">{t('footer.collections')}</a>
            </li>
            <li>
              <a href="/nouveautes">{t('footer.new')}</a>
            </li>
            <li>
              <a href="/meilleures-ventes">{t('footer.best')}</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('footer.about')}</h4>
          <ul>
            <li>
              <a href="/qui-sommes-nous">{t('footer.who')}</a>
            </li>
            <li>
              <a href="/notre-histoire">{t('footer.story')}</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('footer.support')}</h4>
          <ul>
            <li>
              <a href="/faq">{t('footer.faq')}</a>
            </li>
            <li>
              <a href="/livraison-retours">{t('footer.shipping')}</a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('footer.contact')}</h4>
          <ul>
            <li>
              <a href="mailto:sabbelshandmade@gmail.com">sabbelshandmade@gmail.com</a>
            </li>
            <li>
              <a href="tel:+33123456789">+33 1 23 45 67 89</a>
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
            @sabbels_handmade
          </a>
        </div>
      </div>

      <div className="footer-social" aria-label={t('footer.socialLabel')}>
        <a href="#" aria-label={`${t('footer.socialLabel')} - Facebook`} className="social-icon" target="_blank" rel="noreferrer">
          <svg width="24" height="24">
            <title>Facebook</title>
          </svg>
        </a>
        <a href="#" aria-label={`${t('footer.socialLabel')} - Instagram`} className="social-icon" target="_blank" rel="noreferrer">
          <svg width="24" height="24">
            <title>Instagram</title>
          </svg>
        </a>
        <a href="#" aria-label={`${t('footer.socialLabel')} - Pinterest`} className="social-icon" target="_blank" rel="noreferrer">
          <svg width="24" height="24">
            <title>Pinterest</title>
          </svg>
        </a>
      </div>

      <div className="footer-bottom">
        <p>© {year} Sabbels Handmade. {t('footer.copyright')}</p>
        <p>
          <a href="/cgv">{t('footer.terms')}</a> • <a href="/politique-confidentialite">{t('footer.privacy')}</a> •{' '}
          <a href="/mentions-legales">{t('footer.imprint')}</a>
        </p>
      </div>
    </footer>
  );
}
