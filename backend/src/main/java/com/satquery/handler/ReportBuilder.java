package com.satquery.handler;

import com.satquery.model.TaskResult;
import java.io.File;
import java.io.FileWriter;

public class ReportBuilder {

    public static void buildPdf(TaskResult result, String filePath) {
        System.out.println("[ReportBuilder] PDF generation is disabled in minimal dependency mode.");
        // Write a simple text file placeholder so that the file exists and downstream tasks don't fail
        try (FileWriter writer = new FileWriter(new File(filePath))) {
            writer.write("SatQuery AI Analysis Report (Minimal JSON Receipt mode active)\n");
            writer.write("Query ID: " + result.getQueryId() + "\n");
            writer.write("Task Type: " + result.getTaskType() + "\n");
            writer.write("Status: " + result.getStatus() + "\n");
            writer.write("Answer: " + result.getAnswer() + "\n");
        } catch (Exception e) {
            System.err.println("Failed to write mock report file: " + e.getMessage());
        }
    }
}

