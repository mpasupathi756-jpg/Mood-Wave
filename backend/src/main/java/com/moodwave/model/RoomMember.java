package com.moodwave.model;

import java.sql.Timestamp;

public class RoomMember {
    private int id;
    private int roomId;
    private int userId;
    private String username;
    private String avatarColor;
    private String avatarUrl;
    private Timestamp joinedAt;
    private boolean isHost;

    public RoomMember() {}

    public RoomMember(int userId, String username, String avatarColor, boolean isHost) {
        this.userId = userId;
        this.username = username;
        this.avatarColor = avatarColor;
        this.isHost = isHost;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getRoomId() { return roomId; }
    public void setRoomId(int roomId) { this.roomId = roomId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatarColor() { return avatarColor; }
    public void setAvatarColor(String avatarColor) { this.avatarColor = avatarColor; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Timestamp getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Timestamp joinedAt) { this.joinedAt = joinedAt; }

    public boolean isHost() { return isHost; }
    public void setHost(boolean host) { isHost = host; }
}

