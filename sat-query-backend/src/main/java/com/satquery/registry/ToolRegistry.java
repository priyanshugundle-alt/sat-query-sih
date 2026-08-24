package com.satquery.registry;

import com.satquery.model.ImageAsset;
import java.util.*;

public class ToolRegistry {
    private static final Map<String, ToolDefinition> registry = new HashMap<>();

    static {
        // 1. VQA_TOOL definition
        registry.put("VQA_TOOL", new ToolDefinition(
                "VQA_TOOL",
                "Single-image visual question answering",
                List.of("OPTICAL", "MULTISPECTRAL", "SAR", "UNKNOWN"),
                List.of("TIFF", "GEOTIFF", "PNG", "JPEG"),
                1,
                List.of(
                        new ParameterRule("maxQueryLength", "INT", 1, 200),
                        new ParameterRule("modelId", "STRING", 1, 50)
                )
        ));

        // 2. GROUNDING_TOOL definition
        registry.put("GROUNDING_TOOL", new ToolDefinition(
                "GROUNDING_TOOL",
                "Text-guided visual region grounding / object localization",
                List.of("OPTICAL", "MULTISPECTRAL", "SAR", "UNKNOWN"),
                List.of("TIFF", "GEOTIFF", "PNG", "JPEG"),
                1,
                List.of(new ParameterRule("outputMode", "STRING", 3, 20)) // e.g. "bbox", "mask", "polygon"
        ));

        // 3. CHANGE_TOOL definition
        registry.put("CHANGE_TOOL", new ToolDefinition(
                "CHANGE_TOOL",
                "Bi-temporal change detection and analysis",
                List.of("OPTICAL", "MULTISPECTRAL", "SAR", "UNKNOWN"),
                List.of("TIFF", "GEOTIFF", "PNG", "JPEG"),
                2,
                List.of(new ParameterRule("changeThreshold", "DOUBLE", 0.0, 1.0))
        ));

        // 4. FUSION_TOOL definition
        registry.put("FUSION_TOOL", new ToolDefinition(
                "FUSION_TOOL",
                "Cross-modal Optical-SAR joint sensor fusion reasoning",
                List.of("OPTICAL", "SAR", "MULTISPECTRAL"),
                List.of("TIFF", "GEOTIFF"),
                2,
                List.of(new ParameterRule("alignmentMode", "STRING", 2, 20))
        ));
    }

    public static ToolDefinition getTool(String name) {
        return registry.get(name);
    }

    public static ToolValidationResult validate(String toolName, List<ImageAsset> images, Map<String, Object> parameters) {
        ToolValidationResult result = new ToolValidationResult();
        ToolDefinition tool = registry.get(toolName);

        if (tool == null) {
            result.addError("Tool '" + toolName + "' is not registered in the ToolRegistry.");
            return result;
        }

        // 1. Image count validation
        if (images == null || images.size() != tool.getRequiredImageCount()) {
            result.addError(toolName + " requires exactly " + tool.getRequiredImageCount() + " image inputs, but " + 
                            (images == null ? 0 : images.size()) + " were supplied.");
        }

        // 2. Modality & Format validation
        if (images != null) {
            for (ImageAsset img : images) {
                String mod = img.getMetadata().getModality();
                if (!tool.getAcceptedModalities().contains(mod.toUpperCase())) {
                    result.addError("Image " + img.getFileName() + " has modality '" + mod + 
                                    "', which is not accepted by " + toolName + ".");
                }

                String format = img.getMetadata().getFormat();
                if (!tool.getAcceptedFormats().contains(format.toUpperCase())) {
                    result.addError("Image " + img.getFileName() + " has format '" + format + 
                                    "', which is not accepted by " + toolName + ". Expected formats: " + 
                                    tool.getAcceptedFormats());
                }
            }
        }

        // 3. Parameter checks
        if (parameters != null) {
            for (ParameterRule rule : tool.getParameterRules()) {
                Object val = parameters.get(rule.getParameterName());
                if (val != null && !rule.validate(val)) {
                    result.addError("Parameter '" + rule.getParameterName() + "' has invalid value '" + val + 
                                    "' under rules defined for " + toolName + ".");
                }
            }
        }

        return result;
    }
}
