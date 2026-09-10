package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.List;

public class CaptioningStrategy implements TaskStrategy {

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        TraceLogger.logEvent("STRATEGY_START", "Executing Captioning Strategy", "CaptioningStrategy", "IN_PROGRESS");
        try {
            ModelResponse response = modelClient.run(TaskType.CAPTIONING, request, images);
            
            TaskResult result = new TaskResult(
                    request.getQueryId(),
                    TaskType.CAPTIONING,
                    "CaptioningHandler",
                    modelClient.getClass().getSimpleName(),
                    "SUCCESS",
                    response.getAnswer(),
                    "HIGH",
                    response.getEvidence(),
                    response.getLimitations(),
                    TraceLogger.getThreadTrace()
            );
            TraceLogger.logEvent("STRATEGY_END", "Captioning complete", "CaptioningStrategy", "SUCCESS");
            result.setTrace(TraceLogger.getThreadTrace());
            return result;
        } catch (Exception e) {
            TraceLogger.logEvent("STRATEGY_FAILED", "Captioning failed: " + e.getMessage(), "CaptioningStrategy", "FAILED");
            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(TaskType.CAPTIONING);
            failedResult.setStatus("FAILED");
            failedResult.setAnswer("Error: " + e.getMessage());
            failedResult.setTrace(TraceLogger.getThreadTrace());
            return failedResult;
        }
    }
}
