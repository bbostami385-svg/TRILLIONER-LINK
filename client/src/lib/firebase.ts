import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, type Auth } from "firebase/auth";

export function normalizeFirebaseAuthDomain(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const candidate = value.trim().replace(/^https?:\/\//i, "").split("/")[0];
  try {
    const parsed = new URL(`https://${candidate}`);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: normalizeFirebaseAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"] as const;
export const firebaseConfigured = requiredKeys.every((key) => Boolean(config[key]));
export const firebaseConfigError = firebaseConfigured ? null : "Firebase requires valid VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID values.";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) throw new Error(firebaseConfigError ?? "Firebase configuration is invalid.");
  app = app ?? (getApps()[0] ?? initializeApp(config));
  auth = auth ?? getAuth(app);
  return auth;
}

export async function signInWithGoogle() {
  return signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
}

export async function signInWithFirebaseEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function createFirebaseAccount(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function requestFirebasePasswordReset(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email);
}
