package com.satquery.persistence;

import com.satquery.database.DatabaseManager;
import java.sql.*;
import java.time.Instant;
import java.util.UUID;

public class BenchmarkRunRepository {

    public void save(String datasetName, String splitName, String sampleId, String queryId,
                     String expected, String predicted, String metricName, double metricValue,
                     String selectedTask, String modelName) {
        
        String sql = "INSERT INTO benchmark_runs (benchmark_run_id, dataset_name, split_name, sample_id, query_id, " +
                "expected_answer, predicted_answer, metric_name, metric_value, selected_task, model_name, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, "bench-run-" + UUID.randomUUID().toString().substring(0, 8));
            pstmt.setString(2, datasetName);
            pstmt.setString(3, splitName);
            pstmt.setString(4, sampleId);
            pstmt.setString(5, queryId);
            pstmt.setString(6, expected);
            pstmt.setString(7, predicted);
            pstmt.setString(8, metricName);
            pstmt.setDouble(9, metricValue);
            pstmt.setString(10, selectedTask);
            pstmt.setString(11, modelName);
            pstmt.setString(12, Instant.now().toString());
            
            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("Error saving BenchmarkRun metadata: " + e.getMessage());
        }
    }
}
