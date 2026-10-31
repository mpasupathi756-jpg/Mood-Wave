package com.moodwave.dao;

import com.moodwave.model.Playlist;
import com.moodwave.model.Song;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class PlaylistDAOImpl implements PlaylistDAO {

    private SongDAO songDAO = new SongDAOImpl();

    private Playlist mapResultSetToPlaylist(ResultSet rs) throws SQLException {
        Playlist p = new Playlist();
        p.setId(rs.getInt("id"));
        p.setUserId(rs.getInt("user_id"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));
        p.setCoverUrl(rs.getString("cover_url"));
        p.setMoodTag(rs.getString("mood_tag"));
        p.setPublic(rs.getBoolean("is_public"));
        p.setPlayCount(rs.getInt("play_count"));
        p.setCreatedAt(rs.getTimestamp("created_at"));
        return p;
    }

    @Override
    public List<Playlist> findByUser(int userId) {
        List<Playlist> list = new ArrayList<>();
        String sql = "SELECT * FROM playlists WHERE user_id = ? ORDER BY id DESC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Playlist p = mapResultSetToPlaylist(rs);
                    p.setSongs(getPlaylistSongs(p.getId(), userId));
                    list.add(p);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public Playlist findById(int id, Integer currentUserId) {
        String sql = "SELECT * FROM playlists WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Playlist p = mapResultSetToPlaylist(rs);
                    p.setSongs(getPlaylistSongs(p.getId(), currentUserId));
                    return p;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Playlist create(Playlist playlist) {
        String sql = "INSERT INTO playlists (user_id, name, description, cover_url, mood_tag, is_public) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, playlist.getUserId());
            ps.setString(2, playlist.getName());
            ps.setString(3, playlist.getDescription());
            ps.setString(4, playlist.getCoverUrl());
            ps.setString(5, playlist.getMoodTag());
            ps.setBoolean(6, playlist.isPublic());

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    playlist.setId(rs.getInt(1));
                    return playlist;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public boolean addSong(int playlistId, int songId) {
        String sql = "INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, playlistId);
            ps.setInt(2, songId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            return false;
        }
    }

    @Override
    public boolean removeSong(int playlistId, int songId) {
        String sql = "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, playlistId);
            ps.setInt(2, songId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean delete(int id, int userId) {
        String sql = "DELETE FROM playlists WHERE id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public List<Song> getPlaylistSongs(int playlistId, Integer currentUserId) {
        List<Song> songs = new ArrayList<>();
        String sql = "SELECT s.*, (SELECT COUNT(*) FROM song_likes sl WHERE sl.song_id = s.id AND sl.user_id = ?) AS liked_by_me " +
                "FROM playlist_songs ps INNER JOIN songs s ON ps.song_id = s.id WHERE ps.playlist_id = ? ORDER BY ps.position ASC, ps.added_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setObject(1, currentUserId != null ? currentUserId : -1);
            ps.setInt(2, playlistId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Song s = new Song();
                    s.setId(rs.getInt("id"));
                    s.setTitle(rs.getString("title"));
                    s.setArtist(rs.getString("artist"));
                    s.setAlbum(rs.getString("album"));
                    s.setGenre(rs.getString("genre"));
                    s.setMood(rs.getString("mood"));
                    s.setDuration(rs.getInt("duration"));
                    s.setCoverUrl(rs.getString("cover_url"));
                    s.setAudioUrl(rs.getString("audio_url"));
                    s.setLikedByMe(rs.getInt("liked_by_me") > 0);
                    songs.add(s);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return songs;
    }
}

