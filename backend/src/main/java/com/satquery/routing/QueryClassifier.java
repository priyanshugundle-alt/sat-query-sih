package com.satquery.routing;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class QueryClassifier {

    public TaskType classify(QueryRequest request, List<ImageAsset> images) {
        if (request != null && request.getRequestedTask() != null && !request.getRequestedTask().isBlank()) {
            try {
                return TaskType.valueOf(request.getRequestedTask().toUpperCase());
            } catch (Exception ignored) {}
        }

        String text = (request != null && request.getQueryText() != null) ? request.getQueryText().toLowerCase() : "";

        if (images != null && images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                String mod = (img.getMetadata() != null) ? img.getMetadata().getModality() : "OPTICAL";
                if ("OPTICAL".equalsIgnoreCase(mod) || "MULTISPECTRAL".equalsIgnoreCase(mod)) hasOptical = true;
                if ("SAR".equalsIgnoreCase(mod)) hasSar = true;
            }
            
            if (hasOptical && hasSar && (text.contains("both") || text.contains("sar") || text.contains("together") || text.contains("fusion"))) {
                return TaskType.FUSION_ANALYSIS;
            }
            return TaskType.CHANGE_ANALYSIS;
        }

        boolean hasGroundingAction = text.contains("where") || text.contains("highlight") || text.contains("locate") 
            || text.contains("box") || text.contains("bounding") || text.contains("mark") 
            || text.contains("marking") || text.contains("detect") || text.contains("segment") 
            || text.contains("delineat") || text.contains("pinpoint") || text.contains("outline")
            || text.contains("show where") || text.contains("point out") || text.contains("find");

        if (hasGroundingAction || (text.contains("land type") && (text.contains("mark") || text.contains("show") || text.contains("detect")))) {
            return TaskType.GROUNDING;
        }

        if (text.contains("caption") || text.contains("describe") || text.contains("overview") || text.contains("summary")) {
            return TaskType.CAPTIONING;
        }

        return TaskType.VQA;
    }
}
