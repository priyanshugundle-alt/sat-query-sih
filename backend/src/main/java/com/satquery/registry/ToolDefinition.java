package com.satquery.registry;

import java.util.List;

public class ToolDefinition {
    private String toolName;
    private String purpose;
    private List<String> acceptedModalities;
    private List<String> acceptedFormats;
    private int requiredImageCount;
    private List<ParameterRule> parameterRules;

    public ToolDefinition() {}

    public ToolDefinition(String toolName, String purpose, List<String> acceptedModalities, 
                          List<String> acceptedFormats, int requiredImageCount, 
                          List<ParameterRule> parameterRules) {
        this.toolName = toolName;
        this.purpose = purpose;
        this.acceptedModalities = acceptedModalities;
        this.acceptedFormats = acceptedFormats;
        this.requiredImageCount = requiredImageCount;
        this.parameterRules = parameterRules;
    }

    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public List<String> getAcceptedModalities() { return acceptedModalities; }
    public void setAcceptedModalities(List<String> acceptedModalities) { this.acceptedModalities = acceptedModalities; }

    public List<String> getAcceptedFormats() { return acceptedFormats; }
    public void setAcceptedFormats(List<String> acceptedFormats) { this.acceptedFormats = acceptedFormats; }

    public int getRequiredImageCount() { return requiredImageCount; }
    public void setRequiredImageCount(int requiredImageCount) { this.requiredImageCount = requiredImageCount; }

    public List<ParameterRule> getParameterRules() { return parameterRules; }
    public void setParameterRules(List<ParameterRule> parameterRules) { this.parameterRules = parameterRules; }
}
