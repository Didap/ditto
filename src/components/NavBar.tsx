"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, Coins, User } from "lucide-react";
import { useCredits } from "@/lib/credits-context";

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { credits, refresh } = useCredits();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLanding = pathname === "/";

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // fallback
    }
    window.location.href = "/";
  };

  // Fetch credits when authenticated
  useEffect(() => {
    if (session?.user) refresh();
  }, [session, pathname, refresh]);

  // Close mobile menu on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the menu on navigation is a standard pattern
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  // Close user menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const logo = (
    <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
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
            <a href="/catalog" className="block px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors">Catalog</a>
            <a href="/add" className="block px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors">+ Add Design</a>
            <a href="/inspire" className="block px-4 py-2 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:bg-(--ditto-bg) transition-colors">Mix Design</a>
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
    <a
      href="/login"
      className="flex items-center justify-center w-8 h-8 rounded-full border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
      title="Sign in"
    >
      <User className="w-4 h-4" strokeWidth={1.5} />
    </a>
  );

  // Auth pages or loading
  if (isAuthPage || status === "loading") {
    return (
      <nav className="sticky top-0 z-50 border-b border-(--ditto-border) bg-(--ditto-bg)/80 backdrop-blur-xl">
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
        <nav className="sticky top-0 z-50 border-b border-(--ditto-border) bg-(--ditto-bg)/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            {logo}
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <a href="/how-it-works" className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">How it works</a>
              <a href="/pricing" className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">Pricing</a>
              {session ? (
                <a href="/dashboard" className="btn-blob">Dashboard</a>
              ) : (
                <a href="/register" className="btn-blob">Get started</a>
              )}
              {userButton}
            </div>
            {hamburger}
          </div>
        </nav>

        <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
          <a href="/how-it-works" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="/pricing" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Pricing</a>
          {session ? (
            <a href="/dashboard" className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Dashboard</a>
          ) : (
            <>
              <a href="/login" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Sign in</a>
              <a href="/register" className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Get started</a>
            </>
          )}
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
            <a href="/how-it-works" className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">How it works</a>
            <a href="/pricing" className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">Pricing</a>
            <div className="w-px h-5 bg-(--ditto-border)" />
            <a href="/dashboard" className="text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">Dashboard</a>
            {userButton}
          </div>
          {hamburger}
        </div>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <a href="/how-it-works" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>How it works</a>
        <a href="/pricing" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Pricing</a>
        <div className="h-px bg-(--ditto-border)" />
        <a href="/dashboard" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Dashboard</a>
        <a href="/catalog" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>Catalog</a>
        <a href="/add" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>+ Add Design</a>
        <a href="/inspire" className="btn-blob w-full text-center" onClick={() => setMobileOpen(false)}>Mix Design</a>
        {session?.user && (
          <div className="mt-auto pt-4 border-t border-(--ditto-border)">
            {credits !== null && (
              <div className="flex items-center gap-1.5 mb-3 text-sm text-(--ditto-primary)">
                <Coins className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-semibold">{credits}</span>
                <span className="text-(--ditto-text-muted)">credits</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--ditto-text-muted)">{session.user.name || session.user.email}</span>
              <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-(--ditto-text-muted) hover:text-(--ditto-error)">
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} /> Sign out
              </button>
            </div>
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
