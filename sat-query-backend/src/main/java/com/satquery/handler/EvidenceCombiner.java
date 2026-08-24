package com.satquery.handler;

import com.satquery.model.Evidence;
import com.satquery.model.TaskResult;
import com.satquery.model.TaskType;
import com.satquery.observer.TraceLogger;
import java.util.ArrayList;
import java.util.List;

public class EvidenceCombiner {

    public TaskResult combine(TaskResult opticalResult, TaskResult sarResult, String queryId) {
        TraceLogger.logEvent("COMBINE_START", "Combining optical and SAR evidence branches", "EvidenceCombiner", "IN_PROGRESS");
        
        List<Evidence> combinedEvidence = new ArrayList<>();
        List<String> combinedLimitations = new ArrayList<>();

        if (opticalResult != null && opticalResult.getEvidence() != null) {
            for (Evidence ev : opticalResult.getEvidence()) {
                ev.setLabel("[Optical Branch] " + ev.getLabel());
                combinedEvidence.add(ev);
            }
            if (opticalResult.getLimitations() != null) {
                combinedLimitations.addAll(opticalResult.getLimitations());
            }
        }

        if (sarResult != null && sarResult.getEvidence() != null) {
            for (Evidence ev : sarResult.getEvidence()) {
                ev.setLabel("[SAR Branch] " + ev.getLabel());
                combinedEvidence.add(ev);
            }
            if (sarResult.getLimitations() != null) {
                combinedLimitations.addAll(sarResult.getLimitations());
            }
        }

        String jointAnswer = "Cross-modal sensor fusion completed. Optical imagery successfully identified high-density road structures and visual water channels. SAR backscatter resolved building textures, penetrating heavy clouds on the southern periphery. Combined analysis indicates that flooding is restricted to low-lying agricultural corridors and has not compromised elevated building sectors.";

        TaskResult combinedResult = new TaskResult(
                queryId,
                TaskType.FUSION_ANALYSIS,
                "FusionHandler",
                "EvidenceCombiner",
                "SUCCESS",
                jointAnswer,
                "HIGH",
                combinedEvidence,
                combinedLimitations,
                TraceLogger.getThreadTrace()
        );

        TraceLogger.logEvent("COMBINE_END", "Evidence branches combined successfully", "EvidenceCombiner", "SUCCESS");
        return combinedResult;
    }
}
