# Stage 1: Build Frontend SPA
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:4000/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=@review-insights/web --include-workspace-root

COPY apps/web ./apps/web

RUN npm --workspace=@review-insights/web run build

# Stage 2: Serve via Nginx with SPA fallback
FROM nginx:1.27-alpine AS runner
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
