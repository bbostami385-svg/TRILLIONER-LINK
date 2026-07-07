# TRILLIONER LINK - Environment Variables Guide

এই ফাইলে সব প্রয়োজনীয় Environment Variables এর বিস্তারিত তথ্য দেওয়া আছে।

---

## 📋 সব Environment Variables

### 1. **VITE_OAUTH_PORTAL_URL** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Manus OAuth portal এর base URL
- **মূল্য:** `https://api.manus.im`
- **ব্যবহার:** Login/Sign Up এ OAuth authentication এর জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 2. **VITE_APP_ID** ⭐ (বাধ্যতামূলক)
- **কি এটা:** আপনার Manus app এর unique ID
- **মূল্য:** আপনার Manus dashboard থেকে পাবেন
- **ব্যবহার:** OAuth authentication এ app identify করার জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 3. **DATABASE_URL** ⭐ (বাধ্যতামূলক)
- **কি এটা:** আপনার MySQL/TiDB database connection string
- **ফরম্যাট:** `mysql://username:password@host:port/database`
- **উদাহরণ:** `mysql://user:pass@db.example.com:3306/trillioner_link`
- **ব্যবহার:** Backend database operations এর জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 4. **JWT_SECRET** ⭐ (বাধ্যতামূলক)
- **কি এটা:** Session cookie signing এর জন্য secret key
- **মূল্য:** একটি random strong string (minimum 32 characters)
- **উদাহরণ:** `your-super-secret-jwt-key-min-32-chars-long`
- **কীভাবে তৈরি করবেন:**
  ```bash
  # Linux/Mac এ:
  openssl rand -base64 32
  
  # অথবা এই string ব্যবহার করুন:
  # (production এ অবশ্যই নিজের secret ব্যবহার করবেন)
  ```
- **ব্যবহার:** Authentication sessions secure করার জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 5. **VITE_FRONTEND_FORGE_API_KEY** (Optional)
- **কি এটা:** Frontend থেকে Manus APIs access করার জন্য API key
- **ব্যবহার:** Image generation, LLM calls ইত্যাদি
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 6. **VITE_FRONTEND_FORGE_API_URL** (Optional)
- **কি এটা:** Manus built-in APIs এর URL
- **মূল্য:** `https://api.manus.im`
- **ব্যবহার:** Frontend থেকে Manus services access করার জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 7. **BUILT_IN_FORGE_API_KEY** (Optional)
- **কি এটা:** Backend থেকে Manus APIs access করার জন্য API key
- **ব্যবহার:** Server-side LLM calls, notifications ইত্যাদি
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 8. **BUILT_IN_FORGE_API_URL** (Optional)
- **কি এটা:** Manus built-in APIs এর URL (backend)
- **মূল্য:** `https://api.manus.im`
- **ব্যবহার:** Backend থেকে Manus services access করার জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 9. **OWNER_NAME** (Optional)
- **কি এটা:** Project owner এর নাম
- **উদাহরণ:** `Bayojid`
- **ব্যবহার:** Admin notifications, logs ইত্যাদিতে
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 10. **OWNER_OPEN_ID** (Optional)
- **কি এটা:** Project owner এর Manus OpenID
- **ব্যবহার:** Owner notifications পাঠানোর জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 11. **VITE_ANALYTICS_ENDPOINT** (Optional)
- **কি এটা:** Analytics service এর endpoint
- **উদাহরণ:** `https://analytics.example.com`
- **ব্যবহার:** User behavior tracking
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 12. **VITE_ANALYTICS_WEBSITE_ID** (Optional)
- **কি এটা:** Analytics service এ website এর ID
- **ব্যবহার:** Analytics data track করার জন্য
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 13. **VITE_APP_TITLE** (Optional)
- **কি এটা:** আপনার app এর নাম
- **মূল্য:** `TRILLIONER LINK`
- **ব্যবহার:** Browser tab title, header ইত্যাদিতে
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

