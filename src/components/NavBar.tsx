"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Menu, X, LogOut, Coins, User, Sun, Moon, Globe } from "lucide-react";
import { useCredits } from "@/lib/credits-context";
import { useLocalePath, useBarePath, usePathnameLocale } from "@/lib/locale-context";
import { LOCALES } from "@/lib/i18n";

// Theme as external store to avoid setState-in-effect lint errors
function subscribeTheme(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getThemeSnapshot() {
  return localStorage.getItem("ditto-theme") !== "light";
}
function getThemeServerSnapshot() {
  return true; // SSR default: dark
}

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lp = useLocalePath();
  const barePath = useBarePath();
  const currentLocale = usePathnameLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const { credits, refresh } = useCredits();
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = () => {
    const next = !dark;
    localStorage.setItem("ditto-theme", next ? "dark" : "light");
    window.dispatchEvent(new StorageEvent("storage", { key: "ditto-theme" }));
  };

  const isAuthPage = barePath === "/login" || barePath === "/register";
  const isLanding = barePath === "/";

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // fallback
    }
    window.location.href = lp("/");
  };

  // Fetch credits when authenticated
  useEffect(() => {
    if (session?.user) refresh();
  }, [session, pathname, refresh]);

  // Close menus on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the menu on navigation is a standard pattern
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); setLangMenuOpen(false); }, [pathname]);

  // Close menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    if (userMenuOpen || langMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen, langMenuOpen]);

  // Language switcher
  const langSwitcher = (
    <div className="relative" ref={langMenuRef}>
      <button
        onClick={() => setLangMenuOpen(!langMenuOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
        title="Language"
      >
        <Globe className="w-4 h-4" strokeWidth={1.5} />
      </button>
      {langMenuOpen && (
        <div className="absolute right-0 top-10 w-40 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) shadow-xl py-1 z-50">
          {LOCALES.map((l) => (
            <Link
              key={l.code}
              href={`/${l.code}${barePath === "/" ? "" : barePath}`}
              className={`block px-4 py-2 text-sm transition-colors ${
                currentLocale === l.code
                  ? "text-(--ditto-primary) font-medium"
                  : "text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg)"
              }`}
            >
              {l.flag} {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const logo = (
    <Link href={lp("/")} className="flex items-center gap-2 font-semibold text-lg tracking-tight">
      <span className="w-6 h-6 ditto-blob inline-block shrink-0" />
      <span>Ditto</span>
    </Link>
  );

  const hamburger = (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors"
    >
      {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
    </button>
  );

  // User avatar button (opens dropdown)
  const userButton = session?.user ? (
    <div className="relative" ref={userMenuRef}>
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
        title={session.user.name || session.user.email || "Account"}
      >
        <User className="w-4 h-4" strokeWidth={1.5} />
      </button>

      {/* Dropdown */}
      {userMenuOpen && (
        <div
          className="absolute right-0 top-10 w-56 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) shadow-xl py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-(--ditto-border)">
            <p className="text-sm font-medium text-(--ditto-text) truncate">
              {session.user.name || "User"}
            </p>
            <p className="text-xs text-(--ditto-text-muted) truncate">
              {session.user.email}
            </p>
          </div>
          {credits !== null && (
            <div className="px-4 py-2 border-b border-(--ditto-border)">
              <div className="flex items-center gap-1.5 text-sm text-(--ditto-primary)">
                <Coins className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="font-semibold">{credits}</span>
                <span className="text-(--ditto-text-muted) font-normal">credits</span>
              </div>
            </div>
          )}
          <div className="py-1 border-b border-(--ditto-border)">
            <Link href={lp("/catalog")} className="block px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors">Catalog</Link>
            <Link href={lp("/add")} className="block px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors">+ Add Design</Link>
            <Link href={lp("/inspire")} className="block px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors">Mix Design</Link>
          </div>
          {/* Theme toggle */}
                    <div className="px-4 py-2.5 border-b border-(--ditto-border)">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between"
              >
                <span className="text-xs text-(--ditto-text-muted)">{dark ? "Dark mode" : "Light mode"}</span>
                <div
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ backgroundColor: dark ? "var(--ditto-primary)" : "var(--ditto-border)" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-(--ditto-bg) shadow-sm flex items-center justify-center transition-all duration-200"
                    style={{ left: dark ? "calc(100% - 18px)" : "2px" }}
                  >
                    {dark ? (
                      <Moon className="w-2.5 h-2.5 text-(--ditto-text-muted)" strokeWidth={2} />
                    ) : (
                      <Sun className="w-2.5 h-2.5 text-(--ditto-warning)" strokeWidth={2} />
                    )}
                  </div>
                </div>
              </button>
            </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-(--ditto-text-muted) hover:text-(--ditto-error) hover:bg-(--ditto-bg) transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      )}
    </div>
  ) : (
    <Link
      href={lp("/login")}
      className="flex items-center justify-center w-8 h-8 rounded-full border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
      title="Sign in"
    >
      <User className="w-4 h-4" strokeWidth={1.5} />
    </Link>
  );

  // Auth pages or loading
  if (isAuthPage || status === "loading") {
    return (
      <nav className="sticky top-0 z-50 border-b border-(--ditto-border) bg-(--ditto-bg)/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {logo}
          {langSwitcher}
        </div>
      </nav>
    );
  }

  // Landing page
  if (isLanding) {
    return (
      <>
        <nav className="sticky top-0 z-50 border-b border-(--ditto-border) bg-(--ditto-bg)/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            {logo}
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <Link href={lp("/how-it-works")} className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">How it works</Link>
              <Link href={lp("/pricing")} className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">Pricing</Link>
              {session ? (
                <Link href={lp("/dashboard")} className="btn-blob">Dashboard</Link>
              ) : (
                <Link href={lp("/register")} className="btn-blob">Get started</Link>
              )}
              {langSwitcher}
              {userButton}
            </div>
            {hamburger}
          </div>
        </nav>

        <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
          <Link href={lp("/how-it-works")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>How it works</Link>
          <Link href={lp("/pricing")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Pricing</Link>
          {session ? (
            <Link href={lp("/dashboard")} className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          ) : (
            <>
              <Link href={lp("/login")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link href={lp("/register")} className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Get started</Link>
            </>
          )}
          <div className="h-px bg-(--ditto-border)" />
          <div className="flex gap-2 flex-wrap">
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={`/${l.code}${barePath === "/" ? "" : barePath}`}
                className={`text-sm px-2 py-1 rounded ${currentLocale === l.code ? "text-(--ditto-primary) font-medium" : "text-(--ditto-text-muted)"}`}
              >
                {l.flag} {l.code.toUpperCase()}
              </Link>
            ))}
          </div>
        </MobileMenu>
      </>
    );
  }

  // Authenticated app nav
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-(--ditto-border) bg-(--ditto-bg)/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {logo}
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href={lp("/how-it-works")} className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">How it works</Link>
            <Link href={lp("/pricing")} className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">Pricing</Link>
            <div className="w-px h-5 bg-(--ditto-border)" />
            <Link href={lp("/dashboard")} className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">Dashboard</Link>
            {langSwitcher}
            {userButton}
          </div>
          {hamburger}
        </div>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Link href={lp("/how-it-works")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>How it works</Link>
        <Link href={lp("/pricing")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Pricing</Link>
        <div className="h-px bg-(--ditto-border)" />
        <Link href={lp("/dashboard")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
        <Link href={lp("/catalog")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Catalog</Link>
        <Link href={lp("/add")} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>+ Add Design</Link>
        <Link href={lp("/inspire")} className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Mix Design</Link>
        {session?.user && (
          <div className="mt-auto pt-4 border-t border-(--ditto-border)">
            {credits !== null && (
              <div className="flex items-center gap-1.5 mb-3 text-sm text-(--ditto-primary)">
                <Coins className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-semibold">{credits}</span>
                <span className="text-(--ditto-text-muted)">credits</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-(--ditto-text-muted)">{session.user.name || session.user.email}</span>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-(--ditto-text-muted) hover:text-(--ditto-error)">
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} /> Sign out
              </button>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              {LOCALES.map((l) => (
                <a
                  key={l.code}
                  href={`/${l.code}${barePath === "/" ? "" : barePath}`}
                  className={`text-sm px-2 py-1 rounded ${currentLocale === l.code ? "text-(--ditto-primary) font-medium" : "text-(--ditto-text-muted)"}`}
                >
                  {l.flag} {l.code.toUpperCase()}
                </a>
              ))}
            </div>
            <button onClick={toggleTheme} className="w-full flex items-center justify-between">
              <span className="text-xs text-(--ditto-text-muted)">{dark ? "Dark mode" : "Light mode"}</span>
              <div className="relative w-10 h-5 rounded-full transition-colors" style={{ backgroundColor: dark ? "var(--ditto-primary)" : "var(--ditto-border)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-(--ditto-bg) shadow-sm flex items-center justify-center transition-all duration-200" style={{ left: dark ? "calc(100% - 18px)" : "2px" }}>
                  {dark ? <Moon className="w-2.5 h-2.5 text-(--ditto-text-muted)" strokeWidth={2} /> : <Sun className="w-2.5 h-2.5 text-(--ditto-warning)" strokeWidth={2} />}
                </div>
              </div>
            </button>
          </div>
        )}
      </MobileMenu>
    </>
  );
}

function MobileMenu({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
      <div
        className="fixed top-14 right-0 z-50 w-72 h-[calc(100vh-56px)] bg-(--ditto-bg) border-l border-(--ditto-border) p-6 flex flex-col gap-3 transition-transform duration-300 ease-out md:hidden"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        {children}
      </div>
    </>
  );
}
