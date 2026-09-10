package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.List;

public class ExtractionStrategy implements TaskStrategy {

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        TraceLogger.logEvent("STRATEGY_START", "Executing Information Extraction Strategy", "ExtractionStrategy", "IN_PROGRESS");
        try {
            ModelResponse response = modelClient.run(TaskType.INFORMATION_EXTRACTION, request, images);
            
            TaskResult result = new TaskResult(
                    request.getQueryId(),
                    TaskType.INFORMATION_EXTRACTION,
                    "ExtractionHandler",
                    modelClient.getClass().getSimpleName(),
                    "SUCCESS",
                    response.getAnswer(),
                    "HIGH",
                    response.getEvidence(),
                    response.getLimitations(),
                    TraceLogger.getThreadTrace()
            );
            result.setTrace(TraceLogger.getThreadTrace());
            return result;
        } catch (Exception e) {
            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(TaskType.INFORMATION_EXTRACTION);
            failedResult.setStatus("FAILED");
            failedResult.setAnswer("Error: " + e.getMessage());
            failedResult.setTrace(TraceLogger.getThreadTrace());
            return failedResult;
        }
    }
}
