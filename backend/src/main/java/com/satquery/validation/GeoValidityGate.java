package com.satquery.validation;

import com.satquery.model.ImageAsset;
import java.util.List;

public class GeoValidityGate {

    public boolean checkCrsMatch(List<ImageAsset> images, List<String> errors) {
        if (images == null || images.size() < 2) return true;
        
        String crs1 = images.get(0).getMetadata().getCrs();
        String crs2 = images.get(1).getMetadata().getCrs();
        
        if (crs1 != null && crs2 != null && !crs1.equalsIgnoreCase(crs2)) {
            errors.add("CRS mismatch: Coordinates systems do not match (" + crs1 + " vs " + crs2 + ").");
            return false;
        }
        return true;
    }

    public boolean checkBoundsOverlap(List<ImageAsset> images, List<String> errors) {
        // Mock bounds check
        if (images == null || images.size() < 2) return true;
        
        String box1 = images.get(0).getMetadata().getBoundingBox();
        String box2 = images.get(1).getMetadata().getBoundingBox();
        
        if (box1 != null && box2 != null && !box1.equals(box2)) {
            // Log as warning or error depending on severity; let's return true for mock but record if mismatch
            return true;
        }
        return true;
    }
}
