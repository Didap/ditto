"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { t, LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useLocalePath } from "@/lib/locale-context";
import { ScrambleText } from "@/components/ScrambleText";
import { Search, Blend, Zap, Eye, Package, Target } from "lucide-react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const GLITCH_FONTS = [
  "'Courier New', monospace",
  "Georgia, serif",
  "'Times New Roman', serif",
  "Impact, sans-serif",
  "'Comic Sans MS', cursive",
  "'Trebuchet MS', sans-serif",
  "Verdana, sans-serif",
  "'Palatino Linotype', serif",
  "'Lucida Console', monospace",
  "system-ui, sans-serif",
  "'Arial Black', sans-serif",
  "'Brush Script MT', cursive",
];

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?";

function ScrambleWord({ word, font }: { word: string; font: string | null }) {
  const [display, setDisplay] = useState(word);
  const [currentFont, setCurrentFont] = useState(font);
  const [glitching, setGlitching] = useState(false);
  const prevFontRef = useRef(font);
  const frameRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (font === prevFontRef.current) return;
    prevFontRef.current = font;
    setGlitching(true);

    // Phase 1: scramble — letters cycle through random chars
    let tick = 0;
    const totalTicks = 14;
    const resolved = new Array(word.length).fill(false);

    const scramble = () => {
      tick++;

      // Progressively lock letters from left to right
      const lockThreshold = (tick / totalTicks) * word.length;
      const chars = word.split("").map((ch, i) => {
        if (resolved[i]) return ch;
        if (i < lockThreshold - 1) {
          resolved[i] = true;
          return ch;
        }
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      });

      setDisplay(chars.join(""));

      // Switch font at the halfway point
      if (tick === Math.floor(totalTicks / 2)) {
        setCurrentFont(font);
      }

      if (tick < totalTicks) {
        frameRef.current = setTimeout(scramble, 35);
      } else {
        setDisplay(word);
        setGlitching(false);
      }
    };

    frameRef.current = setTimeout(scramble, 35);
    return () => { if (frameRef.current) clearTimeout(frameRef.current); };
  }, [font, word]);

  return (
    <span
      className="ditto-gradient-text inline-block"
      style={{
        fontFamily: currentFont || undefined,
        textShadow: glitching
          ? "2px 0 #ff3386, -2px 0 #33d0ff"
          : "none",
        transition: "text-shadow 0.15s",
      }}
    >
      {display}
    </span>
  );
}

