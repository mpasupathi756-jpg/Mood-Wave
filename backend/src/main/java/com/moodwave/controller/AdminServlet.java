package com.moodwave.controller;

import com.moodwave.dao.*;
import com.moodwave.model.User;
import com.moodwave.util.JsonUtil;
import com.moodwave.util.PasswordUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "AdminServlet", urlPatterns = {"/api/admin/*"})
public class AdminServlet extends BaseServlet {
    private final UserDAO userDAO = new UserDAOImpl();
    private final SongDAO songDAO = new SongDAOImpl();
    private final RoomDAO roomDAO = new RoomDAOImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = getAuthRole(req);
        if (!"admin".equalsIgnoreCase(role)) {
            sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Admin privileges required");
            return;
        }

        String pathInfo = req.getPathInfo();
        if ("/stats".equals(pathInfo)) {
            // Build the rich stats object that AdminPage Dashboard expects:
            // { stats: {...}, topSongs: [], moodDist: [], userGrowth: [], genreDist: [], recentActivity: [] }
            Map<String, Object> statsObj = new HashMap<>();
            int totalUsers = userDAO.countUsers();
            int totalSongs = songDAO.count(null, null, null);
            int activeRooms = roomDAO.findActiveRooms().size();

            statsObj.put("totalUsers", totalUsers);
            statsObj.put("totalSongs", totalSongs);
            statsObj.put("totalRooms", activeRooms);
            statsObj.put("totalPlays", 0);  // Play count tracking TBD
            statsObj.put("activeRooms", activeRooms);
            statsObj.put("newUsersToday", 0);
            statsObj.put("dbMode", DBConnection.isH2() ? "Embedded (Dev)" : "Supabase PostgreSQL");

            Map<String, Object> res = new HashMap<>();
            res.put("ok", true);
            res.put("stats", statsObj);
            res.put("topSongs", new ArrayList<>());    // extended data TBD
            res.put("moodDist", new ArrayList<>());    // mood distribution TBD
            res.put("userGrowth", new ArrayList<>());  // user growth chart TBD
            res.put("genreDist", new ArrayList<>());   // genre distribution TBD
            res.put("recentActivity", new ArrayList<>());
            sendJson(resp, HttpServletResponse.SC_OK, res);

        } else if ("/users".equals(pathInfo)) {
            int page = req.getParameter("page") != null ? Integer.parseInt(req.getParameter("page")) : 1;
            int limit = req.getParameter("limit") != null ? Integer.parseInt(req.getParameter("limit")) : 20;
            int offset = (page - 1) * limit;
            List<User> users = userDAO.findAll(offset, limit);
            int total = userDAO.countUsers();
            sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "users", users, "total", total, "page", page));

        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = getAuthRole(req);
        if (!"admin".equalsIgnoreCase(role)) {
            sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Admin privileges required");
            return;
        }

        String pathInfo = req.getPathInfo();
        if ("/users".equals(pathInfo)) {
            String body = readBody(req);
            Map<String, Object> map = JsonUtil.toMap(body);
            User u = new User();
            u.setUsername((String) map.get("username"));
            u.setEmail((String) map.get("email"));
            u.setPasswordHash(PasswordUtil.hashPassword((String) map.get("password")));
            u.setRole(map.get("role") != null ? (String) map.get("role") : "user");
            User created = userDAO.create(u);
            sendJson(resp, HttpServletResponse.SC_CREATED, Map.of("ok", true, "user", created));
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = getAuthRole(req);
        if (!"admin".equalsIgnoreCase(role)) {
            sendError(resp, HttpServletResponse.SC_FORBIDDEN, "Admin privileges required");
            return;
        }

        String pathInfo = req.getPathInfo();
        if (pathInfo != null && pathInfo.startsWith("/users/")) {
            try {
                int id = Integer.parseInt(pathInfo.substring("/users/".length()));
                boolean ok = userDAO.delete(id);
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", ok));
            } catch (Exception e) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid user id");
            }
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
        }
    }
}
