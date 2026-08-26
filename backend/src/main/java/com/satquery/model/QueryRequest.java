package com.satquery.model;

import java.util.List;
import java.util.Map;

public class QueryRequest {
    private String queryId;
    private String queryText;
    private List<String> imageIds;
    private String timestamp;
    private com.satquery.benchmark.DatasetContext datasetContext;
    private Map<String, Object> parameters;

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

    public List<String> getImageIds() { return imageIds; }
    public void setImageIds(List<String> imageIds) { this.imageIds = imageIds; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public com.satquery.benchmark.DatasetContext getDatasetContext() { return datasetContext; }
    public void setDatasetContext(com.satquery.benchmark.DatasetContext datasetContext) { this.datasetContext = datasetContext; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
}
