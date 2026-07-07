# 🌐 TRILLIONER LINK - Environment Variables Complete Guide

**Firebase Project:** `trillioner-link`
**Platforms:** Android App + Web App (Vercel)

---

## 📱 ANDROID APP Environment Variables

### firebase.properties (Android Project Root)

```properties
# Firebase Project Configuration
firebase.project_id=trillioner-link
firebase.api_key=AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY
firebase.storage_bucket=trillioner-link.firebasestorage.app
firebase.database_url=https://trillioner-link-default-rtdb.asia-southeast1.firebasedatabase.app
```

### google-services.json (android/app/)

**Location:** `android/app/google-services.json`

**Content:** Already provided in your google-services.json file

```json
{
  "project_info": {
    "project_number": "364286702954",
    "firebase_url": "https://trillioner-link-default-rtdb.asia-southeast1.firebasedatabase.app",
    "project_id": "trillioner-link",
    "storage_bucket": "trillioner-link.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:364286702954:android:f4e23f933eaf82bbac6113",
        "android_client_info": {
          "package_name": "com.trillionerlink"
        }
      },
      "oauth_client": [
        {
          "client_id": "364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY"
        }
      ]
    }
  ]
}
```

### Android build.gradle Configuration

**File:** `android/app/build.gradle`

```gradle
plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'  // Firebase plugin
}

android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.trillionerlink"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
        
        // Firebase configuration
        manifestPlaceholders = [
            firebaseProjectId: "trillioner-link",
            firebaseApiKey: "AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY"
        ]
    }
}

dependencies {
    // Firebase
    implementation 'com.google.firebase:firebase-auth:22.1.0'
    implementation 'com.google.firebase:firebase-firestore:24.7.0'
    implementation 'com.google.firebase:firebase-storage:20.2.0'
    implementation 'com.google.firebase:firebase-realtime-database:20.2.0'
    
    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

### Android Manifest Configuration

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Firebase Configuration -->
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="high_importance_channel" />
    
    <!-- Google Sign-In Configuration -->
    <meta-data
        android:name="com.google.android.gms.version"
        android:value="@integer/google_play_services_version" />
    
</manifest>
```

---

## 🌐 WEB APP Environment Variables (Vercel)

### Frontend Variables (VITE_*)

These variables are accessible in the browser and frontend code.

#### Step 1: Add to Vercel Dashboard

**Path:** Vercel Dashboard → Project Settings → Environment Variables

| Variable | Value | Type | Environments |
|----------|-------|------|--------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY` | Sensitive | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | `trillioner-link.firebaseapp.com` | Sensitive | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | `trillioner-link` | Sensitive | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | `trillioner-link.firebasestorage.app` | Sensitive | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `364286702954` | Sensitive | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | *Get from Firebase Console* | Sensitive | Production, Preview, Development |
| `VITE_API_URL` | `https://your-vercel-domain.vercel.app` | Sensitive | Production, Preview, Development |

### Backend Variables (Server-side only)

These variables are NOT accessible in the browser - only on the server.

#### Step 2: Add Backend Variables to Vercel

| Variable | Value | Type | Environments |
|----------|-------|------|--------------|
| `FIREBASE_CLIENT_ID` | `364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com` | Sensitive | Production, Preview, Development |
| `FIREBASE_AUTH_URI` | `https://accounts.google.com/o/oauth2/auth` | Sensitive | Production, Preview, Development |
| `FIREBASE_AUTH_PROVIDER_CERT_URL` | `https://www.googleapis.com/oauth2/v1/certs` | Sensitive | Production, Preview, Development |
| `FIREBASE_CLIENT_CERT_URL` | *Get from Service Account* | Sensitive | Production, Preview, Development |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | *Base64 encoded Service Account JSON* | Sensitive | Production, Preview, Development |
| `JWT_SECRET` | *Generate random secret* | Sensitive | Production, Preview, Development |
| `DATABASE_URL` | *Your database connection string* | Sensitive | Production, Preview, Development |

### Local Development (.env.local)

