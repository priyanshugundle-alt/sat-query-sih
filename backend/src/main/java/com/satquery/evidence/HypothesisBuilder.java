package com.satquery.evidence;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class HypothesisBuilder {

    public String buildHypothesis(QueryRequest request, List<ImageAsset> images) {
        String text = request.getQueryText().toLowerCase();
        
        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                if ("OPTICAL".equalsIgnoreCase(img.getMetadata().getModality())) hasOptical = true;
                if ("SAR".equalsIgnoreCase(img.getMetadata().getModality())) hasSar = true;
            }
            if (hasOptical && hasSar) {
                return "Hypothesis: Possible water expansion / flood detection with Optical-SAR fusion confirmation.";
            }
            return "Hypothesis: Temporal land-cover changes between " + 
                    images.get(0).getMetadata().getAcquisitionDate() + " and " + 
                    images.get(1).getMetadata().getAcquisitionDate() + ".";
        }
        
        if (text.contains("water") || text.contains("flood") || text.contains("river")) {
            return "Hypothesis: Water body area estimation and boundary isolation.";
        }
        return "Hypothesis: General land-cover classification and object presence audit.";
    }
}
