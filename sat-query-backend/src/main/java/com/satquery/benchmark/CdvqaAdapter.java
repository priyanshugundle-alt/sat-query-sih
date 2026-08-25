package com.satquery.benchmark;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class CdvqaAdapter {

    public List<BenchmarkSample> getSamples(boolean evaluationMode) {
        List<BenchmarkSample> samples = new ArrayList<>();

        if (evaluationMode) {
            File datasetFile = new File("sample-data/cdvqa_test.json");
            if (datasetFile.exists()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    List<BenchmarkSample> parsed = mapper.readValue(datasetFile, 
                            new com.fasterxml.jackson.core.type.TypeReference<List<BenchmarkSample>>() {});
                    if (parsed != null) {
                        samples.addAll(parsed);
                    }
                    System.out.println("CDVQA: Loaded " + samples.size() + " samples from " + datasetFile.getPath());
                } catch (Exception e) {
                    System.err.println("CDVQA parsing error: " + e.getMessage());
                }
            } else {
                throw new IllegalStateException("EVALUATION_ERROR: CDVQA test split file not found at " + datasetFile.getPath());
            }
        } else {
            // Development Mode mock samples
            samples.add(new BenchmarkSample(
                    "cdvqa-01",
                    List.of("uploads/cdvqa_t1.png", "uploads/cdvqa_t2.png"),
                    new BenchmarkQuestion("q-cdvqa-01", "What changed between these two dates, and where did the change occur?", "CHANGE_VQA"),
                    new ExpectedAnswer("Built-up sprawl increased near the eastern periphery.", null, "outputs/change-cdvqa-01.png")
            ));
        }

        return samples;
    }
}
