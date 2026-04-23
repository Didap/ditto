# Ditto — Design System Extractor

## What is this
Ditto is a multi-user design system tool that extracts design systems from websites via reverse-engineering (Puppeteer + CSS analysis), generates hybrid designs from multiple inspirations, and provides 6 preview pages (Landing, Dashboard, Auth, Pricing, Blog, Components) that render using the extracted design tokens.

## Stack
- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** for Ditto's own UI
- **Puppeteer** for headless browser extraction
- **PostgreSQL** (via `pg`) + **Drizzle ORM** for data persistence
- **NextAuth v5** (Auth.js) for authentication (credentials provider, JWT sessions)
- Preview components use CSS custom variables (`--d-*`) set by `PreviewShell`

## Key directories
- `src/lib/extractor/` — Core extraction engine (browser.ts + index.ts)
- `src/lib/generator/` — DESIGN.md + hybrid design generation
- `src/lib/db/` — Database schema (schema.ts) and connection (index.ts)
- `src/lib/store.ts` — PostgreSQL-backed storage (all queries user-scoped)
- `src/lib/auth.ts` — NextAuth configuration
- `src/lib/auth.config.ts` — Auth config (used by proxy)
- `src/lib/mood.ts` — Mood dimensions, questions, and auto-detection
- `src/lib/fonts.ts` — Font definitions via `next/font/local` (canvaSans, leoSans)
- `src/lib/errors.ts` — `ApiError` enum and error helpers (all API error strings)
- `src/lib/credits-context.tsx` — Credits context provider (client)
- `src/components/preview/primitives/` — Reusable preview components
- `src/components/preview/pages/` — 6 preview pages
- `data/` — Local data directory (gitignored)
- `cli/` — CLI entry point

## Auth & Data Model
- Users table: id, email, name, passwordHash
- Designs table: id, userId (FK), slug, name, url, tokens (JSON), resolved (JSON), designMd, source
- Slugs are unique per user (UNIQUE(userId, slug))
- All API routes require authentication via `getRequiredUser()`
- Proxy (`src/proxy.ts`, renamed from middleware in Next.js 16) redirects unauthenticated users to `/login`

## Commands
- `npm run dev` — Start dev server
- `npm run cli -- extract <url>` — CLI extraction
- `npx drizzle-kit push` — Push schema changes to PostgreSQL

## API Routes (all require auth)
- POST `/api/auth/register` — Create new account
- GET/POST `/api/auth/[...nextauth]` — NextAuth handlers
- GET `/api/designs` — List user's designs
- GET `/api/designs/[slug]` — Get single design
- DELETE `/api/designs/[slug]` — Soft-delete design (moves to trash, permanent after 7 days)
- GET/POST `/api/designs/trash` — List trash / restore or permanently delete
- POST `/api/extract` — Extract design from URL and save
- POST `/api/designs/save` — Explicitly save a generated design
- POST `/api/inspire` — Extract single URL (`action: extract-one`) or generate hybrid (`action: generate`, does NOT auto-save)
- GET `/api/catalog` — List catalog with unlock status per user
- POST `/api/catalog/unlock` — Unlock a catalog design (50 credits)
- GET/POST `/api/designs/[slug]/unlock` — Check/purchase devkit (50cr) or complete (100cr) unlock (permanent)
- POST `/api/figma-push` — Push tokens to Figma
- GET/POST `/api/credits` — Get/manage user credits
- GET/POST `/api/quests` — Get/claim quests
- POST `/api/stripe/checkout` — Create Stripe checkout session
- POST `/api/stripe/portal` — Create Stripe billing portal session
- POST `/api/stripe/webhook` — Stripe webhook handler
- GET/POST `/api/designs/[slug]/boost` — Estimate/apply design quality boost

## Conventions

### Tailwind CSS v4
- Use parenthesis syntax for CSS variables: `bg-(--ditto-primary)` NOT `bg-[var(--ditto-primary)]`
- Ditto's UI tokens are CSS custom properties prefixed `--ditto-*` defined in `globals.css`
- Fonts are loaded via `next/font/local` in `src/lib/fonts.ts`, referenced as CSS variables `--font-canvaSans` and `--font-leoSans`

### API error messages
- All API error strings must be in English — never use Italian or other languages in server responses
- Use the `ApiError` enum from `src/lib/errors.ts` for all error messages — no inline strings
- For insufficient credits errors, use `insufficientCredits(required, available)` from the same module
- When adding new error cases, add them to the `ApiError` enum first

### Localization (always)
- **Every user-facing string must be localized** — never hardcode text in any language in a component's JSX, `title`, `aria-label`, `placeholder`, or alt attributes. The app ships in English, Italian, French and Spanish.
- Translation keys live in `src/lib/i18n.ts` as one flat object per locale (`en`, `it`, `fr`, `es`). When adding a key, add it to **all four** locales — key parity is enforced by the fact that `TranslationKey = keyof typeof translations.en`.
- Access translations in client components via the `useT()` hook from `src/lib/locale-context.tsx`: `const t = useT(); return <h1>{t("myKey")}</h1>`. In server components or non-React code, import `t` directly from `@/lib/i18n` and pass the current locale.
- **No default string fallbacks in JSX or props** — e.g. `function Foo({ label = "Funziona con" })` is wrong. Either accept only the prop (caller passes a translated value) or call `useT()` inside the component.
- Placeholders inside copyable shell commands / code examples are an exception: use a language-neutral literal (e.g. `YOUR_KEY_HERE`) rather than a translation key, and reference the same literal in surrounding explanatory text.
- Email templates (`src/emails/*`) carry their own per-locale `Record<Locale, Copy>` dictionary keyed off `locale?: Locale` props — follow that existing pattern; don't add email strings to `i18n.ts`.
- When refactoring or adding UI, run a quick scan for hardcoded text before committing:
  `python3 -c "import re,pathlib; [print(f'{p}:{i}: {l.strip()[:120]}') for p in pathlib.Path('src').rglob('*.tsx') for i,l in enumerate(p.read_text().splitlines(),1) if re.search(r'\b(della|delle|questo|questa|caricamento|salva|rimuovi|aggiungi|elimina|accedi|scarica|apri|seleziona|clicca|premi|grazie|benvenut|funziona)\b', l, re.I) and not (l.strip().startswith(('//','*','/*','import ','from ')) or 'src/lib/i18n.ts' in str(p) or 'src/emails' in str(p))]"`

### Next.js 16 patterns
- Proxy: `src/proxy.ts` (not `middleware.ts`) — Next.js 16 renamed middleware to proxy
- Async APIs: `params`, `searchParams`, `cookies()`, `headers()` must always be `await`ed
- Fonts: Use `next/font/local` (not CSS `@font-face`) — see `src/lib/fonts.ts`
- Scripts: Use `next/script` (not raw `<script>` tags) for external scripts
- Error handling: `app/error.tsx` (route errors), `app/global-error.tsx` (root layout errors, uses inline styles since Tailwind CSS isn't loaded)
- Loading: `loading.tsx` files in `dashboard/` and `design/[slug]/`
- 404: `app/not-found.tsx`
- Metadata: Root layout uses title template `"%s | Ditto"`
- Linting: `npm run lint` uses ESLint directly (not `next lint`, removed in v16)

## Design principles
- Zero AI tokens for extraction — pure CSS reverse-engineering
- Preview components are design-agnostic, themed via CSS variables
- Per-user data isolation — each user sees only their designs
- Explicit save after generation (predisposed for future payment/token system)
- PostgreSQL via `DATABASE_URL` (Neon / local Postgres)
