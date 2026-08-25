# TRILLIONER LINK — Firebase + Google Login এবং Vercel Environment Variable Guide

**উদ্দেশ্য:** এই নির্দেশিকাটি TRILLIONER LINK-এর Firebase-only authentication deployment-এর জন্য তৈরি। পরে Vercel-এ Production এবং Preview environment সেটআপ করার সময় এই ফাইল অনুসরণ করুন। বর্তমান authentication flow-এ **Firebase Web Auth + Google Login** এবং backend-side Firebase ID-token verification ব্যবহৃত হয়। Manus OAuth-এর উপর নতুন deployment নির্ভর করবে না।

> **গুরুত্বপূর্ণ:** Firebase-only authentication migration-এর reference commit হলো `f88ca0f`। Repository-এর `main` branch-এ এর পরে আরও validation, CI, Playwright এবং অন্যান্য পরিবর্তন যুক্ত হয়েছে; তাই deployment-এর সময় সবসময় সর্বশেষ `main` commit ব্যবহার করুন।

## ১. Firebase-only deployment-এর আবশ্যক Environment Variables

Vercel Project → **Settings → Environment Variables**-এ নিচের সাতটি variable যোগ করুন। Browser-side variables-এ `VITE_` prefix থাকা স্বাভাবিক এবং এগুলো Firebase Web App configuration-এর public অংশ। Server-side secrets কখনো client bundle-এ প্রকাশ করা যাবে না।

| Variable | Scope | কোথা থেকে পাবেন | কেন প্রয়োজন |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | Frontend | Firebase Console-এর Web App configuration | Firebase browser SDK initialize করতে |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend | Firebase Web App configuration | Google authentication domain; সাধারণত `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Frontend | Firebase Web App configuration | Firebase project শনাক্ত করতে |
| `VITE_FIREBASE_APP_ID` | Frontend | Firebase Web App configuration | নির্দিষ্ট Web App শনাক্ত করতে |
| `DATABASE_URL` | Server | আপনার MySQL/TiDB provider | User, session এবং application data সংরক্ষণ করতে |
| `JWT_SECRET` | Server | নিজে তৈরি করা শক্তিশালী random secret | Firebase token exchange-এর পরে local session cookie sign করতে |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | **Server only** | Firebase Admin service-account JSON-এর Base64 value | Backend-এ Firebase ID token verify করতে |

### Vercel Environment selection

নিরাপদ এবং সামঞ্জস্যপূর্ণ testing-এর জন্য browser variables এবং server variables—দুটোকেই প্রয়োজন অনুযায়ী **Production** এবং **Preview**-তে যোগ করুন। Development environment স্থানীয় `.env` বা Vercel-এর Development scope-এ আলাদাভাবে configure করা যায়। একই Firebase project ব্যবহার করলে Production এবং Preview দুটোতেই একই Firebase Web App values ব্যবহার করা যায়; আলাদা Firebase project ব্যবহার করলে প্রতিটি environment-এর values আলাদা রাখুন।

## ২. Firebase Console থেকে Web App values সংগ্রহ

Firebase Console-এ গিয়ে সঠিক project নির্বাচন করুন। এরপর **Project settings → General → Your apps** অংশে Web app নির্বাচন করুন। Web app না থাকলে **Add app → Web (`</>`)** নির্বাচন করে app register করুন। Firebase configuration object-এ যে values দেখা যাবে, সেগুলো Vercel-এ এই mapping অনুযায়ী বসাতে হবে:

```text
apiKey             → VITE_FIREBASE_API_KEY
authDomain         → VITE_FIREBASE_AUTH_DOMAIN
projectId          → VITE_FIREBASE_PROJECT_ID
appId              → VITE_FIREBASE_APP_ID
storageBucket      → VITE_FIREBASE_STORAGE_BUCKET (optional)
messagingSenderId  → VITE_FIREBASE_MESSAGING_SENDER_ID (optional)
measurementId      → VITE_FIREBASE_MEASUREMENT_ID (optional)
```

`VITE_FIREBASE_AUTH_DOMAIN` সাধারণত hostname হিসেবে দিন, যেমন `your-project.firebaseapp.com`। বর্তমানে client helper accidental `https://` prefix normalize করতে পারে, তবে সরাসরি Firebase Console-এর hostname ব্যবহার করাই ভালো। `VITE_FIREBASE_APP_ID` অবশ্যই Firebase Web App-এর `appId`; এটিকে পুরনো Manus-এর `VITE_APP_ID`-এর সঙ্গে মিশাবেন না।

