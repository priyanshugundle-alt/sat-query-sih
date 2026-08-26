package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import java.util.List;

public interface TaskStrategy {
    TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient);
}
