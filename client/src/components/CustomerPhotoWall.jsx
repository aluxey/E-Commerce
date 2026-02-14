import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/customer-photos.css";

/**
 * Composant mur de photos clients avec grille masonry et lightbox.
 * Utilise en page complete (/photos) et en apercu sur la Home.
 *
 * @param {Object} props
 * @param {Array} props.photos - Liste des photos a afficher
 * @param {boolean} [props.preview] - Mode apercu (limite le nombre de photos)
 * @param {number} [props.previewLimit] - Nombre max en mode apercu
 */
export default function CustomerPhotoWall({ photos = [], preview = false, previewLimit = 8 }) {
  const { t } = useTranslation();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const displayPhotos = preview ? photos.slice(0, previewLimit) : photos;

  // Ouvrir la lightbox
  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  // Fermer la lightbox
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Navigation lightbox
  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : displayPhotos.length - 1));
  }, [displayPhotos.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => (prev < displayPhotos.length - 1 ? prev + 1 : 0));
  }, [displayPhotos.length]);

  // Gestion clavier pour la lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, goToPrev, goToNext]);

  if (!displayPhotos.length) {
    return (
      <div className="photo-wall__empty">
        <p>{t("customerPhotos.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="photo-wall__grid">
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-wall__item"
            onClick={() => openLightbox(index)}
            role="button"
            tabIndex={0}
            aria-label={t("customerPhotos.openPhoto")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(index);
              }
            }}
          >
            <img
              src={photo.image_url}
              alt={t("customerPhotos.photoAlt")}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && displayPhotos[lightboxIndex] && (
        <div
          className="photo-lightbox"
          onClick={closeLightbox}
          role="dialog"
          aria-label={t("customerPhotos.lightboxLabel")}
        >
          <div className="photo-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <button
              className="photo-lightbox__close"
              onClick={closeLightbox}
              aria-label={t("customerPhotos.close")}
            >
              <X size={28} />
            </button>

            {displayPhotos.length > 1 && (
              <button
                className="photo-lightbox__nav photo-lightbox__nav--prev"
                onClick={goToPrev}
                aria-label={t("customerPhotos.prev")}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              src={displayPhotos[lightboxIndex].image_url}
              alt={t("customerPhotos.photoAlt")}
            />

            {displayPhotos.length > 1 && (
              <button
                className="photo-lightbox__nav photo-lightbox__nav--next"
                onClick={goToNext}
                aria-label={t("customerPhotos.next")}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