## ৩. Firebase Console-এ Google Login চালু করা

প্রথমে Firebase Console-এর **Authentication → Sign-in method**-এ যান এবং **Google** provider enable করুন। প্রয়োজনে project-এর support email নির্বাচন করে Save করুন। এরপর **Authentication → Settings → Authorized domains**-এ নিচের domain-গুলো যোগ করুন:

```text
আপনার-production-project.vercel.app
আপনার-preview-domain.vercel.app
```

আপনার custom domain থাকলে সেটিও যোগ করুন। Domain-এর আগে `https://` লিখবেন না এবং path যোগ করবেন না। Firebase authorized domain-এ domain যোগ না থাকলে Google popup বা redirect login production-এ ব্যর্থ হতে পারে।

## ৪. Firebase Admin service account তৈরি এবং Base64 value প্রস্তুত

Backend token verification-এর জন্য Firebase Admin credential প্রয়োজন। Firebase Console-এ **Project settings → Service accounts → Firebase Admin SDK** খুলে **Generate new private key** নির্বাচন করুন। JSON ফাইলটি নিরাপদভাবে download করুন। এই JSON কখনো GitHub, Vercel-এর `VITE_` variable, issue, screenshot বা public chat-এ প্রকাশ করবেন না।

JSON file-কে এক লাইনের Base64 value-তে রূপান্তর করুন। Linux/macOS-এ উদাহরণ:

```bash
base64 -w 0 firebase-admin-service-account.json > firebase-service-account.base64.txt
```

যদি `-w` option না থাকে, ব্যবহার করুন:

```bash
base64 firebase-admin-service-account.json | tr -d '\n' > firebase-service-account.base64.txt
```

Windows PowerShell-এ:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-admin-service-account.json"))
```

উৎপন্ন এক লাইনের সম্পূর্ণ value-টি Vercel-এর `FIREBASE_SERVICE_ACCOUNT_BASE64` variable-এ বসান। JSON file এবং Base64 output local machine থেকে মুছে বা encrypted password manager-এ সংরক্ষণ করুন। Base64 encryption নয়; এটি কেবল encoding।

## ৫. `DATABASE_URL` এবং `JWT_SECRET`

`DATABASE_URL` আপনার MySQL/TiDB database provider থেকে পাওয়া সম্পূর্ণ connection string হবে। Database provider-এর SSL requirement, user permission এবং migration status নিশ্চিত করুন। `JWT_SECRET`-এর জন্য দীর্ঘ, random, অনুমান করা কঠিন secret তৈরি করুন। একটি production secret কখনো repository, commit, browser code বা `VITE_` variable-এ রাখবেন না। Preview এবং Production আলাদা session isolation চাইলে দুই environment-এ আলাদা `JWT_SECRET` ব্যবহার করা উত্তম।

## ৬. এখন যোগ না করলেও চলবে

শুধু Firebase Google Login চালু করার জন্য নিচের variables প্রয়োজন নেই:

| Variable | সিদ্ধান্ত |
|---|---|
| `VITE_FIREBASE_STORAGE_BUCKET` | Current Google Login-এর জন্য optional; browser storage feature চালু করলে দিন |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Current Google Login-এর জন্য optional; Firebase messaging ব্যবহার করলে দিন |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional; বর্তমান auth helper-এ প্রয়োজনীয় নয় |
| `VITE_API_URL` | সাধারণ Vercel deployment-এ যোগ না করাই ভালো; current deployment origin fallback হিসেবে ব্যবহৃত হয় |
| `FRONTEND_URL` | সাধারণ login-এর জন্য প্রয়োজন নেই; explicit Socket.io CORS origin দরকার হলে server-side দিন |

`VITE_API_URL` দিলে অবশ্যই সম্পূর্ণ URL ব্যবহার করতে হবে, যেমন `https://api.example.com`। শুধু `projects.vercel.app` বা অন্য অসম্পূর্ণ hostname দেবেন না। ভুল value থাকলে এটি না দিয়ে current Vercel origin ব্যবহার করা নিরাপদ।

