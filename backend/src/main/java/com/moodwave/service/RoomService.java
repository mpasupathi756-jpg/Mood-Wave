package com.moodwave.service;

import com.moodwave.dao.RoomDAO;
import com.moodwave.dao.RoomDAOImpl;
import com.moodwave.dao.UserDAO;
import com.moodwave.dao.UserDAOImpl;
import com.moodwave.model.ChatMessage;
import com.moodwave.model.Room;
import com.moodwave.model.RoomMember;
import com.moodwave.model.User;
import com.moodwave.util.PasswordUtil;

import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class RoomService {
    private final RoomDAO roomDAO = new RoomDAOImpl();
    private final UserDAO userDAO = new UserDAOImpl();

    // In-memory real-time state cache for smooth multi-user playback sync (3+ users)
    public static class LivePlaybackState {
        public Object currentSong;
        public double position = 0;
        public long lastUpdatedTime = System.currentTimeMillis();
        public boolean isPlaying = false;
        public int hostId;
        public Map<Integer, RoomMember> activeListeners = new ConcurrentHashMap<>();
    }

    private static final Map<String, LivePlaybackState> liveRooms = new ConcurrentHashMap<>();

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom random = new SecureRandom();

    public static String generateRoomCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    public Room createRoom(String name, int hostId, boolean isPrivate, String password) {
        String code;
        int attempts = 0;
        do {
            code = generateRoomCode();
            attempts++;
        } while (roomDAO.findByCode(code) != null && attempts < 10);

        Room room = new Room();
        room.setCode(code);
        room.setName(name != null && !name.trim().isEmpty() ? name.trim() : "Music Session " + code);
        room.setHostId(hostId);
        room.setMaxMembers(25); // Supports 3 or more users effortlessly
        room.setPrivate(isPrivate);
        if (isPrivate && password != null && !password.trim().isEmpty()) {
            room.setPasswordHash(PasswordUtil.hashPassword(password));
        }

        Room created = roomDAO.create(room);
        if (created != null) {
            LivePlaybackState state = new LivePlaybackState();
            state.hostId = hostId;
            User host = userDAO.findById(hostId);
            if (host != null) {
                state.activeListeners.put(hostId, new RoomMember(hostId, host.getUsername(), host.getAvatarColor(), true));
            }
            liveRooms.put(code.toUpperCase(), state);
        }
        return created;
    }

    public Map<String, Object> joinRoom(String code, int userId, String password) {
        Map<String, Object> res = new HashMap<>();
        Room room = roomDAO.findByCode(code);
        if (room == null || !room.isActive()) {
            res.put("error", "Room not found or no longer active.");
            return res;
        }

        if (room.isPrivate() && room.getHostId() != userId) {
            if (password == null || !PasswordUtil.checkPassword(password, room.getPasswordHash())) {
                res.put("error", "Incorrect room password.");
                return res;
            }
        }

        // Add member in database
        roomDAO.addMember(room.getId(), userId);

        // Update in-memory real-time listener cache
        LivePlaybackState state = liveRooms.computeIfAbsent(code.toUpperCase(), k -> {
            LivePlaybackState s = new LivePlaybackState();
            s.hostId = room.getHostId();
            s.currentSong = room.getCurrentSongData();
            s.position = room.getPlaybackPos();
            s.isPlaying = room.isPlaying();
            return s;
        });

        User user = userDAO.findById(userId);
        if (user != null) {
            state.activeListeners.put(userId, new RoomMember(userId, user.getUsername(), user.getAvatarColor(), userId == room.getHostId()));
        }

        res.put("room", room);
        res.put("members", roomDAO.getMembers(room.getId()));
        return res;
    }

    public Room getRoomDetails(String code) {
        Room room = roomDAO.findByCode(code);
        if (room != null) {
            room.setMembers(roomDAO.getMembers(room.getId()));
        }
        return room;
    }

    public List<Room> getActiveRooms() {
        return roomDAO.findActiveRooms();
    }

    public Map<String, Object> getLiveSyncState(String code, int userId) {
        Map<String, Object> state = new HashMap<>();
        LivePlaybackState live = liveRooms.get(code.toUpperCase());
        Room dbRoom = null;
        if (live == null) {
            dbRoom = roomDAO.findByCode(code);
            if (dbRoom != null) {
                live = new LivePlaybackState();
                live.hostId = dbRoom.getHostId();
                live.currentSong = dbRoom.getCurrentSongData();
                live.position = dbRoom.getPlaybackPos();
                live.isPlaying = dbRoom.isPlaying();
                liveRooms.put(code.toUpperCase(), live);
            }
        }

        if (live != null) {
            double currentPos = live.position;
            if (live.isPlaying) {
                long elapsedSec = (System.currentTimeMillis() - live.lastUpdatedTime) / 1000;
                currentPos += elapsedSec;
            }
            state.put("currentSong", live.currentSong);
            state.put("isPlaying", live.isPlaying);
            state.put("position", currentPos);
            state.put("hostId", live.hostId);
            state.put("serverTime", System.currentTimeMillis());

            if (dbRoom == null) dbRoom = roomDAO.findByCode(code);
            if (dbRoom != null) {
                state.put("members", roomDAO.getMembers(dbRoom.getId()));
                state.put("recentMessages", roomDAO.getRecentMessages(dbRoom.getId(), 25));
            }
        }
        return state;
    }

    public boolean updatePlayback(String code, int userId, Object song, double position, boolean isPlaying, String songJson) {
        Room room = roomDAO.findByCode(code);
        if (room == null) return false;

        // Either host or collaborative member can control
        LivePlaybackState live = liveRooms.computeIfAbsent(code.toUpperCase(), k -> new LivePlaybackState());
        live.currentSong = song;
        live.position = position;
        live.isPlaying = isPlaying;
        live.lastUpdatedTime = System.currentTimeMillis();
        live.hostId = room.getHostId();

        return roomDAO.updatePlayback(code, songJson, position, isPlaying);
    }

    public ChatMessage sendMessage(String code, int userId, String msgType, String content, String songDataJson) {
        Room room = roomDAO.findByCode(code);
        if (room == null) return null;
        return roomDAO.addMessage(room.getId(), userId, msgType, content, songDataJson);
    }

    public boolean closeRoom(String code, int hostId) {
        liveRooms.remove(code.toUpperCase());
        return roomDAO.closeRoom(code, hostId);
    }
}

