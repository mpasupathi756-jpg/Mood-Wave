package com.moodwave.dao;

import com.moodwave.model.MoodHistory;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MoodDAOImpl implements MoodDAO {

    @Override
    public MoodHistory record(int userId, String mood, String emoji, int energyLevel, String inputText, int songsQueued) {
        String sql = "INSERT INTO mood_history (user_id, mood, emoji, energy_level, input_text, songs_queued) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setString(2, mood);
            ps.setString(3, emoji);
            ps.setInt(4, energyLevel);
            ps.setString(5, inputText);
            ps.setInt(6, songsQueued);

            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    MoodHistory mh = new MoodHistory();
                    mh.setId(rs.getInt(1));
                    mh.setUserId(userId);
                    mh.setMood(mood);
                    mh.setEmoji(emoji);
                    mh.setEnergyLevel(energyLevel);
                    mh.setInputText(inputText);
                    mh.setSongsQueued(songsQueued);
                    mh.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    return mh;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<MoodHistory> findByUser(int userId, int limit) {
        List<MoodHistory> list = new ArrayList<>();
        String sql = "SELECT * FROM mood_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    MoodHistory mh = new MoodHistory();
                    mh.setId(rs.getInt("id"));
                    mh.setUserId(rs.getInt("user_id"));
                    mh.setMood(rs.getString("mood"));
                    mh.setEmoji(rs.getString("emoji"));
                    mh.setEnergyLevel(rs.getInt("energy_level"));
                    mh.setInputText(rs.getString("input_text"));
                    mh.setSongsQueued(rs.getInt("songs_queued"));
                    mh.setCreatedAt(rs.getTimestamp("created_at"));
                    list.add(mh);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public Map<String, Integer> getMoodStats(int userId) {
        Map<String, Integer> stats = new HashMap<>();
        String sql = "SELECT mood, COUNT(*) as cnt FROM mood_history WHERE user_id = ? GROUP BY mood";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    stats.put(rs.getString("mood"), rs.getInt("cnt"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return stats;
    }
}

