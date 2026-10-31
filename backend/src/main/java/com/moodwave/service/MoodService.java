package com.moodwave.service;

import com.moodwave.dao.MoodDAO;
import com.moodwave.dao.MoodDAOImpl;
import com.moodwave.dao.SongDAO;
import com.moodwave.dao.SongDAOImpl;
import com.moodwave.model.MoodHistory;
import com.moodwave.model.Song;

import java.util.*;

public class MoodService {
    private final MoodDAO moodDAO = new MoodDAOImpl();
    private final SongDAO songDAO = new SongDAOImpl();

    private static final Map<String, String> MOOD_EMOJIS = Map.of(
            "happy", "😊",
            "calm", "🌊",
            "energetic", "⚡",
            "sad", "🌧️",
            "romantic", "💖",
            "focused", "🎯",
            "party", "🎉",
            "workout", "💪",
            "sleepy", "🌙",
            "angry", "🔥"
    );

    public Map<String, Object> detectMoodAndRecommend(int userId, String text, String selectedMood) {
        String detectedMood = selectedMood != null && !selectedMood.trim().isEmpty() ? selectedMood.toLowerCase() : "happy";

        if (text != null && !text.trim().isEmpty() && (selectedMood == null || selectedMood.isEmpty())) {
            String lower = text.toLowerCase();
            if (lower.contains("sad") || lower.contains("cry") || lower.contains("heartbroken") || lower.contains("lonely")) {
                detectedMood = "sad";
            } else if (lower.contains("pump") || lower.contains("gym") || lower.contains("workout") || lower.contains("lift")) {
                detectedMood = "workout";
            } else if (lower.contains("party") || lower.contains("dance") || lower.contains("club") || lower.contains("celebrate")) {
                detectedMood = "party";
            } else if (lower.contains("focus") || lower.contains("study") || lower.contains("work") || lower.contains("code")) {
                detectedMood = "focused";
            } else if (lower.contains("sleep") || lower.contains("night") || lower.contains("tired") || lower.contains("rest")) {
                detectedMood = "sleepy";
            } else if (lower.contains("calm") || lower.contains("relax") || lower.contains("peace") || lower.contains("nature")) {
                detectedMood = "calm";
            } else if (lower.contains("love") || lower.contains("date") || lower.contains("crush") || lower.contains("heart")) {
                detectedMood = "romantic";
            } else if (lower.contains("energy") || lower.contains("hyped") || lower.contains("power")) {
                detectedMood = "energetic";
            } else if (lower.contains("mad") || lower.contains("angry") || lower.contains("rage") || lower.contains("furious")) {
                detectedMood = "angry";
            } else {
                detectedMood = "happy";
            }
        }

        List<Song> songs = songDAO.findByMood(detectedMood, 20, userId > 0 ? userId : null);
        String emoji = MOOD_EMOJIS.getOrDefault(detectedMood, "🎵");

        if (userId > 0) {
            moodDAO.record(userId, detectedMood, emoji, 5, text, songs.size());
        }

        Map<String, Object> res = new HashMap<>();
        res.put("mood", detectedMood);
        res.put("emoji", emoji);
        res.put("songs", songs);
        res.put("count", songs.size());
        return res;
    }

    public List<MoodHistory> getHistory(int userId, int limit) {
        return moodDAO.findByUser(userId, limit > 0 ? limit : 20);
    }

    public Map<String, Integer> getStats(int userId) {
        return moodDAO.getMoodStats(userId);
    }
}

