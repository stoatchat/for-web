# ============================================
# Stage 1: Build the web client
# ============================================
FROM denoland/deno:2.6.5 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends git python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy workspace config + per-package manifests so deno install can resolve workspace members
COPY deno.json deno.lock ./

# Copy all package manifests for workspace packages
COPY packages/stoat.js/package.json packages/stoat.js/
COPY packages/solid-livekit-components/package.json packages/solid-livekit-components/
COPY packages/js-lingui-solid/packages/babel-plugin-lingui-macro/package.json packages/js-lingui-solid/packages/babel-plugin-lingui-macro/
COPY packages/js-lingui-solid/packages/babel-plugin-extract-messages/package.json packages/js-lingui-solid/packages/babel-plugin-extract-messages/
COPY packages/js-lingui-solid/packages/jest-mocks/package.json packages/js-lingui-solid/packages/jest-mocks/
COPY packages/client/package.json packages/client/

# Panda config is required by the build's codegen step
COPY packages/client/panda.config.ts packages/client/

# Install dependencies
RUN deno task install:frozen

# Submodules:
# In CI: actions/checkout@v4 with submodules: recursive handles this automatically.
# Locally: run `git submodule update --init --recursive` before `docker build`.
COPY packages/ packages/

# Build sub-dependencies (stoat.js, livekit-components, lingui plugins, lingui catalogs)
RUN deno task build:deps

# Build the client with placeholder env vars for runtime injection.
# These are replaced by docker/inject.ts at container startup.
ENV VITE_API_URL=__VITE_API_URL__
ENV VITE_WS_URL=__VITE_WS_URL__
ENV VITE_MEDIA_URL=__VITE_MEDIA_URL__
ENV VITE_PROXY_URL=__VITE_PROXY_URL__
ENV VITE_HCAPTCHA_SITEKEY=__VITE_HCAPTCHA_SITEKEY__
ENV VITE_CFG_ENABLE_VIDEO=__VITE_CFG_ENABLE_VIDEO__
ENV VITE_GIFBOX_URL=__VITE_GIFBOX_URL__
ENV VITE_RNNOISE_WORKLET_CDN_URL=__VITE_RNNOISE_WORKLET_CDN_URL__

ARG BASE_PATH=/
ENV BASE_PATH=${BASE_PATH}

RUN deno task build

# ============================================
# Stage 2: Minimal runtime image
# ============================================
FROM denoland/deno:2.6.5

WORKDIR /app

# Copy built static assets from stage 1
COPY --from=builder /build/packages/client/dist ./dist

# Copy runtime scripts
COPY docker/inject.ts docker/serve.ts ./docker/

# Cache the runtime module graph so startup is fast
RUN deno cache --allow-import docker/serve.ts

EXPOSE 5000

# Runtime env vars (overridden by Helm chart / docker run)
ENV PORT=5000
ENV VITE_API_URL=""
ENV VITE_WS_URL=""
ENV VITE_MEDIA_URL=""
ENV VITE_PROXY_URL=""
ENV VITE_HCAPTCHA_SITEKEY=""
ENV VITE_CFG_ENABLE_VIDEO=""
ENV VITE_GIFBOX_URL=""
ENV VITE_RNNOISE_WORKLET_CDN_URL=""

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write=./dist", "docker/serve.ts"]
