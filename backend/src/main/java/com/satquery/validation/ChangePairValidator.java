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
}
