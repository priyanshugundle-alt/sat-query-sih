package com.satquery.model;

import java.util.List;
import java.util.Map;

public class TraceRecord {
    private String query;
    private List<String> inputFiles;
    private List<String> modalities;
    private String selectedTask;
    private List<String> selectedTools;
    private Map<String, Object> parameters;
    private String executionStatus;
    private Object confidence; // Use null or explicit value
    private List<String> limitations;
    private Long latencyMs;

    public TraceRecord() {}

    public TraceRecord(String query, List<String> inputFiles, List<String> modalities, 
                       String selectedTask, List<String> selectedTools, Map<String, Object> parameters, 
                       String executionStatus, Object confidence, List<String> limitations, Long latencyMs) {
        this.query = query;
        this.inputFiles = inputFiles;
        this.modalities = modalities;
        this.selectedTask = selectedTask;
        this.selectedTools = selectedTools;
        this.parameters = parameters;
        this.executionStatus = executionStatus;
        this.confidence = confidence;
        this.limitations = limitations;
        this.latencyMs = latencyMs;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public List<String> getInputFiles() { return inputFiles; }
    public void setInputFiles(List<String> inputFiles) { this.inputFiles = inputFiles; }

    public List<String> getModalities() { return modalities; }
    public void setModalities(List<String> modalities) { this.modalities = modalities; }

    public String getSelectedTask() { return selectedTask; }
    public void setSelectedTask(String selectedTask) { this.selectedTask = selectedTask; }

    public List<String> getSelectedTools() { return selectedTools; }
    public void setSelectedTools(List<String> selectedTools) { this.selectedTools = selectedTools; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public String getExecutionStatus() { return executionStatus; }
    public void setExecutionStatus(String executionStatus) { this.executionStatus = executionStatus; }

    public Object getConfidence() { return confidence; }
    public void setConfidence(Object confidence) { this.confidence = confidence; }

    public List<String> getLimitations() { return limitations; }
    public void setLimitations(List<String> limitations) { this.limitations = limitations; }

    public Long getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Long latencyMs) { this.latencyMs = latencyMs; }
}
