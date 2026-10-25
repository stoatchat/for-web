# Sipher setup

This repo has two versions of Sipher:

| Folder            | What it is                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `packages/sipher` | **Sipher on Firebase.** Its own accounts, servers, channels and DMs. Emails say Sipher. This is the one to host. |
| `packages/client` | The rebranded Stoat web client. Accounts and chats live on Stoat's servers, and its emails come from Stoat.      |

## Sipher on Firebase (`packages/sipher`)

### Features

- Sign up, log in and password reset, with emails from Firebase that you can
  brand as Sipher
- Email verification required before chatting
- Unique usernames plus a display name you can change
- Every new account joins **Da Group** automatically. The first account ever
  created becomes its owner.
- Servers with text channels and real-time messages
- Invite links (`https://your-site/#join=CODE`) to join a server
- Direct messages: click someone in a member list, or use **New message**
- Server owners can create and delete channels, delete any message and remove
  members. Everyone can delete their own messages.

Not included: voice or video calls, and image or file uploads (Firebase
Storage needs a billing account).

### One-time Firebase Console setup

Project: `sipher-e3cfb` (https://console.firebase.google.com)

1. **Authentication → Get started → Sign-in method →** enable
   **Email/Password**.
2. **Firestore Database → Create database →** pick a location near you →
   **Start in production mode**.
3. **Firestore Database → Rules →** delete what's there, paste the whole of
   `packages/sipher/firestore.rules` and click **Publish**. Without this step,
   nothing loads ("You don't have permission").
4. **Project settings → General → Public-facing name →** `Sipher`. Emails use
   this name.
5. **Authentication → Templates →** for **Email address verification** and
   **Password reset**, click the pencil and set **Sender name** to `Sipher`.
   You can also edit the subject and wording.
6. **Authentication → Settings → Authorized domains →** add the domain you
   host on (for example `sipher.nichesite.org`).

### Become the owner of Da Group

Da Group is created by the first account that finishes signing up, and that
account is its owner. **Sign up yourself first**, right after the site goes
live.

If someone else gets there first, open **Firestore Database → Data →
servers → da-group** in the console and change `ownerId` to your user ID.
Your user ID is under **Authentication → Users**.

### Build and host

```bash
pnpm install
pnpm --filter sipher build    # output: packages/sipher/dist
```

Upload everything inside `packages/sipher/dist/` to your host's main folder.
It's six files, and it needs no `.htaccess` or redirect settings.

### Test locally

```bash
cd packages/sipher
npx firebase-tools emulators:start --project sipher-e3cfb --only auth,firestore
# in another terminal:
VITE_USE_EMULATORS=1 pnpm dev   # app against the local emulators
pnpm test                       # security rule tests
```

## Rebranded Stoat client (`packages/client`)

The Stoat client's brand images are in
`packages/client/scripts/assets_fallback/web/`. Don't run `mise assets`. It
pulls Stoat's private brand assets, which replace the Sipher ones.

Its sign-up and password emails come from Stoat's servers, and nothing in this
repo can change them. Build it with `mise build` (output in
`packages/client/dist`, including an `.htaccess` for page routing).
