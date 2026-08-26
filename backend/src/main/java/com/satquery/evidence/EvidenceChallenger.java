package com.satquery.evidence;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class EvidenceChallenger {

    public String challengeEvidence(QueryRequest request, List<ImageAsset> images) {
        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                if ("OPTICAL".equalsIgnoreCase(img.getMetadata().getModality())) hasOptical = true;
                if ("SAR".equalsIgnoreCase(img.getMetadata().getModality())) hasSar = true;
            }
            if (hasOptical && hasSar) {
                return "Challenge: Optical clouds or shadow borders might misalign with radar water signals.";
            }
            return "Challenge: Crop seasonal phenology changes can mimic structural urban sprawl expansion.";
        }
        return "Challenge: Cloud cover percentage and shadow angles could lead to sub-pixel interpretation errors.";
    }
}
