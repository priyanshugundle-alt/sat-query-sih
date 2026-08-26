package com.satquery.strategy;

public class ChangeExplanationGenerator {

    public static String generate(String location, String direction, String date1, String date2, 
                                  String category, String confidence, String limitation) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bi-temporal change analysis successfully compiled.\n");
        sb.append("- Location: ").append(location).append("\n");
        sb.append("- Change Category: ").append(category).append("\n");
        sb.append("- Observation Period: Between ").append(date1).append(" and ").append(date2).append("\n");
        sb.append("- Observed Change Direction: ").append(direction).append("\n");
        sb.append("- Measured Confidence: ").append(confidence).append("\n");
        sb.append("- Processing Limitations: ").append(limitation).append("\n\n");
        
        sb.append("Detailed Narrative: Comparing the satellite imagery acquired on ").append(date1)
          .append(" with the acquisition on ").append(date2)
          .append(", the target region of ").append(location)
          .append(" showed that ").append(category.toLowerCase())
          .append(" has ").append(direction.toLowerCase())
          .append(". This assessment is backed by localized spatiotemporal difference mapping.");
        
        return sb.toString();
    }
}
