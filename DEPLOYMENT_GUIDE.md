# TRILLIONER LINK - Deployment Guide

## Overview

This guide covers the complete deployment process for the TRILLIONER LINK platform, including backend (Render), frontend (Vercel), and mobile app deployment.

---

## Prerequisites

- Node.js 16+ and npm 8+
- MongoDB Atlas account
- Firebase project
- Stripe account
- Render account
- Vercel account
- React Native development environment (for mobile)

---

## Backend Deployment (Render)

### 1. Prepare Backend for Deployment

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with production variables
cp .env.example .env.production
```

### 2. Environment Variables

Create `.env.production` with:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/novaplus
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://your-frontend-domain.com
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLOUDFLARE_R2_BUCKET=your_r2_bucket
CLOUDFLARE_R2_ACCESS_KEY=your_r2_access_key
CLOUDFLARE_R2_SECRET_KEY=your_r2_secret_key
```

### 3. Deploy to Render

1. Push code to GitHub
2. Log in to [Render](https://render.com)
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Name:** novaplus-social-api
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Standard ($7/month)
6. Add environment variables
7. Click "Create Web Service"

### 4. Verify Deployment

```bash
# Test API endpoint
curl https://novaplus-social-api.onrender.com/health

# Expected response
{
  "success": true,
  "message": "Server is running",
  "environment": "production"
}
```

---

## Frontend Deployment (Vercel)

### 1. Prepare Frontend for Deployment

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build
```

### 2. Environment Variables

Create `.env.production` with:

```env
REACT_APP_API_URL=https://novaplus-social-api.onrender.com/api
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

### 3. Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Or use GitHub integration:
   - Log in to [Vercel](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import GitHub repository
   - Add environment variables
   - Click "Deploy"

### 4. Configure Custom Domain

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add custom domain
3. Update DNS records at your domain provider
4. Verify domain

---

## Mobile App Deployment

### iOS App Store

1. **Prepare App:**
```bash
cd mobile
npm install
npm run build:ios
```

2. **Create Apple Developer Account**
   - Visit [Apple Developer](https://developer.apple.com)
   - Enroll in Apple Developer Program ($99/year)

3. **Create App ID and Certificates**
   - Generate App ID in Apple Developer Console
   - Create signing certificates
   - Create provisioning profiles

4. **Build and Submit:**
```bash
# Build for App Store
npm run build:ios -- --release

# Upload to App Store Connect
# Use Xcode or Transporter
```

### Android Play Store

1. **Prepare App:**
```bash
cd mobile
npm install
npm run build:android
```

2. **Create Google Play Developer Account**
   - Visit [Google Play Console](https://play.google.com/console)
   - Pay $25 one-time registration fee

3. **Generate Signing Key:**
```bash
# Create keystore
keytool -genkey -v -keystore novaplus.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias novaplus

# Configure in android/app/build.gradle
```

4. **Build and Submit:**
```bash
# Build for Play Store
npm run build:android -- --release

# Upload to Google Play Console
```

---

## Database Setup

### MongoDB Atlas

1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Update `MONGODB_URI` in environment variables

### Database Migrations

```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

---

## SSL/TLS Certificates

### Render (Automatic)

Render automatically provides SSL certificates for all deployed services.

### Custom Domain

1. Verify domain ownership
2. Update DNS records
3. Certificate auto-renews

---

## Monitoring & Logging

### Render

1. View logs in Render dashboard
2. Set up alerts for errors
3. Monitor CPU and memory usage

### Error Tracking

```bash
# Install Sentry
npm install @sentry/node

# Configure in server.js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### Analytics

- Set up Google Analytics for frontend
- Use Mixpanel for user tracking
- Monitor API performance with New Relic

---

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Set secure CORS headers
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable 2FA for all accounts
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement DDoS protection
- [ ] Set up backup strategy
- [ ] Enable database encryption

---

## Performance Optimization

### Frontend

```bash
# Analyze bundle size
npm run analyze

# Enable gzip compression
# Configure in vercel.json

# Implement lazy loading
# Use React.lazy() for code splitting
```

### Backend

```bash
# Enable caching
# Use Redis for session storage
# Implement database indexing
# Use CDN for static assets
```

### Database

```bash
# Create indexes
db.users.createIndex({ email: 1 })
db.posts.createIndex({ createdAt: -1 })

# Enable sharding for large collections
```

---

## Backup & Recovery

### Database Backups

1. Enable automated backups in MongoDB Atlas
2. Set retention to 30 days
3. Test restore procedures monthly

### Code Backups

```bash
# Push to GitHub regularly
git push origin main

# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

---

## Scaling Strategy

### Horizontal Scaling

1. **Load Balancing:** Use Render's automatic load balancing
2. **Database:** Enable MongoDB sharding
3. **Cache:** Implement Redis cluster

### Vertical Scaling

1. Upgrade Render plan
2. Increase database resources
3. Optimize code performance

---

## Maintenance

### Regular Tasks

- [ ] Update dependencies weekly
- [ ] Review logs daily
- [ ] Monitor performance metrics
- [ ] Test backup restoration monthly
- [ ] Security audits quarterly
- [ ] Load testing before major releases

### Deployment Schedule

- **Development:** Continuous deployment
- **Staging:** Daily at 2 AM UTC
- **Production:** Weekly on Sundays at 3 AM UTC

---

## Rollback Procedure

```bash
# If deployment fails, rollback to previous version
# In Render dashboard:
# 1. Go to "Deployments"
# 2. Select previous successful deployment
# 3. Click "Redeploy"

# Or use git
git revert <commit-hash>
git push origin main
```

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Firebase Docs:** https://firebase.google.com/docs
- **Stripe Docs:** https://stripe.com/docs

---

## Troubleshooting

### Common Issues

**Issue:** API returns 502 Bad Gateway
- **Solution:** Check server logs, restart service, verify database connection

**Issue:** Frontend shows blank page
- **Solution:** Check browser console, verify API URL, check CORS settings

**Issue:** Database connection timeout
- **Solution:** Whitelist IP address, check connection string, verify credentials

---

## Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates valid
- [ ] Monitoring and logging enabled
- [ ] Backup strategy in place
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Team notified of deployment

---

## Post-Deployment

1. Monitor for errors in first 24 hours
2. Verify all features working correctly
3. Check performance metrics
4. Gather user feedback
5. Document any issues
6. Plan next release

