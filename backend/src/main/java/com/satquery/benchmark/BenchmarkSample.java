package com.satquery.benchmark;

import java.util.List;

public class BenchmarkSample {
    private String sampleId;
    private List<String> imagePaths;
    private BenchmarkQuestion question;
    private ExpectedAnswer expectedAnswer;

    public BenchmarkSample() {}

    public BenchmarkSample(String sampleId, List<String> imagePaths, BenchmarkQuestion question, ExpectedAnswer expectedAnswer) {
        this.sampleId = sampleId;
        this.imagePaths = imagePaths;
        this.question = question;
        this.expectedAnswer = expectedAnswer;
    }

    public String getSampleId() { return sampleId; }
    public void setSampleId(String sampleId) { this.sampleId = sampleId; }

    public List<String> getImagePaths() { return imagePaths; }
    public void setImagePaths(List<String> imagePaths) { this.imagePaths = imagePaths; }

    public BenchmarkQuestion getQuestion() { return question; }
    public void setQuestion(BenchmarkQuestion question) { this.question = question; }

    public ExpectedAnswer getExpectedAnswer() { return expectedAnswer; }
    public void setExpectedAnswer(ExpectedAnswer expectedAnswer) { this.expectedAnswer = expectedAnswer; }
}
