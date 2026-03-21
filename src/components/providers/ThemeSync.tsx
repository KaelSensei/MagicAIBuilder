"use client";
// Syncs the Zustand theme state to the document root data-theme attribute
import { useEffect } from "react";
import { useThemeStore } from "@/hooks/useTheme";

export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
