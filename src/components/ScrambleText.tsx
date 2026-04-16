"use client";

import { useState, useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?";

// Module-level state: survives across SPA navigations but resets on full reload.
// This lets us detect locale switches (Link navigation) vs first page load.
let _prevLocale: string | null = null;
let _updateScheduled = false;

function isLocaleSwitch(): boolean {
  if (typeof window === "undefined") return false;
  const current = window.location.pathname.split("/")[1] || "en";
  const switched = _prevLocale !== null && _prevLocale !== current;

  // Defer updating _prevLocale so all ScrambleText components in this render
  // cycle see the OLD locale and all animate together.
  if (switched && !_updateScheduled) {
    _updateScheduled = true;
    setTimeout(() => {
      _prevLocale = current;
      _updateScheduled = false;
    }, 50);
  }

  // First visit — just record
  if (_prevLocale === null) _prevLocale = current;

  return switched;
}

/**
 * Text that scrambles when the locale changes (client-side navigation).
 * Set `delay` (ms) to stagger across multiple instances for a cascade effect.
 * No animation on first page load or full reload — only on SPA locale switches.
 */
export function ScrambleText({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const [display, setDisplay] = useState(text);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const shouldAnimate = isLocaleSwitch();

    if (!shouldAnimate) {
      setDisplay(text);
      return;
    }

    // Start with scrambled text immediately
    setDisplay(text.replace(/[^\s]/g, () => CHARS[Math.floor(Math.random() * CHARS.length)]));

    // After cascade delay, resolve letter by letter
    delayRef.current = setTimeout(() => {
      let tick = 0;
      const totalTicks = 12;

      const animate = () => {
        tick++;
        const lockAt = (tick / totalTicks) * text.length;
        const chars = text.split("").map((ch, i) => {
          if (ch === " ") return " ";
          if (i < lockAt) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        });
        setDisplay(chars.join(""));

        if (tick < totalTicks) {
          timerRef.current = setTimeout(animate, 25);
        } else {
          setDisplay(text);
        }
      };

      timerRef.current = setTimeout(animate, 25);
    }, delay);

    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, delay]);

  return <>{display}</>;
}
