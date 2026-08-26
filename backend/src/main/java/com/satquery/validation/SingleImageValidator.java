package com.satquery.validation;

import com.satquery.model.ImageAsset;
import com.satquery.model.TaskType;
import java.util.List;

public class SingleImageValidator {

    public void validate(List<ImageAsset> images, TaskType taskType, List<String> errors) {
        if (images == null || images.size() != 1) {
            errors.add("Only one image is allowed for " + taskType + ".");
        }
    }
}
