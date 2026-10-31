package com.moodwave.dao;

import com.moodwave.util.Config;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class DBConnection {
    private static HikariDataSource dataSource;
    private static boolean isH2Fallback = false;

    static {
        initDataSource();
    }

    public static synchronized void initDataSource() {
        String rawUrl = Config.get("db.url", "");
        String dbUser = Config.get("db.user", "postgres");
        String dbPass = Config.get("db.password", "");

        String jdbcUrl = rawUrl;

        // Parse Supabase URI (postgresql:// or postgres://)
        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                String prefix = rawUrl.startsWith("postgres://") ? "postgres://" : "postgresql://";
                String remainder = rawUrl.substring(prefix.length());

                // Find the LAST '@' to correctly handle passwords containing '@'
                int lastAt = remainder.lastIndexOf('@');
                if (lastAt != -1) {
                    String userPassPart = remainder.substring(0, lastAt);
                    String hostPortDbPart = remainder.substring(lastAt + 1);

                    // Parse user and pass
                    int colon = userPassPart.indexOf(':');
                    if (colon != -1) {
                        dbUser = URLDecoder.decode(userPassPart.substring(0, colon), StandardCharsets.UTF_8);
                        dbPass = URLDecoder.decode(userPassPart.substring(colon + 1), StandardCharsets.UTF_8);
                    } else {
                        dbUser = URLDecoder.decode(userPassPart, StandardCharsets.UTF_8);
                    }

                    jdbcUrl = "jdbc:postgresql://" + hostPortDbPart;
                } else {
                    jdbcUrl = "jdbc:postgresql://" + remainder;
                }

                if (!jdbcUrl.contains("sslmode=")) {
                    jdbcUrl += (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
                }
                System.out.println("[DBConnection] Parsed Supabase URI successfully -> JDBC URL: " + jdbcUrl + " (User: " + dbUser + ")");
            } catch (Exception ex) {
                System.err.println("[DBConnection] Could not parse URI, using raw JDBC: " + ex.getMessage());
            }
        } else if (jdbcUrl != null && jdbcUrl.startsWith("jdbc:postgresql://") && !jdbcUrl.contains("sslmode=")) {
            jdbcUrl += (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setDriverClassName("org.postgresql.Driver");
        hikariConfig.setJdbcUrl(jdbcUrl);
        hikariConfig.setUsername(dbUser);
        hikariConfig.setPassword(dbPass);
        hikariConfig.setMaximumPoolSize(Config.getInt("db.pool.maximumPoolSize", 10));
        hikariConfig.setMinimumIdle(Config.getInt("db.pool.minimumIdle", 2));
        hikariConfig.setConnectionTimeout(Config.getInt("db.pool.connectionTimeout", 8000));
        hikariConfig.setInitializationFailTimeout(5000);

        try {
            System.out.println("[DBConnection] Connecting to Supabase online database: " + jdbcUrl);
            dataSource = new HikariDataSource(hikariConfig);
            // Verify connection
            try (Connection conn = dataSource.getConnection()) {
                System.out.println("====================================================================");
                System.out.println(" [DBConnection] SUCCESS! Connected to Supabase Online Database!");
                System.out.println(" Host: db.hnyrheeeschzchmyidwv.supabase.co");
                System.out.println(" Catalog: " + conn.getCatalog());
                System.out.println("====================================================================");
                isH2Fallback = false;
            }
        } catch (Exception e) {
            System.err.println("[DBConnection] Could not connect to Supabase: " + e.getMessage());
            System.out.println("[DBConnection] Falling back to embedded development DB until Supabase credentials are confirmed.");
            initFallbackH2();
        }
    }

    private static void initFallbackH2() {
        try {
            if (dataSource != null && !dataSource.isClosed()) {
                dataSource.close();
            }
            HikariConfig h2Config = new HikariConfig();
            h2Config.setDriverClassName("org.h2.Driver");
            h2Config.setJdbcUrl("jdbc:h2:mem:moodwave;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
            h2Config.setUsername("sa");
            h2Config.setPassword("");
            h2Config.setMaximumPoolSize(10);
            dataSource = new HikariDataSource(h2Config);
            isH2Fallback = true;
            runFallbackSchema();
        } catch (Exception ex) {
            System.err.println("[DBConnection] Failed to init fallback DB: " + ex.getMessage());
        }
    }

    private static void runFallbackSchema() {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            String ddl = """
                CREATE TABLE IF NOT EXISTS users (
                  id SERIAL PRIMARY KEY,
                  username VARCHAR(50) NOT NULL UNIQUE,
                  email VARCHAR(120) NOT NULL UNIQUE,
                  password_hash VARCHAR(255) NOT NULL,
                  role VARCHAR(20) NOT NULL DEFAULT 'user',
                  avatar_color VARCHAR(10) NOT NULL DEFAULT '#20C997',
                  avatar_url VARCHAR(500) DEFAULT NULL,
                  bio VARCHAR(280) DEFAULT NULL,
                  is_active BOOLEAN NOT NULL DEFAULT TRUE,
                  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS songs (
                  id SERIAL PRIMARY KEY,
                  jamendo_id VARCHAR(50) UNIQUE DEFAULT NULL,
                  title VARCHAR(255) NOT NULL,
                  artist VARCHAR(255) NOT NULL,
                  album VARCHAR(255) DEFAULT NULL,
                  genre VARCHAR(80) DEFAULT NULL,
                  mood VARCHAR(80) DEFAULT NULL,
                  tags VARCHAR(500) DEFAULT NULL,
                  duration INT NOT NULL DEFAULT 0,
                  bpm INT DEFAULT NULL,
                  cover_url VARCHAR(600) NOT NULL DEFAULT '',
                  audio_url VARCHAR(600) NOT NULL DEFAULT '',
                  waveform_url VARCHAR(600) DEFAULT NULL,
                  play_count INT NOT NULL DEFAULT 0,
                  like_count INT NOT NULL DEFAULT 0,
                  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
                  added_by INT DEFAULT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS song_likes (
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL,
                  song_id INT NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT uniq_song_like UNIQUE (user_id, song_id)
                );

                CREATE TABLE IF NOT EXISTS playlists (
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL,
                  name VARCHAR(200) NOT NULL,
                  description VARCHAR(500) DEFAULT NULL,
                  cover_url VARCHAR(600) DEFAULT NULL,
                  mood_tag VARCHAR(80) DEFAULT NULL,
                  is_public BOOLEAN NOT NULL DEFAULT FALSE,
                  play_count INT NOT NULL DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS playlist_songs (
                  id SERIAL PRIMARY KEY,
                  playlist_id INT NOT NULL,
                  song_id INT NOT NULL,
                  position INT NOT NULL DEFAULT 0,
                  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT uniq_playlist_song UNIQUE (playlist_id, song_id)
                );

                CREATE TABLE IF NOT EXISTS listen_history (
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL,
                  song_id INT DEFAULT NULL,
                  jamendo_id VARCHAR(50) DEFAULT NULL,
                  song_title VARCHAR(255) DEFAULT NULL,
                  song_artist VARCHAR(255) DEFAULT NULL,
                  song_cover VARCHAR(600) DEFAULT NULL,
                  duration_played INT NOT NULL DEFAULT 0,
                  completed BOOLEAN NOT NULL DEFAULT FALSE,
                  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS mood_history (
                  id SERIAL PRIMARY KEY,
                  user_id INT NOT NULL,
                  mood VARCHAR(50) NOT NULL,
                  emoji VARCHAR(10) DEFAULT NULL,
                  energy_level SMALLINT DEFAULT 5,
                  input_text VARCHAR(500) DEFAULT NULL,
                  songs_queued INT DEFAULT 0,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS rooms (
                  id SERIAL PRIMARY KEY,
                  code VARCHAR(8) NOT NULL UNIQUE,
                  name VARCHAR(100) NOT NULL,
                  host_id INT NOT NULL,
                  max_members INT NOT NULL DEFAULT 25,
                  is_active BOOLEAN NOT NULL DEFAULT TRUE,
                  is_private BOOLEAN NOT NULL DEFAULT FALSE,
                  password_hash VARCHAR(255) DEFAULT NULL,
                  current_song_data VARCHAR(4000) DEFAULT NULL,
                  playback_pos DOUBLE PRECISION NOT NULL DEFAULT 0,
                  is_playing BOOLEAN NOT NULL DEFAULT FALSE,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS room_members (
                  id SERIAL PRIMARY KEY,
                  room_id INT NOT NULL,
                  user_id INT NOT NULL,
                  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  CONSTRAINT uniq_room_member UNIQUE (room_id, user_id)
                );

                CREATE TABLE IF NOT EXISTS room_chat (
                  id SERIAL PRIMARY KEY,
                  room_id INT NOT NULL,
                  user_id INT NOT NULL,
                  msg_type VARCHAR(20) NOT NULL DEFAULT 'text',
                  content VARCHAR(1000) NOT NULL,
                  song_data VARCHAR(4000) DEFAULT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                INSERT INTO users (username, email, password_hash, role, avatar_color) VALUES
                ('admin', 'admin@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'admin', '#ef4444'),
                ('demouser', 'demo@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user', '#20c997'),
                ('sarah_vibes', 'sarah@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user', '#8b5cf6'),
                ('alex_beats', 'alex@moodwave.com', '$2a$12$Zq3bqYjIqGSaczYqzYr12OytjIvooWvBPDcWSWC85AS.bGEQ1DyDa', 'user', '#3b82f6');

                INSERT INTO songs (title, artist, album, genre, mood, duration, cover_url, audio_url, play_count, is_featured) VALUES
                ('Midnight City Glow', 'Neon Horizon', 'Synthetics 2026', 'Synthwave', 'energetic', 214, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3', 1240, TRUE),
                ('Ocean Breeze & Rain', 'Lofi Solitude', 'Peaceful Days', 'Lo-Fi', 'calm', 188, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3', 980, TRUE),
                ('Golden Sunrise', 'Aura Soundscapes', 'Morning Bliss', 'Ambient', 'happy', 195, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77530.mp3?filename=uplifting-day-12345.mp3', 840, TRUE),
                ('Deep Focus Flow', 'Neural Mind', 'Alpha States', 'Electronic', 'focused', 240, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=chill-abstract-intention-12099.mp3', 1560, TRUE),
                ('Night Drive Melancholy', 'Echo Valley', 'Distant Lights', 'Indie', 'sad', 210, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=sad-piano-ambient-10926.mp3', 630, FALSE),
                ('Club Voltage', 'HyperPulse', 'Neon Nights', 'Dance', 'party', 178, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80', 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_82c0f64c63.mp3?filename=electronic-future-beats-117997.mp3', 2100, TRUE);

                INSERT INTO rooms (code, name, host_id, max_members, is_active, is_private, playback_pos, is_playing, current_song_data)
                VALUES ('VIBE01', 'Global Chillwave Party', 1, 25, TRUE, FALSE, 45.0, TRUE, '{"id": 1, "title": "Midnight City Glow", "artist": "Neon Horizon", "duration": 214, "cover_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80", "audio_url": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3"}');

                INSERT INTO room_members (room_id, user_id) VALUES (1, 1), (1, 2), (1, 3), (1, 4);

                INSERT INTO room_chat (room_id, user_id, msg_type, content) VALUES
                (1, 1, 'text', 'Welcome to the Listen Together party! We have 4 users connected listening in real-time!');
                """;
            stmt.execute(ddl);
            System.out.println("[DBConnection] Fallback in-memory database initialized successfully.");
        } catch (Exception e) {
            System.err.println("[DBConnection] Error running fallback schema: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        if (dataSource == null) {
            initDataSource();
        }
        return dataSource.getConnection();
    }

    public static boolean isH2() {
        return isH2Fallback;
    }
}
