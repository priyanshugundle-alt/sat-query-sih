package com.satquery.registry;

public class ParameterRule {
    private String parameterName;
    private String type; // INT, DOUBLE, STRING, BOOLEAN
    private Object minVal;
    private Object maxVal;

    public ParameterRule() {}

    public ParameterRule(String parameterName, String type, Object minVal, Object maxVal) {
        this.parameterName = parameterName;
        this.type = type;
        this.minVal = minVal;
        this.maxVal = maxVal;
    }

    public boolean validate(Object value) {
        if (value == null) return false;
        try {
            switch (type.toUpperCase()) {
                case "INT":
                    int valInt = Integer.parseInt(value.toString());
                    if (minVal != null && valInt < Integer.parseInt(minVal.toString())) return false;
                    if (maxVal != null && valInt > Integer.parseInt(maxVal.toString())) return false;
                    return true;
                case "DOUBLE":
                    double valDouble = Double.parseDouble(value.toString());
                    if (minVal != null && valDouble < Double.parseDouble(minVal.toString())) return false;
                    if (maxVal != null && valDouble > Double.parseDouble(maxVal.toString())) return false;
                    return true;
                case "BOOLEAN":
                    return "true".equalsIgnoreCase(value.toString()) || "false".equalsIgnoreCase(value.toString());
                case "STRING":
                    int len = value.toString().length();
                    if (minVal != null && len < Integer.parseInt(minVal.toString())) return false;
                    if (maxVal != null && len > Integer.parseInt(maxVal.toString())) return false;
                    return true;
            }
        } catch (Exception e) {
            return false;
        }
        return false;
    }

    public String getParameterName() { return parameterName; }
    public void setParameterName(String parameterName) { this.parameterName = parameterName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
