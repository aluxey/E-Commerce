import { useState, useEffect } from "react";

/**
 * Feature flags configuration
 * 
 * MOBILE_HOME_VARIANT controls which homepage layout is shown on mobile (<= 768px):
 * - "A" = Desktop-responsive layout (original, just CSS responsive)
 * - "B" = Mobile-optimized layout (new dedicated mobile component)
 */

export const MOBILE_HOME_VARIANT = "B";

// Breakpoint for mobile detection (matches CSS media queries)
export const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if viewport is mobile
 * Uses matchMedia for performance (doesn't cause re-renders on every resize)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    
    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

/**
 * Determine which home variant to show
 */
export function useHomeVariant() {
  const isMobile = useIsMobile();
  
  if (isMobile && MOBILE_HOME_VARIANT === "B") {
    return "mobile";
  }
  return "desktop";
}
