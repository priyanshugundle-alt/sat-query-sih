package com.satquery.client;

import com.satquery.model.Evidence;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import com.satquery.handler.ImageProcessor;
import java.util.ArrayList;
import java.util.List;

public class MockModelClient implements ModelClient {

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        String answer = "";
        List<Evidence> evidence = new ArrayList<>();
        List<String> limitations = new ArrayList<>();

        switch (taskType) {
            case VQA:
                String queryLower = request.getQueryText().toLowerCase();
                if (queryLower.contains("water") || queryLower.contains("river") || queryLower.contains("lake") || queryLower.contains("reservoir")) {
                    answer = "The uploaded satellite image shows a large dark water channel/reservoir running from the northwest to the southeast, bordered by low-reflectance soil. There is no sign of surface vegetation blockage.";
                } else if (queryLower.contains("built") || queryLower.contains("urban") || queryLower.contains("house") || queryLower.contains("building") || queryLower.contains("road") || queryLower.contains("sprawl")) {
                    answer = "The image features high-density built-up residential sectors with grid-pattern urban planning. Hard surface roads and concrete roofs are prominent, showing clear boundary lines.";
                } else if (queryLower.contains("forest") || queryLower.contains("vegetation") || queryLower.contains("crop") || queryLower.contains("agriculture") || queryLower.contains("field") || queryLower.contains("tree")) {
                    answer = "The scene contains agricultural crop fields in different growth stages and dense forest canopy sectors, showing strong NIR reflectance signatures in multispectral bands.";
                } else {
                    answer = "The uploaded satellite image primarily features a high-density urban residential area, flanked by a water reservoir channel and sparse agricultural fields on the eastern periphery.";
                }
                
                evidence.add(new Evidence("IMAGE", images.get(0).getFilePath(), "Source Image Highlight", "Core input used for visual question answering."));
                limitations.add("VQA responses are based on visible spectrum properties. Fine-grained crop types could not be resolved.");
                break;

            case GROUNDING:
                String bboxPath = "outputs/" + request.getQueryId() + "-bbox.png";
                boolean bboxOk = ImageProcessor.generateBoundingBoxMap(
                        images.get(0).getFilePath(), 
                        request.getQueryText(), 
                        bboxPath
                );
                
                if (bboxOk) {
                    evidence.add(new Evidence("BOUNDING_BOX", "/" + bboxPath, "Detected Target Bounding Box", "Box overlay covering the localized feature pixels."));
                } else {
                    evidence.add(new Evidence("BOUNDING_BOX", images.get(0).getFilePath(), "Target Grounding Fallback", "Using original image since processing failed."));
                }
                
                answer = "Target localized successfully. Bounding box coordinates drawn around detected feature regions.";
                limitations.add("Grounding coordinates are estimated. Sub-pixel classification errors might exist around boundaries.");
                break;

            case CHANGE_ANALYSIS:
                String changePath = "outputs/" + request.getQueryId() + "-change.png";
                boolean changeOk = false;
                if (images.size() >= 2) {
                    changeOk = ImageProcessor.generateChangeMap(
                            images.get(0).getFilePath(), 
                            images.get(1).getFilePath(), 
                            changePath
                    );
                }
                
                if (changeOk) {
                    evidence.add(new Evidence("CHANGE_MAP", "/" + changePath, "Spatiotemporal Change Map", "Heatmap highlighting absolute pixel differences between the two temporal dates in red."));
                } else {
                    evidence.add(new Evidence("CHANGE_MAP", images.get(0).getFilePath(), "Temporal Diff Fallback", "Comparison completed (fallback mode active)."));
                }
                
                answer = "Comparative analysis between temporal dates completed. Pixel-level change detection highlights active shifts (colored in red) covering approximately 14.5% of the scene.";
                limitations.add("The exact boundaries of changes should be visually verified to discard minor shadow artifacts.");
                break;

            case FUSION_ANALYSIS:
                String fusedPath = "outputs/" + request.getQueryId() + "-fusion.png";
                boolean fusedOk = false;
                if (images.size() >= 2) {
                    fusedOk = ImageProcessor.generateFusionMap(
                            images.get(0).getFilePath(), 
                            images.get(1).getFilePath(), 
                            fusedPath
                    );
                }
                
                if (fusedOk) {
                    evidence.add(new Evidence("SENSOR_BRANCH", "/" + fusedPath, "Fused Optical-SAR Composition", "Alpha-blended composite overlaying SAR structural backscatter onto optical colors."));
                } else {
                    evidence.add(new Evidence("SENSOR_BRANCH", images.get(0).getFilePath(), "Optical Reference Image", "Active optical observation."));
                    evidence.add(new Evidence("SENSOR_BRANCH", images.get(1).getFilePath(), "SAR Reference Image", "Active SAR observation."));
                }
                
                answer = "Cross-modal sensor fusion completed. Optical imagery successfully identified high-density road structures, while SAR backscatter resolved building geometries, penetrating cloud cover on the southern edge.";
                limitations.add("SAR backscatter is sensitive to radar tilt angles. Double bounce effects may cause minor false positives in dense building clusters.");
                break;
        }

        return new ModelResponse(answer, evidence, limitations);
    }
}
