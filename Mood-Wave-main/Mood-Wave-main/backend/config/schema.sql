-- ============================================================
--  MoodWave v2 — Complete PostgreSQL / Supabase Schema
--  Compatible with Supabase SQL Editor and local PostgreSQL
-- ============================================================

-- Extensions (if needed)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── Updated At Trigger Function ──────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_color  VARCHAR(7)   NOT NULL DEFAULT '#5060f8',
  avatar_url    VARCHAR(500) DEFAULT NULL,
  bio           VARCHAR(280) DEFAULT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_seen     TIMESTAMPTZ  DEFAULT NOW(),
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Songs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS songs (
  id           SERIAL PRIMARY KEY,
  jamendo_id   VARCHAR(50)  UNIQUE DEFAULT NULL,
  title        VARCHAR(255) NOT NULL,
  artist       VARCHAR(255) NOT NULL,
  album        VARCHAR(255) DEFAULT NULL,
  genre        VARCHAR(80)  DEFAULT NULL,
  mood         VARCHAR(80)  DEFAULT NULL,
  tags         VARCHAR(500) DEFAULT NULL,
  duration     INT          NOT NULL DEFAULT 0,
  bpm          INT          DEFAULT NULL,
  cover_url    VARCHAR(600) NOT NULL DEFAULT '',
  audio_url    VARCHAR(600) NOT NULL DEFAULT '',
  waveform_url VARCHAR(600) DEFAULT NULL,
  play_count   INT          NOT NULL DEFAULT 0,
  like_count   INT          NOT NULL DEFAULT 0,
  is_featured  BOOLEAN      NOT NULL DEFAULT FALSE,
  added_by     INT          DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_genre      ON songs (genre);
CREATE INDEX IF NOT EXISTS idx_songs_mood       ON songs (mood);
CREATE INDEX IF NOT EXISTS idx_songs_featured   ON songs (is_featured);
CREATE INDEX IF NOT EXISTS idx_songs_play_count ON songs (play_count DESC);
CREATE INDEX IF NOT EXISTS idx_songs_search     ON songs (title, artist, album);

-- ── User Song Likes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS song_likes (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id    INT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_song_like UNIQUE (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_song_likes_user ON song_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_song_likes_song ON song_likes (song_id);

-- ── Playlists ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  cover_url   VARCHAR(600) DEFAULT NULL,
  mood_tag    VARCHAR(80)  DEFAULT NULL,
  is_public   BOOLEAN      NOT NULL DEFAULT FALSE,
  play_count  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user   ON playlists (user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists (is_public);

DROP TRIGGER IF EXISTS trg_playlists_updated_at ON playlists;
CREATE TRIGGER trg_playlists_updated_at
BEFORE UPDATE ON playlists
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS playlist_songs (
  id          SERIAL PRIMARY KEY,
  playlist_id INT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id     INT NOT NULL REFERENCES songs(id)     ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_playlist_song UNIQUE (playlist_id, song_id)
);

-- ── Listening History ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listen_history (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id         INT DEFAULT NULL REFERENCES songs(id) ON DELETE SET NULL,
  jamendo_id      VARCHAR(50)  DEFAULT NULL,
  song_title      VARCHAR(255) DEFAULT NULL,
  song_artist     VARCHAR(255) DEFAULT NULL,
  song_cover      VARCHAR(600) DEFAULT NULL,
  duration_played INT NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  played_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listen_history_user_time ON listen_history (user_id, played_at DESC);

-- ── Mood History ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_history (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood         VARCHAR(50)  NOT NULL,
  emoji        VARCHAR(10)  DEFAULT NULL,
  energy_level SMALLINT     DEFAULT 5,
  input_text   VARCHAR(500) DEFAULT NULL,
  songs_queued INT          DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_history_user_time ON mood_history (user_id, created_at DESC);

-- ── Rooms ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                SERIAL PRIMARY KEY,
  code              VARCHAR(8)   NOT NULL UNIQUE,
  name              VARCHAR(100) NOT NULL,
  host_id           INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members       INT          NOT NULL DEFAULT 4,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  is_private        BOOLEAN      NOT NULL DEFAULT FALSE,
  password_hash     VARCHAR(255) DEFAULT NULL,
  current_song_data JSONB        DEFAULT NULL,
  playback_pos      FLOAT        NOT NULL DEFAULT 0,
  is_playing        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code   ON rooms (code);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms (is_active);

CREATE TABLE IF NOT EXISTS room_members (
  id        SERIAL PRIMARY KEY,
  room_id   INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_room_member UNIQUE (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_chat (
  id         SERIAL PRIMARY KEY,
  room_id    INT           NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  msg_type   VARCHAR(20)   NOT NULL DEFAULT 'text' CHECK (msg_type IN ('text', 'song', 'system')),
  content    VARCHAR(1000) NOT NULL,
  song_data  JSONB         DEFAULT NULL,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_chat_time ON room_chat (room_id, created_at DESC);

-- ── User Follows ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_follows (
  id           SERIAL PRIMARY KEY,
  follower_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_user_follow UNIQUE (follower_id, following_id)
);

-- ── Song Queue (persistent) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_queue (
  id         SERIAL PRIMARY KEY,
  user_id    INT   NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  queue_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  queue_idx  INT   NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_user_queue_updated_at ON user_queue;
CREATE TRIGGER trg_user_queue_updated_at
BEFORE UPDATE ON user_queue
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Admin Audit Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  admin_id   INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     VARCHAR(100) NOT NULL,
  target     VARCHAR(200) DEFAULT NULL,
  detail     TEXT         DEFAULT NULL,
  ip_address VARCHAR(45)  DEFAULT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_time ON audit_log (admin_id, created_at DESC);

-- ── Seed Data ─────────────────────────────────────────────────────
-- Admin user  (password: Admin@123)
-- Demo user   (password: Admin@123)
INSERT INTO users (username, email, password_hash, role, avatar_color) VALUES
('admin',    'admin@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'admin', '#ef4444'),
('demouser', 'demo@moodwave.com',  '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user',  '#22c55e')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
