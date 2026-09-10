package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.ChangeUnderstandingStrategy;
import java.util.List;

public class ChangeUnderstandingHandler implements SatelliteTask {
    private final ChangeUnderstandingStrategy strategy;

    public ChangeUnderstandingHandler() {
        this.strategy = new ChangeUnderstandingStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.CHANGE_UNDERSTANDING;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
