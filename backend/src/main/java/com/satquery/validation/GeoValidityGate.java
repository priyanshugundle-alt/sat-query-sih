package com.satquery.validation;

import com.satquery.model.ImageAsset;
import java.util.List;

public class GeoValidityGate {

    private final com.satquery.gdal.GdalProcessor gdalProcessor = new com.satquery.gdal.GdalProcessor();

    public boolean checkCrsMatch(List<ImageAsset> images, List<String> errors) {
        if (images == null || images.size() < 2) return true;
        
        String crs1 = images.get(0).getMetadata().getCrs();
        String crs2 = images.get(1).getMetadata().getCrs();
        
        if (!gdalProcessor.isCrsCompatible(crs1, crs2)) {
            errors.add("CRS mismatch: Coordinate systems do not match (" + crs1 + " vs " + crs2 + ").");
            return false;
        }
        return true;
    }

    public boolean checkBoundsOverlap(List<ImageAsset> images, List<String> errors) {
        if (images == null || images.size() < 2) return true;
        
        com.satquery.gdal.GeoRasterMetadata meta1 = gdalProcessor.inspect(images.get(0));
        com.satquery.gdal.GeoRasterMetadata meta2 = gdalProcessor.inspect(images.get(1));
        
        double overlapRatio = gdalProcessor.calculateSpatialOverlapRatio(meta1, meta2);
        
        if (overlapRatio <= 0.0) {
            errors.add(String.format("Spatial bounds mismatch: Images '%s' and '%s' have 0.0%% geographic overlap.", 
                    images.get(0).getFileName(), images.get(1).getFileName()));
            return false;
        }
        return true;
    }
}