## ৭. Manus OAuth variables যোগ করবেন না

Firebase-only deployment-এ নিচের পুরনো Manus OAuth variables ব্যবহার করবেন না:

```text
OAUTH_SERVER_URL
VITE_APP_ID
VITE_OAUTH_PORTAL_URL
```

`VITE_APP_ID` এবং `VITE_FIREBASE_APP_ID` আলাদা provider-এর আলাদা identifier। Firebase authentication-এর জন্য কেবল `VITE_FIREBASE_APP_ID` ব্যবহার করুন। Legacy Manus OAuth callback এবং user-facing Manus login entry point disabled করা হয়েছে।

## ৮. Built-in service variables কখন প্রয়োজন হবে

পুরো platform-এর অন্যান্য feature চালু রাখলে authentication-এর বাইরে আরও server-side configuration প্রয়োজন হতে পারে। এগুলো শুধুমাত্র সংশ্লিষ্ট feature ব্যবহার করলে যোগ করুন:

```text
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
```

এগুলো storage, notification, AI moderation, built-in LLM বা অন্য Manus built-in service-এর জন্য লাগতে পারে। শুধু Google Login test করার জন্য এগুলো প্রয়োজন নেই। Feature production-এ চালু রাখলে deployment readiness document এবং provider configuration অনুযায়ী values দিন।

Frontend-side built-in API access প্রয়োজন হলে:

```text
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
```

এই browser-exposed values-এ কখনো server-only secret ব্যবহার করবেন না।

## ৯. Vercel-এ variables যোগ করার ধাপ

Vercel Dashboard-এ TRILLIONER LINK project খুলে **Settings → Environment Variables** নির্বাচন করুন। প্রথমে variable name লিখুন, তারপর value দিন, এবং Environment হিসেবে **Production**, **Preview**, অথবা প্রয়োজন অনুযায়ী উভয়টি নির্বাচন করুন। `FIREBASE_SERVICE_ACCOUNT_BASE64`, `DATABASE_URL` এবং `JWT_SECRET`-এ Secret value ব্যবহার করুন। Browser Firebase config values public bundle-এ থাকার জন্য `VITE_` prefix-সহ থাকবে, তবে এগুলোও ভুল project বা ভুল domain-এ ব্যবহার করবেন না।

সব values save করার পরে Vercel-এ সর্বশেষ GitHub `main` commit দিয়ে নতুন deployment তৈরি করুন অথবা **Redeploy** করুন। Vite-এর `VITE_*` values build time-এ bundle হয়; শুধু browser refresh করলে নতুন values application-এ ঢুকবে না।

## ১০. Deployment-এর আগে যাচাই তালিকা

Deployment শুরু করার আগে এই বিষয়গুলো নিশ্চিত করুন:

| যাচাই | Expected result |
|---|---|
| Google provider enabled | Firebase Authentication provider list-এ Google enabled |
| Authorized domains | Production এবং Preview domain Firebase-এ যুক্ত |
| Web config | API key, auth domain, project ID, app ID একই Firebase project-এর |
| Admin credential | `FIREBASE_SERVICE_ACCOUNT_BASE64` server-only এবং সম্পূর্ণ Base64 value |
| Database | `DATABASE_URL` reachable এবং required migrations applied |
| Session signing | `JWT_SECRET` দীর্ঘ random value; source control-এ নেই |
| Manus variables | `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL` intentionally absent |
| Redeploy | Variables save করার পরে fresh Vercel build হয়েছে |
| Browser flow | Google Login → Firebase session exchange → `/profile` redirect কাজ করছে |

