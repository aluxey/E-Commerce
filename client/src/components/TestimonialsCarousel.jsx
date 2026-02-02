import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/testimonials.css';
import TestimonialCard from './TestimonialCard';

const AUTOPLAY_INTERVAL = 5000; // 5 seconds

export default function TestimonialsCarousel({ testimonials = [], loading = false }) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const autoplayRef = useRef(null);

  // Number of visible cards based on screen width
  const getVisibleCount = useCallback(() => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1280) return 2; // Increased from 768/1200 to ensure wider cards on laptops
    return 1;
  }, []);

  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  // Update visible count on resize
  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getVisibleCount]);

  const totalSlides = testimonials.length;
  const maxIndex = Math.max(0, totalSlides - visibleCount);

  // Navigate to next slide
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  // Navigate to previous slide
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Navigate to specific slide
  const goToSlide = useCallback((index) => {
    setCurrentIndex(Math.min(Math.max(0, index), maxIndex));
  }, [maxIndex]);

  // Autoplay logic
  useEffect(() => {
    if (isPaused || totalSlides <= visibleCount) {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
      return;
    }

    autoplayRef.current = setInterval(goToNext, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isPaused, goToNext, totalSlides, visibleCount]);

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  // Don't render if no testimonials and not loading
  if (!loading && testimonials.length === 0) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">{t('home.testimonials.eyebrow')}</span>
              <h2>{t('home.testimonials.title')}</h2>
              <p className="color-text-muted">{t('home.testimonials.subtitle')}</p>
            </div>
          </div>
          <div className="testimonials-carousel testimonials-carousel--loading">
            <div className="testimonials-loading" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[1, 2].map((i) => (
                <div key={i} className="testimonial-card testimonial-card--skeleton" style={{ gridTemplateColumns: '150px 1fr', minHeight: 280, display: 'grid' }}>
                  <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                  <div className="testimonial-card__content-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="skeleton skeleton--text" style={{ width: '50%' }} />
                      <div className="skeleton" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton--text" />
                      <div className="skeleton skeleton--text" />
                      <div className="skeleton skeleton--text skeleton--short" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const showNavigation = totalSlides > visibleCount;

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <div>
            <span className="eyebrow">{t('home.testimonials.eyebrow')}</span>
            <h2>{t('home.testimonials.title')}</h2>
            <p className="color-text-muted">{t('home.testimonials.subtitle')}</p>
          </div>
        </div>

        <div
          className="testimonials-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label={t('home.testimonials.carouselLabel')}
          aria-roledescription="carousel"
        >
          {/* Navigation Arrows */}
          {showNavigation && (
            <>
              <button
                className="testimonials-carousel__nav testimonials-carousel__nav--prev"
                onClick={goToPrev}
                aria-label={t('home.testimonials.prev')}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="testimonials-carousel__nav testimonials-carousel__nav--next"
                onClick={goToNext}
                aria-label={t('home.testimonials.next')}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="testimonials-carousel__viewport">
            <div
              className="testimonials-carousel__track"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
                '--visible-count': visibleCount,
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="testimonials-carousel__slide"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} ${t('home.testimonials.of')} ${totalSlides}`}
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          {showNavigation && (
            <div className="testimonials-carousel__dots" role="tablist">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`testimonials-carousel__dot ${index === currentIndex ? 'testimonials-carousel__dot--active' : ''
                    }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`${t('home.testimonials.goToSlide')} ${index + 1}`}
                  aria-selected={index === currentIndex}
                  role="tab"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
