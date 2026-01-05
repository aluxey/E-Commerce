import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContextObject";

const STORAGE_KEY = "app-theme-preference";

const getPreferredTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const root = document.documentElement;
    const previous = root.dataset.theme;

    root.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);

    return () => {
      if (previous) {
        root.dataset.theme = previous;
      } else {
        delete root.dataset.theme;
      }
    };
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const listener = event => {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      setTheme(event.matches ? "dark" : "light");
    };

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    mediaQuery?.addEventListener("change", listener);

    return () => mediaQuery?.removeEventListener("change", listener);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(current => (current === "light" ? "dark" : "light")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};



