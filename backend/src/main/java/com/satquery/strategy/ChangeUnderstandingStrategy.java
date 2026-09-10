package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.List;

public class ChangeUnderstandingStrategy implements TaskStrategy {

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        TraceLogger.logEvent("STRATEGY_START", "Executing Change Understanding Strategy", "ChangeUnderstandingStrategy", "IN_PROGRESS");
        try {
            ModelResponse response = modelClient.run(TaskType.CHANGE_UNDERSTANDING, request, images);
            
            TaskResult result = new TaskResult(
                    request.getQueryId(),
                    TaskType.CHANGE_UNDERSTANDING,
                    "ChangeUnderstandingHandler",
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
            failedResult.setTaskType(TaskType.CHANGE_UNDERSTANDING);
            failedResult.setStatus("FAILED");
            failedResult.setAnswer("Error: " + e.getMessage());
            failedResult.setTrace(TraceLogger.getThreadTrace());
            return failedResult;
        }
    }
}