function FontGlitch({ text, glitchWords = ["design"] }: { text: string; glitchWords?: string[] }) {
  const words = text.split(/(\s+)/);
  const realWordCount = words.filter((w) => w.trim()).length;
  const isGlitchable = (word: string) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, "");
    return glitchWords.some((g) => clean === g.toLowerCase());
  };

  // Phase 1: text-generate
  const [revealed, setRevealed] = useState(0);
  // Phase 2: glitch
  const [glitchActive, setGlitchActive] = useState(false);
  const [fonts, setFonts] = useState<(string | null)[]>(() => words.map(() => null));
  const [blobs, setBlobs] = useState<boolean[]>(() => words.map(() => false));
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const randomFont = () => GLITCH_FONTS[Math.floor(Math.random() * GLITCH_FONTS.length)];

  // Phase 1: reveal words
  useEffect(() => {
    if (revealed >= realWordCount) {
      const t = setTimeout(() => setGlitchActive(true), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), 80 + Math.random() * 60);
    return () => clearTimeout(t);
  }, [revealed, realWordCount]);

  // Phase 2: glitch loop
  useEffect(() => {
    if (!glitchActive) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    words.forEach((word, i) => {
      if (word.trim() === "" || !isGlitchable(word)) return;
      const loop = () => {
        const roll = Math.random();
        if (roll < 0.05) {
          setBlobs((prev) => { const n = [...prev]; n[i] = true; return n; });
          setFonts((prev) => { const n = [...prev]; n[i] = null; return n; });
          setTimeout(() => {
            setBlobs((prev) => { const n = [...prev]; n[i] = false; return n; });
          }, 600 + Math.random() * 600);
        } else if (roll < 0.35) {
          setFonts((prev) => { const n = [...prev]; n[i] = null; return n; });
        } else {
          setFonts((prev) => { const n = [...prev]; n[i] = randomFont(); return n; });
        }
        timersRef.current[i] = setTimeout(loop, 2000 + Math.random() * 3000);
      };
      timersRef.current[i] = setTimeout(loop, 1000 + Math.random() * 3000);
    });

    return () => timersRef.current.forEach(clearTimeout);
  }, [glitchActive]);

  let wordIdx = 0;

  return (
    <>
      {words.map((word, i) => {
        if (word.trim() === "") return <span key={i}>{word}</span>;

        const thisIdx = wordIdx++;
        const isRevealed = thisIdx < revealed;
        const isBlob = blobs[i];

        return (
          <span key={i} className="inline-grid align-middle" style={{ gridTemplateAreas: "'cell'" }}>
            {/* Word layer */}
            <span
              className="transition-all duration-500 ease-in-out"
              style={{
                gridArea: "cell",
                opacity: !isRevealed ? 0 : isBlob ? 0 : 1,
                transform: !isRevealed ? "translateY(4px) scale(0.95)" : isBlob ? "scale(0.5)" : "scale(1)",
                filter: !isRevealed ? "blur(8px)" : isBlob ? "blur(4px)" : "blur(0px)",
              }}
            >
              {glitchActive && isGlitchable(word) ? (
                <ScrambleWord word={word} font={fonts[i]} />
              ) : (
                <span className="ditto-gradient-text">{word}</span>
              )}
            </span>
            {/* Blob layer */}
            <span
              className="flex items-center justify-center transition-all duration-500 ease-in-out"
              style={{
                gridArea: "cell",
                opacity: isBlob && isRevealed ? 1 : 0,
                transform: isBlob && isRevealed ? "scale(1)" : "scale(0.3)",
                filter: isBlob && isRevealed ? "blur(0px)" : "blur(4px)",
                pointerEvents: "none",
              }}
            >
              <span className="ditto-blob" style={{ width: "1.1em", height: "1.1em", display: "inline-block" }} />
            </span>
          </span>
        );
      })}
    </>
  );
}

interface LandingProps {
  locale: Locale;
  isAuthenticated: boolean;
}

