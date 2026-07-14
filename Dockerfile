# syntax=docker/dockerfile:1

# ─── Build stage: compile the Vite SPA to static files in /app/dist ─────────────
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines import.meta.env.VITE_* at BUILD time, so any Supabase config must be
# present BEFORE `npm run build`. Dokploy injects the application's environment into
# the image build; declare them here as build args. All are optional — with none set,
# the app runs on its safe localStorage demo backend (no live tenant data).
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_USE_SUPABASE_AUTH="false"
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_USE_SUPABASE_AUTH=$VITE_USE_SUPABASE_AUTH

# Install against the lockfile first so this layer caches until package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci

# Build. `npm run build` = `tsc -b && vite build`, so a type error fails the image.
COPY . .
RUN npm run build

# ─── Serve stage: nginx serving the static build with SPA routing ───────────────
FROM nginx:1.27-alpine AS serve
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
