package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.List;

public class GroundingStrategy implements TaskStrategy {

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        TraceLogger.logEvent("STRATEGY_START", "Executing Grounding Strategy", "GroundingStrategy", "IN_PROGRESS");
        try {
            TraceLogger.logEvent("MODEL_CALL", "Calling remote-sensing engine for Grounding", "ModelClient", "IN_PROGRESS");
            ModelResponse response = modelClient.run(TaskType.GROUNDING, request, images);
            TraceLogger.logEvent("MODEL_RESPONSE", "Received Grounding response", "ModelClient", "SUCCESS");

            TaskResult result = new TaskResult(
                    request.getQueryId(),
                    TaskType.GROUNDING,
                    "GroundingHandler",
                    modelClient.getClass().getSimpleName(),
                    "SUCCESS",
                    response.getAnswer(),
                    "HIGH",
                    response.getEvidence(),
                    response.getLimitations(),
                    TraceLogger.getThreadTrace()
            );
            TraceLogger.logEvent("STRATEGY_END", "Grounding analysis complete", "GroundingStrategy", "SUCCESS");
            result.setTrace(TraceLogger.getThreadTrace());
            return result;
        } catch (Exception e) {
            TraceLogger.logEvent("STRATEGY_FAILED", "Grounding analysis failed: " + e.getMessage(), "GroundingStrategy", "FAILED");
            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(TaskType.GROUNDING);
            failedResult.setStatus("FAILED");
            failedResult.setAnswer("Error: " + e.getMessage());
            failedResult.setTrace(TraceLogger.getThreadTrace());
            return failedResult;
        }
    }
}
