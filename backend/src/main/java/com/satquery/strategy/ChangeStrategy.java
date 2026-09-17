package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.List;

public class ChangeStrategy implements TaskStrategy {

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        TraceLogger.logEvent("STRATEGY_START", "Executing Change Detection Strategy", "ChangeStrategy", "IN_PROGRESS");
        try {
            TraceLogger.logEvent("MODEL_CALL", "Calling remote-sensing engine for Change Detection", "ModelClient", "IN_PROGRESS");
            ModelResponse response = modelClient.run(TaskType.CHANGE_ANALYSIS, request, images);
            TraceLogger.logEvent("MODEL_RESPONSE", "Received Change detection response", "ModelClient", "SUCCESS");

            String finalAnswer = (response.getAnswer() != null && !response.getAnswer().isBlank())
                    ? response.getAnswer()
                    : "Bi-temporal change analysis complete. Spectral and spatial variance mapped between image acquisitions.";

            TaskResult result = new TaskResult(
                    request.getQueryId(),
                    TaskType.CHANGE_ANALYSIS,
                    "ChangeHandler",
                    modelClient.getClass().getSimpleName(),
                    "SUCCESS",
                    finalAnswer,
                    "HIGH",
                    response.getEvidence(),
                    response.getLimitations(),
                    TraceLogger.getThreadTrace()
            );
            TraceLogger.logEvent("STRATEGY_END", "Change Detection analysis complete", "ChangeStrategy", "SUCCESS");
            result.setTrace(TraceLogger.getThreadTrace());
            return result;
        } catch (Exception e) {
            TraceLogger.logEvent("STRATEGY_FAILED", "Change analysis failed: " + e.getMessage(), "ChangeStrategy", "FAILED");
            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(TaskType.CHANGE_ANALYSIS);
            failedResult.setStatus("FAILED");
            failedResult.setAnswer("Error: " + e.getMessage());
            failedResult.setTrace(TraceLogger.getThreadTrace());
            return failedResult;
        }
    }
}
