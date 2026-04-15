"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { t, LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Menu, X, LogOut, Coins } from "lucide-react";
import { useCredits } from "@/lib/credits-context";

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { credits, refresh } = useCredits();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLanding = pathname === "/";

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // fallback: clear via API directly
    }
    window.location.href = "/";
  };

  // Fetch credits when authenticated
  useEffect(() => {
    if (session?.user) refresh();
  }, [session, pathname, refresh]);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem("ditto-locale") as Locale | null;
    if (stored && LOCALES.some((l) => l.code === stored)) {
      setLocale(stored);
      return;
    }
    const browserLang = navigator.language.slice(0, 2);
    const match = LOCALES.find((l) => l.code === browserLang);
    if (match) setLocale(match.code);
  }, []);

  const changeLocale = (code: Locale) => {
    setLocale(code);
    localStorage.setItem("ditto-locale", code);
    window.location.reload();
  };

  const T = (key: Parameters<typeof t>[1]) => t(locale, key);

  const logo = (
    <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
      <span className="w-6 h-6 ditto-blob inline-block shrink-0" />
      <span>Ditto</span>
    </Link>
  );

  const hamburger = (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[var(--ditto-text-muted)] hover:text-[var(--ditto-text)] transition-colors"
    >
      {mobileOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
    </button>
  );

  // Auth pages or loading
  if (isAuthPage || status === "loading") {
    return (
      <nav className="sticky top-0 z-50 border-b border-[var(--ditto-border)] bg-[var(--ditto-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {logo}
        </div>
      </nav>
    );
  }

  // Landing page
  if (isLanding) {
    return (
      <>
        <nav className="sticky top-0 z-50 border-b border-[var(--ditto-border)] bg-[var(--ditto-bg)]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            {logo}
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/pricing" className="text-sm text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] transition-colors">Pricing</a>
              {session ? (
                <a href="/dashboard" className="btn-blob">{T("navDashboard")}</a>
              ) : (
                <>
                  <a href="/login" className="text-sm text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] transition-colors">{T("navLogin")}</a>
                  <a href="/register" className="btn-blob">{T("navRegister")}</a>
                </>
              )}
            </div>
            {/* Mobile hamburger */}
            {hamburger}
          </div>
        </nav>

        {/* Mobile overlay */}
        <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
          <a href="/pricing" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Pricing</a>
          {session ? (
            <>
              <a href="/dashboard" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Libreria</a>
              <a href="/add" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Add Design</a>
              <a href="/inspire" className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Genera Design</a>
            </>
          ) : (
            <>
              <a href="/login" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>{T("navLogin")}</a>
              <a href="/register" className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>{T("navRegister")}</a>
            </>
          )}
          {/* Lingua in fondo */}
          <div className="mt-auto pt-4 border-t border-[var(--ditto-border)]">
            <select
              value={locale}
              onChange={(e) => changeLocale(e.target.value as Locale)}
              className="w-full rounded-lg border border-[var(--ditto-border)] bg-[var(--ditto-surface)] px-4 py-3 text-sm text-[var(--ditto-text)] outline-none"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </MobileMenu>
      </>
    );
  }

  // Authenticated dashboard nav
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--ditto-border)] bg-[var(--ditto-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {logo}
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] transition-colors">Dashboard</a>
            <a href="/add" className="text-sm text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] transition-colors">Add Design</a>
            <a href="/pricing" className="text-sm text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] transition-colors">Pricing</a>
            <a href="/inspire" className="btn-blob">Genera Design</a>
            {session?.user && (
              <>
                <div className="w-px h-5 bg-[var(--ditto-border)]" />
                {credits !== null && (
                  <span className="flex items-center gap-1 text-xs text-[var(--ditto-primary)]">
                    <Coins className="w-3 h-3" strokeWidth={1.5} />
                    {credits}
                  </span>
                )}
                <span className="text-xs text-[var(--ditto-text-muted)]">{session.user.name || session.user.email}</span>
                <button onClick={() => handleSignOut()} className="text-xs text-[var(--ditto-text-muted)] hover:text-[var(--ditto-text)] transition-colors">Esci</button>
              </>
            )}
          </div>
          {/* Mobile hamburger */}
          {hamburger}
        </div>
      </nav>

      {/* Mobile overlay */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <a href="/dashboard" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Libreria</a>
        <a href="/add" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Add Design</a>
        <a href="/pricing" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Pricing</a>
        <a href="/inspire" className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Genera Design</a>
        {session?.user && (
          <div className="mt-auto pt-4 border-t border-[var(--ditto-border)]">
            {credits !== null && (
              <div className="flex items-center gap-1.5 mb-3 text-sm text-[var(--ditto-primary)]">
                <Coins className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-semibold">{credits}</span>
                <span className="text-[var(--ditto-text-muted)]">crediti</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--ditto-text-muted)]">{session.user.name || session.user.email}</span>
              <button onClick={() => handleSignOut()} className="flex items-center gap-1.5 text-sm text-[var(--ditto-text-muted)] hover:text-[var(--ditto-error)]">
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} /> Esci
              </button>
            </div>
          </div>
        )}
      </MobileMenu>
    </>
  );
}

function MobileMenu({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-14 right-0 z-50 w-72 h-[calc(100vh-56px)] bg-[var(--ditto-bg)] border-l border-[var(--ditto-border)] p-6 flex flex-col gap-3 transition-transform duration-300 ease-out md:hidden"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        {children}
      </div>
    </>
  );
}
