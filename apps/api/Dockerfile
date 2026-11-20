# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace root manifests
COPY package.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/

# Install workspace dependencies
RUN npm install --workspace=@review-insights/api --include-workspace-root

# Copy API source and migrations
COPY apps/api ./apps/api

# Build TypeScript
RUN npm --workspace=@review-insights/api run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/migrations ./apps/api/migrations

EXPOSE 4000

# Run migrations automatically on startup, then launch the API server
CMD ["sh", "-c", "npm --workspace=@review-insights/api run migrate:up && node apps/api/dist/server.js"]
