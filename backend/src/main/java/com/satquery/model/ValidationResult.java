package com.satquery.model;

import java.util.List;

public class ValidationResult {
    private boolean valid;
    private List<String> errors;
    private List<String> warnings;
    private String repairGuidance;

    public ValidationResult() {}

    public ValidationResult(boolean valid, List<String> errors, List<String> warnings) {
        this.valid = valid;
        this.errors = errors;
        this.warnings = warnings;
    }

    public ValidationResult(boolean valid, List<String> errors, List<String> warnings, String repairGuidance) {
        this.valid = valid;
        this.errors = errors;
        this.warnings = warnings;
        this.repairGuidance = repairGuidance;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public String getRepairGuidance() { return repairGuidance; }
    public void setRepairGuidance(String repairGuidance) { this.repairGuidance = repairGuidance; }
}

