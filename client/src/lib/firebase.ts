import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, type Auth } from "firebase/auth";

export function getFirebaseErrorMessage(error: unknown, fallback = "Authentication failed. Please try again."): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
  const messages: Record<string, string> = {
    "auth/popup-closed-by-user": "Google sign-in was cancelled. You can try again whenever you’re ready.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
    "auth/unauthorized-domain": "This domain is not authorized for Firebase login. Add it in Firebase Authentication settings.",
    "auth/network-request-failed": "We couldn’t reach Firebase. Check your internet connection and try again.",
    "auth/invalid-credential": "The sign-in details are invalid or expired. Please try again.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-disabled": "This account has been disabled. Contact support for help.",
    "auth/user-not-found": "No account was found with this email address.",
    "auth/wrong-password": "The password is incorrect. Try again or reset it.",
    "auth/email-already-in-use": "An account already exists with this email address. Try signing in instead.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/too-many-requests": "There have been too many attempts. Wait a moment and try again.",
  };
  if (code && messages[code]) return messages[code];
  if (error instanceof Error && error.message && !error.message.startsWith("FirebaseError")) return error.message;
  return fallback;
}

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
