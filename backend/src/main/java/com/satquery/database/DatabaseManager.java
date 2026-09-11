package com.satquery.database;

import com.satquery.model.*;
import com.satquery.persistence.*;


import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.*;
import java.time.Instant;
import java.util.List;

public class DatabaseManager {
    private static final String DB_URL = "jdbc:sqlite:satquery.db";

    public static synchronized void initialize() {
        try {
            Class.forName("org.sqlite.JDBC");
            
            // Find schema.sql file
            File schemaFile = new File("database/schema.sql");
            if (!schemaFile.exists()) {
                schemaFile = new File("sat-query-backend/database/schema.sql");
            }

            if (!schemaFile.exists()) {
                System.err.println("Database schema.sql file not found. Falling back to default table creation.");
                initializeFallback();
                return;
            }

            String schemaSql = Files.readString(schemaFile.toPath(), StandardCharsets.UTF_8);
            
            try {
                executeSchemaSql(schemaSql);
            } catch (SQLException e) {
                System.out.println("Schema mismatch or SQLite error detected (" + e.getMessage() + "). Resetting database file...");
                File dbFile = new File("satquery.db");
                if (dbFile.exists()) {
                    boolean deleted = dbFile.delete();
                    System.out.println("Previous satquery.db deleted: " + deleted);
                }
                executeSchemaSql(schemaSql);
            }

            // Seed database if empty
            if (isDatabaseEmpty()) {
                File seedFile = new File("database/seed.sql");
                if (!seedFile.exists()) {
                    seedFile = new File("sat-query-backend/database/seed.sql");
                }
                if (seedFile.exists()) {
                    System.out.println("Seeding database with sample records...");
                    try {
                        String seedSql = Files.readString(seedFile.toPath(), StandardCharsets.UTF_8);
                        executeSqlScript(seedSql);
                        System.out.println("Database seeded successfully.");
                    } catch (Exception e) {
                        System.err.println("Database seeding failed: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize SQLite database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static boolean isDatabaseEmpty() {
        String sql = "SELECT COUNT(*) FROM analysis_requests WHERE query_id != 'UNASSIGNED'";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            if (rs.next()) {
                return rs.getInt(1) == 0;
            }
        } catch (SQLException e) {
            return true;
        }
        return true;
    }

    private static void executeSqlScript(String sqlScript) throws SQLException {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA foreign_keys = ON;");
            String[] queries = sqlScript.split(";");
            for (String query : queries) {
                String trimmed = query.trim();
                if (!trimmed.isEmpty()) {
                    stmt.execute(trimmed);
                }
            }
        }
    }

    private static void executeSchemaSql(String schemaSql) throws SQLException {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            
            // Enforce foreign key constraints and WAL mode to prevent locking
            stmt.execute("PRAGMA foreign_keys = ON;");
            stmt.execute("PRAGMA journal_mode = WAL;");
            stmt.execute("PRAGMA busy_timeout = 10000;");
            
            // Execute schema file statements separated by semicolon
            String[] queries = schemaSql.split(";");
            for (String query : queries) {
                String trimmed = query.trim();
                if (!trimmed.isEmpty()) {
                    stmt.execute(trimmed);
                }
            }

            // Insert UNASSIGNED placeholder query to satisfy foreign key constraints for independent uploads
            String sqlPlaceholder = "INSERT OR IGNORE INTO analysis_requests " +
                    "(query_id, query_text, dataset_context, status, created_at) " +
                    "VALUES ('UNASSIGNED', 'Upload placeholder request', 'NORMAL_SATELLITE', 'SUCCESS', '" + Instant.now().toString() + "')";
            stmt.execute(sqlPlaceholder);

            System.out.println("SQLite database initialized successfully using database/schema.sql");
        }
    }

    private static void initializeFallback() throws Exception {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA foreign_keys = ON;");
            
            // Fallback basic creations
            stmt.execute("CREATE TABLE IF NOT EXISTS analysis_requests (" +
                    "query_id TEXT PRIMARY KEY, query_text TEXT, dataset_context TEXT, selected_task TEXT, " +
                    "selected_handler TEXT, selected_model TEXT, status TEXT, answer_text TEXT, " +
                    "confidence_state TEXT, limitations_json TEXT, investigator_json TEXT, created_at TEXT, completed_at TEXT);");

            
            stmt.execute("CREATE TABLE IF NOT EXISTS image_assets (" +
                    "image_id TEXT PRIMARY KEY, query_id TEXT, file_name TEXT, file_path TEXT, file_format TEXT, " +
                    "file_size_bytes INTEGER, width INTEGER, height INTEGER, band_count INTEGER, modality TEXT, " +
                    "acquisition_date TEXT, crs TEXT, bounding_box TEXT, georeferenced INTEGER, created_at TEXT);");
            
            stmt.execute("CREATE TABLE IF NOT EXISTS trace_events (" +
                    "trace_id TEXT PRIMARY KEY, query_id TEXT, event_order INTEGER, event_name TEXT, " +
                    "detail TEXT, tool_name TEXT, parameter_summary TEXT, event_status TEXT, created_at TEXT);");

            stmt.execute("CREATE TABLE IF NOT EXISTS evidence_items (" +
                    "evidence_id TEXT PRIMARY KEY, query_id TEXT, evidence_type TEXT, file_path TEXT, " +
                    "label TEXT, description TEXT, source_modality TEXT, created_at TEXT);");

            stmt.execute("CREATE TABLE IF NOT EXISTS reports (" +
                    "report_id TEXT PRIMARY KEY, query_id TEXT, report_type TEXT, file_path TEXT, generated_at TEXT);");

            stmt.execute("INSERT OR IGNORE INTO analysis_requests (query_id, query_text, status, created_at) " +
                    "VALUES ('UNASSIGNED', 'Upload placeholder', 'SUCCESS', '" + Instant.now().toString() + "');");
            
            System.out.println("SQLite database fallback initialized successfully.");
        }
    }

    public static Connection getConnection() throws SQLException {
        Connection conn = DriverManager.getConnection(DB_URL);
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA busy_timeout = 30000;");
        } catch (Exception ignored) {}
        return conn;
    }

    // Repositories delegation
    private static final ImageAssetRepository imageRepo = new ImageAssetRepository();
    private static final AnalysisRequestRepository requestRepo = new AnalysisRequestRepository();

    // -------------------------------------------------------------
    // ImageAsset Operations
    // -------------------------------------------------------------
    public static void saveImageAsset(ImageAsset asset) {
        imageRepo.save(asset);
    }

    public static ImageAsset getImageAsset(String imageId) {
        return imageRepo.findById(imageId);
    }

    // -------------------------------------------------------------
    // TaskResult Operations
    // -------------------------------------------------------------
    public static void saveTaskResult(TaskResult result) {
        requestRepo.save(result);
    }

    public static TaskResult getTaskResult(String queryId) {
        return requestRepo.findById(queryId);
    }

    public static List<TaskResult> getHistory() {
        return requestRepo.getHistory();
    }
}

