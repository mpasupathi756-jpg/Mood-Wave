package com.moodwave.model;

import java.sql.Timestamp;

public class ChatMessage {
    private int id;
    private int roomId;
    private int userId;
    private String username;
    private String avatarColor;
    private String msgType;
    private String content;
    private Object songData;
    private Timestamp createdAt;

    public ChatMessage() {}

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

    public String getMsgType() { return msgType; }
    public void setMsgType(String msgType) { this.msgType = msgType; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Object getSongData() { return songData; }
    public void setSongData(Object songData) { this.songData = songData; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}

