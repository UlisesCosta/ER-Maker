import { useState, useCallback } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "er-maker-theme";

export function useTheme() {
  // Always default to "dark" for SSR to match the anti-flash script fallback
  const [theme, setTheme] = useState<Theme>("dark");

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
