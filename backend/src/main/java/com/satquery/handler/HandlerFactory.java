package com.satquery.handler;

import com.satquery.model.TaskType;

public class HandlerFactory {

    public SatelliteTask create(TaskType taskType) {
        if (taskType == null) {
            throw new IllegalArgumentException("Task type cannot be null");
        }
        return switch (taskType) {
            case VQA -> new VqaHandler();
            case CAPTIONING -> new CaptioningHandler();
            case GROUNDING -> new GroundingHandler();
            case CHANGE_UNDERSTANDING -> new ChangeUnderstandingHandler();
            case CHANGE_ANALYSIS -> new ChangeHandler();
            case FUSION_ANALYSIS -> new FusionHandler();
            case INFORMATION_EXTRACTION -> new ExtractionHandler();
        };
    }
}
