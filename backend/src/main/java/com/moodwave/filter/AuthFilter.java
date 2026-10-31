package com.moodwave.filter;

import com.moodwave.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

public class AuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        String authHeader = req.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            Claims claims = JwtUtil.parseToken(token);
            if (claims != null) {
                Integer userId = JwtUtil.extractUserId(token);
                req.setAttribute("userId", userId);
                req.setAttribute("username", claims.get("username"));
                req.setAttribute("role", claims.get("role"));
            }
        }

        chain.doFilter(request, response);
    }
}

