# Production Deployment Guide (Neon + Render + Vercel)

This guide walks through deploying the **Review Insights Dashboard** to a live public URL using free-tier cloud providers:
1. **Database**: PostgreSQL 16 on **Neon** (or Render Postgres)
2. **Backend API**: Containerized Node 20 Express service on **Render** (`apps/api/Dockerfile`)
3. **Frontend SPA**: React 18 + Vite static bundle on **Vercel** (`apps/web`)

> **Security Note:** Never commit production connection strings, API keys, or `.env` files to Git. Configure all credentials directly in the Neon, Render, and Vercel dashboards.

---

## Step 1: Provision PostgreSQL 16 on Neon (Free Tier)

1. Sign in to [https://neon.tech](https://neon.tech) and click **New Project**.
2. Choose **PostgreSQL 16**, name the database `review_insights`, and select the region closest to your Render API region (e.g., `AWS us-east-1` or `eu-central-1`).
3. Copy your **Pooled Connection String** (`postgresql://<user>:<password>@<ep-hostname>.neon.tech/review_insights?sslmode=require`).

---

## Step 2: Run Migrations & Seed the Remote Database

From your local terminal at the repository root, run the migrations and deterministic 620-review seed script against your Neon `DATABASE_URL`:

### Option A: PowerShell (Windows)
```powershell
$env:DATABASE_URL="postgresql://<user>:<password>@<ep-hostname>.neon.tech/review_insights?sslmode=require"
npm run db:migrate
npm run db:seed
```

### Option B: Bash / macOS / Linux
```bash
DATABASE_URL="postgresql://<user>:<password>@<ep-hostname>.neon.tech/review_insights?sslmode=require" npm run db:migrate
DATABASE_URL="postgresql://<user>:<password>@<ep-hostname>.neon.tech/review_insights?sslmode=require" npm run db:seed
```

Expected output:
```text
Seed complete: 620 imported, 0 duplicates skipped, 0 failed.
```
*(Because the seed script is idempotent, re-running it will safely report `0 imported, 620 duplicates skipped`.)*

---

## Step 3: Deploy the API on Render (Dockerfile)

1. Sign in to [https://dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service** (or **Blueprint** to auto-detect `render.yaml`).
2. Connect your GitHub repository: `https://github.com/aryanpandeyce/review-insights-dashboard`.
3. Configure the service settings:
   - **Name**: `review-insights-api`
   - **Branch**: `main`
   - **Root Directory**: *(leave blank — repository root)*
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./apps/api/Dockerfile`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables** in Render:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | Your Neon PostgreSQL connection string (`?sslmode=require`) |
| `CORS_ORIGIN` | `https://your-vercel-domain.vercel.app` *(you can set `*` initially, then lock down to your exact Vercel URL after Step 4)* |
| `LOG_LEVEL` | `info` |

5. Click **Create Web Service**. Render will build `apps/api/Dockerfile`, run `node-pg-migrate up` on container boot, and start the server.
6. Verify your live API health endpoint:
   - `https://<your-render-service>.onrender.com/health`
   - `https://<your-render-service>.onrender.com/api/docs`

---

## Step 4: Deploy the Frontend on Vercel

1. Sign in to [https://vercel.com/new](https://vercel.com/new) and import `aryanpandeyce/review-insights-dashboard`.
2. Because root `vercel.json` is pre-configured for the monorepo:
   - **Framework Preset**: `Vite`
   - **Root Directory**: leave as `./` (or set to `apps/web` — both `vercel.json` and `apps/web/vercel.json` include the SPA rewrite rule `/(.*) -> /index.html`).
3. Add the **Environment Variable** in Vercel:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api/v1` |

4. Click **Deploy**.
5. Copy your live Vercel URL (e.g., `https://review-insights-dashboard.vercel.app`) and paste it into Render's `CORS_ORIGIN` environment variable (comma-separated if you want both production and preview URLs), then trigger a quick restart on Render.

---

## Step 5: Environment Variables Checklist

### Backend (`apps/api` — Render)
- [x] `NODE_ENV=production`
- [x] `PORT=4000`
- [x] `DATABASE_URL=postgresql://...`
- [x] `CORS_ORIGIN=https://<your-app>.vercel.app`
- [x] `LOG_LEVEL=info`

### Frontend (`apps/web` — Vercel)
- [x] `VITE_API_URL=https://<your-api>.onrender.com/api/v1`

---

## Step 6: Live Demo Smoke-Test Checklist

Run through these 8 checks on your deployed Vercel URL before submitting:

1. [ ] **API Health & OpenAPI Docs**: Visit `https://<your-api>.onrender.com/health` (`"status": "ok", "database": "connected"`) and `/api/docs`.
2. [ ] **Cold-Start UX Banner**: If the Render free-tier container has been idle for 15+ minutes, verify the friendly *"Waking up the API server..."* banner appears automatically after 2.2 seconds and disappears once data loads.
3. [ ] **Seeded Data Visible on Overview**: Confirm 620 total reviews across the 4 European properties (`Canal House Boutique Amsterdam`, `Sol Mar Beach Resort Barcelona`, `Mitte Executive Hotel Berlin`, `Alpine View Lodge Zurich`) render with sparklines and delta badges.
4. [ ] **Global Property Switcher & Date Range Presets**: Switch between `All Properties` and individual hotels, and toggle `30d`, `90d`, `12m`, and `All (18m)` — verify URL query params (`?propertyId=...&preset=...`) stay in sync and survive a hard browser refresh on deep routes (`/trends`, `/topics`, `/comparison`).
5. [ ] **Reviews Explorer Search & Slide-Over Drawer**: Search for `"wifi"` or `"canal"` in `/reviews`, verify matching terms are highlighted in `<mark>` tags, and click a row to inspect topic snippets in the slide-over drawer.
6. [ ] **Flagged Queue & Resolution Persistence**: Open `/flagged`, click **Mark as Resolved** on an open low-score review, refresh the page, and verify the status persists in PostgreSQL.
7. [ ] **CSV Export & Drag-and-Drop Import**: Click **Export CSV** on `/reviews` to download the filtered dataset, and test uploading the sample CSV template via **Import CSV / JSON**.
8. [ ] **Dark Mode & Mobile Responsiveness**: Toggle Light/Dark mode in the top bar (confirming Recharts gridlines/tooltips update cleanly) and test a `375px` mobile viewport (sidebar collapses into a slide-over drawer).
