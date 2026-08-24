package com.satquery.validation;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import com.satquery.model.ValidationResult;
import java.util.ArrayList;
import java.util.List;

public class InputValidator {

    public ValidationResult validate(QueryRequest request, List<ImageAsset> images, TaskType taskType) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (images == null || images.isEmpty()) {
            errors.add("At least one image must be supplied.");
            return new ValidationResult(false, errors, warnings);
        }

        // Check for unsupported formats
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

        switch (taskType) {
            case VQA:
            case GROUNDING:
                if (images.size() != 1) {
                    errors.add("Only one image is allowed for " + taskType + ".");
                }
                break;

            case CHANGE_ANALYSIS:
                if (images.size() != 2) {
                    errors.add("Two images are required for change analysis.");
                } else {
                    ImageAsset img1 = images.get(0);
                    ImageAsset img2 = images.get(1);

                    String date1 = img1.getMetadata().getAcquisitionDate();
                    String date2 = img2.getMetadata().getAcquisitionDate();

                    if (date1 == null || date2 == null) {
                        errors.add("Acquisition dates are missing. Change analysis requires acquisition dates.");
                    } else if (date1.equals(date2)) {
                        errors.add("Change analysis requires different acquisition dates.");
                    }

                    if (!img1.getMetadata().isGeoreferenced() || !img2.getMetadata().isGeoreferenced()) {
                        errors.add("Location unavailable because the image has no georeferencing metadata.");
                    }
                }
                break;

            case FUSION_ANALYSIS:
                if (images.size() != 2) {
                    errors.add("Optical–SAR analysis requires two images.");
                } else {
                    String mod1 = images.get(0).getMetadata().getModality();
                    String mod2 = images.get(1).getMetadata().getModality();

                    boolean hasOptical = "OPTICAL".equalsIgnoreCase(mod1) || "OPTICAL".equalsIgnoreCase(mod2);
                    boolean hasSar = "SAR".equalsIgnoreCase(mod1) || "SAR".equalsIgnoreCase(mod2);

                    if (!hasOptical || !hasSar) {
                        errors.add("Optical–SAR analysis requires one optical image and one SAR image.");
                    }
                }
                break;
        }

        return new ValidationResult(errors.isEmpty(), errors, warnings);
    }
}
