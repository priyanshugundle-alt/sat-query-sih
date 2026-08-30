package com.satquery.client;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class MockModelClient implements ModelClient {

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        throw new UnsupportedOperationException(
            "MockModelClient has been completely removed/disabled. " +
            "The real self-hosted SatQuery Qwen2-VL Engine on port 5000 must be running."
        );
    }
}
