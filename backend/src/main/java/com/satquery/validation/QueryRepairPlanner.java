package com.satquery.validation;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class QueryRepairPlanner {

    public String generateRepairGuidance(QueryRequest request, List<ImageAsset> images, TaskType taskType, List<String> errors) {
        if (errors == null || errors.isEmpty()) return null;

        for (String err : errors) {
            if (err.contains("Two images are required for change analysis") || err.contains("Acquisition dates are missing")) {
                return "Upload a second image of the same area from a different date.";
            }
            if (err.contains("Optical–SAR analysis requires one optical image and one SAR image")) {
                return "Upload one co-registered SAR image, or ask an optical-only question.";
            }
            if (err.contains("PNG/JPEG is allowed only under approved benchmark contexts")) {
                return "Use GeoTIFF/TIFF for normal analysis, or choose an approved benchmark context.";
            }
            if (err.contains("No real grounding tool") || err.contains("grounding")) {
                // If it's a grounding error, guide the user
                if (images != null && images.size() > 1) {
                    return "Grounding requires exactly one image. Remove the secondary image.";
                }
            }
        }
        return "Please adjust your inputs and try again.";
    }
}
