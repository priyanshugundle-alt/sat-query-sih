package com.satquery.registry;

import java.util.ArrayList;
import java.util.List;

public class ToolValidationResult {
    private boolean valid;
    private List<String> errors;

    public ToolValidationResult() {
        this.valid = true;
        this.errors = new ArrayList<>();
    }

    public ToolValidationResult(boolean valid, List<String> errors) {
        this.valid = valid;
        this.errors = errors;
    }

    public void addError(String error) {
        this.valid = false;
        this.errors.add(error);
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