## ১১. Login test করার ধাপ

Fresh deployment খুলে Login page-এ Google Login button নির্বাচন করুন। Loading state দেখা উচিত এবং failure হলে readable error message দেখা উচিত। সফল authentication-এর পরে application profile dashboard-এ redirect করবে। নতুন account হলে age/verification onboarding প্রয়োজন অনুযায়ী `/verify` বা সংশ্লিষ্ট verification flow-এ যেতে পারে। Browser DevTools-এ কোনো service-account value, JWT secret, database URL বা server-only credential দেখা গেলে deployment বন্ধ করে secret rotate করুন।

## ১২. সাধারণ সমস্যা ও সমাধান

**`Invalid URL` বা malformed URL:** `VITE_API_URL`-এ অসম্পূর্ণ hostname আছে কি না দেখুন। সাধারণ Vercel deployment-এ variable সরিয়ে current origin fallback ব্যবহার করুন। Firebase `authDomain`-এ Console-এর hostname দিন।

**Google popup blocked বা unauthorized domain:** Firebase Authentication-এর Authorized domains-এ বর্তমান Vercel domain যোগ করুন এবং browser popup blocker পরীক্ষা করুন। Preview deployment-এর generated domain বদলালে নতুন domain যোগ করতে হতে পারে।

**Backend token verification ব্যর্থ:** `FIREBASE_SERVICE_ACCOUNT_BASE64` সম্পূর্ণ হয়েছে কি না, Base64 line break ঢুকেছে কি না, service account একই Firebase project-এর কি না পরীক্ষা করুন। ভুল হলে credential revoke করে নতুন private key তৈরি করুন।

**Database/session error:** `DATABASE_URL`-এর SSL, network allowlist, username/password এবং migration status পরীক্ষা করুন। `JWT_SECRET` পরিবর্তন করলে পুরনো session invalid হতে পারে; ব্যবহারকারীকে পুনরায় login করতে হতে পারে।

**পুরনো UI বা environment value দেখা যাচ্ছে:** Vercel-এ নতুন deployment বা Redeploy চালান। Browser refresh একা যথেষ্ট নয়, কারণ `VITE_*` values build time-এ inject হয়।

## ১৩. Security rules

Service-account JSON, Base64 credential, database connection string এবং JWT secret কখনো GitHub commit করবেন না। এগুলো public Vercel build log, client-side code, screenshot, support ticket বা chat message-এ প্রকাশ করবেন না। কোনো secret প্রকাশিত হলে সঙ্গে সঙ্গে Firebase service-account key revoke/regenerate, database password rotate এবং JWT secret replace করুন।

এই guide-এ কোনো বাস্তব secret বা credential রাখা হয়নি। এটি কেবল configuration mapping এবং deployment procedure।

## Final minimal list

Firebase + Google Login-এর জন্য প্রথমে এই সাতটি variable প্রস্তুত রাখুন:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
DATABASE_URL
JWT_SECRET
FIREBASE_SERVICE_ACCOUNT_BASE64
```

প্রথম চারটি Firebase Web App configuration থেকে, `DATABASE_URL` database provider থেকে, `JWT_SECRET` আপনার তৈরি করা secure random value থেকে এবং `FIREBASE_SERVICE_ACCOUNT_BASE64` Firebase Admin service-account JSON-এর Base64 encoding থেকে আসবে।

**শেষ কথা:** Firebase Console configuration, Vercel variable entry এবং final deployment owner-controlled steps। Code বা repository-তে কোনো secret hardcode করবেন না।
