package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.GroundingStrategy;
import java.util.List;

public class GroundingHandler implements SatelliteTask {
    private final GroundingStrategy strategy;

    public GroundingHandler() {
        this.strategy = new GroundingStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.GROUNDING;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
