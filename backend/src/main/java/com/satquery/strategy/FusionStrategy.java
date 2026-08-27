package com.satquery.strategy;

import com.satquery.client.ModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.model.ImageAsset;
import com.satquery.model.QueryRequest;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.List;

public class FusionStrategy implements TaskStrategy {

    @Override
    public TaskResult execute(QueryRequest request, List<ImageAsset> images, ModelClient modelClient) {
        TraceLogger.logEvent("STRATEGY_START", "Executing Optical-SAR Sensor Fusion Strategy", "FusionStrategy", "IN_PROGRESS");
        try {
            TraceLogger.logEvent("MODEL_CALL", "Calling remote-sensing engine for Optical-SAR Fusion", "ModelClient", "IN_PROGRESS");
            modelClient.run(TaskType.FUSION_ANALYSIS, request, images);
            TraceLogger.logEvent("MODEL_RESPONSE", "Received Sensor Fusion response", "ModelClient", "SUCCESS");

            // Simulate dual-branch inputs to feed into the EvidenceCombiner
            com.satquery.model.Evidence optEv = new com.satquery.model.Evidence("IMAGE", (images.size() > 0) ? images.get(0).getFilePath() : "", "Optical Roads Highlight", "Extracted road networks from visible bands.");
            com.satquery.model.Evidence sarEv = new com.satquery.model.Evidence("IMAGE", (images.size() > 1) ? images.get(1).getFilePath() : "", "SAR Backscatter Intensity", "High backscatter textures showing building geometries.");

            TaskResult optRes = new TaskResult();
            optRes.setEvidence(List.of(optEv));
            optRes.setLimitations(List.of("Optical analysis obscured by cloud cover on the southern edge."));

            TaskResult sarRes = new TaskResult();
            sarRes.setEvidence(List.of(sarEv));
            sarRes.setLimitations(List.of("Radar look angle causes double-bounce anomalies in dense structures."));

            com.satquery.handler.EvidenceCombiner combiner = new com.satquery.handler.EvidenceCombiner();
            TaskResult result = combiner.combine(optRes, sarRes, request.getQueryId());
            result.setModelName(modelClient.getClass().getSimpleName());

            TraceLogger.logEvent("STRATEGY_END", "Optical-SAR Fusion complete", "FusionStrategy", "SUCCESS");
            result.setTrace(TraceLogger.getThreadTrace());
            return result;
        } catch (Exception e) {
            TraceLogger.logEvent("STRATEGY_FAILED", "Fusion analysis failed: " + e.getMessage(), "FusionStrategy", "FAILED");
            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(TaskType.FUSION_ANALYSIS);
            failedResult.setStatus("FAILED");
            failedResult.setAnswer("Error: " + e.getMessage());
            failedResult.setTrace(TraceLogger.getThreadTrace());
            return failedResult;
        }
    }
}
