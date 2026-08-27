package com.satquery.controller;

import com.satquery.client.ModelClient;
import com.satquery.handler.HandlerFactory;
import com.satquery.handler.SatelliteTask;
import com.satquery.model.*;
import com.satquery.observer.TraceLogger;
import com.satquery.validation.InputValidator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class AgentController {
    private final InputValidator validator;
    private final HandlerFactory factory;
    private final ModelClient modelClient;

    public AgentController(ModelClient modelClient) {
        this.validator = new InputValidator();
        this.factory = new HandlerFactory();
        this.modelClient = modelClient;
    }

    public TaskResult processQuery(QueryRequest request, List<ImageAsset> images) {
        long startTime = System.currentTimeMillis();
        TraceLogger.clearThreadTrace();
        TraceLogger.logEvent("REQUEST_RECEIVED", "Query ID: " + request.getQueryId() + " received.", "AgentController", "SUCCESS");

        // 1. Task classification
        TaskType taskType = classifyTask(request, images);
        TraceLogger.logEvent("TASK_CLASSIFIED", "Task classified as: " + taskType, "AgentController", "SUCCESS");

        // 2. Input validation
        ValidationResult validationResult = validator.validate(request, images, taskType);
        if (!validationResult.isValid()) {
            String errorMsg = String.join("; ", validationResult.getErrors());
            TraceLogger.logEvent("INPUT_VALIDATION_FAILED", errorMsg, "InputValidator", "FAILED");
            
            long latencyMs = System.currentTimeMillis() - startTime;
            
            // Build trace audit record
            List<String> files = new ArrayList<>();
            List<String> modalities = new ArrayList<>();
            for (ImageAsset img : images) {
                files.add(img.getFileName());
                modalities.add(img.getMetadata().getModality());
            }

            TraceRecord audit = new TraceRecord(
                    request.getQueryText(),
                    files,
                    modalities,
                    taskType.toString(),
                    List.of("InputValidator"),
                    new HashMap<>(),
                    "validation_failed",
                    null,
                    List.of(errorMsg),
                    latencyMs
            );

            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(taskType);
            failedResult.setStatus("VALIDATION_FAILED");
            failedResult.setMode("REAL_MODE");
            failedResult.setReportUrl("/api/report/" + failedResult.getQueryId());
            failedResult.setEvidenceSummary("No dynamic features extracted.");
            
            String answerText = "Validation Error: " + errorMsg;
            if (validationResult.getRepairGuidance() != null) {
                answerText += ". Repair Guidance: " + validationResult.getRepairGuidance();
            }
            failedResult.setAnswer(answerText);
            failedResult.setTrace(TraceLogger.getThreadTrace());
            failedResult.setTraceRecord(audit);
            return failedResult;

        }
        TraceLogger.logEvent("INPUT_VALIDATED", "All validation checks passed.", "InputValidator", "SUCCESS");

        // 3. Handler instantiation
        SatelliteTask taskHandler = factory.create(taskType);
        TraceLogger.logEvent("HANDLER_SELECTED", "Selected handler: " + taskHandler.getClass().getSimpleName(), "AgentController", "SUCCESS");

        // 3b. Registry Tool & Parameter validation
        String toolName = switch (taskType) {
            case VQA -> "VQA_TOOL";
            case GROUNDING -> "GROUNDING_TOOL";
            case CHANGE_ANALYSIS -> "CHANGE_TOOL";
            case FUSION_ANALYSIS -> "FUSION_TOOL";
        };

        com.satquery.registry.ToolValidationResult toolValidation = com.satquery.registry.ToolRegistry.validate(
                toolName, 
                images, 
                request.getParameters()
        );

        if (!toolValidation.isValid()) {
            String errorMsg = "Registry Check Failed: " + String.join("; ", toolValidation.getErrors());
            TraceLogger.logEvent("TOOL_VALIDATION_FAILED", errorMsg, "ToolRegistry", "FAILED");
            
            long latencyMs = System.currentTimeMillis() - startTime;
            
            List<String> files = new ArrayList<>();
            List<String> modalities = new ArrayList<>();
            for (ImageAsset img : images) {
                files.add(img.getFileName());
                modalities.add(img.getMetadata().getModality());
            }

            TraceRecord audit = new TraceRecord(
                    request.getQueryText(),
                    files,
                    modalities,
                    taskType.toString(),
                    List.of("ToolRegistry"),
                    request.getParameters() != null ? request.getParameters() : new HashMap<>(),
                    "registry_failed",
                    null,
                    toolValidation.getErrors(),
                    latencyMs
            );

            TaskResult failedResult = new TaskResult();
            failedResult.setQueryId(request.getQueryId());
            failedResult.setTaskType(taskType);
            failedResult.setStatus("TOOL_VALIDATION_FAILED");
            failedResult.setMode("REAL_MODE");
            failedResult.setReportUrl("/api/report/" + failedResult.getQueryId());
            failedResult.setEvidenceSummary("No dynamic features extracted.");
            failedResult.setAnswer("Tool Validation Error: " + errorMsg);
            failedResult.setTrace(TraceLogger.getThreadTrace());
            failedResult.setTraceRecord(audit);
            return failedResult;
        }
        TraceLogger.logEvent("TOOL_VALIDATED", "Tool rules and parameters verified.", "ToolRegistry", "SUCCESS");

        // 4. Execution
        TaskResult result;
        try {
            result = taskHandler.execute(request, images, modelClient);
        } catch (Exception e) {
            TraceLogger.logEvent("EXECUTION_FAILED", e.getMessage(), taskHandler.getClass().getSimpleName(), "FAILED");
            result = new TaskResult();
            result.setQueryId(request.getQueryId());
            result.setTaskType(taskType);
            result.setStatus("FAILED");
            result.setAnswer("Execution Error: " + e.getMessage());
        }

        long latencyMs = System.currentTimeMillis() - startTime;

        // Build trace audit record
        List<String> files = new ArrayList<>();
        List<String> modalities = new ArrayList<>();
        for (ImageAsset img : images) {
            files.add(img.getFileName());
            modalities.add(img.getMetadata().getModality());
        }

        TraceRecord audit = new TraceRecord(
                request.getQueryText(),
                files,
                modalities,
                taskType.toString(),
                List.of(taskHandler.getClass().getSimpleName(), toolName, modelClient.getClass().getSimpleName()),
                request.getParameters() != null ? request.getParameters() : new HashMap<>(),
                result.getStatus().toLowerCase(),
                result.getConfidenceState(),
                result.getLimitations() != null ? result.getLimitations() : new ArrayList<>(),
                latencyMs
        );
        result.setTraceRecord(audit);
        result.setTrace(TraceLogger.getThreadTrace());

        // 5. Populate Investigator Report
        if ("SUCCESS".equalsIgnoreCase(result.getStatus())) {
            com.satquery.evidence.HypothesisBuilder hypBuilder = new com.satquery.evidence.HypothesisBuilder();
            com.satquery.evidence.EvidencePlanner planner = new com.satquery.evidence.EvidencePlanner();
            com.satquery.evidence.EvidenceChallenger challenger = new com.satquery.evidence.EvidenceChallenger();
            com.satquery.evidence.VerdictEngine verdictEngine = new com.satquery.evidence.VerdictEngine();
            com.satquery.evidence.NextBestEvidenceAdvisor advisor = new com.satquery.evidence.NextBestEvidenceAdvisor();

            String hypothesis = hypBuilder.buildHypothesis(request, images);
            String plan = planner.planEvidenceChecks(request, images);
            String challenge = challenger.challengeEvidence(request, images);
            String verdict = verdictEngine.determineVerdict(request, images, result.getStatus());
            String nextEvidence = advisor.adviseNextBestEvidence(request, images, verdict);

            InvestigatorReport report = new InvestigatorReport(hypothesis, plan, challenge, verdict, nextEvidence);
            result.setInvestigatorReport(report);
        }

        result.setMode("REAL_MODE");
        result.setReportUrl("/api/report/" + result.getQueryId());
        if (result.getEvidence() != null && !result.getEvidence().isEmpty()) {
            result.setEvidenceSummary(result.getEvidence().get(0).getDescription());
        } else {
            result.setEvidenceSummary("No dynamic features extracted.");
        }

        return result;

    }

    public TaskType classifyTask(QueryRequest request, List<ImageAsset> images) {
        String text = request.getQueryText() != null ? request.getQueryText().toLowerCase() : "";

        if (images.size() == 2) {
            boolean hasOptical = false;
            boolean hasSar = false;
            for (ImageAsset img : images) {
                String mod = img.getMetadata().getModality();
                if ("OPTICAL".equalsIgnoreCase(mod)) hasOptical = true;
                if ("SAR".equalsIgnoreCase(mod)) hasSar = true;
            }
            
            if (hasOptical && hasSar && (text.contains("both") || text.contains("sar") || text.contains("together") || text.contains("fusion"))) {
                return TaskType.FUSION_ANALYSIS;
            }
            return TaskType.CHANGE_ANALYSIS;
        }

        if (text.contains("where") || text.contains("highlight") || text.contains("locate")) {
            return TaskType.GROUNDING;
        }

        return TaskType.VQA;
    }
}
