FROM node:20-slim AS base

# ── Dependencies stage ──────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Build stage ─────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Provide dummy env vars for build (server-side — not used at runtime)
ENV DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy"
ENV AUTH_SECRET="build-placeholder"
ENV STRIPE_SECRET_KEY="sk_test_build_placeholder"
ENV STRIPE_WEBHOOK_SECRET="whsec_build_placeholder"

RUN npm run build

# ── Production stage ────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Wrap chrome_crashpad_handler to inject the missing --database flag
RUN HANDLER=$(find /usr -name chrome_crashpad_handler -type f 2>/dev/null | head -1) \
    && if [ -n "$HANDLER" ]; then \
         mv "$HANDLER" "${HANDLER}.real" \
         && printf '#!/bin/sh\nexec "%s.real" --database=/tmp/crashpad "$@"\n' "$HANDLER" > "$HANDLER" \
         && chmod +x "$HANDLER"; \
       fi \
    && mkdir -p /tmp/crashpad && chmod 1777 /tmp/crashpad

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CRASHDUMP_DIR=/tmp/crashpad

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Drizzle migrations & startup scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --chown=nextjs:nodejs scripts/migrate.mjs scripts/start.sh ./scripts/
RUN chmod +x ./scripts/start.sh

# Copy the FULL node_modules from deps stage.
# Rationale: Next.js standalone output only bundles traced dependencies,
# but serverExternalPackages (puppeteer-extra, pg, etc.) need their
# transitive CJS deps at runtime and these aren't traced. Copying the
# full node_modules is the only reliable way to ensure everything is
# present without playing whack-a-mole with missing transitives.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Pre-bundled design JSON files (read at runtime by /api/catalog/unlock)
COPY --chown=nextjs:nodejs designs/*.json ./designs/

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "./scripts/start.sh"]
