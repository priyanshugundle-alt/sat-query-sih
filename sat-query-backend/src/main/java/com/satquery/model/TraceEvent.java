package com.satquery.model;

public class TraceEvent {
    private String eventName;
    private String detail;
    private String toolName;
    private String timestamp;
    private String status;

    public TraceEvent() {}

    public TraceEvent(String eventName, String detail, String toolName, String timestamp, String status) {
        this.eventName = eventName;
        this.detail = detail;
        this.toolName = toolName;
        this.timestamp = timestamp;
        this.status = status;
    }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
