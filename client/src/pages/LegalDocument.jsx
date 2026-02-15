import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LEGAL_DOCUMENTS_BY_ID } from '../config/legalDocuments';
import '../styles/legal.css';

const SHOP_PATH = '/items';

export default function LegalDocument({ docId }) {
  const { t } = useTranslation();
  const documentConfig = LEGAL_DOCUMENTS_BY_ID[docId];

  if (!documentConfig) {
    return <Navigate to="/" replace />;
  }

  const title = t(`legal.documents.${docId}.title`);
  const summary = t(`legal.documents.${docId}.summary`);
  const viewerTitle = t('legal.viewerTitle', { title });
  const content = t(`legal.documents.${docId}.content`, { returnObjects: true });
  const paragraphs = Array.isArray(content) ? content : [];

  return (
    <main className="legal-page" aria-labelledby={`legal-title-${docId}`}>
      <section className="legal-hero">
        <p className="legal-badge">{t('legal.badge')}</p>
        <h1 id={`legal-title-${docId}`}>{title}</h1>
        <p className="legal-summary">{summary}</p>

        <div className="legal-actions">
          <a href={documentConfig.pdf} target="_blank" rel="noopener noreferrer" className="legal-action legal-action-primary">
            {t('legal.openPdf')}
          </a>
          <a href={documentConfig.pdf} download className="legal-action legal-action-secondary">
            {t('legal.downloadPdf')}
          </a>
          <Link to={SHOP_PATH} className="legal-action legal-action-link">
            {t('legal.backToShop')}
          </Link>
        </div>

        <p className="legal-mobile-hint">{t('legal.mobileHint')}</p>
      </section>

      <section className="legal-text-card" aria-label={t('legal.textSectionLabel')}>
        <h2>{t('legal.textSectionTitle')}</h2>
        <div className="legal-text-content">
          {paragraphs.map((paragraph, index) => (
            <p key={`${docId}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="legal-viewer-card" aria-label={viewerTitle}>
        <iframe src={documentConfig.pdf} title={viewerTitle} className="legal-viewer" loading="lazy" />
        <p className="legal-fallback">
          {t('legal.fallback')}{' '}
          <a href={documentConfig.pdf} target="_blank" rel="noopener noreferrer">
            {t('legal.openPdf')}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
