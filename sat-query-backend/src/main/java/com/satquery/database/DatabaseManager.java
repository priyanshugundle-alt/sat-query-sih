package com.satquery.database;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.satquery.model.*;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class DatabaseManager {
    private static final String DB_URL = "jdbc:sqlite:satquery.db";
    private static final ObjectMapper mapper = new ObjectMapper();

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
        } catch (Exception e) {
            System.err.println("Failed to initialize SQLite database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void executeSchemaSql(String schemaSql) throws SQLException {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            
            // Enforce foreign key constraints
            stmt.execute("PRAGMA foreign_keys = ON;");
            
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
                    "confidence_state TEXT, limitations_json TEXT, created_at TEXT, completed_at TEXT);");
            
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
        return DriverManager.getConnection(DB_URL);
    }

    // -------------------------------------------------------------
    // ImageAsset Operations
    // -------------------------------------------------------------
    public static void saveImageAsset(ImageAsset asset) {
        String sql = "INSERT OR REPLACE INTO image_assets (image_id, query_id, file_name, file_path, file_format, " +
                "file_size_bytes, width, height, band_count, modality, acquisition_date, crs, bounding_box, " +
                "georeferenced, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, asset.getImageId());
            pstmt.setString(2, "UNASSIGNED"); // Default to placeholder during raw upload
            pstmt.setString(3, asset.getFileName());
            pstmt.setString(4, asset.getFilePath());
            
            ImageMetadata meta = asset.getMetadata();
            if (meta != null) {
                pstmt.setString(5, meta.getFormat());
                pstmt.setLong(6, 1024L * 1024L); // 1MB mock size
                pstmt.setInt(7, meta.getWidth());
                pstmt.setInt(8, meta.getHeight());
                pstmt.setInt(9, meta.getBandCount() != null ? meta.getBandCount() : 3);
                pstmt.setString(10, meta.getModality());
                pstmt.setString(11, meta.getAcquisitionDate());
                pstmt.setString(12, meta.getCrs());
                pstmt.setString(13, meta.getBoundingBox());
                pstmt.setInt(14, meta.isGeoreferenced() ? 1 : 0);
            } else {
                pstmt.setNull(5, Types.VARCHAR);
                pstmt.setLong(6, 0L);
                pstmt.setInt(7, 0);
                pstmt.setInt(8, 0);
                pstmt.setInt(9, 3);
                pstmt.setNull(10, Types.VARCHAR);
                pstmt.setNull(11, Types.VARCHAR);
                pstmt.setNull(12, Types.VARCHAR);
                pstmt.setNull(13, Types.VARCHAR);
                pstmt.setInt(14, 0);
            }
            pstmt.setString(15, Instant.now().toString());
            
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error saving image asset: " + e.getMessage());
        }
    }

    public static ImageAsset getImageAsset(String imageId) {
        String sql = "SELECT * FROM image_assets WHERE image_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, imageId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    ImageMetadata meta = new ImageMetadata(
                            rs.getString("file_format"),
                            rs.getInt("width"),
                            rs.getInt("height"),
                            rs.getInt("band_count"),
                            rs.getString("modality"),
                            rs.getString("acquisition_date"),
                            rs.getString("crs"),
                            rs.getString("bounding_box"),
                            rs.getInt("georeferenced") == 1
                    );
                    return new ImageAsset(
                            rs.getString("image_id"),
                            rs.getString("file_name"),
                            rs.getString("file_path"),
                            meta
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Error retrieving image asset: " + e.getMessage());
        }
        return null;
    }

    // -------------------------------------------------------------
    // TaskResult Operations
    // -------------------------------------------------------------
    public static void saveTaskResult(TaskResult result) {
        String sqlQueryInsert = "INSERT OR REPLACE INTO analysis_requests (query_id, query_text, dataset_context, " +
                "selected_task, selected_handler, selected_model, status, answer_text, confidence_state, " +
                "limitations_json, created_at, completed_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = getConnection()) {
            conn.setAutoCommit(false); // Start transaction
            
            try {
                // 1. Save core query info
                try (PreparedStatement pstmt = conn.prepareStatement(sqlQueryInsert)) {
                    pstmt.setString(1, result.getQueryId());
                    pstmt.setString(2, result.getTraceRecord() != null ? result.getTraceRecord().getQuery() : "Ask the imagery");
                    pstmt.setString(3, "NORMAL_SATELLITE");
                    pstmt.setString(4, result.getTaskType() != null ? result.getTaskType().name() : null);
                    pstmt.setString(5, result.getHandlerName());
                    pstmt.setString(6, result.getModelName());
                    pstmt.setString(7, result.getStatus());
                    pstmt.setString(8, result.getAnswer());
                    pstmt.setString(9, result.getConfidenceState());
                    pstmt.setString(10, mapper.writeValueAsString(result.getLimitations()));
                    pstmt.setString(11, Instant.now().toString());
                    pstmt.setString(12, Instant.now().toString());
                    pstmt.executeUpdate();
                }

                // 2. Clear old children to overwrite cleanly
                try (PreparedStatement delTraces = conn.prepareStatement("DELETE FROM trace_events WHERE query_id = ?")) {
                    delTraces.setString(1, result.getQueryId());
                    delTraces.executeUpdate();
                }
                try (PreparedStatement delEv = conn.prepareStatement("DELETE FROM evidence_items WHERE query_id = ?")) {
                    delEv.setString(1, result.getQueryId());
                    delEv.executeUpdate();
                }

                // 3. Update uploaded images to point to this query_id instead of UNASSIGNED
                if (result.getTraceRecord() != null && result.getTraceRecord().getInputFiles() != null) {
                    try (PreparedStatement updateImg = conn.prepareStatement("UPDATE image_assets SET query_id = ? WHERE file_name = ?")) {
                        for (String filename : result.getTraceRecord().getInputFiles()) {
                            updateImg.setString(1, result.getQueryId());
                            updateImg.setString(2, filename);
                            updateImg.executeUpdate();
                        }
                    }
                }

                // 4. Save trace events
                if (result.getTrace() != null) {
                    String sqlTrace = "INSERT INTO trace_events (trace_id, query_id, event_order, event_name, detail, " +
                            "tool_name, parameter_summary, event_status, created_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    try (PreparedStatement pstmt = conn.prepareStatement(sqlTrace)) {
                        int order = 1;
                        for (TraceEvent event : result.getTrace()) {
                            pstmt.setString(1, UUID.randomUUID().toString().substring(0, 8));
                            pstmt.setString(2, result.getQueryId());
                            pstmt.setInt(3, order++);
                            pstmt.setString(4, event.getEventName());
                            pstmt.setString(5, event.getDetail());
                            pstmt.setString(6, event.getToolName());
                            pstmt.setString(7, "{}");
                            pstmt.setString(8, event.getStatus());
                            pstmt.setString(9, Instant.now().toString());
                            pstmt.addBatch();
                        }
                        pstmt.executeBatch();
                    }
                }

                // 5. Save evidence
                if (result.getEvidence() != null) {
                    String sqlEvidence = "INSERT INTO evidence_items (evidence_id, query_id, evidence_type, file_path, " +
                            "label, description, source_modality, created_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    try (PreparedStatement pstmt = conn.prepareStatement(sqlEvidence)) {
                        for (Evidence ev : result.getEvidence()) {
                            pstmt.setString(1, UUID.randomUUID().toString().substring(0, 8));
                            pstmt.setString(2, result.getQueryId());
                            pstmt.setString(3, ev.getEvidenceType());
                            pstmt.setString(4, ev.getFilePath());
                            pstmt.setString(5, ev.getLabel());
                            pstmt.setString(6, ev.getDescription());
                            pstmt.setString(7, "OPTICAL");
                            pstmt.setString(8, Instant.now().toString());
                            pstmt.addBatch();
                        }
                        pstmt.executeBatch();
                    }
                }

                // 6. Save report record
                if ("SUCCESS".equalsIgnoreCase(result.getStatus())) {
                    String sqlReport = "INSERT OR REPLACE INTO reports (report_id, query_id, report_type, file_path, generated_at) " +
                            "VALUES (?, ?, ?, ?, ?)";
                    try (PreparedStatement pstmt = conn.prepareStatement(sqlReport)) {
                        pstmt.setString(1, "rep-" + result.getQueryId());
                        pstmt.setString(2, result.getQueryId());
                        pstmt.setString(3, "PDF");
                        pstmt.setString(4, "outputs/report-" + result.getQueryId() + ".pdf");
                        pstmt.setString(5, Instant.now().toString());
                        pstmt.executeUpdate();
                    }
                }

                conn.commit();
            } catch (Exception ex) {
                conn.rollback();
                throw ex;
            }
        } catch (Exception e) {
            System.err.println("Error saving TaskResult to SQLite: " + e.getMessage());
        }
    }

    public static TaskResult getTaskResult(String queryId) {
        String sql = "SELECT * FROM analysis_requests WHERE query_id = ?";
        try (Connection conn = getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, queryId);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    TaskResult result = new TaskResult();
                    result.setQueryId(rs.getString("query_id"));
                    
                    String taskTypeStr = rs.getString("selected_task");
                    if (taskTypeStr != null) {
                        result.setTaskType(TaskType.valueOf(taskTypeStr));
                    }
                    
                    result.setHandlerName(rs.getString("selected_handler"));
                    result.setModelName(rs.getString("selected_model"));
                    result.setStatus(rs.getString("status"));
                    result.setAnswer(rs.getString("answer_text"));
                    result.setConfidenceState(rs.getString("confidence_state"));

                    // Load limitations
                    String limsJson = rs.getString("limitations_json");
                    if (limsJson != null) {
                        result.setLimitations(mapper.readValue(limsJson, new TypeReference<List<String>>() {}));
                    }

                    // Rebuild TraceRecord
                    String queryText = rs.getString("query_text");
                    TraceRecord record = new TraceRecord();
                    record.setQuery(queryText);
                    record.setSelectedTask(taskTypeStr);
                    record.setConfidence(result.getConfidenceState());
                    record.setExecutionStatus(result.getStatus().toLowerCase());
                    result.setTraceRecord(record);

                    // Fetch traces ordered by event_order
                    List<TraceEvent> traces = new ArrayList<>();
                    try (PreparedStatement trStmt = conn.prepareStatement(
                            "SELECT * FROM trace_events WHERE query_id = ? ORDER BY event_order ASC")) {
                        trStmt.setString(1, queryId);
                        try (ResultSet trRs = trStmt.executeQuery()) {
                            while (trRs.next()) {
                                traces.add(new TraceEvent(
                                        trRs.getString("event_name"),
                                        trRs.getString("detail"),
                                        trRs.getString("tool_name"),
                                        trRs.getString("created_at"),
                                        trRs.getString("event_status")
                                ));
                            }
                        }
                    }
                    result.setTrace(traces);

                    // Fetch evidence items
                    List<Evidence> evidence = new ArrayList<>();
                    try (PreparedStatement evStmt = conn.prepareStatement(
                            "SELECT * FROM evidence_items WHERE query_id = ? ORDER BY created_at ASC")) {
                        evStmt.setString(1, queryId);
                        try (ResultSet evRs = evStmt.executeQuery()) {
                            while (evRs.next()) {
                                evidence.add(new Evidence(
                                        evRs.getString("evidence_type"),
                                        evRs.getString("file_path"),
                                        evRs.getString("label"),
                                        evRs.getString("description")
                                ));
                            }
                        }
                    }
                    result.setEvidence(evidence);

                    return result;
                }
            }
        } catch (Exception e) {
            System.err.println("Error retrieving TaskResult: " + e.getMessage());
        }
        return null;
    }

    public static List<TaskResult> getHistory() {
        List<TaskResult> list = new ArrayList<>();
        // Query from analysis_requests directly
        String sql = "SELECT query_id FROM analysis_requests WHERE query_id != 'UNASSIGNED' ORDER BY created_at DESC LIMIT 20";
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                TaskResult res = getTaskResult(rs.getString("query_id"));
                if (res != null) {
                    list.add(res);
                }
            }
        } catch (Exception e) {
            System.err.println("Error retrieving history list: " + e.getMessage());
        }
        return list;
    }
}
