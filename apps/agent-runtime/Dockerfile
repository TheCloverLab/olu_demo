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

# --- runtime stage: minimal production image ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/agent-runtime/node_modules ./apps/agent-runtime/node_modules
COPY --from=build /app/apps/agent-runtime/dist ./apps/agent-runtime/dist
COPY --from=build /app/apps/agent-runtime/package.json ./apps/agent-runtime/
COPY --from=build /app/packages/shared ./packages/shared
COPY package.json ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/agent-runtime/dist/index.js"]
