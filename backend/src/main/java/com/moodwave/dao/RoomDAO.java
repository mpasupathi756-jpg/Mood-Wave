package com.moodwave.dao;

import com.moodwave.model.ChatMessage;
import com.moodwave.model.Room;
import com.moodwave.model.RoomMember;

import java.util.List;

public interface RoomDAO {
    Room findByCode(String code);
    Room findById(int id);
    Room create(Room room);
    boolean closeRoom(String code, int hostId);
    List<Room> findActiveRooms();

    // Member management (supports 3 or more users listening together)
    boolean addMember(int roomId, int userId);
    boolean removeMember(int roomId, int userId);
    List<RoomMember> getMembers(int roomId);
    boolean isMember(int roomId, int userId);
    int getMemberCount(int roomId);

    // Playback state synchronization
    boolean updatePlayback(String code, String currentSongJson, double position, boolean isPlaying);

    // Chat and reactions
    ChatMessage addMessage(int roomId, int userId, String msgType, String content, String songDataJson);
    List<ChatMessage> getRecentMessages(int roomId, int limit);
}

