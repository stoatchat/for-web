# syntax=docker/dockerfile:1

# Build Arguments
ARG NODE_VERSION="24"
ARG DEBIAN_VERSION="trixie"
ARG NGINX_VERSION="1.29"
ARG ALPINE_VERSION="3.22"

# Build Stage
FROM --platform=${BUILDPLATFORM} docker.io/node:${NODE_VERSION}-${DEBIAN_VERSION}-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /usr/src/app
COPY . .
COPY packages/client/.env.example packages/client/.env

FROM builder AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM builder AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile && \
    pnpm build:deps && \
    pnpm build:web

# Dev Stage
FROM base AS dev
COPY --chown=nonroot:nonroot package.json pnpm-lock.yaml ./
COPY --chown=nonroot:nonroot --from=prod-deps /usr/src/app/node_modules node_modules
COPY --chown=nonroot:nonroot --from=build /usr/src/app/packages/client packages/client

# Entrypoint
#USER nonroot
#COPY --chown=nonroot:nonroot --chmod=755 scripts/entrypoint.sh /tmp
#RUN ls -al /tmp && ls -al
VOLUME [ "/data" ]
EXPOSE 5173
#ENTRYPOINT ["/tmp/entrypoint.sh"]
CMD [ "pnpm", "dev:web" ]

# Prod Stage
#FROM base AS prod
#RUN adduser --disabled-password --no-create-home --shell=/bin/false nonroot
#RUN groupadd -g 1001 nonroot && \
#    useradd -u 1001 -g nonroot -m -d /usr/src/app -s /bin/false nonroot
#WORKDIR /usr/src/app

# Entrypoint
#RUN ls -al /tmp && ls -al
#VOLUME [ "/data" ]
#EXPOSE 8080
#CMD [ "pnpm", "start:web" ]
# NGINX

FROM docker.io/nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine${ALPINE_VERSION}-slim AS prod
COPY --from=build /usr/src/app/packages/client/dist /usr/share/nginx/html
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf
