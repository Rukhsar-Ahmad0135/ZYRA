# ZYRA - Vercel Deployment Guide

## Architecture Overview

```
Frontend (React SPA) → Vercel Static Hosting
Backend (Express API) → Vercel Serverless Functions
Database → MongoDB Atlas (required — Vercel has ephemeral filesystem)
Auth → Clerk
Images → Cloudinary
```

## Prerequisites

1. **Vercel account** — [vercel.com](https://vercel.com)
2. **MongoDB Atlas account** — [mongodb.com/atlas](https://www.mongodb.com/atlas) (local JSON store won't work on Vercel's ephemeral filesystem)
3. **GitHub/GitLab repository** connected to Vercel

---

## Step 1: Set Up MongoDB Atlas

1. Create a free cluster on MongoDB Atlas
2. Create a database user with read/write permissions
3. Whitelist IP: `0.0.0.0/0` (or Vercel's IP ranges)
4. Get the connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/zyra?retryWrites=true&w=majority`
5. Run seed on the database to populate initial data:
   - Use MongoDB Compass or `mongosh` to import `Backend/data/products.js`
   - Create admin user in the `users` collection

---

## Step 2: Update Clerk Keys for Production

1. Go to Clerk Dashboard → Settings → API Keys
2. Switch to **Production** mode
3. Copy the **Publishable Key** and **Secret Key**
4. Add your production domains to Allowed Origins in Clerk

---

## Step 3: Configure Vercel Environment Variables

### Backend Project

In Vercel Dashboard → Backend Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | `mongodb+srv://...` (your Atlas connection string) |
| `JWT_SECRET` | Strong random string |
| `CLERK_SECRET_KEY` | Production Clerk secret key |
| `CLERK_PUBLISHABLE_KEY` | Production Clerk publishable key |
| `CLIENT_URL` | `https://your-frontend.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `CLOUDINARY_PRODUCT_FOLDER` | `ZYRA` |
| `USE_LOCAL_DATA` | `false` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

### Frontend Project

In Vercel Dashboard → Frontend Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VITE_BACKEND_URL` | `https://your-backend.vercel.app/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Production Clerk publishable key |
| `VITE_USE_LOCAL_DATA` | `false` |

---

## Step 4: Deploy Frontend to Vercel

1. Push changes to your Git repository
2. In Vercel, create a new project → Import **Frontend** folder
3. Framework preset: **Vite** (auto-detected)
4. Build Command: `npm run build`
5. Install Command: `npm install`
6. Output Directory: `dist`
7. Add all environment variables from Step 3
8. Click **Deploy**

The `vercel.json` at `Frontend/vercel.json` configures SPA rewrites so all routes serve `index.html`.

---

## Step 5: Deploy Backend to Vercel

1. In Vercel, create a new project → Import **Backend** folder
2. Framework: **Other** (custom serverless functions)
3. Build Command: `npm install`
4. Add all environment variables from Step 3
5. Click **Deploy**

The backend is exposed at `https://your-backend.vercel.app/api/*`.

---

## Step 6: Update Frontend to Use Production Backend URL

After both are deployed, update the Frontend `.env`:

```
VITE_BACKEND_URL=https://your-backend.vercel.app/api
```

Then commit and redeploy Frontend.

---

## File Changes Made for Vercel Deployment

### New Files
- `Frontend/vercel.json` — Vercel config with SPA rewrites and security headers
- `Backend/vercel.json` — Vercel config for serverless functions
- `Backend/api/index.js` — Express app wrapped as Vercel serverless function handler
- `Frontend/.env.vercel` — Template for frontend production env vars
- `Backend/.env.vercel` — Template for backend production env vars

### Key Notes
- **Local JSON storage (`data/local-store.json`) does NOT work on Vercel** — must use MongoDB Atlas
- Vercel serverless functions have a **10-second cold start** limit (12s max) — if Express initialization takes too long, consider:
  - Using Vercel's **Pro** plan (up to 60s maxDuration)
  - Or deploying backend on Railway/Render instead
- File uploads go directly to Cloudinary (already configured)
- The `/uploads` static route won't work on Vercel (use Cloudinary URLs instead)

---

## Alternative: Deploy Backend on Railway (Recommended for Long-Running Server)

If Vercel serverless functions are too limiting:

1. [Railway.app](https://railway.app) — deploy via GitHub integration
2. Add PostgreSQL + Redis addons
3. Set environment variables (same as Vercel env vars)
4. Railway provides a persistent URL like `https://zyra-backend.up.railway.app`
5. Update Frontend `VITE_BACKEND_URL` to point to Railway URL

---

## Local Development (unchanged)

```bash
# Backend
cd Backend
npm install
cp .env.vercel .env  # update with local MongoDB URI
npm run dev          # runs on port 9000

# Frontend
cd Frontend
npm install
npm run dev          # runs on port 5174
```
