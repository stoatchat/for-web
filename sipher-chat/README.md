# Sipher Chat

A Discord-style chat app built on Firebase (Auth + Cloud Firestore), with no build step.
The entry point is **`index.svg`**: an SVG document that hosts the UI in a
`<foreignObject>` and loads its stylesheet and ES modules from separate files.

## Features

- Email/password and Google sign-in, password reset
- Servers: create, rename, delete, leave
- Invite links/codes to join a server, with reset
- Text channels: create, rename, delete (server owner)
- Real-time messages with grouping, day dividers, edit/delete, and light markdown
  (`**bold**`, `*italic*`, `` `code` ``, ` ```code blocks``` `, links)
- Member list with online/offline presence; owners can kick members
- Unsent drafts kept per channel; press ↑ in an empty composer to edit your last message
- Responsive layout with a slide-out sidebar on phones

## Layout

```
index.svg            entry point: SVG shell + <foreignObject> root
css/styles.css       theme and layout (linked via <?xml-stylesheet?>)
js/shim.js           makes the SVG document HTML-friendly for the Firebase SDK
js/firebase.js       Firebase config and initialization (app, auth, firestore, analytics)
js/api.js            all Firestore reads/writes and the data model
js/dom.js            DOM helpers (XHTML-namespaced element builder, icons, avatars, toasts)
js/main.js           app state, routing, listeners and actions
js/ui/*.js           auth screen, server rail, channel sidebar, chat pane, member list, modals
firestore.rules      security rules
firebase.json        Firebase Hosting + Firestore config
```

## Firebase setup

In the [Firebase console](https://console.firebase.google.com/project/sipher-e3cfb):

1. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
2. **Authentication → Settings → Authorized domains:** add any domain you serve from
   (`localhost` is there by default).
3. **Firestore Database:** create a database if you haven't yet.
4. Deploy the security rules (the app relies on them for access control):

   ```sh
   npm install -g firebase-tools
   firebase login
   cd sipher-chat
   firebase deploy --only firestore:rules
   ```

## Running locally

The files are ES modules, so serve them over HTTP rather than opening from `file://`:

```sh
cd sipher-chat
npx serve .          # or: python3 -m http.server 8080
```

Then open `http://localhost:3000/index.svg` (or `:8080/index.svg`).

### Against the local emulators

To develop without touching the real project, run the Auth and Firestore emulators
(they load `firestore.rules` automatically) and add `?emulator` to the URL:

```sh
cd sipher-chat
firebase emulators:start      # serves the app on :5000 too
```

Open `http://localhost:5000/index.svg?emulator`.

## Deploying

```sh
cd sipher-chat
firebase deploy      # hosting + rules
```

`firebase.json` redirects `/` to `/index.svg`.

## Notes

- The Firebase web config in `js/firebase.js` is public by design; Firestore rules enforce access.
- Deleting a server removes its channels, members and invite. Messages are left orphaned but
  unreadable; purge them with `firebase firestore:delete --recursive servers/<id>` if needed.
- Because the page is an SVG (XML) document, UI code must build elements with
  `createElementNS` (see `js/dom.js`) and avoid `innerHTML`.
