# Ditto — Design System Extractor

## What is this
Ditto is a multi-user design system tool that extracts design systems from websites via reverse-engineering (Puppeteer + CSS analysis), generates hybrid designs from multiple inspirations, and provides 6 preview pages (Landing, Dashboard, Auth, Pricing, Blog, Components) that render using the extracted design tokens.

## Stack
- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** for Ditto's own UI
- **Puppeteer** for headless browser extraction
- **SQLite** (better-sqlite3) + **Drizzle ORM** for data persistence
- **NextAuth v5** (Auth.js) for authentication (credentials provider, JWT sessions)
- Preview components use CSS custom variables (`--d-*`) set by `PreviewShell`

## Key directories
- `src/lib/extractor/` — Core extraction engine (browser.ts + index.ts)
- `src/lib/generator/` — DESIGN.md + hybrid design generation
- `src/lib/db/` — Database schema (schema.ts) and connection (index.ts)
- `src/lib/store.ts` — SQLite-backed storage (all queries user-scoped)
- `src/lib/auth.ts` — NextAuth configuration
- `src/lib/auth.config.ts` — Auth config (used by proxy)
- `src/lib/mood.ts` — Mood dimensions, questions, and auto-detection
- `src/lib/fonts.ts` — Font definitions via `next/font/local` (canvaSans, leoSans)
- `src/lib/credits-context.tsx` — Credits context provider (client)
- `src/components/preview/primitives/` — Reusable preview components
- `src/components/preview/pages/` — 6 preview pages
- `data/` — SQLite database file (gitignored)
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
- `npx drizzle-kit push` — Push schema changes to SQLite

## API Routes (all require auth)
- POST `/api/auth/register` — Create new account
- GET/POST `/api/auth/[...nextauth]` — NextAuth handlers
- GET `/api/designs` — List user's designs
- GET `/api/designs/[slug]` — Get single design
- DELETE `/api/designs/[slug]` — Delete design
- POST `/api/extract` — Extract design from URL and save
- POST `/api/designs/save` — Explicitly save a generated design
- POST `/api/inspire` — Extract single URL (`action: extract-one`) or generate hybrid (`action: generate`, does NOT auto-save)
- POST `/api/import` — Import from getdesign.md collection
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
- Local-first with SQLite, no external database services
