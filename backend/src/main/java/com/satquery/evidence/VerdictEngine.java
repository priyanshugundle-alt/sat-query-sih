package com.satquery.evidence;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class VerdictEngine {

    public String determineVerdict(QueryRequest request, List<ImageAsset> images, String status) {
        if (!"SUCCESS".equalsIgnoreCase(status)) {
            return "INCONCLUSIVE";
        }
        
        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                if ("OPTICAL".equalsIgnoreCase(img.getMetadata().getModality())) hasOptical = true;
                if ("SAR".equalsIgnoreCase(img.getMetadata().getModality())) hasSar = true;
            }
            if (hasOptical && hasSar) {
                return "STRONGLY_SUPPORTED"; // Joint sensor confirmation
            }
            return "PARTIALLY_SUPPORTED"; // Single sensor temporal comparison
        }
        
        return "STRONGLY_SUPPORTED";
    }
}
