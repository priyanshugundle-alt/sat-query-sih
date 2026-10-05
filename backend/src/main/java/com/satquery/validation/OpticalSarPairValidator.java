package com.satquery.validation;

import com.satquery.model.ImageAsset;
import java.util.List;

public class OpticalSarPairValidator {

    public void validate(List<ImageAsset> images, List<String> errors) {
        if (images == null || images.size() != 2) {
            errors.add("Optical–SAR analysis requires two images.");
            return;
        }

        String mod1 = images.get(0).getMetadata().getModality();
        String mod2 = images.get(1).getMetadata().getModality();

        boolean hasOptical = "OPTICAL".equalsIgnoreCase(mod1) || "MULTISPECTRAL".equalsIgnoreCase(mod1) ||
                             "OPTICAL".equalsIgnoreCase(mod2) || "MULTISPECTRAL".equalsIgnoreCase(mod2);
        boolean hasSar = "SAR".equalsIgnoreCase(mod1) || "SAR".equalsIgnoreCase(mod2);

        if (!hasOptical || !hasSar) {
            errors.add("Optical–SAR analysis requires one optical/multispectral image and one SAR image.");
        }
    }
}
