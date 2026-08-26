package com.satquery.persistence;

import com.satquery.database.DatabaseManager;
import com.satquery.model.Evidence;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class EvidenceRepository {

    public void saveAll(String queryId, List<Evidence> evidenceList) {
        if (evidenceList == null || evidenceList.isEmpty()) return;
        
        String sqlEvidence = "INSERT INTO evidence_items (evidence_id, query_id, evidence_type, file_path, " +
                "label, description, source_modality, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sqlEvidence)) {
            
            for (Evidence ev : evidenceList) {
                pstmt.setString(1, UUID.randomUUID().toString().substring(0, 8));
                pstmt.setString(2, queryId);
                pstmt.setString(3, ev.getEvidenceType());
                pstmt.setString(4, ev.getFilePath());
                pstmt.setString(5, ev.getLabel());
                pstmt.setString(6, ev.getDescription());
                pstmt.setString(7, "OPTICAL");
                pstmt.setString(8, Instant.now().toString());
                pstmt.addBatch();
            }
            pstmt.executeBatch();
        } catch (SQLException e) {
            System.err.println("Error saving Evidence items: " + e.getMessage());
        }
    }

    public List<Evidence> findByQueryId(String queryId) {
        List<Evidence> evidence = new ArrayList<>();
        String sql = "SELECT * FROM evidence_items WHERE query_id = ? ORDER BY created_at ASC";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, queryId);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    evidence.add(new Evidence(
                            rs.getString("evidence_type"),
                            rs.getString("file_path"),
                            rs.getString("label"),
                            rs.getString("description")
                    ));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error retrieving Evidence items: " + e.getMessage());
        }
        return evidence;
    }

    public void deleteByQueryId(String queryId) {
        String sql = "DELETE FROM evidence_items WHERE query_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, queryId);
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error deleting Evidence items: " + e.getMessage());
        }
    }
}
