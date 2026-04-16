import type { Step } from "onborda";

interface Tour {
  tour: string;
  steps: Step[];
}

// ── Dashboard tour — shown after first login ──

const dashboardTour: Tour = {
  tour: "dashboard",
  steps: [
    {
      icon: "👋",
      title: "Welcome to your Design Library",
      content: "This is where all your extracted and unlocked designs live. Each card shows a visual preview, quality score, and which kits you've unlocked.",
      selector: "#tour-dashboard-header",
      side: "bottom",
      showControls: true,
      pointerPadding: 12,
      pointerRadius: 12,
    },
    {
      icon: "➕",
      title: "Add a new design",
      content: "Click here to extract a design system from any website URL. Ditto analyzes the CSS and pulls out colors, fonts, spacing, shadows, and components automatically.",
      selector: "#tour-add-design-btn",
      side: "bottom",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 8,
    },
    {
      icon: "🎯",
      title: "Complete quests for free credits",
      content: "Quests give you free credits for common actions — daily login, first extraction, sharing on social, and more. Expand this panel to see what's available.",
      selector: "#tour-quests-panel",
      side: "bottom",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🖼️",
      title: "Your design cards",
      content: "Each card shows a mini-preview with the design's colors and components. Select multiple cards to generate a hybrid mix or delete them. The icons at the bottom show which kits are unlocked (green) or locked (red).",
      selector: "#tour-design-grid",
      side: "top",
      showControls: true,
      pointerPadding: 12,
      pointerRadius: 12,
    },
  ],
};

// ── Add Design tour — shown on first visit to /add ──

const addDesignTour: Tour = {
  tour: "add-design",
  steps: [
    {
      icon: "🔗",
      title: "Paste any website URL",
      content: "Enter the URL of the website you want to extract. Ditto launches a headless browser, loads the page, and reverse-engineers the entire design system from CSS — zero AI tokens.",
      selector: "#tour-url-input",
      side: "bottom",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 8,
    },
    {
      icon: "✏️",
      title: "Name your design (optional)",
      content: "Give it a custom name, or leave it empty — Ditto will auto-derive it from the URL.",
      selector: "#tour-name-input",
      side: "bottom",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 8,
    },
    {
      icon: "🚀",
      title: "Extract!",
      content: "Hit this button and watch Ditto work. It costs 100 credits per extraction. In about 30 seconds you'll have a complete design system with colors, fonts, spacing, shadows, components, and a full DESIGN.md.",
      selector: "#tour-extract-btn",
      side: "top",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 8,
    },
    {
      icon: "📦",
      title: "Or browse the catalog",
      content: "Don't have a URL in mind? Browse 70+ curated design systems in the catalog. Unlock any of them for just 50 credits.",
      selector: "#tour-catalog-link",
      side: "top",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

// ── Inspire (Mix Design) tour — shown on first visit to /inspire ──

const inspireTour: Tour = {
  tour: "inspire",
  steps: [
    {
      icon: "🔗",
      title: "Add inspiration URLs",
      content: "Paste up to 5 website URLs as inspiration sources. Ditto will extract each one and blend their design tokens into something new.",
      selector: "#tour-inspire-urls",
      side: "bottom",
      showControls: true,
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      icon: "📚",
      title: "Pick from your library",
      content: "Already have designs in your library? Click here to select them as inspiration sources — no need to re-extract. Mix catalog designs with fresh URLs for unique results.",
      selector: "#tour-inspire-catalog",
      side: "bottom",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "🎛️",
      title: "Choose your mood mode",
      content: "Auto — Ditto detects the mood from each design automatically and blends them. Precise — You answer mood questions to fine-tune the result (playful vs. serious, warm vs. cool, etc.).",
      selector: "#tour-inspire-mode",
      side: "top",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: "✨",
      title: "Generate your hybrid design",
      content: "Once your inspirations are ready, hit generate. It costs 300 credits. You'll get a brand-new design system that blends the best of each source — then you can tweak it in the editor and download kits.",
      selector: "#tour-inspire-generate",
      side: "top",
      showControls: true,
      pointerPadding: 8,
      pointerRadius: 8,
    },
  ],
};

/** All tours combined for the Onborda provider */
export const ALL_TOURS: Tour[] = [dashboardTour, addDesignTour, inspireTour];

/** Check if a tour has been seen (localStorage) */
export function hasSeenTour(tourName: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(`ditto-tour-${tourName}`) === "done";
}

/** Mark a tour as seen */
export function markTourSeen(tourName: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`ditto-tour-${tourName}`, "done");
}
