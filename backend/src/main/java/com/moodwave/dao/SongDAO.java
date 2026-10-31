package com.moodwave.dao;

import com.moodwave.model.Song;
import java.util.List;

public interface SongDAO {
    Song findById(int id, Integer currentUserId);
    List<Song> findAll(String search, String mood, String genre, int offset, int limit, Integer currentUserId);
    int count(String search, String mood, String genre);
    List<Song> findByMood(String mood, int limit, Integer currentUserId);
    List<Song> findLikedByUser(int userId);
    List<Song> findHistoryByUser(int userId, int limit);
    boolean toggleLike(int userId, int songId);
    boolean isLiked(int userId, int songId);
    void recordPlay(int userId, int songId, int durationPlayed, boolean completed);
    Song create(Song song);
    boolean update(Song song);
    boolean delete(int id);
}

