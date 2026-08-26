package com.satquery.benchmark;

public class ExpectedAnswer {
    private String answerText;
    private String boundingBox;
    private String changeMapPath;

    public ExpectedAnswer() {}

    public ExpectedAnswer(String answerText, String boundingBox, String changeMapPath) {
        this.answerText = answerText;
        this.boundingBox = boundingBox;
        this.changeMapPath = changeMapPath;
    }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }

    public String getBoundingBox() { return boundingBox; }
    public void setBoundingBox(String boundingBox) { this.boundingBox = boundingBox; }

    public String getChangeMapPath() { return changeMapPath; }
    public void setChangeMapPath(String changeMapPath) { this.changeMapPath = changeMapPath; }
}
