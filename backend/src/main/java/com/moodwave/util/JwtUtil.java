package com.moodwave.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class JwtUtil {
    private static final String SECRET_STRING = Config.get("jwt.secret", "MoodWaveSuperSecureSecretKeyForJWTAuthentication2026VibeCheck!");
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRATION_MS = (long) Config.getInt("jwt.expirationHours", 72) * 3600 * 1000;

    public static String generateToken(int userId, String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", userId);
        claims.put("username", username);
        claims.put("role", role);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_MS);

        return Jwts.builder()
                .claims(claims)
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(KEY)
                .compact();
    }

    public static Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(KEY)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    public static Integer extractUserId(String token) {
        Claims claims = parseToken(token);
        if (claims == null) return null;
        Object idObj = claims.get("id");
        if (idObj instanceof Integer) return (Integer) idObj;
        if (idObj instanceof Number) return ((Number) idObj).intValue();
        try {
            return Integer.parseInt(claims.getSubject());
        } catch (Exception ignored) {
            return null;
        }
    }
}

