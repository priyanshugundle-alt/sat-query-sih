package com.satquery.client;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class MockModelClient implements ModelClient {

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        return new ModelResponse(
            "SatQuery VLM engine analysis completed. Target features identified and mapped.",
            List.of(),
            List.of()
        );
    }
}
