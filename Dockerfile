# Debian-slim rather than Alpine: matches the house style (metricsmentor uses
# python:3.11-slim-trixie) and avoids musl surprises if a native dependency
# shows up later (embeddings clients, sharp, bcrypt).
#
# ⚠️ Apple Silicon builds arm64 natively, which will NOT run on an X86_64
# Fargate task. For a manual push from a Mac: docker build --platform linux/amd64
# CodeBuild already builds x86, so the pipeline is unaffected.

# ── deps ─────────────────────────────────────────────────────────────────────
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder ──────────────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# output: 'standalone' emits server.js plus a traced, minimal node_modules.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Not part of the Next build graph, so copied explicitly.
COPY migrations ./migrations
COPY scripts ./scripts
COPY entrypoint.sh ./

# Fail the build, not the container, if dependency tracing ever stops including
# pg — scripts/migrate.mjs resolves it from the standalone node_modules.
RUN node -e "require.resolve('pg')"

RUN chmod +x entrypoint.sh && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["./entrypoint.sh"]
