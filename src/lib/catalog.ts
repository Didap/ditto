/**
 * Design Catalog — maps getdesign brands to generic style names.
 * Names describe the aesthetic, never reference the original brand.
 * Each entry costs UNLOCK_COST credits to unlock.
 */

export const UNLOCK_COST = 50;

export interface CatalogPreview {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export interface CatalogEntry {
  /** Internal ID (used as slug when saved) */
  id: string;
  /** Generic display name */
  name: string;
  /** Style description */
  description: string;
  /** Category tag */
  category: CatalogCategory;
  /** Preview colors for the card */
  preview: CatalogPreview;
  /** getdesign package name (never exposed to users) */
  _source: string;
}

export type CatalogCategory =
  | "saas"
  | "fintech"
  | "editorial"
  | "developer"
  | "luxury"
  | "creative"
  | "commerce"
  | "ai"
  | "enterprise";

export const CATALOG: CatalogEntry[] = [
  // ── SaaS ──
  { id: "warm-marketplace", name: "Warm Marketplace", description: "Warm coral accent, photography-driven, rounded UI with inviting surfaces.", category: "saas", preview: { primary: "#ff385c", secondary: "#222222", accent: "#ffffff", bg: "#ffffff", text: "#222222" }, _source: "airbnb" },
  { id: "colorful-data", name: "Colorful Data", description: "Friendly, colorful, structured data aesthetic with playful tones.", category: "saas", preview: { primary: "#1b61c9", secondary: "#181d26", accent: "#ffffff", bg: "#ffffff", text: "#181d26" }, _source: "airtable" },
  { id: "open-scheduler", name: "Open Scheduler", description: "Clean neutral UI, developer-oriented simplicity and open feel.", category: "saas", preview: { primary: "#242424", secondary: "#898989", accent: "#111111", bg: "#ffffff", text: "#242424" }, _source: "cal" },
  { id: "collab-canvas", name: "Collab Canvas", description: "Vibrant multi-color palette, playful yet professional design tool aesthetic.", category: "creative", preview: { primary: "#0d99ff", secondary: "#a259ff", accent: "#ec4899", bg: "#2c2c2c", text: "#ffffff" }, _source: "figma" },
  { id: "motion-builder", name: "Motion Builder", description: "Bold black and blue, motion-first, design-forward web builder feel.", category: "creative", preview: { primary: "#0099ff", secondary: "#000000", accent: "#ffffff", bg: "#000000", text: "#ffffff" }, _source: "framer" },
  { id: "task-precision", name: "Task Precision", description: "Ultra-minimal, precise layout with purple accent and sharp focus.", category: "saas", preview: { primary: "#5e6ad2", secondary: "#f7f8f8", accent: "#08090a", bg: "#08090a", text: "#f7f8f8" }, _source: "linear.app" },
  { id: "bright-collab", name: "Bright Collab", description: "Bright yellow accent, infinite canvas aesthetic with energetic whiteboard vibes.", category: "saas", preview: { primary: "#ffd02f", secondary: "#5b76fe", accent: "#00b473", bg: "#1c1c1e", text: "#ffffff" }, _source: "miro" },
  { id: "warm-workspace", name: "Warm Workspace", description: "Warm minimalism, serif headings, soft surfaces for notes and docs.", category: "saas", preview: { primary: "#31302e", secondary: "#f6f5f4", accent: "#eb5757", bg: "#ffffff", text: "#31302e" }, _source: "notion" },
  { id: "visual-discovery", name: "Visual Discovery", description: "Red accent, masonry grid, image-first inspiration board layout.", category: "saas", preview: { primary: "#e60023", secondary: "#91918c", accent: "#62625b", bg: "#e5e5e0", text: "#211922" }, _source: "pinterest" },
  { id: "automation-flow", name: "Automation Flow", description: "Warm orange palette, friendly illustration-driven integration aesthetic.", category: "saas", preview: { primary: "#ff4f00", secondary: "#201515", accent: "#fffefb", bg: "#fffefb", text: "#201515" }, _source: "zapier" },
  { id: "visual-builder", name: "Visual Builder", description: "Blue-accented, polished marketing site aesthetic with drag-and-drop feel.", category: "saas", preview: { primary: "#146ef5", secondary: "#080808", accent: "#7a3dff", bg: "#080808", text: "#ffffff" }, _source: "webflow" },
  { id: "friendly-messenger", name: "Friendly Messenger", description: "Friendly blue palette, conversational UI patterns for customer support.", category: "saas", preview: { primary: "#ff5600", secondary: "#111111", accent: "#faf9f6", bg: "#faf9f6", text: "#111111" }, _source: "intercom" },

  // ── Fintech ──
  { id: "sleek-banking", name: "Sleek Banking", description: "Sleek dark interface, gradient cards, fintech precision and clarity.", category: "fintech", preview: { primary: "#e23b4a", secondary: "#ec7e00", accent: "#00a87e", bg: "#191c1f", text: "#ffffff" }, _source: "revolut" },
  { id: "trust-exchange", name: "Trust Exchange", description: "Clean blue identity, trust-focused institutional feel for digital assets.", category: "fintech", preview: { primary: "#0052ff", secondary: "#578bfa", accent: "#0a0b0d", bg: "#0a0b0d", text: "#ffffff" }, _source: "coinbase" },
  { id: "bold-trading", name: "Bold Trading", description: "Bold yellow accent on monochrome, trading-floor urgency and data density.", category: "fintech", preview: { primary: "#f0b90b", secondary: "#1e2026", accent: "#ffffff", bg: "#0b0e11", text: "#eaecef" }, _source: "binance" },
  { id: "purple-trading", name: "Purple Trading", description: "Purple-accented dark UI, data-dense dashboards for financial platforms.", category: "fintech", preview: { primary: "#7132f5", secondary: "#5741d8", accent: "#5b1ecf", bg: "#101114", text: "#ffffff" }, _source: "kraken" },
  { id: "global-payments", name: "Global Payments", description: "Warm cream canvas, orbital pill shapes, editorial warmth for payments.", category: "fintech", preview: { primary: "#eb001b", secondary: "#ff5f00", accent: "#f79e1b", bg: "#f5f0eb", text: "#1a1a1a" }, _source: "mastercard" },
  { id: "bright-transfer", name: "Bright Transfer", description: "Bright green accent, friendly and clear money transfer aesthetic.", category: "fintech", preview: { primary: "#9fe870", secondary: "#163300", accent: "#0e0f0c", bg: "#0e0f0c", text: "#ffffff" }, _source: "wise" },
  { id: "gradient-pay", name: "Gradient Pay", description: "Signature purple gradients, weight-300 elegance for payment infrastructure.", category: "fintech", preview: { primary: "#533afd", secondary: "#061b31", accent: "#ffffff", bg: "#ffffff", text: "#061b31" }, _source: "stripe" },

  // ── Developer ──
  { id: "dark-deploy", name: "Dark Deploy", description: "Black and white precision, monospace accents for deployment platforms.", category: "developer", preview: { primary: "#171717", secondary: "#ffffff", accent: "#ff5b4f", bg: "#ffffff", text: "#171717" }, _source: "vercel" },
  { id: "dark-emerald", name: "Dark Emerald", description: "Dark emerald theme, code-first aesthetic for backend platforms.", category: "developer", preview: { primary: "#3ecf8e", secondary: "#171717", accent: "#0f0f0f", bg: "#0f0f0f", text: "#ffffff" }, _source: "supabase" },
  { id: "react-native-dark", name: "React Native Dark", description: "Dark theme, tight letter-spacing, code-centric mobile development feel.", category: "developer", preview: { primary: "#000000", secondary: "#f0f0f3", accent: "#60646c", bg: "#f0f0f3", text: "#000000" }, _source: "expo" },
  { id: "green-docs", name: "Green Docs", description: "Clean, green-accented, reading-optimized documentation platform look.", category: "developer", preview: { primary: "#18E299", secondary: "#0d0d0d", accent: "#ffffff", bg: "#ffffff", text: "#0d0d0d" }, _source: "mintlify" },
  { id: "leaf-database", name: "Leaf Database", description: "Green leaf branding, developer documentation focus for data platforms.", category: "developer", preview: { primary: "#00ed64", secondary: "#001e2b", accent: "#b8c4c2", bg: "#001e2b", text: "#ffffff" }, _source: "mongodb" },
  { id: "infra-clean", name: "Infra Clean", description: "Enterprise-clean, black and white infrastructure automation aesthetic.", category: "developer", preview: { primary: "#7b42bc", secondary: "#15181e", accent: "#0d0e12", bg: "#15181e", text: "#ffffff" }, _source: "hashicorp" },
  { id: "error-dashboard", name: "Error Dashboard", description: "Dark dashboard, data-dense layout with pink-purple accent for monitoring.", category: "developer", preview: { primary: "#c2ef4e", secondary: "#1f1633", accent: "#150f23", bg: "#150f23", text: "#ffffff" }, _source: "sentry" },
  { id: "hedgehog-analytics", name: "Hedgehog Analytics", description: "Playful branding, developer-friendly dark UI for product analytics.", category: "developer", preview: { primary: "#F54E00", secondary: "#1e1f23", accent: "#fdfdf8", bg: "#fdfdf8", text: "#1e1f23" }, _source: "posthog" },
  { id: "email-mono", name: "Email Mono", description: "Minimal dark theme, monospace accents for transactional email platforms.", category: "developer", preview: { primary: "#ffffff", secondary: "#f0f0f0", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "resend" },
  { id: "red-content", name: "Red Content", description: "Red accent, content-first editorial layout for headless CMS platforms.", category: "developer", preview: { primary: "#f03e2f", secondary: "#212121", accent: "#353535", bg: "#0b0b0b", text: "#ffffff" }, _source: "sanity" },
  { id: "tool-integrator", name: "Tool Integrator", description: "Modern dark with colorful integration icons for composable platforms.", category: "developer", preview: { primary: "#00ffff", secondary: "#0007cd", accent: "#0f0f0f", bg: "#0f0f0f", text: "#ffffff" }, _source: "composio" },
  { id: "terminal-modern", name: "Terminal Modern", description: "Dark IDE-like interface, block-based command UI for modern terminals.", category: "developer", preview: { primary: "#353534", secondary: "#faf9f6", accent: "#868584", bg: "#faf9f6", text: "#353534" }, _source: "warp" },
  { id: "launcher-chrome", name: "Launcher Chrome", description: "Sleek dark chrome, vibrant gradient accents for productivity tools.", category: "developer", preview: { primary: "#FF6363", secondary: "#07080a", accent: "#ffffff", bg: "#07080a", text: "#ffffff" }, _source: "raycast" },
  { id: "fast-analytics", name: "Fast Analytics", description: "Yellow-accented, technical documentation style for analytics engines.", category: "developer", preview: { primary: "#faff69", secondary: "#414141", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "clickhouse" },

  // ── AI ──
  { id: "warm-assistant", name: "Warm Assistant", description: "Warm terracotta accent, clean editorial layout for AI conversation.", category: "ai", preview: { primary: "#c96442", secondary: "#5e5d59", accent: "#f5f4ed", bg: "#f5f4ed", text: "#4d4c48" }, _source: "claude" },
  { id: "gradient-ai", name: "Gradient AI", description: "Vibrant gradients, data-rich dashboard aesthetic for enterprise AI.", category: "ai", preview: { primary: "#1863dc", secondary: "#d9d9dd", accent: "#e5e7eb", bg: "#d9d9dd", text: "#1863dc" }, _source: "cohere" },
  { id: "cursor-dark", name: "Cursor Dark", description: "Sleek dark interface, gradient accents for AI-powered code editors.", category: "ai", preview: { primary: "#26251e", secondary: "#f2f1ed", accent: "#e6e5e0", bg: "#f2f1ed", text: "#26251e" }, _source: "cursor" },
  { id: "voice-cinema", name: "Voice Cinema", description: "Dark cinematic UI, audio-waveform aesthetics for voice AI platforms.", category: "ai", preview: { primary: "#000000", secondary: "#f5f5f5", accent: "#f5f2ef", bg: "#000000", text: "#ffffff" }, _source: "elevenlabs" },
  { id: "french-minimal", name: "French Minimal", description: "French-engineered minimalism, purple-toned for open AI models.", category: "ai", preview: { primary: "#fa520f", secondary: "#ffd900", accent: "#ffa110", bg: "#fffaeb", text: "#1f1f1f" }, _source: "mistral.ai" },
  { id: "white-canvas-ai", name: "White Canvas AI", description: "Clean white canvas, code-forward layout for ML model platforms.", category: "ai", preview: { primary: "#ea2804", secondary: "#202020", accent: "#2b9a66", bg: "#ffffff", text: "#202020" }, _source: "replicate" },
  { id: "playful-builder", name: "Playful Builder", description: "Playful gradients, friendly dev aesthetic for AI app builders.", category: "ai", preview: { primary: "#1c1c1c", secondary: "#f7f4ed", accent: "#eceae4", bg: "#f7f4ed", text: "#1c1c1c" }, _source: "lovable" },
  { id: "neon-dark-ai", name: "Neon Dark AI", description: "Bold dark interface with neon accents for AI model providers.", category: "ai", preview: { primary: "#1456f0", secondary: "#ffffff", accent: "#3b82f6", bg: "#ffffff", text: "#1456f0" }, _source: "minimax" },
  { id: "monochrome-ai", name: "Monochrome AI", description: "Stark monochrome, futuristic minimalism for AI research labs.", category: "ai", preview: { primary: "#1f2228", secondary: "#ffffff", accent: "#000000", bg: "#ffffff", text: "#1f2228" }, _source: "x.ai" },
  { id: "terminal-llm", name: "Terminal LLM", description: "Terminal-first, monochrome simplicity for local model runners.", category: "ai", preview: { primary: "#ffffff", secondary: "#262626", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "ollama" },
  { id: "ai-infra", name: "AI Infra", description: "Technical, blueprint-style design for open-source AI infrastructure.", category: "ai", preview: { primary: "#ef2cc1", secondary: "#fc4c02", accent: "#010120", bg: "#010120", text: "#ffffff" }, _source: "together.ai" },
  { id: "cinematic-video", name: "Cinematic Video", description: "Cinematic dark UI, media-rich layout for AI video generation.", category: "ai", preview: { primary: "#767d88", secondary: "#7d848e", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "runwayml" },
  { id: "dark-coder", name: "Dark Coder", description: "Developer-centric dark theme for AI coding platforms.", category: "ai", preview: { primary: "#201d1d", secondary: "#fdfcfc", accent: "#9a9898", bg: "#fdfcfc", text: "#201d1d" }, _source: "opencode.ai" },
  { id: "void-agent", name: "Void Agent", description: "Void-black canvas, emerald accent, terminal-native AI agent aesthetic.", category: "ai", preview: { primary: "#00d992", secondary: "#050507", accent: "#3d3a39", bg: "#050507", text: "#ffffff" }, _source: "voltagent" },

  // ── Luxury / Automotive ──
  { id: "premium-minimal", name: "Premium Minimal", description: "Premium white space, system font precision, cinematic imagery.", category: "luxury", preview: { primary: "#000000", secondary: "#f5f5f7", accent: "#1d1d1f", bg: "#ffffff", text: "#1d1d1f" }, _source: "apple" },
  { id: "german-precision", name: "German Precision", description: "Dark premium surfaces, precise engineering aesthetic with sharp lines.", category: "luxury", preview: { primary: "#1c69d4", secondary: "#0653b6", accent: "#757575", bg: "#ffffff", text: "#1c1c1c" }, _source: "bmw" },
  { id: "cinema-black", name: "Cinema Black", description: "Cinema-black canvas, monochrome austerity, monumental display type.", category: "luxury", preview: { primary: "#c4a862", secondary: "#1a1a1a", accent: "#e8e8e8", bg: "#000000", text: "#ffffff" }, _source: "bugatti" },
  { id: "chiaroscuro-red", name: "Chiaroscuro Red", description: "Chiaroscuro editorial, bold red accents on cinematic black canvas.", category: "luxury", preview: { primary: "#DA291C", secondary: "#303030", accent: "#8F8F8F", bg: "#D2D2D2", text: "#303030" }, _source: "ferrari" },
  { id: "black-gold", name: "Black Gold", description: "True black surfaces, gold accents, dramatic uppercase typography.", category: "luxury", preview: { primary: "#FFC000", secondary: "#000000", accent: "#FFFFFF", bg: "#000000", text: "#ffffff" }, _source: "lamborghini" },
  { id: "radical-subtraction", name: "Radical Subtraction", description: "Radical subtraction, full-viewport photography, near-zero UI for electric.", category: "luxury", preview: { primary: "#3E6AE1", secondary: "#FFFFFF", accent: "#F4F4F4", bg: "#FFFFFF", text: "#181818" }, _source: "tesla" },
  { id: "aurora-gradients", name: "Aurora Gradients", description: "Vibrant aurora gradients, bold typography, energetic automotive feel.", category: "luxury", preview: { primary: "#EFDF00", secondary: "#1883FD", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "renault" },

  // ── Commerce ──
  { id: "neon-commerce", name: "Neon Commerce", description: "Dark-first cinematic layout, neon green accent, ultra-light type for e-commerce.", category: "commerce", preview: { primary: "#95bf47", secondary: "#002e25", accent: "#ffffff", bg: "#000000", text: "#ffffff" }, _source: "shopify" },
  { id: "bold-athletic", name: "Bold Athletic", description: "Monochrome UI, massive uppercase type, full-bleed photography.", category: "commerce", preview: { primary: "#111111", secondary: "#ffffff", accent: "#fa5400", bg: "#ffffff", text: "#111111" }, _source: "nike" },
  { id: "urban-mobility", name: "Urban Mobility", description: "Bold black and white, tight type, urban energy for ride platforms.", category: "commerce", preview: { primary: "#000000", secondary: "#ffffff", accent: "#e2e2e2", bg: "#000000", text: "#ffffff" }, _source: "uber" },
  { id: "gaming-console", name: "Gaming Console", description: "Three-surface channel layout, quiet-authority display type, cyan hover-scale.", category: "commerce", preview: { primary: "#00439c", secondary: "#ffffff", accent: "#00d4aa", bg: "#0f1114", text: "#ffffff" }, _source: "playstation" },
  { id: "music-dark", name: "Music Dark", description: "Vibrant green on dark, bold type, album-art-driven streaming aesthetic.", category: "commerce", preview: { primary: "#1db954", secondary: "#181818", accent: "#1f1f1f", bg: "#121212", text: "#ffffff" }, _source: "spotify" },
  { id: "space-future", name: "Space Future", description: "Stark black and white, full-bleed imagery, futuristic aerospace aesthetic.", category: "commerce", preview: { primary: "#ffffff", secondary: "#f0f0fa", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "spacex" },

  // ── Enterprise ──
  { id: "carbon-blue", name: "Carbon Blue", description: "Carbon design system, structured blue palette for enterprise tech.", category: "enterprise", preview: { primary: "#0f62fe", secondary: "#161616", accent: "#ffffff", bg: "#ffffff", text: "#161616" }, _source: "ibm" },
  { id: "green-compute", name: "Green Compute", description: "Green-black energy, technical power aesthetic for GPU computing.", category: "enterprise", preview: { primary: "#76b900", secondary: "#ffffff", accent: "#000000", bg: "#000000", text: "#ffffff" }, _source: "nvidia" },
  { id: "social-photo", name: "Social Photo", description: "Photography-first, binary light/dark surfaces, blue CTAs for social platforms.", category: "enterprise", preview: { primary: "#0081fb", secondary: "#ffffff", accent: "#1c2b33", bg: "#ffffff", text: "#1c2b33" }, _source: "meta" },
  { id: "red-telecom", name: "Red Telecom", description: "Monumental uppercase display, bold red chapter bands for telecom brands.", category: "enterprise", preview: { primary: "#e60000", secondary: "#ffffff", accent: "#333333", bg: "#ffffff", text: "#333333" }, _source: "vodafone" },

  // ── Editorial / Creative ──
  { id: "organic-agency", name: "Organic Agency", description: "Organic shapes, soft gradients, art-directed layout for creative studios.", category: "creative", preview: { primary: "#000000", secondary: "#dad4c8", accent: "#eee9df", bg: "#faf9f7", text: "#000000" }, _source: "clay" },
  { id: "premium-email", name: "Premium Email", description: "Premium dark UI, keyboard-first, purple glow for fast email clients.", category: "creative", preview: { primary: "#cbb7fb", secondary: "#1b1938", accent: "#e9e5dd", bg: "#e9e5dd", text: "#1b1938" }, _source: "superhuman" },
  { id: "acid-editorial", name: "Acid Editorial", description: "Acid-mint and ultraviolet accents, rave-flyer story tiles for tech media.", category: "editorial", preview: { primary: "#00ff94", secondary: "#7e00ff", accent: "#ff0066", bg: "#000000", text: "#ffffff" }, _source: "theverge" },
  { id: "broadsheet-ink", name: "Broadsheet Ink", description: "Paper-white broadsheet density, custom serif display, ink-blue links.", category: "editorial", preview: { primary: "#2d3bff", secondary: "#1a1a1a", accent: "#e6e6e6", bg: "#ffffff", text: "#1a1a1a" }, _source: "wired" },
];

/** Look up a catalog entry by its public ID */
export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

/** All unique categories in the catalog */
export function getCatalogCategories(): CatalogCategory[] {
  return [...new Set(CATALOG.map((e) => e.category))];
}
