package com.moodwave.websocket;

import com.moodwave.model.RoomMember;
import com.moodwave.service.RoomService;
import com.moodwave.util.JsonUtil;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@ServerEndpoint("/ws/rooms/{code}")
public class RoomWebSocketServer {

    // roomCode -> Set of active WebSocket sessions (supports 3+ users)
    private static final Map<String, Set<Session>> roomSessions = new ConcurrentHashMap<>();
    // session -> metadata (userId, username, roomCode)
    private static final Map<Session, Map<String, Object>> sessionData = new ConcurrentHashMap<>();

    private static final RoomService roomService = new RoomService();

    @OnOpen
    public void onOpen(Session session, @PathParam("code") String code) {
        String roomCode = code.toUpperCase();
        roomSessions.computeIfAbsent(roomCode, k -> new CopyOnWriteArraySet<>()).add(session);
        System.out.println("[WebSocket] Client connected to room: " + roomCode + " (Total sessions: " + roomSessions.get(roomCode).size() + ")");
    }

    @OnMessage
    public void onMessage(String message, Session session, @PathParam("code") String code) {
        String roomCode = code.toUpperCase();
        try {
            Map<String, Object> data = JsonUtil.toMap(message);
            if (data == null) return;

            String type = (String) data.get("type");
            if (type == null) return;

            switch (type) {
                case "join": {
                    int userId = data.get("userId") != null ? ((Number) data.get("userId")).intValue() : 0;
                    String username = (String) data.get("username");
                    String avatarColor = (String) data.get("avatarColor");

                    Map<String, Object> meta = new HashMap<>();
                    meta.put("userId", userId);
                    meta.put("username", username);
                    meta.put("avatarColor", avatarColor);
                    meta.put("roomCode", roomCode);
                    sessionData.put(session, meta);

                    // Broadcast member joined notification
                    broadcast(roomCode, Map.of(
                            "type", "member_joined",
                            "user", meta,
                            "activeCount", roomSessions.get(roomCode).size()
                    ), null);
                    break;
                }

                case "play":
                case "pause":
                case "seek":
                case "song": {
                    // Host/collaborator playback synchronization
                    Object song = data.get("song");
                    double position = data.get("position") != null ? ((Number) data.get("position")).doubleValue() : 0.0;
                    boolean isPlaying = Boolean.TRUE.equals(data.get("isPlaying")) || "play".equals(type) || "song".equals(type);

                    roomService.updatePlayback(roomCode, 0, song, position, isPlaying, song != null ? JsonUtil.toJson(song) : null);

                    // Broadcast to ALL users in the room so all 3+ users stay synchronized!
                    broadcast(roomCode, Map.of(
                            "type", "playback_sync",
                            "action", type,
                            "song", song != null ? song : "",
                            "position", position,
                            "isPlaying", isPlaying,
                            "timestamp", System.currentTimeMillis()
                    ), null);
                    break;
                }

                case "chat": {
                    String content = (String) data.get("content");
                    String msgType = (String) data.get("msgType");
                    Map<String, Object> meta = sessionData.get(session);
                    int uid = meta != null && meta.get("userId") != null ? (Integer) meta.get("userId") : 0;

                    if (content != null && !content.trim().isEmpty()) {
                        roomService.sendMessage(roomCode, uid, msgType != null ? msgType : "text", content.trim(), null);
                        broadcast(roomCode, Map.of(
                                "type", "chat_message",
                                "username", meta != null ? meta.get("username") : "Guest",
                                "avatarColor", meta != null ? meta.get("avatarColor") : "#20C997",
                                "content", content.trim(),
                                "msgType", msgType != null ? msgType : "text",
                                "timestamp", System.currentTimeMillis()
                        ), null);
                    }
                    break;
                }

                case "reaction": {
                    String emoji = (String) data.get("emoji");
                    Map<String, Object> meta = sessionData.get(session);
                    broadcast(roomCode, Map.of(
                            "type", "live_reaction",
                            "emoji", emoji != null ? emoji : "❤️",
                            "username", meta != null ? meta.get("username") : "Friend"
                    ), null);
                    break;
                }

                default:
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @OnClose
    public void onClose(Session session, @PathParam("code") String code) {
        String roomCode = code.toUpperCase();
        Set<Session> sessions = roomSessions.get(roomCode);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                roomSessions.remove(roomCode);
            }
        }
        Map<String, Object> meta = sessionData.remove(session);
        if (meta != null) {
            broadcast(roomCode, Map.of(
                    "type", "member_left",
                    "user", meta,
                    "activeCount", sessions != null ? sessions.size() : 0
            ), null);
        }
        System.out.println("[WebSocket] Session closed in room: " + roomCode);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        System.err.println("[WebSocket] Error: " + throwable.getMessage());
    }

    private static void broadcast(String roomCode, Object messageObj, Session excludeSession) {
        Set<Session> sessions = roomSessions.get(roomCode);
        if (sessions == null) return;

        String json = JsonUtil.toJson(messageObj);
        for (Session s : sessions) {
            if (s.isOpen() && (excludeSession == null || !s.equals(excludeSession))) {
                try {
                    s.getBasicRemote().sendText(json);
                } catch (IOException e) {
                    System.err.println("[WebSocket] Broadcast error: " + e.getMessage());
                }
            }
        }
    }
}

