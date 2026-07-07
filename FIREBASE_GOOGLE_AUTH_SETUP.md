# TRILLIONER LINK - Google Firebase Authentication Setup

এই গাইডে Google Firebase দিয়ে সম্পূর্ণ authentication system সেটআপ করার পদ্ধতি দেওয়া আছে।

---

## 📋 প্রয়োজনীয় Firebase Environment Variables

### 1. **FIREBASE_CLIENT_ID** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Google OAuth Client ID
- **কোথায় পাবেন:** Google Cloud Console → APIs & Services → Credentials
- **উদাহরণ:** `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
- **ব্যবহার:** Frontend এ Google Sign In এর জন্য

### 2. **FIREBASE_AUTH_URI** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Google OAuth authorization endpoint
- **মূল্য:** `https://accounts.google.com/o/oauth2/auth`
- **ব্যবহার:** Login redirect করার সময়

### 3. **FIREBASE_AUTH_PROVIDER_CERT_URL** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Google token verification এর জন্য certificate URL
- **মূল্য:** `https://www.googleapis.com/oauth2/v1/certs`
- **ব্যবহার:** JWT token verify করার সময়

### 4. **FIREBASE_CLIENT_CERT_URL** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Service account certificate URL
- **পাবেন:** Firebase Console → Service Account JSON এ `client_x509_cert_url` field
- **উদাহরণ:** `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx@project.iam.gserviceaccount.com`

### 5. **FIREBASE_SERVICE_ACCOUNT_BASE64** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Firebase Service Account JSON (Base64 encoded)
- **কেন Base64?** Vercel environment variables এ special characters handle করার জন্য
- **কীভাবে তৈরি করবেন:** নিচে দেখুন

---

## 🚀 Firebase Setup ধাপে ধাপে

### Step 1: Google Cloud Project তৈরি করুন
1. https://console.cloud.google.com এ যান
2. Top এ project dropdown ক্লিক করুন
3. "New Project" ক্লিক করুন
4. Name: `TRILLIONER-LINK` দিন
5. "Create" ক্লিক করুন

### Step 2: Firebase Enable করুন
1. Google Cloud Console এ আপনার project select করুন
2. Left sidebar এ "APIs & Services" → "Library" ক্লিক করুন
3. "Firebase" search করুন
4. "Firebase Authentication API" ক্লিক করুন
5. "Enable" ক্লিক করুন

### Step 3: OAuth 2.0 Credentials তৈরি করুন
1. Google Cloud Console এ আপনার project select করুন
2. Left sidebar এ "APIs & Services" → "Credentials" ক্লিক করুন
3. "Create Credentials" ক্লিক করুন
4. "OAuth 2.0 Client ID" select করুন
5. "Application type" → "Web application" select করুন
6. Name: `TRILLIONER-LINK` দিন
7. **Authorized redirect URIs যোগ করুন:**
   ```
   http://localhost:3000/api/auth/callback
   https://your-vercel-domain.vercel.app/api/auth/callback
   ```
8. "Create" ক্লিক করুন
9. **Client ID এবং Client Secret copy করুন** (পরে লাগবে)

### Step 4: Service Account তৈরি করুন
1. Google Cloud Console এ আপনার project select করুন
2. Left sidebar এ "APIs & Services" → "Credentials" ক্লিক করুন
3. "Service Accounts" tab ক্লিক করুন
4. "Create Service Account" ক্লিক করুন
5. Service account name: `firebase-admin` দিন
6. "Create and Continue" ক্লিক করুন
7. Role: "Editor" select করুন (অথবা "Firebase Admin")
8. "Continue" ক্লিক করুন
9. "Done" ক্লিক করুন

### Step 5: Service Account Key Generate করুন
1. Google Cloud Console এ Service Accounts page এ যান
2. আপনার service account (`firebase-admin`) ক্লিক করুন
3. "Keys" tab ক্লিক করুন
4. "Add Key" → "Create new key" ক্লিক করুন
5. Key type: "JSON" select করুন
6. "Create" ক্লিক করুন
7. **JSON file download হবে - এটা সংরক্ষণ করুন!**

---

## 📝 Environment Variables তৈরি করা

### Step 1: Service Account JSON থেকে Base64 তৈরি করুন

**Linux/Mac এ:**
```bash
# Download করা JSON file কে Base64 এ convert করুন
cat firebase-service-account.json | base64

# Output copy করুন এবং Vercel এ paste করুন
```

**Windows এ:**
```powershell
# PowerShell এ:
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("firebase-service-account.json"))
```

**Online Tool ব্যবহার করে:**
1. https://www.base64encode.org এ যান
2. আপনার JSON file upload করুন
3. Encoded text copy করুন

### Step 2: JSON থেকে প্রয়োজনীয় Fields খুঁজে বের করুন

