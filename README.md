<div align="center">
<h1>
  Stoat Frontend
  
  [![Stars](https://img.shields.io/github/stars/stoatchat/for-web?style=flat-square&logoColor=white)](https://github.com/stoatchat/for-web/stargazers)
  [![Forks](https://img.shields.io/github/forks/stoatchat/for-web?style=flat-square&logoColor=white)](https://github.com/stoatchat/for-web/network/members)
  [![Pull Requests](https://img.shields.io/github/issues-pr/stoatchat/for-web?style=flat-square&logoColor=white)](https://github.com/stoatchat/for-web/pulls)
  [![Issues](https://img.shields.io/github/issues/stoatchat/for-web?style=flat-square&logoColor=white)](https://github.com/stoatchat/for-web/issues)
  [![Contributors](https://img.shields.io/github/contributors/stoatchat/for-web?style=flat-square&logoColor=white)](https://github.com/stoatchat/for-web/graphs/contributors)
  [![License](https://img.shields.io/github/license/stoatchat/for-web?style=flat-square&logoColor=white)](https://github.com/stoatchat/for-web/blob/main/LICENSE)
</h1>
The official web client powering https://beta.revolt.chat/app, built with <a href="https://www.solidjs.com/">Solid.js</a> 💖. <br/>
Track the project roadmap on <a href="https://op.revolt.wtf/projects/revolt-for-web/roadmap">OpenProject</a>.
</div>
<br/>

## Development Guide

Before contributing, make yourself familiar with [our contribution guidelines](https://developers.revolt.chat/contrib.html), the [code style guidelines](./GUIDELINES.md), and the [technical documentation for this project](https://revoltchat.github.io/frontend/).

Before getting started, you'll want to install:

- Git
- Node.js
- pnpm (run `corepack enable`)

Then proceed to setup:

```bash
# clone the repository
git clone --recursive https://github.com/stoatchat/for-web client
cd client

# update submodules if you pull new changes
# git submodule init && git submodule update

# install all packages
pnpm i --frozen-lockfile

# build deps:
pnpm build:deps

# or build a specific dep (e.g. stoat.js updates):
# pnpm --filter stoat.js run build

# customise the .env
cp packages/client/.env.example packages/client/.env

# run dev server
pnpm dev:web
```

Finally, navigate to http://local.revolt.chat:5173.

### Pulling in Stoat's brand assets

If you want to pull in Stoat brand assets after pulling, run the following:

```bash
# update the assets
git -c submodule."packages/client/assets".update=checkout submodule update --init packages/client/assets
```

You can switch back to the fallback assets by running deinit and continuing as normal:

```bash
# deinit submodule which clears directory
git submodule deinit packages/client/assets
```

## Deployment Guide

### Build the app

```bash
# install packages
pnpm i --frozen-lockfile

# build dependencies
pnpm build:deps

# build for web
pnpm build:web

# ... when building for Stoat production, use this instead of :web
pnpm build:prod
```

You can now deploy the directory `packages/client/dist`.

### Routing Information

The app currently needs the following routes:

- `/login`
- `/pwa`
- `/dev`
- `/discover`
- `/settings`
- `/invite`
- `/bot`
- `/friends`
- `/server`
- `/channel`

This corresponds to [Content.tsx#L33](packages/client/src/index.tsx).
