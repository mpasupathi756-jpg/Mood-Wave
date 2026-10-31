package com.moodwave.dao;

import com.moodwave.model.ChatMessage;
import com.moodwave.model.Room;
import com.moodwave.model.RoomMember;
import com.moodwave.util.JsonUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RoomDAOImpl implements RoomDAO {

    private Room mapResultSetToRoom(ResultSet rs) throws SQLException {
        Room r = new Room();
        r.setId(rs.getInt("id"));
        r.setCode(rs.getString("code"));
        r.setName(rs.getString("name"));
        r.setHostId(rs.getInt("host_id"));
        r.setMaxMembers(rs.getInt("max_members"));
        r.setActive(rs.getBoolean("is_active"));
        r.setPrivate(rs.getBoolean("is_private"));
        r.setPasswordHash(rs.getString("password_hash"));
        r.setPlaybackPos(rs.getDouble("playback_pos"));
        r.setPlaying(rs.getBoolean("is_playing"));
        r.setCreatedAt(rs.getTimestamp("created_at"));

        String songJson = rs.getString("current_song_data");
        if (songJson != null && !songJson.trim().isEmpty()) {
            r.setCurrentSongData(JsonUtil.toMap(songJson));
        }

        try {
            r.setHostUsername(rs.getString("host_username"));
        } catch (SQLException ignored) {}

        return r;
    }

    @Override
    public Room findByCode(String code) {
        String sql = "SELECT r.*, u.username as host_username FROM rooms r INNER JOIN users u ON r.host_id = u.id WHERE UPPER(r.code) = UPPER(?) AND r.is_active = TRUE";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, code);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Room r = mapResultSetToRoom(rs);
                    r.setMembers(getMembers(r.getId()));
                    return r;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Room findById(int id) {
        String sql = "SELECT r.*, u.username as host_username FROM rooms r INNER JOIN users u ON r.host_id = u.id WHERE r.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Room r = mapResultSetToRoom(rs);
                    r.setMembers(getMembers(r.getId()));
                    return r;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Room create(Room room) {
        String sql = "INSERT INTO rooms (code, name, host_id, max_members, is_private, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, room.getCode().toUpperCase());
            ps.setString(2, room.getName());
            ps.setInt(3, room.getHostId());
            ps.setInt(4, room.getMaxMembers() > 0 ? room.getMaxMembers() : 20); // 3+ users capacity
            ps.setBoolean(5, room.isPrivate());
            ps.setString(6, room.getPasswordHash());

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    room.setId(rs.getInt(1));
                    // Host automatically joins the room
                    addMember(room.getId(), room.getHostId());
                    return room;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public boolean closeRoom(String code, int hostId) {
        String sql = "UPDATE rooms SET is_active = FALSE WHERE UPPER(code) = UPPER(?) AND host_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, code);
            ps.setInt(2, hostId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public List<Room> findActiveRooms() {
        List<Room> list = new ArrayList<>();
        String sql = "SELECT r.*, u.username as host_username FROM rooms r INNER JOIN users u ON r.host_id = u.id WHERE r.is_active = TRUE ORDER BY r.id DESC LIMIT 20";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Room r = mapResultSetToRoom(rs);
                r.setMembers(getMembers(r.getId()));
                list.add(r);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public boolean addMember(int roomId, int userId) {
        if (isMember(roomId, userId)) return true;
        String sql = "INSERT INTO room_members (room_id, user_id) VALUES (?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, roomId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            // Already member or conflict
            return true;
        }
    }

    @Override
    public boolean removeMember(int roomId, int userId) {
        String sql = "DELETE FROM room_members WHERE room_id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, roomId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public List<RoomMember> getMembers(int roomId) {
        List<RoomMember> list = new ArrayList<>();
        String sql = "SELECT rm.*, u.username, u.avatar_color, u.avatar_url, r.host_id " +
                "FROM room_members rm " +
                "INNER JOIN users u ON rm.user_id = u.id " +
                "INNER JOIN rooms r ON rm.room_id = r.id " +
                "WHERE rm.room_id = ? ORDER BY rm.joined_at ASC";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, roomId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    RoomMember m = new RoomMember();
                    m.setId(rs.getInt("id"));
                    m.setRoomId(rs.getInt("room_id"));
                    m.setUserId(rs.getInt("user_id"));
                    m.setUsername(rs.getString("username"));
                    m.setAvatarColor(rs.getString("avatar_color"));
                    m.setAvatarUrl(rs.getString("avatar_url"));
                    m.setJoinedAt(rs.getTimestamp("joined_at"));
                    m.setHost(rs.getInt("host_id") == m.getUserId());
                    list.add(m);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public boolean isMember(int roomId, int userId) {
        String sql = "SELECT COUNT(*) FROM room_members WHERE room_id = ? AND user_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, roomId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public int getMemberCount(int roomId) {
        String sql = "SELECT COUNT(*) FROM room_members WHERE room_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, roomId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public boolean updatePlayback(String code, String currentSongJson, double position, boolean isPlaying) {
        String sql = "UPDATE rooms SET current_song_data = ?, playback_pos = ?, is_playing = ? WHERE UPPER(code) = UPPER(?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, currentSongJson);
            ps.setDouble(2, position);
            ps.setBoolean(3, isPlaying);
            ps.setString(4, code);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public ChatMessage addMessage(int roomId, int userId, String msgType, String content, String songDataJson) {
        String sql = "INSERT INTO room_chat (room_id, user_id, msg_type, content, song_data) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, roomId);
            ps.setInt(2, userId);
            ps.setString(3, msgType != null ? msgType : "text");
            ps.setString(4, content);
            ps.setString(5, songDataJson);

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    ChatMessage msg = new ChatMessage();
                    msg.setId(rs.getInt(1));
                    msg.setRoomId(roomId);
                    msg.setUserId(userId);
                    msg.setMsgType(msgType);
                    msg.setContent(content);
                    if (songDataJson != null) msg.setSongData(JsonUtil.toMap(songDataJson));
                    msg.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    return msg;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<ChatMessage> getRecentMessages(int roomId, int limit) {
        List<ChatMessage> list = new ArrayList<>();
        String sql = "SELECT c.*, u.username, u.avatar_color FROM room_chat c " +
                "INNER JOIN users u ON c.user_id = u.id " +
                "WHERE c.room_id = ? ORDER BY c.created_at ASC LIMIT ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, roomId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ChatMessage msg = new ChatMessage();
                    msg.setId(rs.getInt("id"));
                    msg.setRoomId(rs.getInt("room_id"));
                    msg.setUserId(rs.getInt("user_id"));
                    msg.setUsername(rs.getString("username"));
                    msg.setAvatarColor(rs.getString("avatar_color"));
                    msg.setMsgType(rs.getString("msg_type"));
                    msg.setContent(rs.getString("content"));
                    String songJson = rs.getString("song_data");
                    if (songJson != null) msg.setSongData(JsonUtil.toMap(songJson));
                    msg.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(msg);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}

