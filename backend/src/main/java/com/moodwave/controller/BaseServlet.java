package com.moodwave.controller;

import com.moodwave.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public abstract class BaseServlet extends HttpServlet {

    protected void sendJson(HttpServletResponse resp, int status, Object data) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.getWriter().write(JsonUtil.toJson(data));
        resp.getWriter().flush();
    }

    protected void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        Map<String, Object> err = new HashMap<>();
        err.put("ok", false);
        err.put("msg", message);
        err.put("error", message);
        sendJson(resp, status, err);
    }

    protected String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }

    protected Integer getAuthUserId(HttpServletRequest req) {
        Object uid = req.getAttribute("userId");
        if (uid instanceof Integer) return (Integer) uid;
        return null;
    }

    protected String getAuthRole(HttpServletRequest req) {
        Object role = req.getAttribute("role");
        return role != null ? role.toString() : null;
    }
}
