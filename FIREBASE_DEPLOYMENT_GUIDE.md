# TRILLIONER LINK Firebase Deployment Guide

This project now contains an optional Firebase authentication boundary. The browser adapter remains inactive until the Firebase Web variables are present, so local development and the existing backend session can continue while deployment configuration is completed.

## Firebase Web App variables

Add the following variables to the **Vercel or Render environment used to build the web client**. Use the values from Firebase Console → Project settings → Your apps → Web app. Do not add quotes around values.

| Variable | Firebase Console source | Exposure | Required |
|---|---|---:|---:|
| `VITE_FIREBASE_API_KEY` | Web app config → `apiKey` | Browser-visible | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Web app config → `authDomain` | Browser-visible | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Web app config → `projectId` | Browser-visible | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Web app config → `storageBucket` | Browser-visible | Recommended |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Web app config → `messagingSenderId` | Browser-visible | Recommended |
| `VITE_FIREBASE_APP_ID` | Web app config → `appId` | Browser-visible | Yes |

These values identify the Firebase Web application; they are not service-account credentials. Restrict the Web API key in Google Cloud Console where appropriate, but do not attempt to hide it in frontend code.

## Firebase Android app

The Android app should use the same Firebase project ID as the Web app. Register the Android package name in Firebase Console, download `google-services.json`, and place it in the Android application’s native configuration directory. Do not put `google-services.json` inside this Vite web project and do not convert its values into frontend secrets. Android authentication uses the same Firebase users as the Web app when both apps point to the same Firebase project.

For Expo or React Native builds, configure the native Firebase application through the mobile build system and keep the Web `VITE_FIREBASE_*` variables separate from Android native configuration. The Android client may use Google Sign-In and email/password through the Firebase Android SDK; the server must still verify the resulting Firebase ID token.

## Server-only verification variable

Add this variable only to the **server runtime** on Vercel or Render, never to a `VITE_*` variable and never to browser code:

| Variable | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64-encoded Firebase Admin service-account JSON used by `server/firebaseAuth.ts` to verify Firebase ID tokens. |

Create the service account in Firebase Console → Project settings → Service accounts → Generate new private key. Base64-encode the complete JSON file as one line, then add that one-line value to the server environment. Keep the original JSON outside the repository, do not commit it, and rotate the key if it is exposed.

## Authentication activation sequence

Enable **Google** and **Email/Password** under Firebase Console → Authentication → Sign-in method. Add the deployed web domain under Authentication → Settings → Authorized domains. Then add the Web variables to the deployment environment and redeploy. The server-side verifier becomes available after `FIREBASE_SERVICE_ACCOUNT_BASE64` is present.

The code intentionally keeps Firebase configuration optional until these variables are supplied. This prevents a blank screen or an invalid Firebase initialization during development. The browser adapter is in `client/src/lib/firebase.ts`, while the server-only verifier is in `server/firebaseAuth.ts`.

## Security boundaries

Never place `FIREBASE_SERVICE_ACCOUNT_BASE64`, a private key, or a service-account JSON document in the browser, `VITE_*` variables, GitHub, or Android client source. Firebase Web API keys and app identifiers are designed to be present in client configuration; authorization rules, Firebase Security Rules, and server-side ID-token verification provide the security boundary.

## Current implementation note

The existing application session procedures remain the source of the current authenticated server context until the Firebase ID-token exchange route is enabled. This separation is deliberate: it allows Web and Android Firebase clients to be configured first, followed by a controlled server session bridge that maps verified Firebase users to the existing shared user records.
