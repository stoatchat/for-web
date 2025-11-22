# syntax=docker/dockerfile:1

# Build Arguments
ARG NODE_VERSION="24"
ARG NGINX_VERSION="1.29"
ARG ALPINE_VERSION="3.22"

# Build Stage
FROM --platform=${BUILDPLATFORM} docker.io/node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

FROM base AS builder
WORKDIR /usr/src/app
COPY . .

FROM builder AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile && \
    pnpm cache delete

FROM builder AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile && \
    pnpm build:deps && \
    pnpm build:web && \
    pnpm cache delete

# Dev Stage
FROM build AS dev
ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn

# not strictly necessary(?)
COPY . .

EXPOSE 5173 9229
CMD [ "pnpm", "dev:web" ]

FROM docker.io/nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine${ALPINE_VERSION}-slim AS prod
COPY --from=build /usr/src/app/packages/client/dist /usr/share/nginx/html
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf
