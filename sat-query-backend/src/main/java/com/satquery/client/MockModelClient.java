package com.satquery.client;

import com.satquery.model.Evidence;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
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
                answer = "The uploaded satellite image primarily features a high-density urban residential area, flanked by a water reservoir channel and sparse agricultural fields on the eastern periphery.";
                evidence.add(new Evidence("IMAGE", images.get(0).getFilePath(), "Source Image Highlight", "Core input used for visual question answering."));
                limitations.add("VQA responses are based on visible spectrum properties. Fine-grained crop types could not be resolved.");
                break;
            case GROUNDING:
                answer = "Water body successfully detected and localized. Coordinates highlighted in bounding box overlays.";
                evidence.add(new Evidence("BOUNDING_BOX", "/outputs/" + request.getQueryId() + "-bbox.png", "Detected Water Body Bounding Box", "Box overlay covering the water channel pixels."));
                limitations.add("Grounding coordinates are estimated. Sub-pixel classification errors might exist around boundaries.");
                break;
            case CHANGE_ANALYSIS:
                answer = "Comparative analysis between dates detects a 14.5% increase in built-up area. Urban sprawl expanded towards the eastern agricultural land.";
                evidence.add(new Evidence("CHANGE_MAP", "/outputs/" + request.getQueryId() + "-change.png", "Spatiotemporal Change Map", "Heatmap indicating positive urban expansion."));
                limitations.add("The exact boundaries of changes should be visually verified to discard minor shadow artifacts.");
                break;
            case FUSION_ANALYSIS:
                answer = "Cross-modal sensor fusion completed. Optical imagery identified urban roads, while SAR backscatter resolved dense building textures, penetrating cloud cover on the southern edge.";
                evidence.add(new Evidence("SENSOR_BRANCH", "/outputs/" + request.getQueryId() + "-optical-edge.png", "Optical Edge Map", "Structural edges extracted from visible band."));
                evidence.add(new Evidence("SENSOR_BRANCH", "/outputs/" + request.getQueryId() + "-sar-backscatter.png", "SAR Backscatter Intensity", "High backscatter values showing building coordinates."));
                limitations.add("SAR backscatter is sensitive to radar tilt angles. Double bounce effects may cause minor false positives in dense building clusters.");
                break;
        }

        return new ModelResponse(answer, evidence, limitations);
    }
}
