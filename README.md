# TRILLIONER LINK

একটি সম্পূর্ণ YouTube, Facebook, Instagram স্টাইলের সোশ্যাল মিডিয়া প্ল্যাটফর্ম - TRILLIONER LINK দ্বারা তৈরি।

## 🚀 ফিচার

### কোর ফিচার
- **ফিড** - পোস্ট তৈরি, লাইক, কমেন্ট
- **ভিডিও** - ভিডিও আপলোড এবং প্লেয়ার
- **স্টোরি** - 24 ঘন্টার স্টোরি
- **মেসেজিং** - রিয়েল-টাইম চ্যাট (WebSocket)
- **প্রোফাইল** - ইউজার প্রোফাইল এবং এডিটিং
- **নোটিফিকেশন** - লাইক, কমেন্ট, ফলো নোটিফিকেশন
- **এক্সপ্লোর** - ট্রেন্ডিং এবং সার্চ

### উন্নত ফিচার
- **রিয়েল-টাইম মেসেজিং** - Socket.io WebSocket
- **পেমেন্ট** - SSLCommerz ইন্টিগ্রেশন
- **মাল্টি-ল্যাঙ্গুয়েজ** - বাংলা, ইংরেজি, হিন্দি
- **লাইভ স্ট্রিমিং** - HLS সাপোর্ট
- **কন্টেন্ট মডারেশন** - রিপোর্টিং এবং ব্লকিং
- **রিকমেন্ডেশন** - ট্রেন্ডিং এবং পার্সোনালাইজড
- **ডার্ক মোড** - Light/Dark থিম সুইচিং
- **মার্কেটপ্লেস** - প্রোডাক্ট সেলিং
- **ক্রিয়েটর ড্যাশবোর্ড** - অ্যানালিটিক্স এবং আর্নিংস

## 🏗️ আর্কিটেকচার

### ফ্রন্টএন্ড
- React 19 + TypeScript
- Tailwind CSS 4
- tRPC ক্লায়েন্ট
- Wouter রাউটিং
- Socket.io ক্লায়েন্ট

### ব্যাকএন্ড
- Express 4 + Node.js
- tRPC 11
- Drizzle ORM
- MySQL/TiDB ডাটাবেস
- Socket.io সার্ভার

### ডাটাবেস
- Users
- Posts
- Videos
- Stories
- Comments
- Likes
- Follows
- Messages
- Conversations
- Hashtags
- Notifications

## 📦 পেজ এবং রাউটার

### ফ্রন্টএন্ড পেজ (13)
1. Feed - সোশ্যাল ফিড
2. Explore - ট্রেন্ডিং এবং সার্চ
3. Messages - রিয়েল-টাইম চ্যাট
4. Videos - ভিডিও গ্যালারি
5. Stories - স্টোরি ভিউয়ার
6. Profile - ইউজার প্রোফাইল
7. ProfileEdit - প্রোফাইল এডিটিং
8. Notifications - নোটিফিকেশন সেন্টার
9. Marketplace - প্রোডাক্ট মার্কেটপ্লেস
10. CreatorDashboard - ক্রিয়েটর অ্যানালিটিক্স
11. Settings - সেটিংস ম্যানেজমেন্ট
12. Payment - সাবস্ক্রিপশন পেমেন্ট
13. LiveStreaming - লাইভ স্ট্রিম

### API রাউটার (13)
1. Feed - পোস্ট CRUD, লাইক
2. Messages - মেসেজিং
3. Users - ইউজার ম্যানেজমেন্ট, ফলো
4. Videos - ভিডিও ম্যানেজমেন্ট
5. Stories - স্টোরি ম্যানেজমেন্ট
6. Comments - কমেন্ট সিস্টেম
7. Search - সার্চ ফাংশনালিটি
8. Notifications - নোটিফিকেশন
9. Payment - SSLCommerz পেমেন্ট
10. LiveStream - লাইভ স্ট্রিমিং
11. Moderation - কন্টেন্ট মডারেশন
12. Recommendations - রিকমেন্ডেশন
13. ProfileEdit - প্রোফাইল এডিটিং

## 🎨 ডিজাইন

- **থিম**: গ্লাসমরফিজম UI
- **কালার**: সাইয়ান/ব্লু গ্রেডিয়েন্ট
- **মোড**: ডার্ক/লাইট সুইচিং
- **রেসপন্সিভ**: মোবাইল-ফার্স্ট ডিজাইন

## 🧪 টেস্টিং

- **টেস্ট ফ্রেমওয়ার্ক**: Vitest
- **টেস্ট কভারেজ**: 58 টেস্ট পাস
- **টেস্ট টাইপ**: ইউনিট এবং ইন্টিগ্রেশন

## 🚀 ডিপ্লয়মেন্ট

প্রজেক্টটি Manus প্ল্যাটফর্মে ডিপ্লয় করা যায়।

### এনভায়রনমেন্ট ভেরিয়েবল
```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your-secret
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
```

## 📝 লাইসেন্স

MIT

## 👨‍💻 ডেভেলপার

TRILLIONER LINK - সম্পূর্ণ সোশ্যাল ও Creator ভিডিও প্ল্যাটফর্ম

---

**GitHub Repository**: https://github.com/bbostami385-svg/TRILLIONER-LINK


## Render deployment

This repository is a single root-level Node application; it does not contain a `backend/` directory. In Render, set **Root Directory** to blank or `.`, use `npm exec --yes pnpm@10.4.1 -- install --frozen-lockfile && npm exec --yes pnpm@10.4.1 -- build` as the **Build Command**, and use `npm exec --yes pnpm@10.4.1 -- start` as the **Start Command**. Do not use `cd backend && npm install`. The checked-in `render.yaml` contains the same service configuration for Blueprint deployment. Add the required environment variables in Render’s Environment settings, including `DATABASE_URL`, `JWT_SECRET`, the Firebase variables, and `VITE_APP_TITLE=TRILLIONER LINK`.


## Install TRILLIONER LINK without the Play Store

TRILLIONER LINK is now configured as an installable Progressive Web App. Publish the web application over HTTPS, open it in Chrome or another supported browser, and choose **Install app** from the in-app prompt or the browser menu. On Android this adds an app-style launcher entry and opens the platform in standalone mode; the service worker keeps the application shell and key media routes available when the network is interrupted. iPhone and iPad users can use **Share → Add to Home Screen** in Safari.

This approach does not require a Play Store listing and does not require a separate APK for ordinary app-like use. It preserves the same web account, backend, and database. For a later Play Store release, the same production HTTPS URL can be packaged as an Android Trusted Web Activity or migrated into a dedicated Android wrapper, followed by Android signing, privacy-policy, data-safety, and Play Console review. The current PWA configuration is the low-maintenance distribution path; an APK/AAB should only be produced after the production domain, branding, privacy policy, and release signing key are finalized.
