-- ====================================================================
--  MoodWave — Supabase / PostgreSQL Schema & Seed Migration Script
--  Deployable directly to Supabase SQL Editor or standard PostgreSQL
-- ====================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Utility Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- 3. Users Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_color  VARCHAR(10)  NOT NULL DEFAULT '#20C997',
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

-- --------------------------------------------------------------------
-- 4. Songs Table
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 5. Song Likes Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS song_likes (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id    INT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_song_like UNIQUE (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_song_likes_user ON song_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_song_likes_song ON song_likes (song_id);

-- --------------------------------------------------------------------
-- 6. Playlists Table
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 7. Playlist Songs Mapping
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS playlist_songs (
  id          SERIAL PRIMARY KEY,
  playlist_id INT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id     INT NOT NULL REFERENCES songs(id)     ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_playlist_song UNIQUE (playlist_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_songs_rel ON playlist_songs (playlist_id, song_id);

-- --------------------------------------------------------------------
-- 8. Listening History
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 9. Mood History
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 10. Rooms (Listen Together / Listen to Other)
-- Supports 3 or more users listening together in real-time sync
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id                SERIAL PRIMARY KEY,
  code              VARCHAR(8)   NOT NULL UNIQUE,
  name              VARCHAR(100) NOT NULL,
  host_id           INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_members       INT          NOT NULL DEFAULT 20, -- Supports 3 or more users
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

-- --------------------------------------------------------------------
-- 11. Room Members
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_members (
  id        SERIAL PRIMARY KEY,
  room_id   INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_room_member UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members (user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members (room_id);

-- --------------------------------------------------------------------
-- 12. Room Chat & Live Reactions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_chat (
  id         SERIAL PRIMARY KEY,
  room_id    INT           NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  msg_type   VARCHAR(20)   NOT NULL DEFAULT 'text' CHECK (msg_type IN ('text', 'song', 'system', 'reaction')),
  content    VARCHAR(1000) NOT NULL,
  song_data  JSONB         DEFAULT NULL,
  created_at TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_chat_time ON room_chat (room_id, created_at DESC);

-- --------------------------------------------------------------------
-- 13. Persistent User Queue
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 14. Admin Audit Log
-- --------------------------------------------------------------------
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

-- ====================================================================
-- SEED DATA (Ready to use in Supabase)
-- ====================================================================

-- 1. Default Users (Pass: Admin@123)
-- Hash generated via BCrypt (12 rounds)
INSERT INTO users (username, email, password_hash, role, avatar_color, bio) VALUES
('admin', 'admin@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'admin', '#ef4444', 'Platform Administrator & MoodWave Curator'),
('demouser', 'demo@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user', '#20c997', 'Music enthusiast exploring moods & listening parties'),
('sarah_vibes', 'sarah@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user', '#8b5cf6', 'Lofi and chillout collector'),
('alex_beats', 'alex@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user', '#3b82f6', 'Electronic, synthwave and deep focus grooves')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 2. Curated Songs with High Quality Streams and Artwork
INSERT INTO songs (title, artist, album, genre, mood, duration, cover_url, audio_url, play_count, is_featured) VALUES
('Midnight City Glow', 'Neon Horizon', 'Synthetics 2026', 'Synthwave', 'energetic', 214, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3', 1240, TRUE),
('Ocean Breeze & Rain', 'Lofi Solitude', 'Peaceful Days', 'Lo-Fi', 'calm', 188, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3', 980, TRUE),
('Golden Sunrise', 'Aura Soundscapes', 'Morning Bliss', 'Ambient', 'happy', 195, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77530.mp3?filename=uplifting-day-12345.mp3', 840, TRUE),
('Deep Focus Flow', 'Neural Mind', 'Alpha States', 'Electronic', 'focused', 240, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=chill-abstract-intention-12099.mp3', 1560, TRUE),
('Night Drive Melancholy', 'Echo Valley', 'Distant Lights', 'Indie', 'sad', 210, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=sad-piano-ambient-10926.mp3', 630, FALSE),
('Club Voltage', 'HyperPulse', 'Neon Nights', 'Dance', 'party', 178, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_82c0f64c63.mp3?filename=electronic-future-beats-117997.mp3', 2100, TRUE),
('Caffeine & High Tempo', 'Iron Cardio', 'Beast Mode', 'Rock / EDM', 'workout', 190, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c35ef28ff0.mp3?filename=sport-electro-126298.mp3', 1890, FALSE),
('Velvet Candlelight', 'Silk & Strings', 'Midnight Serenade', 'Acoustic', 'romantic', 225, 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_d0c6ff1bab.mp3?filename=warm-acoustic-love-11532.mp3', 750, FALSE),
('Starlight Lullaby', 'Dreamweaver', 'Sleepscapes', 'Ambient', 'sleepy', 260, 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73f081702d.mp3?filename=sleep-meditation-432hz-16298.mp3', 920, FALSE),
('Thunder Strike', 'Distortion Unit', 'Reckoning', 'Metal', 'angry', 205, 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db65972744.mp3?filename=powerful-rock-metal-112342.mp3', 490, FALSE)
ON CONFLICT DO NOTHING;

-- 3. Initial Demo Room for "Listen Together" with 3+ Users
INSERT INTO rooms (code, name, host_id, max_members, is_active, is_private, playback_pos, is_playing, current_song_data)
VALUES (
  'VIBE01',
  'Global Chillwave Party',
  (SELECT id FROM users WHERE username = 'admin' LIMIT 1),
  25,
  TRUE,
  FALSE,
  45.0,
  TRUE,
  '{"id": 1, "title": "Midnight City Glow", "artist": "Neon Horizon", "duration": 214, "cover_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80", "audio_url": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3"}'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- 4. Initial Members in Room VIBE01 (Showing 3 or more users listening together!)
INSERT INTO room_members (room_id, user_id)
SELECT r.id, u.id FROM rooms r, users u
WHERE r.code = 'VIBE01' AND u.username IN ('admin', 'demouser', 'sarah_vibes', 'alex_beats')
ON CONFLICT DO NOTHING;

-- 5. Seed Welcome Chat for Listen Together
INSERT INTO room_chat (room_id, user_id, msg_type, content)
SELECT r.id, u.id, 'text', 'Welcome to the Listen Together party! We have 4 users connected listening in real-time!'
FROM rooms r, users u WHERE r.code = 'VIBE01' AND u.username = 'admin'
ON CONFLICT DO NOTHING;

