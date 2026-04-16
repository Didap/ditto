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