### 14. **VITE_APP_LOGO** (Optional)
- **কি এটা:** আপনার app এর logo URL
- **উদাহরণ:** `https://example.com/logo.png`
- **ব্যবহার:** Header, favicon ইত্যাদিতে
- **কোথায় যোগ করবেন:** Vercel → Settings → Environment Variables

---

## 🚀 Vercel এ Environment Variables যোগ করার ধাপ

### Step 1: Vercel Dashboard এ যান
1. https://vercel.com/dashboard এ লগইন করুন
2. আপনার **TRILLIONER-LINK** project খুঁজে বের করুন
3. Project এ ক্লিক করুন

### Step 2: Settings এ যান
1. Top menu এ **Settings** ক্লিক করুন
2. Left sidebar এ **Environment Variables** খুঁজে বের করুন
3. **Environment Variables** ক্লিক করুন

### Step 3: Variables যোগ করুন
প্রতিটি variable এর জন্য:
1. **Name** field এ variable name লিখুন (যেমন: `VITE_OAUTH_PORTAL_URL`)
2. **Value** field এ value লিখুন (যেমন: `https://api.manus.im`)
3. **Environments** select করুন: `Production` এবং `Preview`
4. **Save** ক্লিক করুন

---

## 📝 প্রয়োজনীয় Variables (Minimum Setup)

সাইট চালানোর জন্য **কমপক্ষে এই variables যোগ করতে হবে:**

| Variable | Value | উদাহরণ |
|----------|-------|--------|
| `VITE_OAUTH_PORTAL_URL` | `https://api.manus.im` | `https://api.manus.im` |
| `VITE_APP_ID` | আপনার Manus App ID | `app_xxxxxxxxxxxxx` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Random 32+ char string | `your-secret-key-here` |

---

## 🔑 JWT_SECRET কীভাবে তৈরি করবেন?

### Option 1: OpenSSL ব্যবহার করে (Linux/Mac)
```bash
openssl rand -base64 32
```

Output উদাহরণ:
```
aBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0
```

### Option 2: Node.js ব্যবহার করে
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Online Generator
https://www.random.org/strings/ ব্যবহার করে একটি random string তৈরি করুন

---

## 🔍 Manus App ID পেতে

1. Manus Dashboard এ যান: https://manus.im/dashboard
2. আপনার project খুঁজে বের করুন
3. **Settings** → **API Keys** এ যান
4. **App ID** কপি করুন
5. Vercel এ paste করুন

---

## 🗄️ Database Connection String তৈরি করা

### MySQL Format:
```
mysql://username:password@hostname:port/database_name
```

### উদাহরণ:
```
mysql://root:mypassword123@db.example.com:3306/trillioner_link
```

### Parts:
- `username`: Database user
- `password`: Database password
- `hostname`: Database server address
- `port`: Database port (default: 3306)
- `database_name`: আপনার database এর নাম

---

## ✅ সবকিছু সেট করার পরে

1. Vercel এ সব variables যোগ করুন
2. **Redeploy** ক্লিক করুন
3. Build complete হওয়ার জন্য অপেক্ষা করুন (2-3 মিনিট)
4. আপনার site visit করুন
5. Homepage load হওয়া উচিত
6. Login/Signup pages কাজ করবে

---

## 🐛 সমস্যা হলে

### সাদা page দেখাচ্ছে?
- Browser console খুলুন (F12)
- Errors দেখুন
- সব variables সঠিকভাবে set করা আছে কিনা check করুন

### Login/Signup এ error?
- `VITE_OAUTH_PORTAL_URL` এবং `VITE_APP_ID` check করুন
- Manus dashboard এ app settings verify করুন

### Database connection error?
- `DATABASE_URL` সঠিক কিনা check করুন
- Database server running আছে কিনা check করুন
- Username/password সঠিক কিনা verify করুন

---

## 📞 সাহায্য প্রয়োজন?

যদি কোনো সমস্যা হয়:
1. Vercel deployment logs দেখুন
2. Browser console এ errors check করুন
3. Database connection verify করুন
4. সব environment variables সঠিকভাবে set করা আছে কিনা check করুন

---

**Last Updated:** July 7, 2026
**Version:** 1.0
