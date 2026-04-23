"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribeTheme(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getThemeSnapshot() {
  return localStorage.getItem("ditto-theme") !== "light";
}
function getThemeServerSnapshot() {
  return true;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(dark ? "dark" : "light");
  }, [dark]);

  const toggle = () => {
    localStorage.setItem("ditto-theme", dark ? "light" : "dark");
    window.dispatchEvent(new StorageEvent("storage", { key: "ditto-theme" }));
  };

  const next = dark ? "Light mode" : "Dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      title={next}
      aria-label={`Switch to ${next}`}
      aria-pressed={!dark}
    >
      {dark ? (
        <Sun className="w-4 h-4 text-(--ditto-text-muted)" strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-(--ditto-text-muted)" strokeWidth={1.5} aria-hidden="true" />
      )}
    </button>
  );
}
