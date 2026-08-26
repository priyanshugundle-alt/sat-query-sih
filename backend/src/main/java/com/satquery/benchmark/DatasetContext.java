package com.satquery.benchmark;

public class DatasetContext {
    private BenchmarkDataset dataset;
    private boolean evaluationMode; // true = EVALUATION (real datasets), false = DEVELOPMENT (mocks)

    public DatasetContext() {}

    public DatasetContext(BenchmarkDataset dataset, boolean evaluationMode) {
        this.dataset = dataset;
        this.evaluationMode = evaluationMode;
    }

    public BenchmarkDataset getDataset() { return dataset; }
    public void setDataset(BenchmarkDataset dataset) { this.dataset = dataset; }

    public boolean isEvaluationMode() { return evaluationMode; }
    public void setEvaluationMode(boolean evaluationMode) { this.evaluationMode = evaluationMode; }
}
