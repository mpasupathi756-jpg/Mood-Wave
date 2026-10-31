package com.moodwave.controller;

import com.moodwave.dao.PlaylistDAO;
import com.moodwave.dao.PlaylistDAOImpl;
import com.moodwave.model.Playlist;
import com.moodwave.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "PlaylistServlet", urlPatterns = {"/api/playlists/*"})
public class PlaylistServlet extends BaseServlet {
    private final PlaylistDAO playlistDAO = new PlaylistDAOImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);

        if (pathInfo == null || "/".equals(pathInfo) || pathInfo.isEmpty()) {
            if (currentUserId == null) {
                sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
                return;
            }
            List<Playlist> playlists = playlistDAO.findByUser(currentUserId);
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "playlists", playlists));
            return;
        }

        try {
            int playlistId = Integer.parseInt(pathInfo.substring(1));
            Playlist pl = playlistDAO.findById(playlistId, currentUserId);
            if (pl != null) {
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "playlist", pl));
            } else {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Playlist not found");
            }
        } catch (NumberFormatException e) {
            sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid playlist id");
        }
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

        // POST /api/playlists -> create playlist
        if (pathInfo == null || "/".equals(pathInfo) || pathInfo.isEmpty()) {
            String name = map != null ? (String) map.get("name") : null;
            if (name == null || name.trim().isEmpty()) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Playlist name is required");
                return;
            }

            Playlist pl = new Playlist();
            pl.setUserId(currentUserId);
            pl.setName(name.trim());
            pl.setDescription(map.get("description") != null ? (String) map.get("description") : "");
            pl.setMoodTag(map.get("mood_tag") != null ? (String) map.get("mood_tag") : null);
            pl.setPublic(map.get("is_public") != null && Boolean.TRUE.equals(map.get("is_public")));

            Playlist created = playlistDAO.create(pl);
            sendJson(resp, HttpServletResponse.SC_CREATED, Map.of("ok", true, "id", created != null ? created.getId() : 0, "playlist", created));
            return;
        }

        // POST /api/playlists/{id}/songs -> add song
        if (pathInfo.contains("/songs")) {
            try {
                int playlistId = Integer.parseInt(pathInfo.substring(1, pathInfo.indexOf("/songs")));
                int songId = ((Number) map.get("song_id")).intValue();
                boolean ok = playlistDAO.addSong(playlistId, songId);
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
            } catch (Exception e) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Failed to add song");
            }
            return;
        }

        sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);
        if (currentUserId == null) {
            sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        // DELETE /api/playlists/{id}/songs/{songId}
        if (pathInfo != null && pathInfo.contains("/songs/")) {
            try {
                String[] parts = pathInfo.split("/");
                int playlistId = Integer.parseInt(parts[1]);
                int songId = Integer.parseInt(parts[3]);
                boolean ok = playlistDAO.removeSong(playlistId, songId);
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
            } catch (Exception e) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Failed to remove song");
            }
            return;
        }

        // DELETE /api/playlists/{id}
        if (pathInfo != null && pathInfo.length() > 1) {
            try {
                int playlistId = Integer.parseInt(pathInfo.substring(1));
                boolean ok = playlistDAO.delete(playlistId, currentUserId);
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
            } catch (Exception e) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid playlist id");
            }
            return;
        }

        sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid request");
    }
}

