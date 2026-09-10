package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.strategy.CaptioningStrategy;
import java.util.List;

public class CaptioningHandler implements SatelliteTask {
    private final CaptioningStrategy strategy;

    public CaptioningHandler() {
        this.strategy = new CaptioningStrategy();
    }

    @Override
    public TaskType getTaskType() {
        return TaskType.CAPTIONING;
    }

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        return strategy.execute(request, images, modelClient);
    }
}
