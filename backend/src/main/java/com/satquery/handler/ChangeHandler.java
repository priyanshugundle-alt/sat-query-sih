package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.ChangeStrategy;
import java.util.List;

public class ChangeHandler implements SatelliteTask {
    private final ChangeStrategy strategy;

    public ChangeHandler() {
        this.strategy = new ChangeStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.CHANGE_ANALYSIS;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
