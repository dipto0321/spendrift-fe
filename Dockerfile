# syntax=docker/dockerfile:1.7
# Frontend: TanStack Start (Vite + Nitro) app served by node.

FROM node:22-alpine

WORKDIR /app

# Enable pnpm via corepack (matches pnpm-lock.yaml / pnpm-workspace.yaml in this repo).
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests first so the install layer is cached when only source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build the Nitro server output.
COPY . .

# VITE_API_BASE_URL is baked at build time, so it's a build arg.
# Override at build with: --build-arg VITE_API_BASE_URL=...
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm build

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000

# Run as the prebuilt non-root "node" user that ships with the base image.
USER node

# Mirrors the `start` script in package.json: import the Sentry instrument
# shim, then start the Nitro server bundle.
CMD ["sh", "-c", "node --import ./.output/server/instrument.server.mjs .output/server/index.mjs"]
