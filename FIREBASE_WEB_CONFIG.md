# Firebase Web App Configuration

Android google-services.json থেকে extracted Web App configuration

---

## 🌐 Web App Firebase Config

আপনার Android google-services.json থেকে এই information পেয়েছি:

```json
{
  "project_id": "trillioner-link",
  "storage_bucket": "trillioner-link.firebasestorage.app",
  "firebase_url": "https://trillioner-link-default-rtdb.asia-southeast1.firebasedatabase.app",
  "api_key": "AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY",
  "client_id": "364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com"
}
```

---

## 🔑 Vercel Environment Variables

এই values গুলো Vercel এ add করুন:

### Frontend Variables (VITE_*):

```
VITE_FIREBASE_API_KEY = AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY
VITE_FIREBASE_AUTH_DOMAIN = trillioner-link.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = trillioner-link
VITE_FIREBASE_STORAGE_BUCKET = trillioner-link.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 364286702954
VITE_FIREBASE_APP_ID = 1:364286702954:web:YOUR_WEB_APP_ID
```

### Backend Variables:

```
FIREBASE_CLIENT_ID = 364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com
FIREBASE_AUTH_URI = https://accounts.google.com/o/oauth2/auth
FIREBASE_AUTH_PROVIDER_CERT_URL = https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL = (Service Account থেকে)
FIREBASE_SERVICE_ACCOUNT_BASE64 = (Service Account JSON Base64)
```

---

## ⚠️ Missing Information

Android google-services.json এ Web app এর জন্য কিছু information নেই:

1. **VITE_FIREBASE_APP_ID** - Web app এর জন্য unique ID
2. **VITE_FIREBASE_AUTH_DOMAIN** - Auth domain
3. **VITE_FIREBASE_MESSAGING_SENDER_ID** - Messaging sender ID

### এই information পেতে:

1. Firebase Console এ যান: https://console.firebase.google.com
2. আপনার project (`trillioner-link`) select করুন
3. Project Settings ক্লিক করুন
4. "Your apps" section এ Web app খুঁজে বের করুন
5. Web app এর Firebase config copy করুন

---

## 🔧 Web App Firebase Config পেতে

### Step 1: Firebase Console এ যান
```
https://console.firebase.google.com
```

### Step 2: Project Select করুন
- Project: `trillioner-link`

### Step 3: Web App Add করুন (যদি না থাকে)
1. Project Settings ক্লিক করুন
2. "Your apps" section এ যান
3. "Add app" ক্লিক করুন
4. "Web" select করুন
5. App name: `TRILLIONER-LINK-Web` দিন
6. "Register app" ক্লিক করুন

### Step 4: Firebase Config Copy করুন
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## 📝 Vercel এ Add করার ধাপ

### Step 1: Vercel Dashboard এ যান
```
https://vercel.com/dashboard
```

### Step 2: TRILLIONER-LINK Project খুঁজে বের করুন

### Step 3: Settings → Environment Variables

### Step 4: প্রতিটি Variable Add করুন

| Variable | Value |
|----------|-------|
| VITE_FIREBASE_API_KEY | `AIzaSyCvyEQoOqjLi6feDBbgU1wiJi7tb_x8zgY` |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Console থেকে |
| VITE_FIREBASE_PROJECT_ID | `trillioner-link` |
| VITE_FIREBASE_STORAGE_BUCKET | `trillioner-link.firebasestorage.app` |
| VITE_FIREBASE_MESSAGING_SENDER_ID | `364286702954` |
| VITE_FIREBASE_APP_ID | Firebase Console থেকে |

### Step 5: Backend Variables Add করুন

| Variable | Value |
|----------|-------|
| FIREBASE_CLIENT_ID | `364286702954-sckjhqv39j5cc4t0eoeruchn679audm4.apps.googleusercontent.com` |
| FIREBASE_AUTH_URI | `https://accounts.google.com/o/oauth2/auth` |
| FIREBASE_AUTH_PROVIDER_CERT_URL | `https://www.googleapis.com/oauth2/v1/certs` |
| FIREBASE_CLIENT_CERT_URL | Service Account থেকে |
| FIREBASE_SERVICE_ACCOUNT_BASE64 | Service Account JSON Base64 |

### Step 6: Redeploy করুন

---

## ✅ Checklist

- [ ] Firebase Console এ Web app add করেছি
- [ ] Firebase config copy করেছি
- [ ] Vercel এ সব Frontend variables add করেছি
- [ ] Vercel এ সব Backend variables add করেছি
- [ ] Redeploy করেছি
- [ ] Web app test করেছি

---

## 🎯 Next Steps

1. Firebase Console থেকে Web app config পান
2. Vercel এ সব variables add করুন
3. Redeploy করুন
4. Web app test করুন

---

**Last Updated:** July 7, 2026
