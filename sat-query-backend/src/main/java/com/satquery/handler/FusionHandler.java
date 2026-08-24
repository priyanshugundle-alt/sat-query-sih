package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.FusionStrategy;
import java.util.List;

public class FusionHandler implements SatelliteTask {
    private final FusionStrategy strategy;

    public FusionHandler() {
        this.strategy = new FusionStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.FUSION_ANALYSIS;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
