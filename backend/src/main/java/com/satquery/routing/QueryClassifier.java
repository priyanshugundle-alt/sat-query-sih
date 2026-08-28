package com.satquery.routing;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class QueryClassifier {

    public TaskType classify(QueryRequest request, List<ImageAsset> images) {
        String text = request.getQueryText() != null ? request.getQueryText().toLowerCase() : "";

        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                String mod = img.getMetadata().getModality();
                if ("OPTICAL".equalsIgnoreCase(mod)) hasOptical = true;
                if ("SAR".equalsIgnoreCase(mod)) hasSar = true;
            }
            
            if (hasOptical && hasSar && (text.contains("both") || text.contains("sar") || text.contains("together") || text.contains("fusion"))) {
                return TaskType.FUSION_ANALYSIS;
            }
            return TaskType.CHANGE_ANALYSIS;
        }

        if (text.contains("where") || text.contains("highlight") || text.contains("locate")) {
            return TaskType.GROUNDING;
        }

        return TaskType.VQA;
    }
}
