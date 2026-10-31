package com.moodwave.model;

import java.sql.Timestamp;

public class MoodHistory {
    private int id;
    private int userId;
    private String mood;
    private String emoji;
    private int energyLevel;
    private String inputText;
    private int songsQueued;
    private Timestamp createdAt;

    public MoodHistory() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public int getEnergyLevel() { return energyLevel; }
    public void setEnergyLevel(int energyLevel) { this.energyLevel = energyLevel; }

    public String getInputText() { return inputText; }
    public void setInputText(String inputText) { this.inputText = inputText; }

    public int getSongsQueued() { return songsQueued; }
    public void setSongsQueued(int songsQueued) { this.songsQueued = songsQueued; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}

