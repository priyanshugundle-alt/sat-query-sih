package com.satquery.model;

import java.util.List;

public class TaskResult {
    private String queryId;
    private TaskType taskType;
    private String handlerName;
    private String modelName;
    private String status;
    private String answer;
    private String confidenceState; // HIGH, MEDIUM, LOW, REVIEW_RECOMMENDED
    private List<Evidence> evidence;
    private List<String> limitations;
    private List<TraceEvent> trace;
    private TraceRecord traceRecord;

    public TaskResult() {}

    public TaskResult(String queryId, TaskType taskType, String handlerName, String modelName, 
                      String status, String answer, String confidenceState, List<Evidence> evidence, 
                      List<String> limitations, List<TraceEvent> trace) {
        this.queryId = queryId;
        this.taskType = taskType;
        this.handlerName = handlerName;
        this.modelName = modelName;
        this.status = status;
        this.answer = answer;
        this.confidenceState = confidenceState;
        this.evidence = evidence;
        this.limitations = limitations;
        this.trace = trace;
    }

    public String getQueryId() { return queryId; }
    public void setQueryId(String queryId) { this.queryId = queryId; }

    public TaskType getTaskType() { return taskType; }
    public void setTaskType(TaskType taskType) { this.taskType = taskType; }

    public String getHandlerName() { return handlerName; }
    public void setHandlerName(String handlerName) { this.handlerName = handlerName; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getConfidenceState() { return confidenceState; }
    public void setConfidenceState(String confidenceState) { this.confidenceState = confidenceState; }

    public List<Evidence> getEvidence() { return evidence; }
    public void setEvidence(List<Evidence> evidence) { this.evidence = evidence; }

    public List<String> getLimitations() { return limitations; }
    public void setLimitations(List<String> limitations) { this.limitations = limitations; }

    public List<TraceEvent> getTrace() { return trace; }
    public void setTrace(List<TraceEvent> trace) { this.trace = trace; }

    public TraceRecord getTraceRecord() { return traceRecord; }
    public void setTraceRecord(TraceRecord traceRecord) { this.traceRecord = traceRecord; }
}
