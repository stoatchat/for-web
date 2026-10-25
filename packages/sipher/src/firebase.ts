import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

/**
 * Firebase web config (Project settings → Your apps). These values are
 * public by design; access is controlled by firestore.rules.
 */
const firebaseConfig = {
  apiKey: "AIzaSyA8fHkptfmPebRju9ZlOgE9eTljuXqyRnI",
  authDomain: "sipher-e3cfb.firebaseapp.com",
  projectId: "sipher-e3cfb",
  storageBucket: "sipher-e3cfb.firebasestorage.app",
  messagingSenderId: "508514132309",
  appId: "1:508514132309:web:2ac1945b3cb57342648fdc",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// local testing against `firebase emulators:start`
if (import.meta.env.VITE_USE_EMULATORS) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
