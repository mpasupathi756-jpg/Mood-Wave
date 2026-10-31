package com.moodwave.dao;

import com.moodwave.model.User;
import java.util.List;

public interface UserDAO {
    User findById(int id);
    User findByEmail(String email);
    User findByUsername(String username);
    User create(User user);
    boolean updateProfile(int id, String bio, String avatarColor, String avatarUrl);
    boolean updatePassword(int id, String newPasswordHash);
    List<User> findAll(int offset, int limit);
    int countUsers();
    boolean delete(int id);
    boolean updateRole(int id, String role, boolean active);
}

