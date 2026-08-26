package com.satquery.handler;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import java.util.List;

public interface SatelliteTask {
    TaskType getTaskType();
    TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient);
}
