package com.moodwave.dao;

import com.moodwave.model.MoodHistory;
import java.util.List;
import java.util.Map;

public interface MoodDAO {
    MoodHistory record(int userId, String mood, String emoji, int energyLevel, String inputText, int songsQueued);
    List<MoodHistory> findByUser(int userId, int limit);
    Map<String, Integer> getMoodStats(int userId);
}

