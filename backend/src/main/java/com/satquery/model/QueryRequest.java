package com.satquery.model;

import java.util.List;
import java.util.Map;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class QueryRequest {
    private String queryId;
    private String queryText;
    private List<String> imageIds;
    private String timestamp;
    private com.satquery.benchmark.DatasetContext datasetContext;
    private Map<String, Object> parameters;
    private String requestedTask;
    private List<Map<String, Object>> frontendAssets;

    public QueryRequest() {}

    public QueryRequest(String queryId, String queryText, List<String> imageIds, String timestamp) {
        this.queryId = queryId;
        this.queryText = queryText;
        this.imageIds = imageIds;
        this.timestamp = timestamp;
    }

    public String getQueryId() { return queryId; }
    public void setQueryId(String queryId) { this.queryId = queryId; }

    public String getQueryText() { return queryText; }
    public void setQueryText(String queryText) { this.queryText = queryText; }

    // Support 'question' and 'query' alias from frontend
    public String getQuestion() { return queryText; }
    public void setQuestion(String question) { this.queryText = question; }

    public String getQuery() { return queryText; }
    public void setQuery(String query) { this.queryText = query; }

    public List<String> getImageIds() { return imageIds; }
    public void setImageIds(List<String> imageIds) { this.imageIds = imageIds; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public com.satquery.benchmark.DatasetContext getDatasetContext() { return datasetContext; }
    
    public void setDatasetContext(com.satquery.benchmark.DatasetContext datasetContext) { 
        this.datasetContext = datasetContext; 
    }

    // Support string-based datasetContext from React frontend
    public void setDatasetContext(String datasetStr) {
        try {
            com.satquery.benchmark.BenchmarkDataset db = com.satquery.benchmark.BenchmarkDataset.valueOf(datasetStr.toUpperCase());
            this.datasetContext = new com.satquery.benchmark.DatasetContext(db, false);
        } catch (Exception e) {
            this.datasetContext = new com.satquery.benchmark.DatasetContext(com.satquery.benchmark.BenchmarkDataset.NORMAL_SATELLITE, false);
        }
    }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }

    public String getRequestedTask() { return requestedTask; }
    public void setRequestedTask(String requestedTask) { this.requestedTask = requestedTask; }

    public List<Map<String, Object>> getFrontendAssets() { return frontendAssets; }
    public void setFrontendAssets(List<Map<String, Object>> frontendAssets) { this.frontendAssets = frontendAssets; }
}
