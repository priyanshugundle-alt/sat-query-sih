package com.satquery.model;

@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class Evidence {

    private String evidenceType;  // IMAGE, BOUNDING_BOX, MASK, CHANGE_MAP, SENSOR_BRANCH
    private String filePath;
    private String label;
    private String description;

    public Evidence() {}

    public Evidence(String evidenceType, String filePath, String label, String description) {
        this.evidenceType = evidenceType;
        this.filePath = filePath;
        this.label = label;
        this.description = description;
    }

    public String getEvidenceType() { return evidenceType; }
    public void setEvidenceType(String evidenceType) { this.evidenceType = evidenceType; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
