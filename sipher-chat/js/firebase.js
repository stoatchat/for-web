// Firebase setup. The SDK is loaded straight from Google's CDN as ES modules,
// so there is no build step: serve this folder and open index.svg.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getAnalytics,
  isSupported as analyticsSupported,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-analytics.js";
import {
  connectAuthEmulator,
  getAuth,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  connectFirestoreEmulator,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Firebase web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = {
  apiKey: "AIzaSyA8fHkptfmPebRju9ZlOgE9eTljuXqyRnI",
  authDomain: "sipher-e3cfb.firebaseapp.com",
  projectId: "sipher-e3cfb",
  storageBucket: "sipher-e3cfb.firebasestorage.app",
  messagingSenderId: "508514132309",
  appId: "1:508514132309:web:2ac1945b3cb57342648fdc",
  measurementId: "G-ZLX9FPVGPN",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Open index.svg?emulator to use the local Firebase emulators (firebase emulators:start).
export const usingEmulator = new URLSearchParams(location.search).has(
  "emulator",
);
if (usingEmulator) {
  connectAuthEmulator(auth, `http://${location.hostname}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, location.hostname, 8080);
}

// Analytics is optional; it isn't available everywhere (e.g. file://, some privacy modes).
export let analytics = null;
analyticsSupported()
  .then((ok) => {
    if (ok && !usingEmulator) analytics = getAnalytics(app);
  })
  .catch((err) => console.warn("Analytics disabled:", err));
