# Sipher setup

This repo is a rebranded fork of the Stoat web client. The app's name, logo
(purple lightning bolt), page title, PWA manifest and app icons now say
**Sipher**.

## Where the logo files are

All brand images are in `packages/client/scripts/assets_fallback/web/`:

| File                   | Used for                                     |
| ---------------------- | -------------------------------------------- |
| `wordmark.svg`         | Bolt + "sipher" logo (login, home, titlebar) |
| `monochrome.svg`       | Single-colour bolt icon                      |
| `icon.ico`             | Browser tab icon                             |
| `android-chrome-*.png` | Install / home-screen icons                  |
| `masking-512x512.png`  | Android adaptive icon                        |

Don't run `mise assets` (or `mise install:assets`). It pulls Stoat's private
brand assets, which replace the Sipher ones.

## Account emails (why they still come from Stoat)

The **"verify your account"** and **"reset your password"** emails don't come
from this repo. Stoat's backend server (`api.stoat.chat`) sends them, using
Stoat's own mail server and templates. While the app points at `api.stoat.chat`,
accounts live on Stoat's servers and Stoat sends the emails. Nothing in the
frontend can change that.

You can get Sipher-branded emails in one of two ways:

1. **Run your own backend.** Self-host the Stoat backend
   (https://github.com/stoatchat/self-hosted) on a VPS, set its SMTP settings
   and email templates to Sipher, then build this client with `VITE_API_URL`
   and `VITE_HOST` pointing at it. InfinityFree **can't** host the backend.
   It only serves PHP and static files, with no Docker and no websockets.
2. **Use Firebase Auth for your own accounts.** Firebase can send
   Sipher-branded emails (see below). Firebase accounts are separate from the
   chat accounts, though, so this only helps for features you build on
   Firebase yourself.

## Linking Firebase

The Firebase SDK is installed, and `packages/client/components/common/lib/firebase.ts`
holds the connection code.

1. Go to https://console.firebase.google.com → **Add project** → name it `Sipher`.
2. **Project settings → General → Your apps →** click the `</>` (Web) icon,
   name it `Sipher Web` and register it. Firebase shows a `firebaseConfig`
   object.
3. Copy `packages/client/.env.example` to `packages/client/.env` and fill in the
   values from that object:

   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=sipher-xxxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=sipher-xxxx
   VITE_FIREBASE_STORAGE_BUCKET=sipher-xxxx.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
   ```

   These values are public client config, not secrets. They end up in the built
   JavaScript.

4. **Authentication → Get started → Sign-in method →** enable **Email/Password**.
5. **Authentication → Settings → Authorized domains →** add your InfinityFree
   domain (for example `sipher.infinityfreeapp.com`, or your custom domain).
6. **Authentication → Templates →** for each template (Email address
   verification, Password reset, Email address change):
   - click the pencil, set **Sender name** to `Sipher`
   - set the **Subject** (for example `Verify your Sipher account`) and edit
     the message text
   - optional: **Customize domain** to send from `noreply@your-domain`. This
     needs DNS records at your domain registrar.

To use it in code:

```ts
import { createUserWithEmailAndPassword } from "firebase/auth";

import {
  getFirebaseAuth,
  sendSipherVerificationEmail,
} from "@revolt/common/lib/firebase";

const auth = getFirebaseAuth();
if (auth) {
  await createUserWithEmailAndPassword(auth, email, password);
  await sendSipherVerificationEmail(); // sent using your "Sipher" template
}
```

## Hosting on InfinityFree

InfinityFree serves static files, which is all this client needs.

1. Install the tools (see `README.md`), then build:

   ```bash
   mise install:frozen
   mise build:deps
   mise build          # output goes to packages/client/dist
   ```

2. In the InfinityFree control panel, open **File Manager** (or connect with
   FTP using FileZilla and the FTP details from the panel).
3. Delete the default files in `htdocs/`, then upload **everything inside**
   `packages/client/dist/` into `htdocs/`, including the hidden `.htaccess`
   file. `.htaccess` sends routes like `/login` and `/server/...` to
   `index.html`. Without it, refreshing those pages gives a 404.
4. Turn on **SSL** for the domain in the control panel. Login, notifications
   and installing the app all need HTTPS.

Note: Firebase values are compiled in at build time. Change `.env`, rebuild,
and upload again.
