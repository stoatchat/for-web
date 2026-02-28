# ============================================
# Stage 1: Build the web client
# ============================================
FROM node:24-alpine AS builder

RUN apk add --no-cache git python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /build

# Copy workspace config files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy all package.json files for workspace packages
COPY packages/stoat.js/package.json packages/stoat.js/
COPY packages/solid-livekit-components/package.json packages/solid-livekit-components/
COPY packages/js-lingui-solid/packages/babel-plugin-lingui-macro/package.json packages/js-lingui-solid/packages/babel-plugin-lingui-macro/
COPY packages/js-lingui-solid/packages/babel-plugin-extract-messages/package.json packages/js-lingui-solid/packages/babel-plugin-extract-messages/
COPY packages/client/package.json packages/client/

# Copy panda config needed by client's "prepare" lifecycle script (panda codegen)
COPY packages/client/panda.config.ts packages/client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Submodules:
# In CI: actions/checkout@v4 with submodules: recursive handles this automatically.
# Locally: run `git submodule update --init --recursive` before `docker build`.
COPY packages/ packages/

# Build sub-dependencies (stoat.js, livekit-components, lingui plugins, panda css etc)
RUN pnpm --filter stoat.js build && \
  pnpm --filter solid-livekit-components build && \
  pnpm --filter @lingui-solid/babel-plugin-lingui-macro build && \
  pnpm --filter @lingui-solid/babel-plugin-extract-messages build && \
  pnpm --filter client exec lingui compile --typescript && \
  pnpm --filter client exec node scripts/copyAssets.mjs && \
  pnpm --filter client exec panda codegen 

# Build the client with placeholder env vars for runtime injection 
# these are replaced by inject.js at container run startup
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_WS_URL=__VITE_WS_URL__
ENV VITE_MEDIA_URL=__VITE_MEDIA_URL__
ENV VITE_PROXY_URL=__VITE_PROXY_URL__
ENV VITE_HCAPTCHA_SITEKEY=__VITE_HCAPTCHA_SITEKEY__
ENV BASE_PATH=/

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

# Runtime env vars (overridden by Helm chart / docker run)
ENV VITE_API_URL=""
ENV VITE_WS_URL=""
ENV VITE_MEDIA_URL=""
ENV VITE_PROXY_URL=""
ENV VITE_HCAPTCHA_SITEKEY=""
ENV REVOLT_PUBLIC_URL=""

CMD ["npm", "start"]
