package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.VqaStrategy;
import java.util.List;

public class VqaHandler implements SatelliteTask {
    private final VqaStrategy strategy;

    public VqaHandler() {
        this.strategy = new VqaStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.VQA;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
