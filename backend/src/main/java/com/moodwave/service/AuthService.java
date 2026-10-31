package com.moodwave.service;

import com.moodwave.dao.UserDAO;
import com.moodwave.dao.UserDAOImpl;
import com.moodwave.model.User;
import com.moodwave.util.JwtUtil;
import com.moodwave.util.PasswordUtil;

import java.util.HashMap;
import java.util.Map;

public class AuthService {
    private final UserDAO userDAO = new UserDAOImpl();

    public Map<String, Object> register(String username, String email, String password) {
        Map<String, Object> response = new HashMap<>();
        if (username == null || username.trim().isEmpty() || email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            response.put("error", "Username, email and password are required.");
            return response;
        }

        if (userDAO.findByEmail(email.trim()) != null) {
            response.put("error", "An account with this email already exists.");
            return response;
        }

        if (userDAO.findByUsername(username.trim()) != null) {
            response.put("error", "Username is already taken.");
            return response;
        }

        String hash = PasswordUtil.hashPassword(password);
        User newUser = new User();
        newUser.setUsername(username.trim());
        newUser.setEmail(email.trim().toLowerCase());
        newUser.setPasswordHash(hash);
        newUser.setRole("user");
        newUser.setAvatarColor("#20C997");

        User created = userDAO.create(newUser);
        if (created == null) {
            response.put("error", "Registration failed. Please try again.");
            return response;
        }

        String token = JwtUtil.generateToken(created.getId(), created.getUsername(), created.getRole());
        response.put("token", token);
        response.put("user", created);
        return response;
    }

    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();
        if (email == null || password == null) {
            response.put("error", "Email and password are required.");
            return response;
        }

        User user = userDAO.findByEmail(email.trim());
        if (user == null || !PasswordUtil.checkPassword(password, user.getPasswordHash())) {
            response.put("error", "Invalid email or password.");
            return response;
        }

        if (!user.isActive()) {
            response.put("error", "Your account has been deactivated.");
            return response;
        }

        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        response.put("token", token);
        response.put("user", user);
        return response;
    }

    public User getProfile(int userId) {
        return userDAO.findById(userId);
    }

    public boolean updateProfile(int userId, String username, String bio, String avatarColor, String avatarUrl) {
        return ((UserDAOImpl) userDAO).updateProfileFull(userId, username, bio, avatarColor, avatarUrl);
    }

    // Backward-compat overload
    public boolean updateProfile(int userId, String bio, String avatarColor, String avatarUrl) {
        return userDAO.updateProfile(userId, bio, avatarColor, avatarUrl);
    }

    public boolean changePassword(int userId, String oldPassword, String newPassword) {
        User user = userDAO.findById(userId);
        if (user == null || !PasswordUtil.checkPassword(oldPassword, user.getPasswordHash())) {
            return false;
        }
        return userDAO.updatePassword(userId, PasswordUtil.hashPassword(newPassword));
    }
}