Download করা JSON file খুলুন এবং এই fields খুঁজে বের করুন:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "client_email": "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## 🔑 Vercel এ Environment Variables যোগ করা

### Step 1: Vercel Dashboard এ যান
1. https://vercel.com/dashboard এ লগইন করুন
2. TRILLIONER-LINK project খুঁজে বের করুন
3. Project ক্লিক করুন

### Step 2: Settings এ যান
1. Top menu এ "Settings" ক্লিক করুন
2. Left sidebar এ "Environment Variables" খুঁজে বের করুন

### Step 3: প্রতিটি Variable যোগ করুন

| Variable Name | Value | কোথা থেকে পাবেন |
|---------------|-------|-----------------|
| `FIREBASE_CLIENT_ID` | `123456789-abc...apps.googleusercontent.com` | OAuth Credentials |
| `FIREBASE_AUTH_URI` | `https://accounts.google.com/o/oauth2/auth` | Fixed value |
| `FIREBASE_AUTH_PROVIDER_CERT_URL` | `https://www.googleapis.com/oauth2/v1/certs` | Fixed value |
| `FIREBASE_CLIENT_CERT_URL` | `https://www.googleapis.com/robot/v1/metadata/x509/...` | Service Account JSON |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 encoded JSON | Service Account JSON |

**প্রতিটি variable এর জন্য:**
1. Name field এ variable name লিখুন
2. Value field এ value paste করুন
3. Environments: "Production" এবং "Preview" select করুন
4. "Save" ক্লিক করুন

---

## 🛠️ Backend Implementation (Node.js/Express)

### Step 1: Firebase Admin SDK Install করুন
```bash
npm install firebase-admin
```

### Step 2: Backend এ Firebase Initialize করুন
```typescript
// server/firebase.ts
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString()
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

export const auth = admin.auth();
export const db = admin.firestore();
```

### Step 3: Login Endpoint তৈরি করুন
```typescript
// server/routers/auth.ts
import { auth } from '../firebase';

export const authRouter = {
  loginWithGoogle: async (idToken: string) => {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;
      
      // Database এ user save করুন
      // Session create করুন
      
      return { uid, email, success: true };
    } catch (error) {
      throw new Error('Invalid token');
    }
  },
};
```

---

## 🎨 Frontend Implementation (React)

### Step 1: Firebase SDK Install করুন
```bash
npm install firebase
```

### Step 2: Frontend এ Firebase Initialize করুন
```typescript
// client/src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### Step 3: Google Sign In Component তৈরি করুন
```typescript
// client/src/components/GoogleSignIn.tsx
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export function GoogleSignInButton() {
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Backend এ পাঠান
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      
      const data = await response.json();
      // User logged in!
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <button onClick={handleSignIn}>
      Sign in with Google
    </button>
  );
}
```

---

## ✅ সেটআপ চেকলিস্ট

- [ ] Google Cloud Project তৈরি করেছি
- [ ] Firebase Authentication API enable করেছি
- [ ] OAuth 2.0 Credentials তৈরি করেছি
- [ ] Redirect URIs add করেছি (local + production)
- [ ] Service Account তৈরি করেছি
- [ ] Service Account Key download করেছি
- [ ] Base64 encoding করেছি
- [ ] Vercel এ সব 5টি variables add করেছি
- [ ] Backend Firebase setup করেছি
- [ ] Frontend Firebase setup করেছি
- [ ] Google Sign In button তৈরি করেছি
- [ ] Login/Signup test করেছি

---

## 🐛 সমস্যা সমাধান

### "Invalid Client ID" Error
```
সমাধান:
- Client ID সঠিক কিনা check করুন
- Redirect URI exactly match করছে কিনা verify করুন
- Spaces বা typo না থাকে সেটা নিশ্চিত করুন
```

### "Invalid Redirect URI" Error
```
সমাধান:
- Redirect URI exactly match করতে হবে
- Protocol (http/https) সঠিক কিনা check করুন
- Domain name সঠিক কিনা verify করুন
```

### "Service Account Error"
```
সমাধান:
- Base64 encoding সঠিক কিনা check করুন
- JSON file valid কিনা verify করুন
- Service account permissions check করুন
```

### "Token Verification Failed"
```
সমাধান:
- Private key সঠিক কিনা check করুন
- Token expired না হয়েছে verify করুন
- FIREBASE_SERVICE_ACCOUNT_BASE64 সঠিক কিনা check করুন
```

---

## 📚 সহায়ক লিঙ্ক

- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)

---

## 🎯 পরবর্তী ধাপ

1. ✅ সব environment variables Vercel এ add করুন
2. ✅ Vercel এ Redeploy করুন
3. ✅ Backend Firebase setup করুন
4. ✅ Frontend Google Sign In implement করুন
5. ✅ Login/Signup test করুন
6. ✅ Production এ deploy করুন

---

**Last Updated:** July 7, 2026
**Version:** 1.0
