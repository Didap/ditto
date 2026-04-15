"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ditto-theme");
    if (stored === "light") {
      setDark(false);
      document.documentElement.classList.replace("dark", "light");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next ? "dark" : "light");
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
