package com.moodwave.controller;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@WebServlet(name = "HealthServlet", urlPatterns = {"/api/health"})
public class HealthServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        sendJson(resp, HttpServletResponse.SC_OK, Map.of(
                "ok", true,
                "msg", "MoodWave Java Servlets API is running seamlessly",
                "timestamp", Instant.now().toString(),
                "runtime", "Java 21 LTS + Jakarta Servlets + JDBC + DAO Pattern"
        ));
    }
}

