package com.satquery.model;

public class InvestigatorReport {
    private String hypothesis;
    private String supportingEvidence;
    private String challengingEvidence;
    private String verdict;
    private String nextBestEvidence;

    public InvestigatorReport() {}

    public InvestigatorReport(String hypothesis, String supportingEvidence, String challengingEvidence, 
                              String verdict, String nextBestEvidence) {
        this.hypothesis = hypothesis;
        this.supportingEvidence = supportingEvidence;
        this.challengingEvidence = challengingEvidence;
        this.verdict = verdict;
        this.nextBestEvidence = nextBestEvidence;
    }

    public String getHypothesis() { return hypothesis; }
    public void setHypothesis(String hypothesis) { this.hypothesis = hypothesis; }

    public String getSupportingEvidence() { return supportingEvidence; }
    public void setSupportingEvidence(String supportingEvidence) { this.supportingEvidence = supportingEvidence; }

    public String getChallengingEvidence() { return challengingEvidence; }
    public void setChallengingEvidence(String challengingEvidence) { this.challengingEvidence = challengingEvidence; }

    public String getVerdict() { return verdict; }
    public void setVerdict(String verdict) { this.verdict = verdict; }

    public String getNextBestEvidence() { return nextBestEvidence; }
    public void setNextBestEvidence(String nextBestEvidence) { this.nextBestEvidence = nextBestEvidence; }
}
