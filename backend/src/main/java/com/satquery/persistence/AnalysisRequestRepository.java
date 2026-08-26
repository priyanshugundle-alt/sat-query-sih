package com.satquery.persistence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.satquery.database.DatabaseManager;
import com.satquery.model.*;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AnalysisRequestRepository {
    private static final ObjectMapper mapper = new ObjectMapper();
    private final TraceEventRepository traceRepo = new TraceEventRepository();
    private final EvidenceRepository evidenceRepo = new EvidenceRepository();
    private final ReportRepository reportRepo = new ReportRepository();

    public void save(TaskResult result) {
        String sqlQueryInsert = "INSERT OR REPLACE INTO analysis_requests (query_id, query_text, dataset_context, " +
                "selected_task, selected_handler, selected_model, status, answer_text, confidence_state, " +
                "limitations_json, investigator_json, created_at, completed_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseManager.getConnection()) {
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
                    pstmt.setString(11, mapper.writeValueAsString(result.getInvestigatorReport()));
                    pstmt.setString(12, Instant.now().toString());
                    pstmt.setString(13, Instant.now().toString());
                    pstmt.executeUpdate();
                }


                // 2. Clear old children to overwrite cleanly
                traceRepo.deleteByQueryId(result.getQueryId());
                evidenceRepo.deleteByQueryId(result.getQueryId());

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
                traceRepo.saveAll(result.getQueryId(), result.getTrace());

                // 5. Save evidence
                evidenceRepo.saveAll(result.getQueryId(), result.getEvidence());

                // 6. Save report record
                if ("SUCCESS".equalsIgnoreCase(result.getStatus())) {
                    reportRepo.save(result.getQueryId(), "PDF", "outputs/report-" + result.getQueryId() + ".pdf");
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

    public TaskResult findById(String queryId) {
        String sql = "SELECT * FROM analysis_requests WHERE query_id = ?";
        try (Connection conn = DatabaseManager.getConnection();
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

                    // Load investigator report
                    String invJson = rs.getString("investigator_json");
                    if (invJson != null) {
                        try {
                            result.setInvestigatorReport(mapper.readValue(invJson, InvestigatorReport.class));
                        } catch (Exception e) {
                            System.err.println("Error deserializing investigator report: " + e.getMessage());
                        }
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
                    result.setTrace(traceRepo.findByQueryId(queryId));

                    // Fetch evidence items
                    result.setEvidence(evidenceRepo.findByQueryId(queryId));

                    return result;
                }
            }
        } catch (Exception e) {
            System.err.println("Error retrieving TaskResult: " + e.getMessage());
        }
        return null;
    }

    public List<TaskResult> getHistory() {
        List<TaskResult> list = new ArrayList<>();
        String sql = "SELECT query_id FROM analysis_requests WHERE query_id != 'UNASSIGNED' ORDER BY created_at DESC LIMIT 20";
        try (Connection conn = DatabaseManager.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                TaskResult res = findById(rs.getString("query_id"));
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
