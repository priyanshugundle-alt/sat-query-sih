package com.satquery.client;

import com.satquery.model.Evidence;
import java.util.List;

public class ModelResponse {
    private String answer;
    private List<Evidence> evidence;
    private List<String> limitations;

    public ModelResponse() {}

    public ModelResponse(String answer, List<Evidence> evidence, List<String> limitations) {
        this.answer = answer;
        this.evidence = evidence;
        this.limitations = limitations;
    }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public List<Evidence> getEvidence() { return evidence; }
    public void setEvidence(List<Evidence> evidence) { this.evidence = evidence; }

    public List<String> getLimitations() { return limitations; }
    public void setLimitations(List<String> limitations) { this.limitations = limitations; }
}