**File:** `.env.local` (Don't commit to Git)

```env
# Frontend (VITE_*)
VITE_FIREBASE_API_KEY=AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY
VITE_FIREBASE_AUTH_DOMAIN=trillioner-link.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trillioner-link
VITE_FIREBASE_STORAGE_BUCKET=trillioner-link.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=364286702954
VITE_FIREBASE_APP_ID=1:364286702954:web:your_web_app_id
VITE_API_URL=http://localhost:3000

# Backend
FIREBASE_CLIENT_ID=364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=your_service_account_cert_url
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account_json
JWT_SECRET=your_random_jwt_secret_here
DATABASE_URL=your_database_connection_string
```

---

## 🔑 How to Get Missing Values

### 1. VITE_FIREBASE_APP_ID

**Steps:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: `trillioner-link`
3. Go to Project Settings
4. Find "Your apps" section
5. Look for Web app
6. If not exists, click "Add app" → "Web"
7. Copy the `appId` value

**Format:** `1:364286702954:web:xxxxxxxxxxxxx`

### 2. FIREBASE_CLIENT_CERT_URL

**Steps:**
1. Firebase Console → Project Settings
2. Go to "Service Accounts" tab
3. Click "Generate New Private Key"
4. Download JSON file
5. Open JSON file and find `client_cert_url` field
6. Copy the URL

### 3. FIREBASE_SERVICE_ACCOUNT_BASE64

**Steps:**
1. Download Service Account JSON (see above)
2. Convert to Base64:

**Linux/Mac:**
```bash
cat firebase-service-account.json | base64
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("firebase-service-account.json"))
```

**Online Tool:**
- Visit: https://www.base64encode.org/
- Upload the JSON file
- Copy the Base64 output

### 4. JWT_SECRET

**Generate random secret:**

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Online Generator:**
- Visit: https://generate-random.org/
- Generate 32-character random string

### 5. DATABASE_URL

**If using Firebase Realtime Database:**
```
https://trillioner-link-default-rtdb.asia-southeast1.firebasedatabase.app
```

**If using other database:**
- Use your database connection string

---

## 📋 Setup Checklist

### Android App Setup
- [ ] Copied google-services.json to `android/app/`
- [ ] Updated `build.gradle` with Firebase plugin
- [ ] Added Firebase dependencies
- [ ] Updated `AndroidManifest.xml`
- [ ] Synced Android Studio
- [ ] Built and tested Android app

### Web App Setup (Vercel)
- [ ] Got VITE_FIREBASE_APP_ID from Firebase Console
- [ ] Got Service Account credentials
- [ ] Generated FIREBASE_SERVICE_ACCOUNT_BASE64
- [ ] Generated JWT_SECRET
- [ ] Added all Frontend variables to Vercel
- [ ] Added all Backend variables to Vercel
- [ ] Redeployed on Vercel
- [ ] Tested Web app

### Local Development
- [ ] Created `.env.local` file
- [ ] Added all variables to `.env.local`
- [ ] Added `.env.local` to `.gitignore`
- [ ] Tested locally with `npm run dev`

---

## 🚀 Deployment Steps

### Step 1: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select TRILLIONER-LINK project
3. Go to Settings → Environment Variables

### Step 2: Add Frontend Variables
1. Click "Add New"
2. Add each VITE_* variable
3. Select: Production, Preview, Development
4. Click "Save"

### Step 3: Add Backend Variables
1. Click "Add New"
2. Add each backend variable
3. Select: Production, Preview, Development
4. Click "Save"

### Step 4: Redeploy
1. Go to Deployments tab
2. Click on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Step 5: Test
1. Visit your Vercel domain
2. Test Google Sign-In
3. Check console for errors

---

## 🐛 Troubleshooting

### Issue: "Firebase initialization error"
**Solution:** Check if VITE_FIREBASE_PROJECT_ID is set correctly

### Issue: "Invalid API Key"
**Solution:** Verify VITE_FIREBASE_API_KEY value

### Issue: "Auth domain mismatch"
**Solution:** Ensure VITE_FIREBASE_AUTH_DOMAIN matches Firebase Console

### Issue: "Service account error"
**Solution:** Verify FIREBASE_SERVICE_ACCOUNT_BASE64 is properly encoded

### Issue: "Token verification failed"
**Solution:** Check if FIREBASE_CLIENT_ID is correct

---

## 📚 Reference

- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- Firebase Docs: https://firebase.google.com/docs
- Android Firebase Setup: https://firebase.google.com/docs/android/setup

---

## ✅ Final Checklist

- [ ] Android app has google-services.json
- [ ] Web app has all VITE_* variables
- [ ] Web app has all backend variables
- [ ] Both apps tested locally
- [ ] Web app deployed to Vercel
- [ ] Android app ready to build

---

**Last Updated:** July 7, 2026
**Firebase Project:** trillioner-link
**Status:** ✅ Ready for deployment
