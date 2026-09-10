package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.ExtractionStrategy;
import java.util.List;

public class ExtractionHandler implements SatelliteTask {
    private final ExtractionStrategy strategy;

    public ExtractionHandler() {
        this.strategy = new ExtractionStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.INFORMATION_EXTRACTION;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
