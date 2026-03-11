# Build from repo root: docker build -f apps/agent-runtime/Dockerfile .
FROM node:20-slim AS base
WORKDIR /app

# --- deps stage: install production dependencies ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/agent-runtime/package.json ./apps/agent-runtime/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=apps/agent-runtime --workspace=packages/shared --omit=dev

# --- build stage: compile TypeScript ---
FROM base AS build
COPY package.json package-lock.json ./
COPY apps/agent-runtime/ ./apps/agent-runtime/
COPY packages/shared/ ./packages/shared/
RUN npm install --workspace=apps/agent-runtime --workspace=packages/shared
RUN npm run build --workspace=packages/shared 2>/dev/null; \
    npm run build --workspace=apps/agent-runtime

# --- runtime stage: production image with Chromium for browser automation ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install Python3 (for lark-suite skill subprocess calls)
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*

# Install Playwright Chromium system dependencies
RUN npx playwright install-deps chromium 2>/dev/null || true

# npm workspaces hoists all deps to root node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/agent-runtime/dist ./apps/agent-runtime/dist
COPY --from=build /app/apps/agent-runtime/package.json ./apps/agent-runtime/
COPY --from=build /app/packages/shared ./packages/shared
COPY package.json ./

# Copy lark-suite Python scripts (for subprocess calling from agent tools)
COPY scripts/lark-suite/ ./lark-suite/

# Install Playwright Chromium browser
RUN npx playwright install chromium

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/agent-runtime/dist/index.js"]
