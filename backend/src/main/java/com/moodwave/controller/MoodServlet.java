package com.moodwave.controller;

import com.moodwave.service.MoodService;
import com.moodwave.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.*;

@WebServlet(name = "MoodServlet", urlPatterns = {"/api/mood/*"})
public class MoodServlet extends BaseServlet {
    private final MoodService moodService = new MoodService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);

        if ("/detect".equals(pathInfo)) {
            String body = readBody(req);
            Map<String, Object> map = JsonUtil.toMap(body);
            String text = map != null ? (String) map.get("text") : null;
            String mood = map != null ? (String) map.get("mood") : null;

            Map<String, Object> res = new HashMap<>(moodService.detectMoodAndRecommend(
                    currentUserId != null ? currentUserId : -1,
                    text,
                    mood
            ));
            res.put("ok", true);
            sendJson(resp, HttpServletResponse.SC_OK, res);
        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Mood endpoint not found");
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        Integer currentUserId = getAuthUserId(req);

        if ("/history".equals(pathInfo)) {
            if (currentUserId == null) {
                // Return empty history for guests instead of erroring
                sendJson(resp, HttpServletResponse.SC_OK, Map.of("ok", true, "history", List.of()));
                return;
            }
            int limit = req.getParameter("limit") != null ? Integer.parseInt(req.getParameter("limit")) : 20;
            sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "ok", true,
                    "history", moodService.getHistory(currentUserId, limit)
            ));

        } else if ("/stats".equals(pathInfo)) {
            if (currentUserId == null) {
                // Return empty stats for guests
                sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                        "ok", true,
                        "distribution", List.of(),
                        "weekly", List.of()
                ));
                return;
            }
            // getStats returns Map<String, Integer> { mood -> count }
            // LibraryPage expects: { distribution: [{mood, count}], weekly: [] }
            Map<String, Integer> rawStats = moodService.getStats(currentUserId);
            List<Map<String, Object>> distribution = new ArrayList<>();
            if (rawStats != null) {
                for (Map.Entry<String, Integer> entry : rawStats.entrySet()) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("mood", entry.getKey());
                    item.put("count", entry.getValue());
                    distribution.add(item);
                }
            }
            sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                    "ok", true,
                    "distribution", distribution,
                    "weekly", List.of()  // weekly data not yet implemented
            ));

        } else {
            sendError(resp, HttpServletResponse.SC_NOT_FOUND, "Not found");
        }
    }
}
