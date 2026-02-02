import { ArrowRight, Quote, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function TestimonialCard({ testimonial }) {
  const { t } = useTranslation();

  const {
    author_name,
    content,
    image_url,
    rating,
    type,
    items
  } = testimonial;

  // Get item details if linked
  const linkedItem = items;
  const itemImage = linkedItem?.item_images?.[0]?.image_url;
  const displayImage = image_url || itemImage;

  // Render star rating
  const renderStars = () => {
    if (!rating) return null;
    return (
      <div className="testimonial-card__rating" aria-label={`${rating} ${t('home.testimonials.outOf')} 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'star-filled' : 'star-empty'}
            fill={star <= rating ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="testimonial-card">
      <div className="testimonial-card__image-container">
        {displayImage ? (
          <img
            src={displayImage}
            alt={author_name}
            className="testimonial-card__image"
            loading="lazy"
          />
        ) : (
          <div className="testimonial-card__image-placeholder">
            <span>{author_name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="testimonial-card__content-container">
        <div className="testimonial-card__header">
          <div className="testimonial-card__meta">
            <div className="testimonial-card__author-info">
              <h4 className="testimonial-card__name">{author_name}</h4>
              {type && type !== 'general' && (
                <span className="testimonial-card__type">
                  {t(`home.testimonials.types.${type}`)}
                </span>
              )}
            </div>
            {renderStars()}
          </div>

          <div className="testimonial-card__icon">
            <Quote size={24} />
          </div>
        </div>

        <div className="testimonial-card__body">
          <p className="testimonial-card__text">"{content}"</p>
        </div>

        {linkedItem && (
          <div className="testimonial-card__footer">
            <Link
              to={`/item/${linkedItem.id}`}
              className="testimonial-card__product-link"
            >
              <span>{t('home.testimonials.viewProduct')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
