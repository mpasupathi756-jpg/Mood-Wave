package com.moodwave.controller;

import com.moodwave.model.ChatMessage;
import com.moodwave.model.Room;
import com.moodwave.service.RoomService;
import com.moodwave.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "RoomServlet", urlPatterns = {"/api/rooms/*"})
public class RoomServlet extends BaseServlet {
    private final RoomService roomService = new RoomService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);

        // GET /api/rooms/all -> List all public active rooms for "Listen to Other"
        if ("/all".equals(pathInfo) || "/active".equals(pathInfo)) {
            List<Room> rooms = roomService.getActiveRooms();
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "rooms", rooms));
            return;
        }

        if (pathInfo != null && pathInfo.length() > 1) {
            String subPath = pathInfo.substring(1);

            // GET /api/rooms/{code}/sync -> Real-time polling & playback synchronization for 3+ users
            if (subPath.contains("/sync")) {
                String code = subPath.substring(0, subPath.indexOf("/sync"));
                Map<String, Object> syncState = new HashMap<>(roomService.getLiveSyncState(code, currentUserId != null ? currentUserId : -1));
                syncState.put("ok", true);
                sendJson(resp, HttpServletResponse.SC_OK, syncState);
                return;
            }

            // GET /api/rooms/{code} -> Get room info and active members
            String code = subPath;
            Room room = roomService.getRoomDetails(code);
            if (room != null) {
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "room", room));
            } else {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Room not found");
            }
            return;
        }

        sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);
        if (currentUserId == null) {
            sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        String body = readBody(req);
        Map<String, Object> map = JsonUtil.toMap(body);

        // POST /api/rooms -> Create room
        if (pathInfo == null || "/".equals(pathInfo) || pathInfo.isEmpty()) {
            String name = map != null ? (String) map.get("name") : "Listen Party";
            boolean isPrivate = map != null && Boolean.TRUE.equals(map.get("is_private"));
            String password = map != null ? (String) map.get("password") : null;

            Room created = roomService.createRoom(name, currentUserId, isPrivate, password);
            if (created != null) {
                sendJson(resp, HttpServletResponse.SC_CREATED, Map.of("ok", true, "room", created));
            } else {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Failed to create room");
            }
            return;
        }

        // POST /api/rooms/join -> Join room
        if ("/join".equals(pathInfo)) {
            String code = map != null ? (String) map.get("code") : null;
            String password = map != null ? (String) map.get("password") : null;

            if (code == null || code.trim().isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Room code is required");
                return;
            }

            Map<String, Object> res = roomService.joinRoom(code.trim().toUpperCase(), currentUserId, password);
            if (res.containsKey("error")) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, (String) res.get("error"));
            } else {
                sendJson(resp, HttpServletResponse.SC_OK, res);
            }
            return;
        }

        // POST /api/rooms/{code}/sync -> Synchronize playback across 3+ users
        if (pathInfo.contains("/sync")) {
            String code = pathInfo.substring(1, pathInfo.indexOf("/sync"));
            Object song = map != null ? map.get("song") : null;
            double position = map != null && map.get("position") != null ? ((Number) map.get("position")).doubleValue() : 0.0;
            boolean isPlaying = map != null && Boolean.TRUE.equals(map.get("isPlaying"));
            String songJson = song != null ? JsonUtil.toJson(song) : null;

            boolean ok = roomService.updatePlayback(code, currentUserId, song, position, isPlaying, songJson);
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
            return;
        }

        // POST /api/rooms/{code}/chat -> Send chat message or emoji reaction
        if (pathInfo.contains("/chat")) {
            String code = pathInfo.substring(1, pathInfo.indexOf("/chat"));
            String content = map != null ? (String) map.get("content") : "";
            String msgType = map != null ? (String) map.get("msg_type") : "text";
            Object songData = map != null ? map.get("song_data") : null;
            String songJson = songData != null ? JsonUtil.toJson(songData) : null;

            ChatMessage msg = roomService.sendMessage(code, currentUserId, msgType, content, songJson);
            if (msg != null) {
                sendJson(resp, HttpServletResponse.SC_CREATED, Map.of("ok", true, "message", msg));
            } else {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Failed to send message");
            }
            return;
        }

        sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);
        if (currentUserId == null) {
            sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        if (pathInfo != null && pathInfo.length() > 1) {
            String code = pathInfo.substring(1);
            boolean ok = roomService.closeRoom(code, currentUserId);
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
            return;
        }

        sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Room code required");
    }
}

