package com.moodwave.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.InputStream;
import java.util.Properties;

public class Config {
    private static final Properties props = new Properties();

    static {
        // 1. Load application.properties from classpath
        try (InputStream in = Config.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (in != null) {
                props.load(in);
            }
        } catch (Exception e) {
            System.err.println("Could not load application.properties: " + e.getMessage());
        }

        // 2. Load .env file if present in working directory or parent directory
        loadEnvFile(new File(".env"));
        loadEnvFile(new File("../.env"));
        loadEnvFile(new File("backend/.env"));
    }

    private static void loadEnvFile(File envFile) {
        if (envFile.exists() && envFile.isFile()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) continue;
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String val = line.substring(eqIdx + 1).trim();
                        // Strip quotes if wrapped
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        props.setProperty(key, val);
                    }
                }
                System.out.println("[Config] Loaded environment variables from: " + envFile.getAbsolutePath());
            } catch (Exception e) {
                System.err.println("[Config] Error reading .env file: " + e.getMessage());
            }
        }
    }

    public static String get(String key, String defaultValue) {
        // Environment variable check
        String envKey = key.toUpperCase().replace('.', '_');
        String envVal = System.getenv(envKey);
        if (envVal != null && !envVal.trim().isEmpty()) {
            return envVal;
        }

        // Check common Supabase aliases
        if ("db.url".equals(key) || "database.url".equals(key)) {
            String dbUrl = System.getenv("DATABASE_URL");
            if (dbUrl != null && !dbUrl.trim().isEmpty()) return dbUrl;
            String supabaseUrl = System.getenv("SUPABASE_DB_URL");
            if (supabaseUrl != null && !supabaseUrl.trim().isEmpty()) return supabaseUrl;
            String propDbUrl = props.getProperty("DATABASE_URL");
            if (propDbUrl != null && !propDbUrl.trim().isEmpty()) return propDbUrl;
            String propSupabaseUrl = props.getProperty("SUPABASE_DB_URL");
            if (propSupabaseUrl != null && !propSupabaseUrl.trim().isEmpty()) return propSupabaseUrl;
        }

        if ("db.password".equals(key)) {
            String dbPass = System.getenv("DB_PASSWORD");
            if (dbPass != null && !dbPass.trim().isEmpty()) return dbPass;
            String propPass = props.getProperty("DB_PASSWORD");
            if (propPass != null && !propPass.trim().isEmpty()) return propPass;
        }

        return props.getProperty(key, defaultValue);
    }

    public static int getInt(String key, int defaultValue) {
        // Render.com sets PORT environment variable — always check it for server.port
        if ("server.port".equals(key)) {
            String port = System.getenv("PORT");
            if (port != null && !port.trim().isEmpty()) {
                try { return Integer.parseInt(port.trim()); } catch (NumberFormatException ignored) {}
            }
        }
        String val = get(key, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
