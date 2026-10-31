package com.moodwave.controller;

import com.moodwave.model.User;
import com.moodwave.service.AuthService;
import com.moodwave.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet(name = "AuthServlet", urlPatterns = {"/api/auth/*"})
public class AuthServlet extends BaseServlet {
    private final AuthService authService = new AuthService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        String body = readBody(req);
        Map<String, Object> payload = JsonUtil.toMap(body);

        if ("/register".equals(pathInfo)) {
            String username = payload != null ? (String) payload.get("username") : null;
            String email = payload != null ? (String) payload.get("email") : null;
            String password = payload != null ? (String) payload.get("password") : null;

            Map<String, Object> result = authService.register(username, email, password);
            if (result.containsKey("error")) {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, (String) result.get("error"));
            } else {
                Map<String, Object> res = new HashMap<>(result);
                res.put("ok", true);
                sendJson(resp, HttpServletResponse.SC_CREATED, res);
            }
        } else if ("/login".equals(pathInfo)) {
            String email = payload != null ? (String) payload.get("email") : null;
            String password = payload != null ? (String) payload.get("password") : null;

            Map<String, Object> result = authService.login(email, password);
            if (result.containsKey("error")) {
                sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, (String) result.get("error"));
            } else {
                Map<String, Object> res = new HashMap<>(result);
                res.put("ok", true);
                sendJson(resp, HttpServletResponse.SC_OK, res);
            }
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Auth endpoint not found");
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer userId = getAuthUserId(req);

        if ("/me".equals(pathInfo)) {
            if (userId == null) {
                sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
                return;
            }
            User user = authService.getProfile(userId);
            if (user == null) {
                sendError(resp, HttpServletResponse.SC_NOT_FOUND, "User not found");
            } else {
                Map<String, Object> res = new HashMap<>();
                res.put("ok", true);
                res.put("user", user);
                sendJson(resp, HttpServletResponse.SC_OK, res);
            }
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer userId = getAuthUserId(req);
        if (userId == null) {
            sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
            return;
        }

        String body = readBody(req);
        Map<String, Object> payload = JsonUtil.toMap(body);

        if ("/profile".equals(pathInfo)) {
            String bio = payload != null ? (String) payload.get("bio") : null;
            String avatarColor = payload != null ? (String) payload.get("avatar_color") : null;
            String avatarUrl = payload != null ? (String) payload.get("avatar_url") : null;
            String username = payload != null ? (String) payload.get("username") : null;

            boolean ok = authService.updateProfile(userId, username, bio, avatarColor, avatarUrl);
            if (ok) {
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "user", authService.getProfile(userId)));
            } else {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Profile update failed");
            }
        } else if ("/password".equals(pathInfo)) {
            String oldPass = payload != null ? (String) payload.get("old_password") : null;
            String newPass = payload != null ? (String) payload.get("new_password") : null;

            boolean ok = authService.changePassword(userId, oldPass, newPass);
            if (ok) {
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "msg", "Password updated successfully"));
            } else {
                sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Current password incorrect");
            }
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        }
    }
}
