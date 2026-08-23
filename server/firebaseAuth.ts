import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseApp: App | null = null;

export const firebaseServerConfigured = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);

function getFirebaseApp() {
  if (!firebaseServerConfigured) throw new Error("Firebase server auth is not configured. Add FIREBASE_SERVICE_ACCOUNT_BASE64 in the deployment environment.");
  if (firebaseApp) return firebaseApp;
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!;
  const credentials = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  firebaseApp = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
  return firebaseApp;
}

/** Verify a Firebase ID token without exposing service-account material to the browser. */
export async function verifyFirebaseIdToken(idToken: string) {
  if (!idToken.trim()) throw new Error("A Firebase ID token is required.");
  return getAuth(getFirebaseApp()).verifyIdToken(idToken, true);
}
