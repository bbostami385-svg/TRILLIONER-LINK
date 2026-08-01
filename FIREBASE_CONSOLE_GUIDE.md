# Firebase Console Guide - Getting Missing Values

This guide explains how to obtain all the required Firebase credentials and environment variables needed for the TRILLIONER LINK project to work properly on both Web and Android platforms.

---

## 📋 Overview of Required Values

### Web App Environment Variables
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Server (Backend) Environment Variables
```
FIREBASE_TYPE
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_CLIENT_ID
FIREBASE_AUTH_URI
FIREBASE_TOKEN_URI
FIREBASE_AUTH_PROVIDER_CERT_URL
FIREBASE_CLIENT_CERT_URL
```

### Android App Configuration
```
google-services.json (placed in android/app/)
```

---

## 🚀 Step-by-Step Instructions

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `TRILLIONER-LINK` (or your preferred name)
4. Accept the terms and click **"Create project"**
5. Wait for the project to be created (usually takes 1-2 minutes)

---

### Step 2: Get Web App Configuration

#### 2.1 Register Web App

1. In Firebase Console, click the **gear icon** (⚙️) → **Project Settings**
2. Scroll down to **"Your apps"** section
3. Click **"Web"** icon (looks like `</>`):
   - App nickname: `TRILLIONER-LINK Web`
   - Check "Also set up Firebase Hosting for this app" (optional)
   - Click **"Register app"**

#### 2.2 Copy Web App Credentials

After registration, you'll see a code snippet like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "trillioner-link.firebaseapp.com",
  projectId: "trillioner-link",
  storageBucket: "trillioner-link.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

**Map these values to environment variables:**

| Firebase Config | Environment Variable |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

---

### Step 3: Get Android App Configuration

#### 3.1 Register Android App

1. In Firebase Console, click **"Add app"** → **"Android"**
2. Fill in the details:
   - **Android package name:** `com.trillionerlink` (or your package name)
   - **App nickname:** `TRILLIONER-LINK Android` (optional)
   - **Debug signing certificate SHA-1:** (see Step 3.2 below)
3. Click **"Register app"**

#### 3.2 Get Debug SHA-1 Certificate

Run this command to get your debug SHA-1:

**On Windows (Git Bash):**
```bash
cd %USERPROFILE%\.android
keytool -list -v -alias androiddebugkey -keystore debug.keystore -storepass android -keypass android
```

**On macOS/Linux:**
```bash
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
```

Look for the line starting with `SHA1:` and copy that value.

#### 3.3 Download google-services.json

1. After registering the Android app, click **"Download google-services.json"**
2. Place the file at: `android/app/google-services.json`
3. This file contains all necessary Android configurations

---

### Step 4: Get Service Account Credentials (Backend)

#### 4.1 Create Service Account

1. In Firebase Console, click **gear icon** (⚙️) → **Project Settings**
2. Go to **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. A JSON file will download - this contains all your backend credentials

#### 4.2 Extract Backend Environment Variables

The downloaded JSON file contains these fields:

```json
{
  "type": "service_account",
  "project_id": "trillioner-link",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xyz@trillioner-link.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Map these to environment variables:**

| JSON Field | Environment Variable |
|---|---|
| `type` | `FIREBASE_TYPE` |
| `project_id` | `FIREBASE_PROJECT_ID` |
| `private_key_id` | `FIREBASE_PRIVATE_KEY_ID` |
| `private_key` | `FIREBASE_PRIVATE_KEY` |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `client_id` | `FIREBASE_CLIENT_ID` |
| `auth_uri` | `FIREBASE_AUTH_URI` |
| `token_uri` | `FIREBASE_TOKEN_URI` |
| `auth_provider_x509_cert_url` | `FIREBASE_AUTH_PROVIDER_CERT_URL` |
| `client_x509_cert_url` | `FIREBASE_CLIENT_CERT_URL` |

---

## ⚙️ Vercel Deployment Setup

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add all the variables from Step 2 and Step 4 above

**Web App Variables (from Firebase Config):**
```
VITE_FIREBASE_API_KEY = AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN = trillioner-link.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = trillioner-link
VITE_FIREBASE_STORAGE_BUCKET = trillioner-link.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID = 1:123456789:web:abc123def456
```

**Backend Variables (from Service Account JSON):**
```
FIREBASE_TYPE = service_account
FIREBASE_PROJECT_ID = trillioner-link
FIREBASE_PRIVATE_KEY_ID = abc123...
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xyz@trillioner-link.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = 123456789
FIREBASE_AUTH_URI = https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI = https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL = https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL = https://www.googleapis.com/robot/v1/metadata/x509/...
```

### Step 2: Redeploy on Vercel

1. After adding all environment variables, click **"Redeploy"** in the Deployments tab
2. Wait for the build to complete
3. Your app should now work with Firebase authentication

---

## 🔒 Security Best Practices

1. **Never commit credentials** - Keep `.env.local` in `.gitignore`
2. **Use Vercel's environment variables** - Don't hardcode credentials
3. **Restrict API keys** - In Firebase Console:
   - Go to **APIs & Services** → **Credentials**
   - Click on your API key
   - Restrict to Web/Android only
4. **Use Firebase Security Rules** - Protect your database and storage
5. **Enable authentication** - Only allow registered users

---

## ✅ Verification Checklist

After setting up all variables:

- [ ] Web app can load and show login page
- [ ] Google Sign-In button works
- [ ] User can create account with email/password
- [ ] User can log in successfully
- [ ] Android app can authenticate with Firebase
- [ ] No console errors related to Firebase
- [ ] Vercel deployment shows no build errors

---

## 🆘 Troubleshooting

### Issue: "Firebase is not defined"
**Solution:** Make sure all `VITE_FIREBASE_*` variables are set in `.env.local` or Vercel

### Issue: "apiKey is invalid"
**Solution:** Check that `VITE_FIREBASE_API_KEY` is correct and matches Firebase Console

### Issue: "Project ID mismatch"
**Solution:** Ensure `VITE_FIREBASE_PROJECT_ID` matches the project name in Firebase Console

### Issue: "Service account key is invalid"
**Solution:** Download a fresh service account key from Firebase Console

### Issue: Android app won't authenticate
**Solution:** 
1. Verify `google-services.json` is in `android/app/`
2. Check that SHA-1 certificate matches in Firebase Console
3. Ensure package name is correct

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

**Last Updated:** August 1, 2026
**Project:** TRILLIONER LINK
**Status:** Complete
