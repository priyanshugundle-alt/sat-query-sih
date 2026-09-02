package com.satquery.validation;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import java.util.List;

public class BenchmarkContextValidator {

    public void validate(QueryRequest request, List<ImageAsset> images, List<String> errors, List<String> warnings) {
        for (ImageAsset img : images) {
            String format = img.getMetadata().getFormat();
            boolean isTiff = "TIFF".equalsIgnoreCase(format) || "GEOTIFF".equalsIgnoreCase(format);
            boolean isPngJpg = "PNG".equalsIgnoreCase(format) || "JPEG".equalsIgnoreCase(format) || "JPG".equalsIgnoreCase(format);
            
            if (isPngJpg) {
                warnings.add("Image " + img.getFileName() + " format (" + format + ") accepted via multi-spectral raster reader.");
            } else if (!isTiff) {
                warnings.add("Non-standard format '" + format + "' processed via multi-band RGB fallback reader.");
            }



        }
    }
}
