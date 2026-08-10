# ============================================
# Stage 1: Build the web client
# ============================================
FROM node:24-alpine AS builder

RUN apk add --no-cache git python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

WORKDIR /build

# Copy workspace config files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY packages/ packages/

# Copy panda config needed by client's "prepare" lifecycle script (panda codegen)
COPY packages/client/panda.config.ts packages/client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build sub-dependencies (stoat.js, livekit-components, lingui plugins, panda css etc)
RUN pnpm --filter stoat.js build && \
  pnpm --filter solid-livekit-components build && \
  pnpm --filter client exec lingui compile --typescript && \
  pnpm --filter client exec node scripts/copyAssets.mjs && \
  pnpm --filter client exec panda codegen

RUN pnpm --filter client exec lingui extract
RUN pnpm --filter client exec lingui compile --typescript

# Build the client with placeholder env vars for runtime injection 
# these are replaced by inject.js at container run startup
ENV VITE_HOST=__VITE_HOST__
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_DEV_WS_URL=__VITE_WS_URL__
ENV VITE_DEV_MEDIA_URL=__VITE_MEDIA_URL__
ENV VITE_DEV_PROXY_URL=__VITE_PROXY_URL__
ENV VITE_DEV_GIFBOX_URL=__VITE_GIFBOX_URL__
ENV VITE_RNNOISE_WORKLET_CDN_URL=__VITE_RNNOISE_WORKLET_CDN_URL__

ARG BASE_PATH=/
ARG PWA_SCOPE
ENV BASE_PATH=${BASE_PATH}
ENV PWA_SCOPE=${PWA_SCOPE}

RUN pnpm --filter client exec vite build

# ============================================
# Stage 2: Minimal runtime image
# ============================================
FROM node:24-alpine

WORKDIR /app

# Copy the server package and install dependencies
COPY docker/package.json docker/inject.js ./
RUN npm install --omit=dev

# Copy built static assets stage 1
COPY --from=builder /build/packages/client/dist ./dist

EXPOSE 5000

CMD ["npm", "start"]
