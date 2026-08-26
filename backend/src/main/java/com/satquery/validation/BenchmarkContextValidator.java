package com.satquery.validation;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class BenchmarkContextValidator {

    public void validate(QueryRequest request, List<ImageAsset> images, List<String> errors, List<String> warnings) {
        boolean hasBenchmarkContext = request.getDatasetContext() != null;
        
        for (ImageAsset img : images) {
            String format = img.getMetadata().getFormat();
            boolean isTiff = "TIFF".equalsIgnoreCase(format) || "GEOTIFF".equalsIgnoreCase(format);
            boolean isPngJpg = "PNG".equalsIgnoreCase(format) || "JPEG".equalsIgnoreCase(format) || "JPG".equalsIgnoreCase(format);
            
            if (isPngJpg) {
                if (hasBenchmarkContext) {
                    warnings.add("Image " + img.getFileName() + " format is accepted solely under benchmark context (" + request.getDatasetContext().getDataset() + ").");
                } else {
                    errors.add("Format " + format + " is unsupported for normal satellite queries. PNG/JPEG is allowed only under approved benchmark contexts.");
                }
            } else if (!isTiff) {
                errors.add("Unsupported format '" + format + "'. Use GeoTIFF/TIFF or an approved benchmark image.");
            }
        }
    }
}
