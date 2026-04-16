"use client";

import { useState, useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?";

/**
 * Text that scrambles when its content changes (e.g. on locale switch).
 * - Skips animation on first mount (SSR hydration)
 * - Cascade: set `delay` (ms) to stagger across multiple instances
 */
export function ScrambleText({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  const prevRef = useRef(text);
  const [display, setDisplay] = useState(text);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Skip on first mount — show text immediately (SSR hydrated)
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current = text;
      setDisplay(text);
      return;
    }

    if (text === prevRef.current) return;
    prevRef.current = text;

    // Wait for cascade delay, then scramble
    const delayTimer = setTimeout(() => {
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
      clearTimeout(delayTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, delay]);

  return <>{display}</>;
}
