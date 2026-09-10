package com.satquery.strategy;

import com.satquery.client.ModelClient;
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
            com.satquery.client.ModelResponse response = modelClient.run(TaskType.FUSION_ANALYSIS, request, images);
            TraceLogger.logEvent("MODEL_RESPONSE", "Received Sensor Fusion response", "ModelClient", "SUCCESS");

            // Build dual-branch evidence inputs for EvidenceCombiner
            com.satquery.model.Evidence optEv = new com.satquery.model.Evidence("IMAGE", (images.size() > 0) ? images.get(0).getFilePath() : "", "Optical Reflectance Branch", "Extracted spectral reflectance & land cover from multispectral bands.");
            com.satquery.model.Evidence sarEv = new com.satquery.model.Evidence("IMAGE", (images.size() > 1) ? images.get(1).getFilePath() : "", "SAR Backscatter Branch", "High microwave backscatter textures resolving building geometries and penetration through clouds.");

            TaskResult optRes = new TaskResult();
            optRes.setEvidence(List.of(optEv));
            optRes.setLimitations(List.of("Optical reflectance band analysis evaluated."));

            TaskResult sarRes = new TaskResult();
            sarRes.setEvidence(List.of(sarEv));
            sarRes.setLimitations(List.of("SAR C-band microwave backscatter intensity evaluated."));

            com.satquery.handler.EvidenceCombiner combiner = new com.satquery.handler.EvidenceCombiner();
            TaskResult result = combiner.combine(optRes, sarRes, request.getQueryId());
            result.setModelName(modelClient.getClass().getSimpleName());

            if (response != null) {
                if (response.getAnswer() != null && !response.getAnswer().isEmpty()) {
                    result.setAnswer(response.getAnswer());
                }
                if (response.getEvidence() != null && !response.getEvidence().isEmpty()) {
                    List<com.satquery.model.Evidence> combinedEv = new java.util.ArrayList<>(result.getEvidence() != null ? result.getEvidence() : List.of());
                    combinedEv.addAll(response.getEvidence());
                    result.setEvidence(combinedEv);
                }
                if (response.getLimitations() != null && !response.getLimitations().isEmpty()) {
                    List<String> combinedLim = new java.util.ArrayList<>(result.getLimitations() != null ? result.getLimitations() : List.of());
                    combinedLim.addAll(response.getLimitations());
                    result.setLimitations(combinedLim);
                }
            }

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
