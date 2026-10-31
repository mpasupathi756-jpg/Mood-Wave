# 🎵 MoodWave v2 — Advanced Mood-Based Music Streaming Application

> **Enterprise-grade full-stack music platform** with AI-powered mood detection, real-time collaborative listening rooms, comprehensive admin dashboard, and seamless Jamendo API integration.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3+-blue?logo=react)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange?logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [API Reference](#api-reference)
- [Real-Time Events](#real-time-events)
- [Database Schema](#database-schema)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

**MoodWave v2** is a production-ready music streaming application that intelligently matches songs to your emotional state. The platform features:

- 🎧 **Mood-Based Music Discovery** — AI text analysis to detect emotional state and recommend tracks
- 🎵 **Real-Time Collaborative Rooms** — Synchronous listening experiences for up to 4 users with live chat
- 📊 **Advanced Analytics Dashboard** — Admin panel with user growth, mood trends, and activity monitoring
- 🔐 **Enterprise Security** — JWT authentication, bcrypt hashing, rate limiting, and role-based access
- 🌐 **Extensive Music Library** — Integration with Jamendo API for millions of tracks

---

## Key Features

### 👤 User Features

| Category | Features |
|----------|----------|
| **Authentication** | JWT login/register, bcrypt password hashing, auto token refresh, profile management |
| **Music Discovery** | Mood-based recommendations, full-text search across millions of Jamendo tracks, genre browsing |
| **Mood System** | 10-emotion mood picker with emoji, AI text detection ("I'm pumped" → energetic mood) |
| **Playback** | Play/pause, seek, skip, volume control, shuffle, repeat modes, spinning vinyl animation |
| **Visualizations** | Real-time equalizer bars, animated waveforms, immersive full-screen now playing mode |
| **Content Management** | Create/edit playlists, like/unlike songs, track listening history with completion status |
| **Analytics** | Personal mood journal with distribution charts, detailed listening statistics |
| **Social** | Collaborative listening rooms (sync playback), live chat with typing indicators, floating emoji reactions |
| **Customization** | Custom avatar colors, user bio, profile customization |

### 👨‍💼 Admin Features

| Category | Features |
|----------|----------|
| **Dashboard** | Real-time statistics (active users, total songs, listening rooms, play counts) |
| **Analytics** | 14-day user growth line chart, mood distribution bar chart, most-played songs ranking |
| **Monitoring** | Real-time activity feed, audit log of all admin actions with timestamps |
| **User Management** | Create users, assign roles (user/admin), toggle user status, delete accounts |
| **Library Management** | View all songs with metadata, track play counts, manage song properties |
| **Song Ingestion** | Manual song upload via URL (any mp3 stream), batch import from Jamendo |
| **Content Control** | Mark songs as featured, edit metadata, delete songs |

---

## Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn**
- Git (optional, for version control)

### Step 1 — Database Setup

Open MySQL client:

```bash
mysql -u root -p
```

Initialize the database:

```sql
source C:/path/to/moodwave/backend/config/schema.sql
```

Or copy-paste the entire `backend/config/schema.sql` file.

**This creates:**
- Database: `moodwave_v2` (UTF-8 support)
- 11 relational tables (users, songs, moods, rooms, playlists, etc.)
- Default admin account: `admin@moodwave.com` / `Admin@123`
- Demo user account: `demo@moodwave.com` / `Admin@123`

> ⚠️ **Important:** Change default passwords in production!

---

### Step 2 — Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — **configure these variables:**

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=moodwave_v2

# JWT Security
JWT_SECRET=your-256-bit-random-string-minimum-64-characters-long
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

**Expected output:**
```
✅  MySQL connected → moodwave_v2
╔═══════════════════════════════════════╗
║   🎵  MoodWave v2 API  Running        ║
║   Port : 5000                         ║
╚═══════════════════════════════════════╝
```

The API is now available at: **http://localhost:5000/api**

---

### Step 3 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open your browser: **http://localhost:5173**

---

## Tech Stack

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | JavaScript runtime | 18+ |
| **Express.js** | Web framework | 4.19.2 |
| **MySQL 2** | Database driver | 3.9.4 |
| **Socket.io** | Real-time communication | 4.7.5 |
| **JWT** | Authentication & authorization | 9.0.2 |
| **bcryptjs** | Password hashing | 2.4.3 |
| **Axios** | HTTP client | 1.6.8 |
| **Helmet** | Security headers | 7.1.0 |
| **Morgan** | Request logging | 1.10.0 |
| **Express Rate Limit** | DDoS protection | 7.2.0 |

### Frontend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI library | 18.3.1 |
| **Vite** | Build tool | 5.2.10 |
| **React Router** | Client-side routing | 6.23.0 |
| **Zustand** | State management | 4.5.2 |
| **Howler.js** | Audio playback | 2.2.4 |
| **Framer Motion** | Animations | 11.1.7 |
| **Tailwind CSS** | Styling | 3.4.3 |
| **Recharts** | Data visualization | 2.12.4 |
| **Lucide React** | Icons | 0.378.0 |
| **Socket.io Client** | Real-time events | 4.7.5 |
| **React Hot Toast** | Notifications | 2.4.1 |

---

## Project Architecture

### Directory Structure

```
moodwave/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool & helpers
│   │   └── schema.sql             # Database initialization script
│   ├── controllers/
│   │   ├── authController.js      # Auth endpoints (login, register, profile)
│   │   ├── songController.js      # Song CRUD & search operations
│   │   ├── moodController.js      # Mood detection & analytics
│   │   ├── roomController.js      # Collaborative room management
│   │   ├── playlistController.js  # Playlist operations
│   │   └── adminController.js     # Admin dashboard & management
│   ├── middleware/
│   │   └── auth.js                # JWT verification & role guards
│   ├── routes/
│   │   └── index.js               # Centralized API routing
│   ├── socket/
│   │   └── roomSocket.js          # Socket.io event handlers for rooms
│   ├── utils/
│   │   └── jamendo.js             # Jamendo API integration
│   ├── server.js                  # Express & Socket.io initialization
│   ├── package.json
│   └── .env.example               # Environment variables template
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   └── AppLayout.jsx   # Main layout with sidebar & player
    │   │   ├── Player/
    │   │   │   └── Player.jsx      # Bottom player bar (controls, progress)
    │   │   ├── MoodPicker/
    │   │   │   └── MoodPicker.jsx  # Mood selection UI
    │   │   ├── SongCard/
    │   │   │   └── SongCard.jsx    # Reusable song card components
    │   │   └── ...other components
    │   ├── pages/
    │   │   ├── LoginPage.jsx       # Authentication
    │   │   ├── RegisterPage.jsx    # User registration
    │   │   ├── HomePage.jsx        # Mood selector & recommendations
    │   │   ├── SearchPage.jsx      # Search & browse
    │   │   ├── LibraryPage.jsx     # User library (liked, history, playlists)
    │   │   ├── ProfilePage.jsx     # User profile settings
    │   │   ├── NowPlaying.jsx      # Full-screen player
    │   │   ├── RoomPage.jsx        # Collaborative listening
    │   │   └── AdminPage.jsx       # Admin dashboard & controls
    │   ├── store/
    │   │   ├── authStore.js        # Zustand auth state
    │   │   └── playerStore.js      # Zustand player state + Howler.js
    │   ├── services/
    │   │   ├── api.js              # Axios instance with interceptors
    │   │   ├── jamendo.js          # Jamendo API client
    │   │   └── socket.js           # Socket.io singleton
    │   ├── App.jsx                 # Main app component
    │   ├── main.jsx                # React entry point
    │   └── index.css               # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── .env.example

└── vercel.json                     # Deployment configuration
```

### Data Flow Architecture

```
User Interface (React + Zustand)
    ↓ (HTTP Requests)
API Layer (Axios)
    ↓ (Socket.io for real-time)
Express Backend
    ↓
Authentication (JWT)
    ↓
Controllers (Business Logic)
    ↓
MySQL Database
    ↓ (Jamendo API for external music)
Music Library Integration
```

---

## Default Accounts

> ⚠️ Change these passwords immediately in production!

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@moodwave.com` | `Admin@123` | Admin | Full system access, analytics, user management |
| `demo@moodwave.com` | `Admin@123` | User | Standard user demo experience |

---

## API Reference

### Authentication Endpoints

```
POST   /api/auth/register         # Create new user account
POST   /api/auth/login            # Login & get JWT token
GET    /api/auth/me               # Get current user profile
PUT    /api/auth/profile          # Update username, bio, avatar
PUT    /api/auth/password         # Change password
```

### Song Endpoints

```
GET    /api/songs                 # List all songs (paginated, filterable)
GET    /api/songs?genre=pop&mood=happy&search=query&page=1&limit=20
GET    /api/songs/:id             # Get single song details
GET    /api/songs/liked           # Get user's liked songs
GET    /api/songs/history         # Get user's play history
GET    /api/songs/mood/:mood      # Get songs for specific mood

POST   /api/songs                 # ⭐ Admin: Create new song
PUT    /api/songs/:id             # ⭐ Admin: Update song metadata
DELETE /api/songs/:id             # ⭐ Admin: Delete song

POST   /api/songs/:id/like        # Like/unlike a song
POST   /api/songs/play            # Record play event
GET    /api/songs/jamendo/search  # ⭐ Admin: Search Jamendo API
POST   /api/songs/jamendo/import  # ⭐ Admin: Import from Jamendo
```

### Mood Endpoints

```
POST   /api/mood/detect           # AI text-to-mood analysis
GET    /api/mood/history          # Get user's mood history
GET    /api/mood/stats            # Get mood distribution stats
```

### Playlist Endpoints

```
GET    /api/playlists             # List user's playlists
POST   /api/playlists             # Create new playlist
GET    /api/playlists/:id         # Get playlist details
POST   /api/playlists/:id/songs   # Add song to playlist
DELETE /api/playlists/:id/songs/:songId  # Remove song
DELETE /api/playlists/:id         # Delete playlist
```

### Room Endpoints (Real-time Collaboration)

```
POST   /api/rooms                 # Create new listening room
POST   /api/rooms/join            # Join existing room by code
GET    /api/rooms/:code           # Get room info & members
DELETE /api/rooms/:code           # Leave/delete room
GET    /api/rooms/all             # ⭐ Admin: List all active rooms
```

### Admin Endpoints

```
GET    /api/admin/stats           # Dashboard stats (users, songs, rooms)
GET    /api/admin/users           # List all users with details
POST   /api/admin/users           # Create new user account
PUT    /api/admin/users/:id       # Update user role/status
DELETE /api/admin/users/:id       # Delete user account
GET    /api/admin/audit           # Audit log of admin actions
```

⭐ = Requires admin role

---

## Real-Time Events

### Socket.io Event Reference

All room events use Socket.io for instant synchronization across up to 4 users.

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `room:join` | Client→Server | `{roomCode, userId}` | Join room & receive current state |
| `room:leave` | Client→Server | `{roomCode}` | Leave room gracefully |
| `room:play` | Bidirectional | `{songId, timestamp}` | Sync playback across all members |
| `room:pause` | Bidirectional | `{timestamp}` | Sync pause state |
| `room:seek` | Bidirectional | `{position}` | Jump to specific timestamp |
| `room:song` | Bidirectional | `{songId, title, artist}` | Change song for entire room |
| `room:chat` | Bidirectional | `{userId, message, timestamp}` | Send/receive messages |
| `room:typing` | Bidirectional | `{userId, isTyping}` | Show typing indicator |
| `room:react` | Bidirectional | `{userId, emoji, position}` | Floating emoji reactions |
| `room:state` | Server→Client | `{currentSong, position, isPaused, members}` | Full state on join |
| `room:member-update` | Server→Room | `{members: [...]}` | Members list changed |
| `room:notification` | Server→Room | `{message, type}` | User join/leave notification |

---

## Database Schema

The application uses **11 relational tables** with proper indexing and foreign key constraints.

### Core Tables

**users** — User accounts with authentication
```sql
- id (PK), username, email, password_hash, role, avatar_color, bio, is_active, timestamps
- Indexes: email, role
```

**songs** — Music library
```sql
- id (PK), jamendo_id, title, artist, album, genre, mood, duration, play_count, 
  cover_url, audio_url, added_by (FK), timestamps
- Indexes: genre, mood, added_by
```

**moods** — User mood history
```sql
- id (PK), user_id (FK), mood, text_input, detected_emotion, confidence, created_at
```

**playlists** — User-created collections
```sql
- id (PK), user_id (FK), title, description, is_public, created_at
```

**playlist_songs** — Songs in playlists (junction table)
```sql
- playlist_id (FK), song_id (FK), added_at
- PK: (playlist_id, song_id)
```

**rooms** — Collaborative listening spaces
```sql
- id (PK), code (UNIQUE), creator_id (FK), title, password_hash (nullable), 
  max_members, is_active, created_at
```

**room_members** — Room participants
```sql
- room_id (FK), user_id (FK), joined_at
- PK: (room_id, user_id)
```

**play_history** — Track listening records
```sql
- id (PK), user_id (FK), song_id (FK), completed, duration_played, 
  played_at, created_at
- Indexes: user_id, played_at
```

**song_likes** — User song preferences
```sql
- user_id (FK), song_id (FK)
- PK: (user_id, song_id)
```

**admin_audit_log** — Admin action tracking
```sql
- id (PK), admin_id (FK), action, resource_type, resource_id, 
  before_state (JSON), after_state (JSON), ip_address, timestamp
```

**settings** — System configuration
```sql
- key (PK), value, updated_by (FK), updated_at
```

---

## Development Guide

### Environment Configuration

**Backend `.env` template:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=moodwave_v2

JWT_SECRET=min-64-characters-long-random-string
JWT_EXPIRE=7d

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JAMENDO_API_KEY=your_optional_key

LOG_LEVEL=debug
```

**Frontend `.env` template:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 — MySQL (if not running as service):**
```bash
# Windows
net start mysql

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### Code Quality Tools (Recommended)

Add to your VS Code:
- **ES7+ React/Redux snippets** — Quick component scaffolding
- **Tailwind CSS IntelliSense** — CSS class autocompletion
- **Prettier** — Code formatting
- **MySQL** (cweijan) — Database browser
- **Thunder Client** — API testing
- **REST Client** — Alternative API testing

`.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Authentication Flow

1. **Registration** → Password hashed with bcryptjs → Stored in `users` table
2. **Login** → Email & password verified → JWT token issued (7-day expiry)
3. **Protected Routes** → JWT verified via middleware → User context attached to request
4. **Token Refresh** → Client auto-refreshes before expiry (Zustand store)
5. **Logout** → Token removed from localStorage, user cleared from state

### Real-Time Room Logic

1. **Create Room** → POST `/api/rooms` → Room code generated (4 digits)
2. **Join Room** → POST `/api/rooms/join` → Socket.io connection established
3. **Playback Sync** → Leader plays song → Socket event → All members sync
4. **Chat & Reactions** → Messages/emojis broadcast to room → Real-time display
5. **Leave Room** → Socket disconnect → Remove from members list

---

## Deployment

### Frontend Deployment (Vercel)

1. **Build the project:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel:**
   - Push repository to GitHub
   - Connect GitHub to Vercel
   - Set `VITE_API_URL` to production backend
   - Deploy

3. **Alternative (Manual):**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

### Backend Deployment (Railway/Render)

**Option 1: Railway**
1. Connect your GitHub repo
2. Select `backend` folder as root directory
3. Set environment variables in Railway dashboard
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Use Railway PostgreSQL (or PlanetScale MySQL)

**Option 2: Render**
1. Create new Web Service
2. Connect GitHub repository
3. Set start command: `npm install && node server.js`
4. Add environment variables
5. Deploy

**Environment Variables (Production):**
```env
DB_HOST=your-mysql-host
DB_USER=root
DB_PASSWORD=secure_password_here
DB_NAME=moodwave_v2
JWT_SECRET=long-secure-random-string-min-64-chars
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Database Migration

For PlanetScale or Railway MySQL:
1. Create new MySQL database
2. Run schema: `mysql -u user -p database < schema.sql`
3. Update backend `.env` with new credentials

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| ❌ MySQL connection error | Wrong password or MySQL not running | Check `.env` DB credentials; run `net start mysql` (Windows) or `brew services start mysql` (Mac) |
| ❌ Port 5000 already in use | Another service using port | Change `PORT` in `.env` or kill process: `lsof -i :5000 \| grep LISTEN \| awk '{print $2}' \| xargs kill` |
| ❌ Port 5173 in use | Vite dev server conflict | Change port in `vite.config.js` or kill existing process |
| ❌ CORS errors | API & Frontend domain mismatch | Update `FRONTEND_URL` in backend `.env` |
| ❌ Socket.io not connecting | Backend not running | Ensure backend running on correct port |
| ❌ Cannot login (403 Forbidden) | Using non-admin account to access admin panel | Login with `admin@moodwave.com` or request admin role |
| ❌ Audio won't play | Jamendo geo-restriction or invalid URL | Try different mood; check song `audio_url` in database |
| ❌ Password hashing error | bcryptjs not installed | Run `npm install bcryptjs` |
| ⚠️ Slow song search | No database indexes | Verify `schema.sql` indexes created; run: `SHOW INDEX FROM songs;` |
| ⚠️ Memory leak | Abandoned Socket connections | Ensure rooms close properly; check for `room:leave` handlers |

---

## Performance Optimization Tips

- **Database Queries** — Use indexed columns (email, role, genre, mood)
- **Image Optimization** — Compress cover artwork; use CDN for assets
- **Rate Limiting** — Login: 20/15min, Register: 10/hour, API: 500/15min
- **Caching** — Cache Jamendo search results (5-min TTL)
- **Pagination** — Default 20 items/page; use offset-based pagination
- **Socket Rooms** — Limit to 4 members per room to reduce broadcast traffic

---

## Contributing

This is a portfolio project. For modifications:
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## License

This project is licensed under the MIT License — see LICENSE file for details.

---

## Support & Contact

For issues, questions, or feedback:
- 📧 Email: support@moodwave.app
- 🐛 Report Bugs: GitHub Issues
- 💡 Feature Requests: GitHub Discussions

---

**Built with ❤️ using React • Node.js • MySQL • Socket.io • Jamendo API**

*Last Updated: 2026 | MoodWave v2.0*
