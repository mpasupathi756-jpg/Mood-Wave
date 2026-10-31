package com.moodwave;

import com.moodwave.controller.*;
import com.moodwave.filter.AuthFilter;
import com.moodwave.filter.CorsFilter;
import com.moodwave.util.Config;
import com.moodwave.websocket.RoomWebSocketServer;
import jakarta.websocket.server.ServerContainer;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;
import org.apache.tomcat.websocket.server.WsSci;

import java.io.File;

public class ServerApp {

    public static void main(String[] args) throws Exception {
        int port = Config.getInt("server.port", 5000);

        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
        tomcat.getConnector(); // Initialize connector

        String baseDir = new File(System.getProperty("java.io.tmpdir"), "tomcat-moodwave-" + port).getAbsolutePath();
        tomcat.setBaseDir(baseDir);

        File docBase = new File(System.getProperty("java.io.tmpdir"), "tomcat-docbase-" + port);
        if (!docBase.exists()) docBase.mkdirs();

        Context ctx = tomcat.addContext("", docBase.getAbsolutePath());

        // WebSocket Container Initializer
        ctx.addServletContainerInitializer(new WsSci(), null);

        // 1. CORS Filter
        CorsFilter corsFilter = new CorsFilter();
        FilterDef corsDef = new FilterDef();
        corsDef.setFilterName("CorsFilter");
        corsDef.setFilterClass(CorsFilter.class.getName());
        corsDef.setFilter(corsFilter);
        ctx.addFilterDef(corsDef);

        FilterMap corsMap = new FilterMap();
        corsMap.setFilterName("CorsFilter");
        corsMap.addURLPatternDecoded("/*");
        ctx.addFilterMap(corsMap);

        // 2. Auth Filter
        AuthFilter authFilter = new AuthFilter();
        FilterDef authDef = new FilterDef();
        authDef.setFilterName("AuthFilter");
        authDef.setFilterClass(AuthFilter.class.getName());
        authDef.setFilter(authFilter);
        ctx.addFilterDef(authDef);

        FilterMap authMap = new FilterMap();
        authMap.setFilterName("AuthFilter");
        authMap.addURLPatternDecoded("/*");
        ctx.addFilterMap(authMap);

        // 3. Register MVC Servlets
        Tomcat.addServlet(ctx, "HealthServlet", new HealthServlet());
        ctx.addServletMappingDecoded("/api/health", "HealthServlet");

        Tomcat.addServlet(ctx, "AuthServlet", new AuthServlet());
        ctx.addServletMappingDecoded("/api/auth/*", "AuthServlet");

        Tomcat.addServlet(ctx, "SongServlet", new SongServlet());
        ctx.addServletMappingDecoded("/api/songs/*", "SongServlet");

        Tomcat.addServlet(ctx, "MoodServlet", new MoodServlet());
        ctx.addServletMappingDecoded("/api/mood/*", "MoodServlet");

        Tomcat.addServlet(ctx, "RoomServlet", new RoomServlet());
        ctx.addServletMappingDecoded("/api/rooms/*", "RoomServlet");

        Tomcat.addServlet(ctx, "PlaylistServlet", new PlaylistServlet());
        ctx.addServletMappingDecoded("/api/playlists/*", "PlaylistServlet");

        Tomcat.addServlet(ctx, "AdminServlet", new AdminServlet());
        ctx.addServletMappingDecoded("/api/admin/*", "AdminServlet");

        System.out.println("====================================================================");
        System.out.println(" Starting MoodWave Java Backend on http://localhost:" + port);
        System.out.println(" Architecture: MVC Architecture + DAO Design Pattern + Jakarta Servlets");
        System.out.println(" Database: Supabase PostgreSQL (Online Cloud DB)");
        System.out.println(" Listen Together Sync: Real-Time WebSockets & Polling for 3+ users");
        System.out.println("====================================================================");

        tomcat.start();

        // WebSocket Endpoint
        try {
            ServerContainer wsContainer = (ServerContainer) ctx.getServletContext().getAttribute(ServerContainer.class.getName());
            if (wsContainer != null) {
                wsContainer.addEndpoint(RoomWebSocketServer.class);
                System.out.println("[WebSocket] RoomWebSocketServer registered at /ws/rooms/{code}");
            }
        } catch (Exception wsEx) {
            System.out.println("[WebSocket] Note: " + wsEx.getMessage());
        }

        System.out.println("[ServerApp] MoodWave Java Backend is ready and listening for requests!");

        tomcat.getServer().await();
    }
}
