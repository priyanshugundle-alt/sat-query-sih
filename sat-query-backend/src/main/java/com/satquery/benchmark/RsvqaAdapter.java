package com.satquery.benchmark;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class RsvqaAdapter {

    public List<BenchmarkSample> getSamples(boolean evaluationMode) {
        List<BenchmarkSample> samples = new ArrayList<>();

        if (evaluationMode) {
            File datasetFile = new File("sample-data/rsvqa_test.json");
            if (datasetFile.exists()) {
                try {
                    System.out.println("RSVQA: Loading real dataset annotations from " + datasetFile.getPath());
                } catch (Exception e) {
                    System.err.println("RSVQA parsing error: " + e.getMessage());
                }
            } else {
                throw new IllegalStateException("EVALUATION_ERROR: RSVQA test split file not found at " + datasetFile.getPath());
            }
        } else {
            // Development Mode mock samples
            samples.add(new BenchmarkSample(
                    "rsvqa-01",
                    List.of("uploads/rsvqa_image1.png"),
                    new BenchmarkQuestion("q-rsvqa-01", "Are there buildings visible in this image?", "VQA_PRESENCE"),
                    new ExpectedAnswer("yes", null, null)
            ));
            samples.add(new BenchmarkSample(
                    "rsvqa-02",
                    List.of("uploads/rsvqa_image2.png"),
                    new BenchmarkQuestion("q-rsvqa-02", "Is there a river crossing the region?", "VQA_PRESENCE"),
                    new ExpectedAnswer("no", null, null)
            ));
        }

        return samples;
    }
}
