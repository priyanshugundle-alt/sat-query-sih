package com.satquery.routing;

import com.satquery.database.DatabaseManager;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;

/**
 * JobManager handles state persistence across execution stages.
 * If Space 1 exhausts quota during inference, Space 2 can read the saved job state
 * and resume execution directly without restarting image validation/pre-processing.
 */
public class JobManager {

    public enum Stage {
        UPLOADED,
        METADATA_CACHED,
        INFERENCE_DONE,
        EVIDENCE_GENERATED,
        COMPLETED,
        FAILED
    }

    public static class JobState {
        public String jobId;
        public String queryId;
        public String currentStage;
        public String stageDataJson;
        public String lastActiveSpace;
        public String updatedAt;

        public JobState(String jobId, String queryId, String currentStage, String stageDataJson, String lastActiveSpace, String updatedAt) {
            this.jobId = jobId;
            this.queryId = queryId;
            this.currentStage = currentStage;
            this.stageDataJson = stageDataJson;
            this.lastActiveSpace = lastActiveSpace;
            this.updatedAt = updatedAt;
        }
    }

    /**
     * Create or initialize a new job state record.
     */
    public static synchronized void initJob(String jobId, String queryId) {
        String sql = "INSERT OR REPLACE INTO job_stages (job_id, query_id, current_stage, stage_data_json, last_active_space, updated_at) " +
                "VALUES (?, ?, 'UPLOADED', '{}', 'UNKNOWN', ?)";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, jobId);
            stmt.setString(2, queryId);
            stmt.setString(3, Instant.now().toString());
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("JobManager error initializing job: " + e.getMessage());
        }
    }

    /**
     * Update the progress stage and intermediate payload of a job.
     */
    public static synchronized void updateStage(String jobId, Stage stage, String stageDataJson, String activeSpaceId) {
        String sql = "UPDATE job_stages SET current_stage = ?, stage_data_json = ?, last_active_space = ?, updated_at = ? " +
                "WHERE job_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, stage.name());
            stmt.setString(2, stageDataJson != null ? stageDataJson : "{}");
            stmt.setString(3, activeSpaceId);
            stmt.setString(4, Instant.now().toString());
            stmt.setString(5, jobId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            System.err.println("JobManager error updating stage: " + e.getMessage());
        }
    }

    /**
     * Retrieve the job state for resumption.
     */
    public static JobState getJobState(String jobId) {
        String sql = "SELECT job_id, query_id, current_stage, stage_data_json, last_active_space, updated_at FROM job_stages WHERE job_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, jobId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return new JobState(
                            rs.getString("job_id"),
                            rs.getString("query_id"),
                            rs.getString("current_stage"),
                            rs.getString("stage_data_json"),
                            rs.getString("last_active_space"),
                            rs.getString("updated_at")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("JobManager error getting job state: " + e.getMessage());
        }
        return null;
    }
}
