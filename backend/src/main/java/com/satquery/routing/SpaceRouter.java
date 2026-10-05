package com.satquery.routing;

import com.satquery.database.DatabaseManager;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SpaceRouter manages routing across the 10 Hugging Face ZeroGPU Spaces.
 * It provides round-robin load balancing, circuit breaker failover on HTTP 429/timeouts,
 * and a 10-minute keep-alive ping to prevent ZeroGPU cold starts.
 */
public class SpaceRouter {
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private static int roundRobinIndex = 0;

    static {
        // Start background keep-alive ping every 10 minutes
        scheduler.scheduleAtFixedRate(SpaceRouter::pingActiveSpaces, 1, 10, TimeUnit.MINUTES);
    }

    public static class SpaceInfo {
        public String spaceId;
        public String spaceName;
        public String spaceUrl;
        public String status;

        public SpaceInfo(String spaceId, String spaceName, String spaceUrl, String status) {
            this.spaceId = spaceId;
            this.spaceName = spaceName;
            this.spaceUrl = spaceUrl;
            this.status = status;
        }
    }

    /**
     * Seed or register default 10 Hugging Face ZeroGPU spaces if none exist in the database.
     */
    public static synchronized void registerDefaultSpaces(List<String> spaceUrls) {
        String insertSql = "INSERT OR IGNORE INTO space_registry (space_id, space_name, space_url, status, created_at) " +
                "VALUES (?, ?, ?, 'ACTIVE', ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(insertSql)) {
            
            for (int i = 0; i < spaceUrls.size(); i++) {
                String spaceId = "hf-space-" + (i + 1);
                String spaceName = "SatQuery Worker Space " + (i + 1);
                stmt.setString(1, spaceId);
                stmt.setString(2, spaceName);
                stmt.setString(3, spaceUrls.get(i));
                stmt.setString(4, Instant.now().toString());
                stmt.addBatch();
            }
            stmt.executeBatch();
            System.out.println("SpaceRouter: Initialized " + spaceUrls.size() + " model worker spaces.");
        } catch (SQLException e) {
            System.err.println("SpaceRouter Error registering spaces: " + e.getMessage());
        }
    }

    /**
     * Get all currently ACTIVE spaces, auto-recovering spaces whose cooldown timer has expired.
     */
    public static List<SpaceInfo> getActiveSpaces() {
        List<SpaceInfo> activeList = new ArrayList<>();
        String nowStr = Instant.now().toString();

        // 1. Recover exhausted spaces whose time has passed
        String recoverSql = "UPDATE space_registry SET status = 'ACTIVE', consecutive_failures = 0 " +
                "WHERE status = 'EXHAUSTED' AND exhausted_until IS NOT NULL AND exhausted_until <= ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(recoverSql)) {
            stmt.setString(1, nowStr);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("SpaceRouter error recovering exhausted spaces: " + e.getMessage());
        }

        // 2. Fetch active spaces
        String selectSql = "SELECT space_id, space_name, space_url, status FROM space_registry WHERE status = 'ACTIVE'";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(selectSql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                activeList.add(new SpaceInfo(
                        rs.getString("space_id"),
                        rs.getString("space_name"),
                        rs.getString("space_url"),
                        rs.getString("status")
                ));
            }
        } catch (SQLException e) {
            System.err.println("SpaceRouter error fetching active spaces: " + e.getMessage());
        }

        // Fallback: If all spaces exhausted or empty, return default local server endpoint
        if (activeList.isEmpty()) {
            activeList.add(new SpaceInfo("local-fallback", "Local Fallback Model Server", "http://127.0.0.1:5000", "ACTIVE"));
        }
        return activeList;
    }

    /**
     * Pick the next active space in round-robin sequence.
     */
    public static synchronized SpaceInfo getNextActiveSpace() {
        List<SpaceInfo> activeSpaces = getActiveSpaces();
        if (roundRobinIndex >= activeSpaces.size()) {
            roundRobinIndex = 0;
        }
        SpaceInfo chosen = activeSpaces.get(roundRobinIndex);
        roundRobinIndex = (roundRobinIndex + 1) % activeSpaces.size();
        return chosen;
    }

    /**
     * Mark a space as EXHAUSTED for a given duration (e.g., 24 hours for daily ZeroGPU quota reset).
     */
    public static void markSpaceExhausted(String spaceId, int cooldownMinutes) {
        String until = Instant.now().plus(Duration.ofMinutes(cooldownMinutes)).toString();
        String sql = "UPDATE space_registry SET status = 'EXHAUSTED', consecutive_failures = consecutive_failures + 1, " +
                "exhausted_until = ? WHERE space_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, until);
            stmt.setString(2, spaceId);
            stmt.executeUpdate();
            System.out.println("SpaceRouter: Marked space " + spaceId + " EXHAUSTED until " + until);
        } catch (SQLException e) {
            System.err.println("SpaceRouter error marking space exhausted: " + e.getMessage());
        }
    }

    /**
     * Keep-alive ping task to prevent HF ZeroGPU cold starts.
     */
    private static void pingActiveSpaces() {
        List<SpaceInfo> spaces = getActiveSpaces();
        for (SpaceInfo space : spaces) {
            if ("local-fallback".equals(space.spaceId)) continue;
            try {
                HttpRequest pingRequest = HttpRequest.newBuilder()
                        .uri(URI.create(space.spaceUrl + "/health"))
                        .timeout(Duration.ofSeconds(5))
                        .GET()
                        .build();
                httpClient.sendAsync(pingRequest, HttpResponse.BodyHandlers.discarding());
            } catch (Exception ignored) {
            }
        }
    }
}
