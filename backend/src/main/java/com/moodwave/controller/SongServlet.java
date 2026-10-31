package com.moodwave.controller;

import com.moodwave.model.Song;
import com.moodwave.service.SongService;
import com.moodwave.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "SongServlet", urlPatterns = {"/api/songs/*"})
public class SongServlet extends BaseServlet {
    private final SongService songService = new SongService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);

        if (pathInfo == null || "/".equals(pathInfo) || pathInfo.isEmpty()) {
            String search = req.getParameter("q");
            String mood = req.getParameter("mood");
            String genre = req.getParameter("genre");
            int page = req.getParameter("page") != null ? Integer.parseInt(req.getParameter("page")) : 1;
            int limit = req.getParameter("limit") != null ? Integer.parseInt(req.getParameter("limit")) : 20;

            Map<String, Object> data = new HashMap<>(songService.listSongs(search, mood, genre, page, limit, currentUserId));
            data.put("ok", true);
            sendJson(resp, HttpServletResponse.SC_OK, data);
            return;
        }

        if ("/liked".equals(pathInfo)) {
            if (currentUserId == null) {
                sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
                return;
            }
            List<Song> songs = songService.getLiked(currentUserId);
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "songs", songs));
            return;
        }

        if ("/history".equals(pathInfo)) {
            if (currentUserId == null) {
                // Return empty history for unauthenticated users (guest mode)
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "history", List.of()));
                return;
            }
            int limit = req.getParameter("limit") != null ? Integer.parseInt(req.getParameter("limit")) : 30;
            List<Song> songs = songService.getHistory(currentUserId, limit);
            // Map Song fields to history entry format expected by HomePage
            List<Map<String, Object>> history = new ArrayList<>();
            for (Song s : songs) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", s.getId());
                entry.put("song_title", s.getTitle());
                entry.put("song_artist", s.getArtist());
                entry.put("song_cover", s.getCoverUrl());
                entry.put("played_at", s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
                // Also include full song object fields for ProfilePage
                entry.put("title", s.getTitle());
                entry.put("artist", s.getArtist());
                entry.put("cover_url", s.getCoverUrl());
                entry.put("audio_url", s.getAudioUrl());
                history.add(entry);
            }
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "history", history, "songs", songs));
            return;
        }

        if (pathInfo.startsWith("/mood/")) {
            String mood = pathInfo.substring("/mood/".length()).trim();
            int limit = req.getParameter("limit") != null ? Integer.parseInt(req.getParameter("limit")) : 20;
            List<Song> songs = songService.getByMood(mood, limit, currentUserId);
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "mood", mood, "songs", songs));
            return;
        }

        try {
            int songId = Integer.parseInt(pathInfo.substring(1));
            Song song = songService.getSong(songId, currentUserId);
            if (song != null) {
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "song", song));
            } else {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Song not found");
            }
        } catch (NumberFormatException e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid song ID");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);

        if ("/play".equals(pathInfo)) {
            String body = readBody(req);
            Map<String, Object> map = JsonUtil.toMap(body);
            if (map != null && map.containsKey("songId")) {
                int songId = ((Number) map.get("songId")).intValue();
                int duration = map.containsKey("duration") ? ((Number) map.get("duration")).intValue() : 0;
                boolean completed = map.containsKey("completed") && Boolean.TRUE.equals(map.get("completed"));
                songService.recordPlay(currentUserId != null ? currentUserId : -1, songId, duration, completed);
            }
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true));
            return;
        }

        if (pathInfo != null && pathInfo.endsWith("/like")) {
            if (currentUserId == null) {
                sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
                return;
            }
            try {
                String idStr = pathInfo.substring(1, pathInfo.lastIndexOf("/like"));
                int songId = Integer.parseInt(idStr);
                boolean liked = songService.toggleLike(currentUserId, songId);
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "liked", liked, "song_id", songId));
            } catch (Exception e) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid song id");
            }
            return;
        }

        if (pathInfo == null || "/".equals(pathInfo) || pathInfo.isEmpty()) {
            String body = readBody(req);
            Song newSong = JsonUtil.fromJson(body, Song.class);
            if (newSong == null || newSong.getTitle() == null) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Song data is required");
                return;
            }
            if (currentUserId != null) newSong.setAddedBy(currentUserId);
            Song created = songService.addSong(newSong);
            sendJson(resp, HttpServletResponse.SC_CREATED, Map.of("ok", true, "song", created));
            return;
        }

        sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            int songId = Integer.parseInt(pathInfo.substring(1));
            String body = readBody(req);
            Song song = JsonUtil.fromJson(body, Song.class);
            if (song != null) {
                song.setId(songId);
                boolean updated = songService.updateSong(song);
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", updated));
            } else {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid payload");
            }
        } catch (Exception e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid song id");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        try {
            int songId = Integer.parseInt(pathInfo.substring(1));
            boolean ok = songService.deleteSong(songId);
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
        } catch (Exception e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid song id");
        }
    }
}
