import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HERO_IMAGES } from "../config/responsiveImages";
import AppImage from "./ui/AppImage";
import "../styles/hero-carousel.css";

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

const getCircularDistance = (from, to, total) => {
  const distance = Math.abs(from - to);
  return Math.min(distance, total - distance);
};

/**
 * HeroCarousel - Desktop only smooth carousel
 * Mobile version is handled separately in MobileHome.jsx
 */
export default function HeroCarousel() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(goToNext, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goToNext]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div
      className="hero-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hero-carousel__track">
        {HERO_IMAGES.map((image, index) => {
          const shouldLoadImage = getCircularDistance(currentIndex, index, HERO_IMAGES.length) <= 1;

          return (
          <div
            key={index}
            className={`hero-carousel__slide ${index === currentIndex ? "hero-carousel__slide--active" : ""}`}
            style={{ transform: `translateX(${(index - currentIndex) * 100}%)` }}
          >
            {shouldLoadImage ? (
              <AppImage
                src={image.src}
                srcSet={image.srcSet}
                width={image.width}
                height={image.height}
                alt={image.alt}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : null}
          </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        onClick={goToPrev}
        aria-label={t("carousel.prevImage")}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="hero-carousel__arrow hero-carousel__arrow--next"
        onClick={goToNext}
        aria-label={t("carousel.nextImage")}
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="hero-carousel__dots">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            className={`hero-carousel__dot ${index === currentIndex ? "hero-carousel__dot--active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={t("carousel.goToImage", { index: index + 1 })}
          />
        ))}
      </div>
    </div>
  );
}
