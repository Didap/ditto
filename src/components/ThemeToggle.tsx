"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("ditto-theme") !== "light";
  });

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("ditto-theme", next ? "dark" : "light");
  };

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
