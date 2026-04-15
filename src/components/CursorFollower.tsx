"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const CURSOR_PAGES = ["/", "/dashboard", "/pricing"];

export function CursorFollower() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = CURSOR_PAGES.includes(pathname);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!active) {
      el.style.display = "none";
      document.documentElement.classList.remove("custom-cursor");
      return;
    }

    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) {
      el.style.display = "none";
      return;
    }

    document.documentElement.classList.add("custom-cursor");

    let hovering = false;

    const onMove = (e: MouseEvent) => {
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest("a, button, [role='button'], select, input, textarea, [data-clickable]");
      if (isInteractive && !hovering) {
        hovering = true;
        el.classList.add("wiggle");
      } else if (!isInteractive && hovering) {
        hovering = false;
        el.classList.remove("wiggle");
      }
    };

    const onLeave = () => {
      el.style.display = "none";
    };
    const onEnter = () => {
      el.style.display = "block";
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, [active]);

  return <div ref={ref} className="cursor-follower" />;
}
