package com.moodwave.model;

import java.sql.Timestamp;

public class Song {
    private int id;
    private String jamendoId;
    private String title;
    private String artist;
    private String album;
    private String genre;
    private String mood;
    private String tags;
    private int duration;
    private Integer bpm;
    private String coverUrl;
    private String audioUrl;
    private String waveformUrl;
    private int playCount;
    private int likeCount;
    private boolean featured;
    private Integer addedBy;
    private Timestamp createdAt;
    private boolean likedByMe;

    public Song() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getJamendoId() { return jamendoId; }
    public void setJamendoId(String jamendoId) { this.jamendoId = jamendoId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getAlbum() { return album; }
    public void setAlbum(String album) { this.album = album; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public Integer getBpm() { return bpm; }
    public void setBpm(Integer bpm) { this.bpm = bpm; }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public String getWaveformUrl() { return waveformUrl; }
    public void setWaveformUrl(String waveformUrl) { this.waveformUrl = waveformUrl; }

    public int getPlayCount() { return playCount; }
    public void setPlayCount(int playCount) { this.playCount = playCount; }

    public int getLikeCount() { return likeCount; }
    public void setLikeCount(int likeCount) { this.likeCount = likeCount; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public Integer getAddedBy() { return addedBy; }
    public void setAddedBy(Integer addedBy) { this.addedBy = addedBy; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public boolean isLikedByMe() { return likedByMe; }
    public void setLikedByMe(boolean likedByMe) { this.likedByMe = likedByMe; }
}

