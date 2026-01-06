import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/hero-carousel.css";

// Import carousel images
import mainPic from "../assets/carroussel/mainPic.jpg";
import image1 from "../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.49.jpeg";
import image2 from "../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.50.jpeg";
import image3 from "../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.50 (1).jpeg";
import image4 from "../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.50 (2).jpeg";

const CAROUSEL_IMAGES = [
  { src: mainPic, alt: "Handgemachte Produkte" },
  { src: image1, alt: "Handgemachte Körbe" },
  { src: image2, alt: "Strickarbeiten" },
  { src: image3, alt: "Handgefertigte Accessoires" },
  { src: image4, alt: "Kunsthandwerk" },
];

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

/**
 * HeroCarousel - Desktop only smooth carousel
 * Mobile version is handled separately in MobileHome.jsx
 */
export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
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
        {CAROUSEL_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`hero-carousel__slide ${index === currentIndex ? "hero-carousel__slide--active" : ""}`}
            style={{ transform: `translateX(${(index - currentIndex) * 100}%)` }}
          >
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        className="hero-carousel__arrow hero-carousel__arrow--prev"
        onClick={goToPrev}
        aria-label="Image précédente"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="hero-carousel__arrow hero-carousel__arrow--next"
        onClick={goToNext}
        aria-label="Image suivante"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="hero-carousel__dots">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            className={`hero-carousel__dot ${index === currentIndex ? "hero-carousel__dot--active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Aller à l'image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
