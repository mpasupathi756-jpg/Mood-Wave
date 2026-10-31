package com.moodwave.dao;

import com.moodwave.model.Playlist;
import com.moodwave.model.Song;

import java.util.List;

public interface PlaylistDAO {
    List<Playlist> findByUser(int userId);
    Playlist findById(int id, Integer currentUserId);
    Playlist create(Playlist playlist);
    boolean addSong(int playlistId, int songId);
    boolean removeSong(int playlistId, int songId);
    boolean delete(int id, int userId);
    List<Song> getPlaylistSongs(int playlistId, Integer currentUserId);
}

