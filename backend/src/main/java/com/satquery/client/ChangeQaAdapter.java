package com.satquery.client;

import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskType;
import java.util.List;

public class ChangeQaAdapter implements ModelClient {
    private final ModelClient delegate;

    public ChangeQaAdapter(ModelClient delegate) {
        this.delegate = delegate;
    }

    @Override
    public ModelResponse run(TaskType taskType, QueryRequest request, List<ImageAsset> images) {
        return delegate.run(taskType, request, images);
    }
}
