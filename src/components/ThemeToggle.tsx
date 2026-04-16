"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ditto-theme");
    const isDark = stored !== "light";
    setDark(isDark);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(dark ? "dark" : "light");
  }, [dark, mounted]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("ditto-theme", next ? "dark" : "light");
  };

  // Render a static placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="theme-toggle" title="Toggle theme">
        <Sun className="w-4 h-4 text-(--ditto-text-muted)" strokeWidth={1.5} />
      </button>
    );
  }

  return (
    <button onClick={toggle} className="theme-toggle" title={dark ? "Light mode" : "Dark mode"}>
      {dark ? (
        <Sun className="w-4 h-4 text-(--ditto-text-muted)" strokeWidth={1.5} />
      ) : (
        <Moon className="w-4 h-4 text-(--ditto-text-muted)" strokeWidth={1.5} />
      )}
    </button>
  );
}
