package com.satquery.validation;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import com.satquery.model.ValidationResult;
import java.util.ArrayList;
import java.util.List;

public class InputValidator {
    private final GeoValidityGate geoGate = new GeoValidityGate();
    private final SingleImageValidator singleValidator = new SingleImageValidator();
    private final ChangePairValidator changeValidator = new ChangePairValidator();
    private final OpticalSarPairValidator fusionValidator = new OpticalSarPairValidator();
    private final BenchmarkContextValidator formatValidator = new BenchmarkContextValidator();
    private final QueryRepairPlanner repairPlanner = new QueryRepairPlanner();

    public ValidationResult validate(QueryRequest request, List<ImageAsset> images, TaskType taskType) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (images == null || images.isEmpty()) {
            errors.add("At least one image must be supplied.");
            return new ValidationResult(false, errors, warnings, "Upload a satellite image to begin.");
        }

        // 1. Format and Benchmark Context checks
        formatValidator.validate(request, images, errors, warnings);

        // 2. Modality & Task specific checks
        switch (taskType) {
            case VQA:
            case GROUNDING:
                singleValidator.validate(images, taskType, errors);
                break;

            case CHANGE_ANALYSIS:
                changeValidator.validate(images, errors);
                if (errors.isEmpty()) {
                    geoGate.checkCrsMatch(images, errors);
                    geoGate.checkBoundsOverlap(images, errors);
                }
                break;

            case FUSION_ANALYSIS:
                fusionValidator.validate(images, errors);
                if (errors.isEmpty()) {
                    geoGate.checkCrsMatch(images, errors);
                    geoGate.checkBoundsOverlap(images, errors);
                }
                break;
        }

        // 3. Generate Repair Guidance if errors are present
        String repairGuidance = null;
        if (!errors.isEmpty()) {
            repairGuidance = repairPlanner.generateRepairGuidance(request, images, taskType, errors);
        }

        return new ValidationResult(errors.isEmpty(), errors, warnings, repairGuidance);
    }
}

