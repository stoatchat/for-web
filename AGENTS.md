# Stoat Chat (Frontend) — AGENTS.md

Self-hosted chat platform (Discord alternative). A fork of [Revolt Chat](https://github.com/revoltchat) by
[stoatchat](https://github.com/stoatchat), customized with Authentik OIDC SSO.

## Architecture

**Frontend** — Solid.js + Vite + pnpm workspace. Material Design 3 (MDUI).

## SSO flow (end-to-end)

```
User clicks "Log In with SSO"
  → GET /api/auth/sso/login (backend)
  → 302 → Authentik OIDC authorize
  → User authenticates on Authentik
  → Authentik redirects → GET /api/auth/sso/callback?code=... (backend)
  → backend exchanges code for token, fetches userinfo
  → creates/finds account in MongoDB, creates session
  → 302 → /login/sso?token=SESSION_TOKEN
  → FlowSSO reads token, injects session, user is logged in
```

## SSO code map (frontend)

- `packages/client/components/auth/src/flows/FlowSSO.tsx` — new file, `/login/sso` route, reads `?token=` from URL
- `packages/client/components/auth/src/flows/FlowHome.tsx` — rewritten: stripped email/password UI, replaced with SSO-only button
- `packages/client/components/auth/src/flows/FlowLogin.tsx` — rewritten: stripped email/password form, replaced with SSO-only button
- `packages/client/src/index.tsx` — imports FlowSSO, mounts at path `/sso`; removed dead flows (FlowCreate, FlowVerify, FlowReset, FlowDeleteAccount)
- `packages/client/components/client/Controller.ts` — logout redirects to `/auth/sso/end-session?session_token=...`

## Fork maintenance strategy

This is a fork of [stoatchat/stoatchat](https://github.com/stoatchat/stoatchat). Upstream releases
are tagged as `vX.Y.Z` on GitHub. The customizations are:

### Files modified by us (conflict surface)

| File | Risk | Notes |
|------|------|-------|
| `packages/client/src/index.tsx` | Low | +2 lines (import + route), removed dead flow routes |
| `packages/client/components/auth/src/flows/FlowHome.tsx` | **High** | Completely rewritten (~77 lines removed, ~31 added). Conflicts on every upstream change. |
| `packages/client/components/auth/src/flows/FlowLogin.tsx` | **High** | Completely rewritten (~94 lines removed, ~31 added). Same pattern. |
| `packages/client/components/client/Controller.ts` | Low | +3 lines for SSO end-session redirect on logout |

### Files added by us (no upstream conflict)

- `packages/client/components/auth/src/flows/FlowSSO.tsx` (1 file, ~88 lines)

### Files deleted by us

- `packages/client/components/auth/src/flows/FlowCreate.tsx`
- `packages/client/components/auth/src/flows/FlowDelete.tsx`
- `packages/client/components/auth/src/flows/FlowReset.tsx`
- `packages/client/components/auth/src/flows/FlowVerify.tsx`
- i18n catalogs: `packages/client/components/i18n/catalogs/` (~60 locale directories)

### Recommended strategy

**Primary approach — periodic rebase on upstream tags:**

1. Add `upstream` remote: `git remote add upstream https://github.com/stoatchat/stoatchat.git`
2. On each upstream release: `git fetch upstream && git rebase upstream/vX.Y.Z`
3. Resolve ~2 high-risk conflicts (FlowHome, FlowLogin) by re-applying our stripped-down versions
4. Resolve 0-1 low-risk conflicts (index.tsx — trivial one-liners)

**Conflict resolution recipe for FlowHome/FlowLogin:**
Always prefer our version (SSO-only). The stripped-down UI is simpler and changes rarely. If upstream
adds a new feature to FlowHome that we need (unlikely), evaluate whether to rebuild our SSO-only
version or refactor the SSO button as an addition rather than a replacement.
