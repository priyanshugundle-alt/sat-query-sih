package com.satquery.routing;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class WorkflowPlan {
    private String intent;
    private List<String> requiredModalities;
    private boolean requiresTemporalPair;
    private String requestedEvidence;
    private Map<String, Object> parameters;

    public WorkflowPlan() {}

    public WorkflowPlan(String intent, List<String> requiredModalities, boolean requiresTemporalPair, 
                        String requestedEvidence, Map<String, Object> parameters) {
        this.intent = intent;
        this.requiredModalities = requiredModalities;
        this.requiresTemporalPair = requiresTemporalPair;
        this.requestedEvidence = requestedEvidence;
        this.parameters = parameters;
    }

    public String getIntent() { return intent; }
    public void setIntent(String intent) { this.intent = intent; }

    public List<String> getRequiredModalities() { return requiredModalities; }
    public void setRequiredModalities(List<String> requiredModalities) { this.requiredModalities = requiredModalities; }

    @JsonProperty("requiresTemporalPair")
    public boolean isRequiresTemporalPair() { return requiresTemporalPair; }
    public void setRequiresTemporalPair(boolean requiresTemporalPair) { this.requiresTemporalPair = requiresTemporalPair; }

    public String getRequestedEvidence() { return requestedEvidence; }
    public void setRequestedEvidence(String requestedEvidence) { this.requestedEvidence = requestedEvidence; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
}
