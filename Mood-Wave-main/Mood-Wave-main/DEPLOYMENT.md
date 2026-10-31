# 🚀 MoodWave — 100% Free Production Deployment Guide (Supabase + Render + Vercel)

This guide walks you through deploying **MoodWave v2** online completely for **FREE** using **Supabase (PostgreSQL)**, **Render (Node.js API)**, and **Vercel (React Frontend)**.

---

## 🏗️ Architecture Overview

| Component | Free Platform | Free Tier Inclusions | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Unlimited edge bandwidth, Global CDN, SSL, CI/CD | **$0/mo** |
| **Backend API** | **Render.com** | 750 free instance hours/month, WebSocket & Socket.io support | **$0/mo** |
| **Database** | **Supabase (PostgreSQL)** | 500MB free database, automatic backups, SSL connection pooling | **$0/mo** |
| **Audio Stream** | **Jamendo API** | 500,000+ tracks, free streaming CDN | **$0/mo** |

---

## 📋 Step 1: Set Up Free PostgreSQL on Supabase

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in with GitHub.
2. Click **New Project** and name it `moodwave-db`.
3. Set a strong database password (save this password safely!).
4. Choose a region closest to you and click **Create new project**.
5. Once your project is ready:
   - Go to **Project Settings** (gear icon) → **Database**.
   - Scroll to **Connection string** / **Connection Pooling**.
   - Select **URI** mode and copy the connection string.
     - Mode: **Transaction** (Port `6543`) or **Session** (Port `5432`).
     - Example:
       ```
       postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
       ```
   - Replace `[YOUR-PASSWORD]` with the password you set in step 3.
6. Run the database schema:
   - In the Supabase left navigation bar, click **SQL Editor**.
   - Click **New Query**.
   - Copy the entire contents of [backend/config/schema.sql](file:///c:/Users/PHENIX/Downloads/moodwave-main/moodwave-main/backend/config/schema.sql).
   - Paste into the SQL editor and click **Run**.
   - All 13 tables, indexes, update triggers, and default seed accounts (`admin@moodwave.com`, `demo@moodwave.com`) will be created!

---

## ⚡ Step 2: Deploy Backend to Render.com

1. Commit and push your MoodWave project to your GitHub repository.
2. Sign in to [https://render.com](https://render.com).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository (`Mood-Wave`).
5. Configure the service:
   - **Name**: `moodwave-api`
   - **Root Directory**: `backend` *(or `moodwave-main/backend` depending on your repository root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:

| Variable | Value | Note |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Port listened to internally |
| `DATABASE_URL` | *(Supabase URI from Step 1)* | Full PostgreSQL connection string with password |
| `DB_SSL` | `true` | Required for Supabase cloud SSL |
| `JWT_SECRET` | `MySuperSecureSecretKey2026!MoodWavePostgres` | 32+ character random string |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `JAMENDO_CLIENT_ID` | `24b564e3` | Free Jamendo API Client ID |
| `FRONTEND_URL` | `*` *(or your Vercel URL)* | Allowed CORS origin |

7. Click **Create Web Service**.
8. Once the build completes, copy your live backend URL (e.g. `https://moodwave-api.onrender.com`).

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Sign in to [https://vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`Mood-Wave`).
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(or `moodwave-main/frontend`)*
5. Under **Environment Variables**, add:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://your-moodwave-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-moodwave-api.onrender.com` |

6. Click **Deploy**.
7. Vercel will deploy your React app to `https://your-project.vercel.app`!

---

## 🧪 Testing Your Live Deployment

1. Open your Vercel app URL.
2. Click **Demo User** (`demo@moodwave.com` / `Admin@123`) or register a new account.
3. Test emotion-based music discovery, playlist creation, song liking, and listening rooms.
