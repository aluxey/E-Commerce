import TestimonialManager from '@/components/Admin/TestimonialManager';
import { useTranslation } from 'react-i18next';
import '../styles/Admin.css';

const AdminTestimonials = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{t('admin.testimonials.eyebrow', 'Retours clients')}</span>
          <h1>{t('admin.testimonials.title', 'Témoignages')}</h1>
          <p className="admin-subtitle">
            {t('admin.testimonials.subtitle', 'Gérez les avis et témoignages de vos clients.')}
          </p>
        </div>
      </div>
      <div className="admin-card">
        <TestimonialManager />
      </div>
    </div>
  );
};

export default AdminTestimonials;
