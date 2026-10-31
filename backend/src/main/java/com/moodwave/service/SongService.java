package com.moodwave.service;

import com.moodwave.dao.SongDAO;
import com.moodwave.dao.SongDAOImpl;
import com.moodwave.model.Song;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SongService {
    private final SongDAO songDAO = new SongDAOImpl();

    public Map<String, Object> listSongs(String search, String mood, String genre, int page, int limit, Integer currentUserId) {
        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 20;
        int offset = (page - 1) * limit;

        List<Song> songs = songDAO.findAll(search, mood, genre, offset, limit, currentUserId);
        int total = songDAO.count(search, mood, genre);

        Map<String, Object> res = new HashMap<>();
        res.put("songs", songs);
        res.put("total", total);
        res.put("page", page);
        res.put("pages", (int) Math.ceil((double) total / limit));
        return res;
    }

    public Song getSong(int id, Integer currentUserId) {
        return songDAO.findById(id, currentUserId);
    }

    public List<Song> getByMood(String mood, int limit, Integer currentUserId) {
        return songDAO.findByMood(mood, limit > 0 ? limit : 20, currentUserId);
    }

    public List<Song> getLiked(int userId) {
        return songDAO.findLikedByUser(userId);
    }

    public List<Song> getHistory(int userId, int limit) {
        return songDAO.findHistoryByUser(userId, limit > 0 ? limit : 30);
    }

    public boolean toggleLike(int userId, int songId) {
        return songDAO.toggleLike(userId, songId);
    }

    public void recordPlay(int userId, int songId, int durationPlayed, boolean completed) {
        songDAO.recordPlay(userId, songId, durationPlayed, completed);
    }

    public Song addSong(Song song) {
        return songDAO.create(song);
    }

    public boolean updateSong(Song song) {
        return songDAO.update(song);
    }

    public boolean deleteSong(int id) {
        return songDAO.delete(id);
    }
}

