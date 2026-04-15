"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface CreditsContextValue {
  credits: number | null;
  plan: string;
  setCredits: (n: number) => void;
  /** Refresh credits from server */
  refresh: () => Promise<void>;
  /** Optimistically deduct credits (call refresh after server confirms) */
  deduct: (amount: number) => void;
  /** Optimistically add credits */
  add: (amount: number) => void;
}

const CreditsContext = createContext<CreditsContextValue>({
  credits: null,
  plan: "free",
  setCredits: () => {},
  refresh: async () => {},
  deduct: () => {},
  add: () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState("free");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setPlan(data.plan || "free");
      }
    } catch {}
  }, []);

  const deduct = useCallback((amount: number) => {
    setCredits((prev) => (prev !== null ? Math.max(0, prev - amount) : prev));
  }, []);

  const add = useCallback((amount: number) => {
    setCredits((prev) => (prev !== null ? prev + amount : amount));
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, plan, setCredits, refresh, deduct, add }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
