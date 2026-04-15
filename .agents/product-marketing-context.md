# Product Marketing Context

*Last updated: 2026-04-14*

## Product Overview
**One-liner:** Ditto extracts design systems from any website and lets you blend multiple inspirations into a unique design system.
**What it does:** Ditto reverse-engineers websites using headless browser CSS analysis (zero AI tokens) to extract colors, typography, spacing, shadows, and component patterns. Users can combine 2-10 website inspirations with adjustable weights to generate hybrid design systems, preview them across 6 page templates, and export as DESIGN.md, CSS variables, React components, or push directly to Figma.
**Product category:** Design system tools / Design extraction / Design token generators
**Product type:** SaaS (web app + CLI)
**Business model:** Freemium — free tier with limited generations, paid tiers for more volume and features (in development)

## Target Audience
**Target companies:** Design agencies, startups, freelancers, dev shops, product teams at SMBs
**Decision-makers:** Frontend developers, UI/UX designers, design system leads, CTOs at small teams, solo founders
**Primary use case:** Quickly bootstrap a professional design system without starting from scratch or hiring a designer
**Jobs to be done:**
- "I need a design system for my new project but don't want to start from a blank canvas"
- "I love the design of [website] and want something similar but unique"
- "I need to standardize our design tokens across teams quickly"
**Use cases:**
- Startup building an MVP and needs a polished design system fast
- Agency creating unique designs for multiple clients by blending references
- Developer who wants design tokens without learning Figma
- Team migrating from ad-hoc CSS to a structured design system

## Problems & Pain Points
**Core problem:** Creating a design system from scratch is slow, expensive, and requires design expertise that many teams lack.
**Why alternatives fall short:**
- Figma/design tools: Require design skills and manual token extraction
- UI kits (Shadcn, Chakra): Generic — every product looks the same
- Design agencies: Expensive ($10k+) and slow (weeks/months)
- Manual CSS inspection: Tedious, error-prone, incomplete
**What it costs them:** Weeks of design work, $5-50k for design agencies, or shipping with a generic look that doesn't differentiate
**Emotional tension:** "Our product looks like every other startup" — fear of being generic, frustration with design bottlenecks

## Competitive Landscape
**Direct:** CSS Stats, Style Dictionary — extract tokens but don't blend or generate hybrid systems
**Secondary:** Figma Dev Mode, Storybook — help manage design systems but don't create them from references
**Indirect:** UI kits (Shadcn, Radix, Chakra) — provide pre-made systems but no customization from real-world inspiration

## Differentiation
**Key differentiators:**
- Zero-AI extraction: Pure CSS reverse-engineering, not AI-generated guesses
- Blending engine: Combine multiple inspirations with weighted mood dimensions
- Full pipeline: Extract → Blend → Preview → Export → Figma push in one tool
- 6 live preview templates to see your system in context before committing
**How we do it differently:** We analyze actual CSS rules from live websites rather than generating from prompts or templates
**Why that's better:** Tokens are precise and production-ready because they come from real, working designs
**Why customers choose us:** Speed (minutes, not weeks), uniqueness (blend = no two outputs alike), developer-friendly (exports code, not mockups)

## Objections
| Objection | Response |
|-----------|----------|
| "Isn't this just copying someone's design?" | No — blending multiple inspirations with mood weighting creates something original, like how musicians sample and remix |
| "I can just inspect CSS myself" | You could, but Ditto extracts the complete token set (100+ variables) in seconds and normalizes them into a coherent system |
| "Will the output actually match my needs?" | The 6 preview pages let you validate before committing, and you can fine-tune mood dimensions |

**Anti-persona:** Enterprise teams with existing mature design systems and dedicated design ops teams — they don't need extraction, they need governance

## Switching Dynamics
**Push:** "I'm tired of generic UI kits" / "We can't afford a design agency" / "Manual token extraction takes forever"
**Pull:** "I can have a unique design system in minutes" / "I can reference the sites I actually admire"
**Habit:** "We already use [Tailwind defaults / Shadcn]" / "Our designer handles this"
**Anxiety:** "Will the output be production-quality?" / "Is it legal to extract from other sites?"

## Customer Language
**How they describe the problem:**
- "Our app looks like every other SaaS"
- "I spent days tweaking colors and spacing"
- "I wish I could just point at a site and say 'make mine like that'"
**How they describe us:**
- "It's like Shazam for design systems"
- "Reverse-engineer any website's design"
**Words to use:** extract, blend, design system, tokens, inspiration, reverse-engineer, unique
**Words to avoid:** copy, steal, clone, scrape, AI-generated
**Glossary:**
| Term | Meaning |
|------|---------|
| Design tokens | Named values (colors, spacing, fonts) that define a design system |
| Mood dimensions | Axes (warmth, energy, density, etc.) used to blend inspirations |
| DESIGN.md | Markdown spec documenting the complete design system |
| Hybrid design | A unique system generated by blending multiple inspirations |

## Brand Voice
**Tone:** Technical but approachable, confident, slightly playful
**Style:** Direct, concise, developer-oriented with occasional wit
**Personality:** Clever, precise, creative, bold

## Proof Points
**Metrics:** Extracts 100+ design tokens in under 30 seconds. 6 live preview templates.
**Customers:** Early-stage — building user base
**Value themes:**
| Theme | Proof |
|-------|-------|
| Speed | Full design system in minutes, not weeks |
| Uniqueness | Blending engine ensures no two outputs are alike |
| Precision | Real CSS analysis, not AI guesses |
| Developer-first | Exports code-ready tokens, not design mockups |

## Goals
**Business goal:** Grow user base, validate freemium model, establish as the go-to design extraction tool
**Conversion action:** Sign up for free account → extract first design → upgrade for more generations
**Current metrics:** Pre-launch / early stage
