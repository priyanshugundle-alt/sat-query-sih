package com.satquery.persistence;

import com.satquery.database.DatabaseManager;
import com.satquery.model.TraceEvent;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class TraceEventRepository {

    public void saveAll(String queryId, List<TraceEvent> traces) {
        if (traces == null || traces.isEmpty()) return;
        
        String sqlTrace = "INSERT INTO trace_events (trace_id, query_id, event_order, event_name, detail, " +
                "tool_name, parameter_summary, event_status, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sqlTrace)) {
            
            int order = 1;
            for (TraceEvent event : traces) {
                pstmt.setString(1, UUID.randomUUID().toString().substring(0, 8));
                pstmt.setString(2, queryId);
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
        } catch (SQLException e) {
            System.err.println("Error saving TraceEvents: " + e.getMessage());
        }
    }

    public List<TraceEvent> findByQueryId(String queryId) {
        List<TraceEvent> traces = new ArrayList<>();
        String sql = "SELECT * FROM trace_events WHERE query_id = ? ORDER BY event_order ASC";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, queryId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    traces.add(new TraceEvent(
                            rs.getString("event_name"),
                            rs.getString("detail"),
                            rs.getString("tool_name"),
                            rs.getString("created_at"),
                            rs.getString("event_status")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error retrieving TraceEvents: " + e.getMessage());
        }
        return traces;
    }

    public void deleteByQueryId(String queryId) {
        String sql = "DELETE FROM trace_events WHERE query_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, queryId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error deleting TraceEvents: " + e.getMessage());
        }
    }
}
