package com.satquery.client;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class JavaLocalModelClient implements ModelClient {

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        throw new UnsupportedOperationException(
            "JavaLocalModelClient has been disabled. Real SatQuery Qwen2-VL Model Server on port 5000 is strictly required."
        );
    }
}
