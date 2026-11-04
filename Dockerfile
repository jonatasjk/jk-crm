# Unified Dockerfile for the jk-crm monorepo.
# Build context must be the repo root so both apps/* trees are visible.
#
#   docker build --target frontend -t jk-crm-frontend .
#   docker build --target api      -t jk-crm-api .
#
# docker-compose.yml builds both targets from this same file.

# ── Stage: frontend build (Vite) ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm install --frozen-lockfile
COPY apps/frontend/ ./

# Bake the API base URL at build time — nginx will proxy /api to the backend
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage: api build (tsc) ──────────────────────────────────────────────────────
FROM node:20-alpine AS api-builder
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm install --frozen-lockfile
COPY apps/api/ ./
RUN npm run build

# ── Target: frontend — serve with nginx ─────────────────────────────────────────
FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Target: api — run with node ─────────────────────────────────────────────────
FROM node:20-alpine AS api
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm install --frozen-lockfile --omit=dev
COPY --from=api-builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
