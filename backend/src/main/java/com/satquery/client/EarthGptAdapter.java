package com.satquery.client;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class EarthGptAdapter implements ModelClient {
    private final ModelClient delegate;

    public EarthGptAdapter(ModelClient delegate) {
        this.delegate = delegate;
    }

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        return delegate.run(taskType, request, images);
    }
}
