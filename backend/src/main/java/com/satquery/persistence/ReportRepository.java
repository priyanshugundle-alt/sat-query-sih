package com.satquery.persistence;

import com.satquery.database.DatabaseManager;
import java.sql.*;
import java.time.Instant;

public class ReportRepository {

    public void save(String queryId, String reportType, String filePath) {
        String sqlReport = "INSERT OR REPLACE INTO reports (report_id, query_id, report_type, file_path, generated_at) " +
                "VALUES (?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sqlReport)) {
            
            pstmt.setString(1, "rep-" + queryId);
            pstmt.setString(2, queryId);
            pstmt.setString(3, reportType);
            pstmt.setString(4, filePath);
            pstmt.setString(5, Instant.now().toString());
            
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error saving Report metadata: " + e.getMessage());
        }
    }
}
