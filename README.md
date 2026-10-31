# MoodWave 🎵

> **Full-stack AI-powered mood music streaming platform** with Java backend (Jakarta Servlets + JDBC + DAO pattern + MVC), React frontend, Supabase PostgreSQL database, and real-time Listen Together rooms for 3+ users.

## 🏗️ Architecture

```
moodwave/
├── backend/                     ← Java 21 backend (pure Jakarta Servlets, no Spring)
│   └── src/main/java/com/moodwave/
│       ├── controller/          ← MVC Controllers (Servlets)
│       ├── service/             ← Business logic layer
│       ├── dao/                 ← DAO Design Pattern (JDBC)
│       ├── model/               ← POJO models
│       ├── filter/              ← CORS + Auth filters
│       ├── websocket/           ← Real-time room sync WebSocket
│       └── util/                ← JWT, BCrypt, JSON utilities
├── frontend/                    ← React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/               ← All UI pages
│       ├── components/          ← Reusable components
│       ├── store/               ← Zustand state management
│       └── services/            ← API + Jamendo integration
├── database/
│   └── supabase_schema.sql      ← Full Supabase DDL + seed data
├── .env.example                 ← Template (copy to .env)
└── supabase_schema.sql          ← Same SQL file at root
```

## ⚡ Quick Start (Local Development)

### Prerequisites
- Java 21 JDK
- Maven 3.8+
- Node.js 18+
- Supabase account (or use provided demo database)

### 1. Configure Environment
```bash
# Copy example env file
copy .env.example .env

# Edit .env with your Supabase credentials:
# DB_HOST=db.xxxxxxxxxxxx.supabase.co
# DB_USER=postgres
# DB_PASSWORD=your_password
# DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
```

### 2. Set Up Database (Supabase)
1. Go to [supabase.com](https://supabase.com) → your project → SQL Editor
2. Paste and run `supabase_schema.sql`
3. This creates all 12 tables + seeds demo data (10 songs, 4 users, 1 room)

### 3. Start Backend (Java)
```bash
# Windows
start_backend.bat

# Or manually:
cd backend
mvn exec:java -Dexec.mainClass=com.moodwave.ServerApp
```
Backend starts at **http://localhost:5000**

### 4. Start Frontend (React)
```bash
# Windows
start_frontend.bat

# Or manually:
cd frontend
npm install
npm run dev
```
Frontend starts at **http://localhost:3001** (or 3000 if available)

### 5. Open App
Navigate to **http://localhost:3001** in your browser.

**Demo credentials:**
- Admin: `admin@moodwave.com` / `Admin@123`
- User: `demouser@moodwave.com` / `Demo@123`

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server health check |
| POST | `/api/auth/login` | No | Login, returns JWT token |
| POST | `/api/auth/register` | No | Register new user |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| GET | `/api/songs` | No | List songs (filter: q, mood, genre) |
| GET | `/api/songs/mood/{mood}` | No | Songs by mood |
| GET | `/api/songs/liked` | Yes | User's liked songs |
| GET | `/api/songs/history` | Yes | Listening history |
| POST | `/api/songs/{id}/like` | Yes | Toggle like |
| GET | `/api/rooms/all` | No | All active public rooms |
| POST | `/api/rooms` | Yes | Create room |
| POST | `/api/rooms/join` | Yes | Join room by code |
| GET | `/api/rooms/{code}/sync` | No | Polling sync state |
| POST | `/api/mood/detect` | No | Detect mood from text |
| GET | `/api/mood/history` | Yes | Mood history |
| GET | `/api/mood/stats` | Yes | Mood analytics |
| GET | `/api/playlists` | Yes | User's playlists |
| POST | `/api/playlists` | Yes | Create playlist |
| GET | `/api/admin/stats` | Admin | Platform analytics |

---

## 🗄️ Database Schema (Supabase PostgreSQL)

12 tables including: `users`, `songs`, `listen_history`, `song_likes`, `rooms`, `room_members`, `room_chat_messages`, `playlists`, `playlist_songs`, `mood_history`, `followers`

---

## 📱 PWA / Mobile App

MoodWave is a Progressive Web App (PWA):
- **Android:** Open in Chrome → Menu → "Add to Home Screen"
- **iOS:** Open in Safari → Share → "Add to Home Screen"
- **Desktop:** Click install button in browser address bar

---

## 🚀 Deployment

### Backend (Render / Railway / Fly.io)
1. Set environment variables from `.env.example`
2. Build: `mvn -f backend/pom.xml package -DskipTests`
3. Run: `java -jar backend/target/moodwave-backend-2.0.0.jar`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL=https://your-backend-url/api`
2. Build: `cd frontend && npm run build`
3. Deploy `frontend/dist/` folder

### Database
Already hosted on **Supabase** — no deployment needed.

---

## 🔒 Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- Use `.env.example` as the template for new environments
- JWT tokens expire in 72 hours
- BCrypt is used for password hashing (cost factor 12)
- All API routes use CORS filter with configurable origins
- Supabase connection uses SSL (`sslmode=require`)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Jakarta Servlets, Embedded Tomcat 10.1 |
| Database Layer | JDBC, HikariCP connection pool, DAO pattern |
| Database | Supabase (PostgreSQL 15) |
| Auth | JJWT 0.12, BCrypt (jBCrypt) |
| JSON | Jackson with snake_case naming |
| Frontend | React 18, Vite 5, Tailwind CSS |
| State | Zustand |
| Audio | Howler.js |
| Real-time | Native WebSocket (room sync) |
| Music API | Jamendo Open API |
| PWA | Web App Manifest + Service Worker |

---

## 🧩 Features

- 🎵 **Mood-based music discovery** — pick from 10 moods or describe in text
- 🎧 **Listen Together** — create/join rooms for 3+ users with synchronized playback
- 👁️ **Listen to Others** — browse active rooms and join live sessions
- 💬 **Room Chat** — real-time emoji reactions and text chat
- ❤️ **Liked Songs** — personal favorites library
- 📋 **Playlists** — create and manage custom playlists
- 📊 **Mood Journal** — analytics of your emotional listening patterns
- 👤 **Profile** — avatar, bio, listening history
- 🛡️ **Admin Panel** — user management, platform analytics
- 📱 **Mobile PWA** — installable on iOS & Android
