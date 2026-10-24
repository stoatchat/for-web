import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth, sendEmailVerification } from "firebase/auth";

/**
 * Firebase web config, read from `VITE_FIREBASE_*` env vars
 * (Firebase Console → Project settings → Your apps → Web app)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
    | string
    | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** If Firebase has been configured for this build */
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

/**
 * Get the Firebase app, initialising it on first use
 * @returns Firebase app, or undefined if not configured
 */
export function getFirebaseApp(): FirebaseApp | undefined {
  if (!isFirebaseConfigured) return undefined;
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

/**
 * Get Firebase Auth
 * @returns Firebase Auth, or undefined if not configured
 */
export function getFirebaseAuth(): Auth | undefined {
  const app = getFirebaseApp();
  return app ? getAuth(app) : undefined;
}

/**
 * Send the signed in Firebase user a verification email.
 * The sender name and wording come from the Firebase Console
 * (Authentication → Templates), so set those to Sipher there.
 */
export async function sendSipherVerificationEmail() {
  const user = getFirebaseAuth()?.currentUser;
  if (!user) throw new Error("No Firebase user is signed in");

  await sendEmailVerification(user, {
    url: window.location.origin + "/login",
  });
}
