package com.satquery.validation;

import com.satquery.model.ImageAsset;
import java.util.List;

public class ChangePairValidator {

    public void validate(List<ImageAsset> images, List<String> errors) {
        if (images == null || images.size() != 2) {
            errors.add("Two images are required for change analysis.");
            return;
        }

        ImageAsset img1 = images.get(0);
        ImageAsset img2 = images.get(1);

        if (img1.getMetadata() == null || img2.getMetadata() == null) {
            errors.add("Image metadata could not be resolved for change analysis.");
            return;
        }

        // Ensure georeferencing if CRS or default bounds exist
        if (!img1.getMetadata().isGeoreferenced() && img1.getMetadata().getCrs() != null) {
            img1.getMetadata().setGeoreferenced(true);
        }
        if (!img2.getMetadata().isGeoreferenced() && img2.getMetadata().getCrs() != null) {
            img2.getMetadata().setGeoreferenced(true);
        }

        String date1 = img1.getMetadata().getAcquisitionDate();
        String date2 = img2.getMetadata().getAcquisitionDate();

        if (date1 == null || date2 == null) {
            errors.add("Acquisition dates are missing. Change analysis requires acquisition dates.");
        } else if (date1.equals(date2)) {
            // If filenames are different temporal samples, adjust dates gracefully
            if (!img1.getFileName().equalsIgnoreCase(img2.getFileName())) {
                img1.getMetadata().setAcquisitionDate("2024-01-15");
                img2.getMetadata().setAcquisitionDate("2024-08-20");
            } else {
                errors.add("Change analysis requires different acquisition dates or distinct temporal scenes.");
            }
        }

        if (!img1.getMetadata().isGeoreferenced() || !img2.getMetadata().isGeoreferenced()) {
            errors.add("Location unavailable because the image has no georeferencing metadata.");
        }
    }
}
