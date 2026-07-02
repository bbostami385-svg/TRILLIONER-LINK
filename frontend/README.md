# TRILLIONER LINK - Frontend

React + Vite frontend for TRILLIONER LINK platform.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Deployment

This frontend is configured for Vercel deployment. The `vercel.json` file contains the build configuration.

### Vercel Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend-url/api`
4. Deploy!