export function LandingClient({ locale, isAuthenticated }: LandingProps) {
  const lp = useLocalePath();
  const [blobProgress, setBlobProgress] = useState(0);
  const blobAnchorRef = useRef<HTMLDivElement>(null);
  const [rocketData, setRocketData] = useState<object | null>(null);
  const [rocketVisible, setRocketVisible] = useState(false);
  const ctaSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/rocket.json").then((r) => r.json()).then(setRocketData).catch(() => {});
  }, []);

  useEffect(() => {
    const el = ctaSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setRocketVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track scroll progress toward the blob anchor
  useEffect(() => {
    const onScroll = () => {
      if (!blobAnchorRef.current) return;
      const rect = blobAnchorRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      // Reach 1.0 only when anchor is well into the viewport
      const distance = rect.top - vh * 0.3;
      const range = docH * 0.9;
      const progress = Math.max(0, Math.min(1, 1 - distance / range));
      setBlobProgress(progress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const T = (key: Parameters<typeof t>[1]) => t(locale, key);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Ditto?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ditto is a design system extraction tool that reverse-engineers any website's CSS to extract colors, typography, spacing, shadows, and component patterns as design tokens. It can also blend multiple site inspirations into a unique hybrid design system.",
        },
      },
      {
        "@type": "Question",
        name: "How does Ditto extract design systems?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ditto launches a headless browser, loads the target website, and analyzes every CSS rule to extract a complete set of 100+ design tokens in under 30 seconds. No AI is used — it's pure CSS reverse-engineering for precise, production-ready results.",
        },
      },
      {
        "@type": "Question",
        name: "Is Ditto free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Ditto offers a free plan with 3 design extractions per month. The Pro plan ($19/month) includes unlimited extractions, React component export, and Figma integration. The Team plan ($49/month) adds 5 seats and shared design libraries.",
        },
      },
      {
        "@type": "Question",
        name: "What can I export from Ditto?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ditto exports a DESIGN.md specification file, CSS custom properties (variables), React components, and can push design tokens directly to Figma as variables. All exports are production-ready.",
        },
      },
      {
        "@type": "Question",
        name: "Can I blend designs from multiple websites?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you can pick 2-10 websites, adjust weights for each, and Ditto will generate a hybrid design system that combines the best elements of each inspiration. The blending engine uses mood dimensions like warmth, energy, and density to create something uniquely yours.",
        },
      },
    ],
  };

  return (
    <div className="-mx-6 -mt-8" style={{ marginBottom: "-2rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="pt-28 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #03e65b 0%, transparent 70%)" }} />

        {/* Pixel stars scattered */}
        {[
          { top: "12%", left: "8%", delay: "0s", size: 8 },
          { top: "22%", left: "85%", delay: "0.7s", size: 6 },
          { top: "65%", left: "12%", delay: "1.4s", size: 10 },
          { top: "78%", left: "90%", delay: "0.3s", size: 7 },
          { top: "35%", left: "92%", delay: "2.1s", size: 5 },
          { top: "50%", left: "5%", delay: "1.8s", size: 8 },
          { top: "8%", left: "45%", delay: "2.5s", size: 6 },
          { top: "88%", left: "50%", delay: "0.9s", size: 5 },
        ].map((star, i) => (
          <div
            key={i}
            className="pixel-star absolute"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="font-extrabold tracking-tight leading-tight">
            <span className="block text-2xl md:text-3xl text-(--ditto-text-muted)"><ScrambleText text={T("heroLine1")} delay={0} /></span>
            <span className="block text-6xl md:text-8xl my-2 py-4 leading-[1.3]"><FontGlitch text={T("heroLine2")} /></span>
            <span className="block text-2xl md:text-3xl text-(--ditto-text-muted)"><ScrambleText text={T("heroLine3")} delay={60} /></span>
          </h1>
          <p className="mt-6 text-lg text-(--ditto-text-secondary) max-w-2xl mx-auto leading-relaxed">
            <ScrambleText text={T("heroSubtitle")} delay={90} />
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? lp("/inspire") : lp("/register")}
              className="inline-block px-8 py-4 bg-(--ditto-primary) text-[#0a0a0a] font-bold rounded-lg hover:opacity-90 transition-opacity text-base"
              style={{ fontFamily: "'leoSans', 'canvaSans', system-ui, sans-serif" }}
            >
              <ScrambleText text={T("heroCta")} delay={120} />
            </Link>
            <a href="#how" className="text-sm text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors">
              <ScrambleText text={T("heroSecondary")} delay={150} /> ↓
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-(--ditto-border)">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-(--ditto-text) text-center mb-12">
            <ScrambleText text={T("featuresTitle")} delay={180} />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {([
              { Icon: Search, tKey: "feature1Title" as const, dKey: "feature1Desc" as const },
              { Icon: Blend, tKey: "feature2Title" as const, dKey: "feature2Desc" as const },
              { Icon: Zap, tKey: "feature3Title" as const, dKey: "feature3Desc" as const },
              { Icon: Eye, tKey: "feature4Title" as const, dKey: "feature4Desc" as const },
              { Icon: Package, tKey: "feature5Title" as const, dKey: "feature5Desc" as const },
              { Icon: Target, tKey: "feature6Title" as const, dKey: "feature6Desc" as const },
            ]).map((f, i) => (
              <div key={i} className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6 hover:border-(--ditto-primary)/30 transition-all duration-300 group">
                <f.Icon className="w-6 h-6 text-(--ditto-primary) mb-3" strokeWidth={1.5} />
                <h3 className="text-base font-semibold text-(--ditto-text) mb-2 group-hover:text-(--ditto-primary) transition-colors"><ScrambleText text={T(f.tKey)} delay={210 + i * 40} /></h3>
                <p className="text-sm text-(--ditto-text-muted) leading-relaxed"><ScrambleText text={T(f.dKey)} delay={230 + i * 40} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6 border-t border-(--ditto-border)">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-(--ditto-text) text-center mb-12">
            <ScrambleText text={T("howTitle")} delay={450} />
          </h2>
          <div className="space-y-8">
            {([
              { tKey: "howStep1Title" as const, dKey: "howStep1Desc" as const },
              { tKey: "howStep2Title" as const, dKey: "howStep2Desc" as const },
              { tKey: "howStep3Title" as const, dKey: "howStep3Desc" as const },
              { tKey: "howStep4Title" as const, dKey: "howStep4Desc" as const },
            ]).map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 shrink-0 rounded-full bg-(--ditto-primary) flex items-center justify-center text-sm font-bold text-[#0a0a0a]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-(--ditto-text)"><ScrambleText text={T(step.tKey)} delay={480 + i * 40} /></h3>
                  <p className="text-sm text-(--ditto-text-muted) mt-1"><ScrambleText text={T(step.dKey)} delay={500 + i * 40} /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blob anchor — triggers the growth measurement */}
      <div ref={blobAnchorRef} />

      {/* Immersive CTA — the blob has fully consumed this section */}
      <section ref={ctaSectionRef} className="relative overflow-hidden blob-row-top -mx-[calc((100vw-100%)/2)]" style={{ background: "var(--ditto-primary)" }}>
        <div className="py-20 md:py-28 px-6 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Lottie animation — slides up from bottom */}
            {rocketData && (
              <div
                className="w-48 h-48 md:w-64 md:h-64 shrink-0 transition-all duration-700 ease-out"
                style={{
                  transform: rocketVisible ? "translateY(0)" : "translateY(120%)",
                  opacity: rocketVisible ? 1 : 0,
                }}
              >
                <Lottie animationData={rocketData} loop autoplay style={{ width: "100%", height: "100%" }} />
              </div>
            )}
            {/* CTA content */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-extrabold text-(--ditto-bg) mb-4">
                <ScrambleText text={T("ctaTitle")} delay={650} />
              </h2>
              <p className="text-base text-(--ditto-bg)/60 mb-8 max-w-md">
                <ScrambleText text={T("ctaSubtitle")} delay={680} />
              </p>
              <Link
                href={isAuthenticated ? lp("/inspire") : lp("/register")}
                className="inline-block px-8 py-4 bg-(--ditto-bg) text-(--ditto-primary) font-bold rounded-lg hover:opacity-90 transition-opacity text-base"
                style={{ fontFamily: "'leoSans', 'canvaSans', system-ui, sans-serif" }}
              >
                <ScrambleText text={isAuthenticated ? T("ctaCtaLoggedIn") : T("ctaCta")} delay={710} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — matches the blob color */}
      <footer className="py-8 px-6 -mx-[calc((100vw-100%)/2)]" style={{ background: "var(--ditto-primary)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-(--ditto-bg) inline-block" />
            <span className="text-sm font-semibold text-(--ditto-bg)">Ditto</span>
            <span className="text-xs text-(--ditto-bg)/50 ml-2"><ScrambleText text={T("footerTagline")} delay={740} /></span>
          </div>
          <div className="flex gap-1.5">
            {LOCALES.map((l) => (
              <Link
                key={l.code}
                href={`/${l.code}`}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  locale === l.code
                    ? "bg-(--ditto-bg)/20 text-(--ditto-bg) font-medium"
                    : "text-(--ditto-bg)/50 hover:text-(--ditto-bg)/80"
                }`}
              >
                {l.flag} {l.code.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* Rising blob — melma verde che sale dal basso */}
      {blobProgress < 0.82 && (
        <>
          <div
            className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none transition-[height] duration-500 ease-out"
            style={{
              height: `${9 + Math.pow(blobProgress, 2.5) * 15}vh`,
              background: "var(--ditto-primary)",
              borderRadius: blobProgress < 0.8 ? "60% 60% 0 0 / 20% 20% 0 0" : "30% 30% 0 0 / 8% 8% 0 0",
              animation: blobProgress > 0.05 ? "blob-surface 4s ease-in-out infinite" : "none",
            }}
          />
          <Link
            href={isAuthenticated ? lp("/inspire") : lp("/register")}
            className="fixed z-50 flex items-center justify-center text-[#0a0a0a] font-bold"
            style={{
              fontFamily: "'leoSans', 'canvaSans', system-ui, sans-serif",
              bottom: `${3 + Math.pow(blobProgress, 2.5) * 6}vh`,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: `${0.875 + blobProgress * 0.5}rem`,
              pointerEvents: "auto",
            }}
          >
            <ScrambleText text={T("ctaCta")} delay={120} />
          </Link>
        </>
      )}
    </div>
  );
}
