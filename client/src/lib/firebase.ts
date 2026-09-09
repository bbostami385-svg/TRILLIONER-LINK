import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, type Auth } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"] as const;
export const firebaseConfigured = requiredKeys.every((key) => Boolean(config[key]));

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* variables in the deployment environment.");
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
