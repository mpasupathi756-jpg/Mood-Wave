package com.moodwave.dao;

import com.moodwave.model.Song;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SongDAOImpl implements SongDAO {

    private Song mapResultSetToSong(ResultSet rs, Integer currentUserId) throws SQLException {
        Song song = new Song();
        song.setId(rs.getInt("id"));
        song.setJamendoId(rs.getString("jamendo_id"));
        song.setTitle(rs.getString("title"));
        song.setArtist(rs.getString("artist"));
        song.setAlbum(rs.getString("album"));
        song.setGenre(rs.getString("genre"));
        song.setMood(rs.getString("mood"));
        song.setTags(rs.getString("tags"));
        song.setDuration(rs.getInt("duration"));
        song.setBpm(rs.getObject("bpm") != null ? rs.getInt("bpm") : null);
        song.setCoverUrl(rs.getString("cover_url"));
        song.setAudioUrl(rs.getString("audio_url"));
        song.setWaveformUrl(rs.getString("waveform_url"));
        song.setPlayCount(rs.getInt("play_count"));
        song.setLikeCount(rs.getInt("like_count"));
        song.setFeatured(rs.getBoolean("is_featured"));
        song.setAddedBy(rs.getObject("added_by") != null ? rs.getInt("added_by") : null);
        song.setCreatedAt(rs.getTimestamp("created_at"));

        try {
            // Check if liked_by_me column exists in the result set
            int likedVal = rs.getInt("liked_by_me");
            song.setLikedByMe(likedVal > 0);
        } catch (SQLException ignored) {
            if (currentUserId != null) {
                song.setLikedByMe(isLiked(currentUserId, song.getId()));
            }
        }
        return song;
    }

    @Override
    public Song findById(int id, Integer currentUserId) {
        String sql = "SELECT s.*, (SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id AND sl.user_id = ?) AS liked_by_me FROM songs s WHERE s.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, currentUserId != null ? currentUserId : -1);
            ps.setInt(2, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapResultSetToSong(rs, currentUserId);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Song> findAll(String search, String mood, String genre, int offset, int limit, Integer currentUserId) {
        List<Song> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
                "SELECT s.*, (SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id AND sl.user_id = ?) AS liked_by_me FROM songs s WHERE 1=1 "
        );
        List<Object> params = new ArrayList<>();
        params.add(currentUserId != null ? currentUserId : -1);

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(s.title) LIKE ? OR LOWER(s.artist) LIKE ? OR LOWER(s.album) LIKE ?)");
            String pattern = "%" + search.trim().toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
        if (mood != null && !mood.trim().isEmpty()) {
            sql.append(" AND LOWER(s.mood) = ?");
            params.add(mood.trim().toLowerCase());
        }
        if (genre != null && !genre.trim().isEmpty()) {
            sql.append(" AND LOWER(s.genre) = ?");
            params.add(genre.trim().toLowerCase());
        }

        sql.append(" ORDER BY s.is_featured DESC, s.play_count DESC, s.id DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToSong(rs, currentUserId));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int count(String search, String mood, String genre) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM songs s WHERE 1=1 ");
        List<Object> params = new ArrayList<>();
        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (LOWER(s.title) LIKE ? OR LOWER(s.artist) LIKE ? OR LOWER(s.album) LIKE ?)");
            String pattern = "%" + search.trim().toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
        if (mood != null && !mood.trim().isEmpty()) {
            sql.append(" AND LOWER(s.mood) = ?");
            params.add(mood.trim().toLowerCase());
        }
        if (genre != null && !genre.trim().isEmpty()) {
            sql.append(" AND LOWER(s.genre) = ?");
            params.add(genre.trim().toLowerCase());
        }

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public List<Song> findByMood(String mood, int limit, Integer currentUserId) {
        return findAll(null, mood, null, 0, limit, currentUserId);
    }

    @Override
    public List<Song> findLikedByUser(int userId) {
        List<Song> list = new ArrayList<>();
        String sql = "SELECT s.*, 1 AS liked_by_me FROM songs s INNER JOIN song_likes sl ON s.id = sl.song_id WHERE sl.user_id = ? ORDER BY sl.created_at DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToSong(rs, userId));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Song> findHistoryByUser(int userId, int limit) {
        List<Song> list = new ArrayList<>();
        String sql = "SELECT s.*, (SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id AND sl.user_id = ?) AS liked_by_me " +
                "FROM listen_history lh INNER JOIN songs s ON lh.song_id = s.id WHERE lh.user_id = ? ORDER BY lh.played_at DESC LIMIT ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapResultSetToSong(rs, userId));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public boolean isLiked(int userId, int songId) {
        String sql = "SELECT COUNT(*) FROM song_likes WHERE user_id = ? AND song_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, songId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean toggleLike(int userId, int songId) {
        boolean liked = isLiked(userId, songId);
        try (Connection conn = DBConnection.getConnection()) {
            if (liked) {
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM song_likes WHERE user_id = ? AND song_id = ?")) {
                    ps.setInt(1, userId);
                    ps.setInt(2, songId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("UPDATE songs SET like_count = GREATEST(0, like_count - 1) WHERE id = ?")) {
                    ps.setInt(1, songId);
                    ps.executeUpdate();
                }
                return false;
            } else {
                try (PreparedStatement ps = conn.prepareStatement("INSERT INTO song_likes (user_id, song_id) VALUES (?, ?)")) {
                    ps.setInt(1, userId);
                    ps.setInt(2, songId);
                    ps.executeUpdate();
                }
                try (PreparedStatement ps = conn.prepareStatement("UPDATE songs SET like_count = like_count + 1 WHERE id = ?")) {
                    ps.setInt(1, songId);
                    ps.executeUpdate();
                }
                return true;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public void recordPlay(int userId, int songId, int durationPlayed, boolean completed) {
        try (Connection conn = DBConnection.getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement("UPDATE songs SET play_count = play_count + 1 WHERE id = ?")) {
                ps.setInt(1, songId);
                ps.executeUpdate();
            }
            if (userId > 0) {
                try (PreparedStatement ps = conn.prepareStatement("INSERT INTO listen_history (user_id, song_id, duration_played, completed) VALUES (?, ?, ?, ?)")) {
                    ps.setInt(1, userId);
                    ps.setInt(2, songId);
                    ps.setInt(3, durationPlayed);
                    ps.setBoolean(4, completed);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    @Override
    public Song create(Song song) {
        String sql = "INSERT INTO songs (jamendo_id, title, artist, album, genre, mood, tags, duration, bpm, cover_url, audio_url, waveform_url, is_featured, added_by) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, song.getJamendoId());
            ps.setString(2, song.getTitle());
            ps.setString(3, song.getArtist());
            ps.setString(4, song.getAlbum());
            ps.setString(5, song.getGenre());
            ps.setString(6, song.getMood());
            ps.setString(7, song.getTags());
            ps.setInt(8, song.getDuration());
            ps.setObject(9, song.getBpm());
            ps.setString(10, song.getCoverUrl() != null ? song.getCoverUrl() : "");
            ps.setString(11, song.getAudioUrl() != null ? song.getAudioUrl() : "");
            ps.setString(12, song.getWaveformUrl());
            ps.setBoolean(13, song.isFeatured());
            ps.setObject(14, song.getAddedBy());

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    song.setId(rs.getInt(1));
                    return song;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public boolean update(Song song) {
        String sql = "UPDATE songs SET title = ?, artist = ?, album = ?, genre = ?, mood = ?, tags = ?, duration = ?, cover_url = ?, audio_url = ?, is_featured = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, song.getTitle());
            ps.setString(2, song.getArtist());
            ps.setString(3, song.getAlbum());
            ps.setString(4, song.getGenre());
            ps.setString(5, song.getMood());
            ps.setString(6, song.getTags());
            ps.setInt(7, song.getDuration());
            ps.setString(8, song.getCoverUrl());
            ps.setString(9, song.getAudioUrl());
            ps.setBoolean(10, song.isFeatured());
            ps.setInt(11, song.getId());
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean delete(int id) {
        String sql = "DELETE FROM songs WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}

