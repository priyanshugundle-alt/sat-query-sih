package com.satquery.evidence;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class EvidencePlanner {

    public String planEvidenceChecks(QueryRequest request, List<ImageAsset> images) {
        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                if ("OPTICAL".equalsIgnoreCase(img.getMetadata().getModality())) hasOptical = true;
                if ("SAR".equalsIgnoreCase(img.getMetadata().getModality())) hasSar = true;
            }
            if (hasOptical && hasSar) {
                return "Plan: Run Sentinel-2 NDVI/NDWI indexing + Sentinel-1 Radar backscatter cross-check.";
            }
            return "Plan: Calculate pixel-level temporal difference and apply threshold limits.";
        }
        return "Plan: Direct visual question answering via adapted remote-sensing model.";
    }
}
