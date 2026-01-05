import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { Skeleton } from "./Skeleton";

/* Blur-Up Image Component */
const BlurUpImage = React.forwardRef(
  (
    {
      src,
      alt,
      placeholderSrc,
      className = "",
      width,
      height,
      priority = false,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(placeholderSrc || "");

    useEffect(() => {
      if (priority && src) {
        setCurrentSrc(src);
      }
    }, [priority, src]);

    const handleLoad = event => {
      setIsLoaded(true);
      setHasError(false);
      if (onLoad) {
        onLoad(event);
      }
    };

    const handleError = event => {
      setHasError(true);
      if (onError) {
        onError(event);
      }
    };

    // Intersection Observer for lazy loading
    const imageRef = React.useRef();

    useEffect(() => {
      if (priority) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCurrentSrc(src);
            observer.disconnect();
          }
        },
        {
          rootMargin: "50px",
        }
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => observer.disconnect();
    }, [src, priority]);

    return (
      <div className="blur-up-image-wrapper" ref={ref}>
        <img
          ref={imageRef}
          src={currentSrc}
          alt={alt}
          className={cn(
            "blur-up-image",
            isLoaded ? "blur-up-image-loaded" : "blur-up-image-loading",
            hasError && "blur-up-image-error",
            className
          )}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
        {hasError && (
          <div className="blur-up-image-fallback">
            <span className="blur-up-image-icon">🖼️</span>
            <span className="blur-up-image-text">Failed to load image</span>
          </div>
        )}
      </div>
    );
  }
);

BlurUpImage.displayName = "BlurUpImage";

/* Advanced Skeleton Variants */
const ProductCardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-card-image">
      <Skeleton variant="rectangular" height={200} />
    </div>
    <div className="skeleton-card-content">
      <Skeleton variant="text" lines={2} className="skeleton-card-title" />
      <Skeleton variant="text" width="60%" className="skeleton-card-price" />
      <div className="skeleton-card-actions">
        <Skeleton variant="rectangular" height={36} width={100} />
        <Skeleton variant="circular" size={36} />
      </div>
    </div>
  </div>
);

const ListSkeleton = ({ count = 3 }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="skeleton-list-item">
        <Skeleton variant="circular" size={48} className="skeleton-list-avatar" />
        <div className="skeleton-list-content">
          <Skeleton variant="text" width="40%" className="skeleton-list-title" />
          <Skeleton variant="text" width="70%" className="skeleton-list-description" />
        </div>
        <Skeleton variant="rectangular" height={32} width={80} className="skeleton-list-action" />
      </div>
    ))}
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }, (_, index) => (
        <Skeleton key={index} variant="text" height={20} className="skeleton-table-header-cell" />
      ))}
    </div>
    <div className="skeleton-table-body">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} className="skeleton-table-cell" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="skeleton-form">
    <div className="skeleton-form-field">
      <Skeleton variant="text" width="20%" height={16} className="skeleton-form-label" />
      <Skeleton variant="rectangular" height={44} className="skeleton-form-input" />
    </div>
    <div className="skeleton-form-field">
      <Skeleton variant="text" width="25%" height={16} className="skeleton-form-label" />
      <Skeleton variant="rectangular" height={88} className="skeleton-form-textarea" />
    </div>
    <div className="skeleton-form-field">
      <Skeleton variant="text" width="15%" height={16} className="skeleton-form-label" />
      <div className="skeleton-form-checkboxes">
        <Skeleton variant="rectangular" height={20} width={100} />
        <Skeleton variant="rectangular" height={20} width={120} />
        <Skeleton variant="rectangular" height={20} width={80} />
      </div>
    </div>
    <div className="skeleton-form-actions">
      <Skeleton variant="rectangular" height={44} width={120} className="skeleton-form-button" />
      <Skeleton
        variant="rectangular"
        height={44}
        width={100}
        className="skeleton-form-button-secondary"
      />
    </div>
  </div>
);

/* Loading States */
const LoadingSpinner = ({ size = "md", variant = "primary", className = "" }) => (
  <div
    className={cn(
      "loading-spinner",
      `loading-spinner-${size}`,
      `loading-spinner-${variant}`,
      className
    )}
  >
    <svg
      className="loading-spinner-svg"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="loading-spinner-circle"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="60 60"
      />
    </svg>
  </div>
);

const LoadingDots = ({ text = "Loading", className = "" }) => (
  <div className={cn("loading-dots", className)}>
    <span>{text}</span>
    <div className="loading-dots-container">
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </div>
  </div>
);

const LoadingBar = ({ progress = 0, variant = "primary", showText = true, className = "" }) => (
  <div className={cn("loading-bar", `loading-bar-${variant}`, className)}>
    <div className="loading-bar-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}>
      <div className="loading-bar-shine" />
    </div>
    {showText && <span className="loading-bar-text">{Math.round(progress)}%</span>}
  </div>
);

/* Skeleton Screen Manager */
const SkeletonScreen = ({ loading, children, skeleton, fadeOut = true, className = "" }) => (
  <div className={cn("skeleton-screen", className)}>
    {loading ? (
      <div className={cn("skeleton-screen-content", fadeOut && "skeleton-screen-fade-in")}>
        {skeleton}
      </div>
    ) : (
      <div className={cn("skeleton-screen-content", fadeOut && "skeleton-screen-fade-in")}>
        {children}
      </div>
    )}
  </div>
);

/* Progressive Image Loader */
const ProgressiveImage = ({ src, placeholder, alt, onLoad, onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      if (onLoad) onLoad(img);
    };

    img.onerror = () => {
      setIsLoading(false);
      if (onError) onError(img);
    };
  }, [src, onLoad, onError]);

  return (
    <div className="progressive-image">
      <img
        src={imageSrc}
        alt={alt}
        className={cn("progressive-image-img", isLoading && "progressive-image-loading")}
        {...props}
      />
      {isLoading && (
        <div className="progressive-image-loader">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};

/* Export all loading components */
export {
  BlurUpImage,
  FormSkeleton,
  ListSkeleton,
  LoadingBar,
  LoadingDots,
  LoadingSpinner,
  ProductCardSkeleton,
  ProgressiveImage,
  SkeletonScreen,
  TableSkeleton,
};
