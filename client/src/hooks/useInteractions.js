import { useEffect, useMemo, useRef, useState } from "react";

// Intersection Observer Hook for scroll animations
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);

  // Memoize options to avoid re-creating observer on every render
  const memoizedOptions = useMemo(
    () => ({
      threshold: options.threshold ?? 0.1,
      rootMargin: options.rootMargin ?? "50px",
      root: options.root ?? null,
    }),
    [options.threshold, options.rootMargin, options.root]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, memoizedOptions);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, memoizedOptions]);

  return { ref, isIntersecting, hasIntersected };
};

// Magnetic Effect Hook
export const useMagneticEffect = (strength = 0.3) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = e => {
      const { left, top, width, height } = element.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = "translate(0, 0)";
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return ref;
};

// Parallax Effect Hook
export const useParallax = (speed = 0.5) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -speed;
      element.style.transform = `translateY(${rate}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return ref;
};

// Typewriter Effect Hook
export const useTypewriter = (text, speed = 100) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isComplete };
};

// Ripple Effect Hook
export const useRipple = () => {
  const ref = useRef(null);

  const createRipple = event => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple-effect");

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  return { ref, createRipple };
};

// Smooth Scroll Hook
export const useSmoothScroll = () => {
  const scrollTo = (target, options = {}) => {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
      ...options,
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return { scrollTo, scrollToTop, scrollToBottom };
};

// Debounced Resize Hook
export const useDebouncedResize = (callback, delay = 250) => {
  const ref = useRef();

  useEffect(() => {
    const handleResize = () => {
      if (ref.current) {
        clearTimeout(ref.current);
      }
      ref.current = setTimeout(callback, delay);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (ref.current) {
        clearTimeout(ref.current);
      }
    };
  }, [callback, delay]);
};

// Hover State Hook with Delay
export const useHoverDelay = (delayEnter = 0, delayLeave = 300) => {
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (delayEnter === 0) {
      setIsHovering(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsHovering(true);
      }, delayEnter);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, delayLeave);
  };

  return { isHovering, handleMouseEnter, handleMouseLeave };
};

// Spring Animation Hook
export const useSpring = (config = {}) => {
  const [value, setValue] = useState(config.initial || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef();

  const animateTo = target => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = value;
    const change = target - start;
    const duration = config.duration || 300;
    const startTime = performance.now();

    const animate = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Spring easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + change * easeProgress;

      setValue(current);
      setIsAnimating(true);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return { value, animateTo, isAnimating };
};

// Gesture Recognition Hook
export const useGestures = () => {
  const ref = useRef(null);
  const [gesture, setGesture] = useState(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = e => {
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          setGesture(deltaX > 0 ? "swipe-right" : "swipe-left");
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          setGesture(deltaY > 0 ? "swipe-down" : "swipe-up");
        }
      }

      setTimeout(() => setGesture(null), 100);
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return { ref, gesture };
};

// Performance-optimized Animation Hook
export const useOptimizedAnimation = () => {
  const rafId = useRef();
  const callbacks = useRef(new Set());

  const addCallback = callback => {
    callbacks.current.add(callback);
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(animate);
    }
  };

  const removeCallback = callback => {
    callbacks.current.delete(callback);
    if (callbacks.current.size === 0 && rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  const animate = () => {
    callbacks.current.forEach(callback => callback());
    rafId.current = requestAnimationFrame(animate);
  };

  const cleanup = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    callbacks.current.clear();
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return { addCallback, removeCallback };
};
