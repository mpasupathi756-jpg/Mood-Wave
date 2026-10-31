package com.moodwave.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class Room {
    private int id;
    private String code;
    private String name;
    private int hostId;
    private String hostUsername;
    private int maxMembers;
    private boolean active;
    private boolean isPrivate;

    @JsonIgnore
    private String passwordHash;

    private Object currentSongData;
    private double playbackPos;
    private boolean isPlaying;
    private Timestamp createdAt;

    // Active members currently joined
    private List<RoomMember> members = new ArrayList<>();

    public Room() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getHostId() { return hostId; }
    public void setHostId(int hostId) { this.hostId = hostId; }

    public String getHostUsername() { return hostUsername; }
    public void setHostUsername(String hostUsername) { this.hostUsername = hostUsername; }

    public int getMaxMembers() { return maxMembers; }
    public void setMaxMembers(int maxMembers) { this.maxMembers = maxMembers; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isPrivate() { return isPrivate; }
    public void setPrivate(boolean aPrivate) { isPrivate = aPrivate; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Object getCurrentSongData() { return currentSongData; }
    public void setCurrentSongData(Object currentSongData) { this.currentSongData = currentSongData; }

    public double getPlaybackPos() { return playbackPos; }
    public void setPlaybackPos(double playbackPos) { this.playbackPos = playbackPos; }

    public boolean isPlaying() { return isPlaying; }
    public void setPlaying(boolean playing) { isPlaying = playing; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public List<RoomMember> getMembers() { return members; }
    public void setMembers(List<RoomMember> members) { this.members = members; }
}

