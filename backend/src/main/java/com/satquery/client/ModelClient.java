package com.satquery.client;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public interface ModelClient {
    ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images);
}
