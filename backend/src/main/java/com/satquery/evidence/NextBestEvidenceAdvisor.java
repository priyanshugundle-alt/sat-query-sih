package com.satquery.evidence;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class NextBestEvidenceAdvisor {

    public String adviseNextBestEvidence(QueryRequest request, List<ImageAsset> images, String verdict) {
        if ("STRONGLY_SUPPORTED".equals(verdict)) {
            return "No additional evidence needed. Analysis is fully backed by multi-modal inputs.";
        }
        
        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                if ("OPTICAL".equalsIgnoreCase(img.getMetadata().getModality())) hasOptical = true;
                if ("SAR".equalsIgnoreCase(img.getMetadata().getModality())) hasSar = true;
            }
            if (hasOptical && !hasSar) {
                return "Upload a co-registered Sentinel-1 SAR image to confirm soil moisture or water bounds beneath canopy.";
            }
        } else if (images.size() == 1) {
            return "Upload a secondary co-registered temporal image from a different date to verify change trends.";
        }
        
        return "Review high-resolution imagery or ground-truth points if available.";
    }
}
