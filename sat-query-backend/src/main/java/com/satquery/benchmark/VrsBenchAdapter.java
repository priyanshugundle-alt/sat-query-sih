package com.satquery.benchmark;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

public class VrsBenchAdapter {

    public List<BenchmarkSample> getSamples(boolean evaluationMode) {
        List<BenchmarkSample> samples = new ArrayList<>();

        if (evaluationMode) {
            File datasetFile = new File("sample-data/vrsbench_test.json");
            if (datasetFile.exists()) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    List<BenchmarkSample> parsed = mapper.readValue(datasetFile, 
                            new com.fasterxml.jackson.core.type.TypeReference<List<BenchmarkSample>>() {});
                    if (parsed != null) {
                        samples.addAll(parsed);
                    }
                    System.out.println("VRSBench: Loaded " + samples.size() + " samples from " + datasetFile.getPath());
                } catch (Exception e) {
                    System.err.println("VRSBench parsing error: " + e.getMessage());
                }
            } else {
                throw new IllegalStateException("EVALUATION_ERROR: VRSBench test split file not found at " + datasetFile.getPath());
            }
        } else {
            // Development Mode mock samples
            samples.add(new BenchmarkSample(
                    "vrs-01",
                    List.of("uploads/vrs_image1.png"),
                    new BenchmarkQuestion("q-vrs-01", "Describe the land-cover and major objects visible in this image.", "CAPTION"),
                    new ExpectedAnswer("The image shows a dense urban sector adjacent to a harbor dock with multiple container cranes.", null, null)
            ));
            samples.add(new BenchmarkSample(
                    "vrs-02",
                    List.of("uploads/vrs_image2.png"),
                    new BenchmarkQuestion("q-vrs-02", "Highlight the water body referred to in the query.", "GROUNDING"),
                    new ExpectedAnswer("Water body successfully highlighted.", "[50, 120, 200, 400]", null)
            ));
        }

        return samples;
    }
}
