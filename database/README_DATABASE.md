# MoodWave Database Deployment — Supabase Guide

This directory contains the complete PostgreSQL database schema and seed data for **MoodWave**, fully configured for deployment on [Supabase](https://supabase.com).

## 📁 Files
- **`supabase_schema.sql`** (also mirrored at the root of the project as `supabase_schema.sql`):
  Contains all table schemas, indexes, foreign keys with cascade rules, auto-updating timestamp triggers, and verified seed data (default users, curated royalty-free music streams, and real-time Listen Together party rooms).

---

## 🚀 How to Deploy to Supabase (Step-by-Step)

### Step 1: Create a Free Supabase Project
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**, choose your organization, name it `moodwave`, and set a database password.

### Step 2: Open the SQL Editor
1. In the left navigation menu, click on the **SQL Editor** tab (icon `>_`).
2. Click **+ New Query**.

### Step 3: Paste and Execute the Schema
1. Open [`database/supabase_schema.sql`](supabase_schema.sql) from this project.
2. Copy the entire file contents and paste it into the Supabase SQL Editor.
3. Click the green **Run** button (or press `Ctrl + Enter`).
4. You will see `Success: No rows returned` — all 14 tables, indexes, triggers, and seed songs are now created!

---

## 🔌 Connecting Backend to Supabase

In your Supabase project:
1. Go to **Project Settings** (gear icon) -> **Database**.
2. Scroll to **Connection string** and select **URI** or **JDBC**.
3. Format:
   ```text
   jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require
   ```
4. Set this in `backend/src/main/resources/application.properties` or as an environment variable:
   ```properties
   db.url=jdbc:postgresql://db.<your-project-ref>.supabase.co:5432/postgres?sslmode=require
   db.user=postgres
   db.password=YOUR_SUPABASE_DB_PASSWORD
   ```

---

## 🗄️ Tables Created
| Table | Description |
|---|---|
| `users` | Accounts, avatars, roles (`user`, `admin`), BCrypt password hashes |
| `songs` | Song library with audio URLs, cover art, genres, and mood tags |
| `song_likes` | Many-to-many user favorite songs |
| `playlists` | Custom user-created playlists with public/private visibility |
| `playlist_songs` | Playlist track ordering and relationships |
| `rooms` | **Listen Together** party rooms supporting 3+ concurrent listeners |
| `room_members` | Active connected listeners in each room |
| `room_chat` | Real-time chat messages and emoji reactions within rooms |
| `listen_history` | User listening logs with completion metrics |
| `mood_history` | Mood detection logs and emotion timeline |
| `user_queue` | Persistent player queues |
| `audit_log` | Security audit trail for admin actions |

---

## 👤 Default Seed Accounts
| Username | Email | Password | Role |
|---|---|---|---|
| `admin` | `admin@moodwave.com` | `Admin@123` | Administrator |
| `demouser` | `demo@moodwave.com` | `Admin@123` | Standard User |
| `sarah_vibes` | `sarah@moodwave.com` | `Admin@123` | Standard User |
| `alex_beats` | `alex@moodwave.com` | `Admin@123` | Standard User |

