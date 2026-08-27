package com.satquery.handler;

import com.satquery.model.TaskResult;
import com.satquery.model.TraceEvent;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import java.io.File;

public class ReportBuilder {

    public static void buildPdf(TaskResult result, String filePath) {
        System.out.println("[ReportBuilder] Generating PDF report via Apache PDFBox: " + filePath);
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Main Header Title
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 22);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText("SatQuery AI - Geospatial Query Report");
                contentStream.endText();

                // Sub-header metadata
                contentStream.beginText();
                contentStream.setFont(PDType1Font.COURIER_BOLD, 10);
                contentStream.newLineAtOffset(50, 715);
                contentStream.showText("QUERY ID: " + sanitize(result.getQueryId()));
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("TASK ROUTE: " + sanitize(String.valueOf(result.getTaskType())));
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("HANDLER: " + sanitize(result.getHandlerName()));
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("STATUS: " + sanitize(result.getStatus()));
                contentStream.endText();

                // Separator line
                contentStream.setLineWidth(1f);
                contentStream.moveTo(50, 650);
                contentStream.lineTo(550, 650);
                contentStream.stroke();

                // User Query Section
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.newLineAtOffset(50, 620);
                contentStream.showText("Analysis Output Result:");
                contentStream.endText();

                // Render answer text wrapped or simplified (clean line chunks)
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(50, 600);
                String qText = sanitize(result.getAnswer());
                if (qText != null && qText.length() > 80) {
                    contentStream.showText(qText.substring(0, 80));
                    contentStream.newLineAtOffset(0, -15);
                    if (qText.length() > 160) {
                        contentStream.showText(qText.substring(80, 160) + "...");
                    } else {
                        contentStream.showText(qText.substring(80));
                    }
                } else if (qText != null) {
                    contentStream.showText(qText);
                } else {
                    contentStream.showText("N/A");
                }
                contentStream.endText();

                // Model Analysis Results
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.newLineAtOffset(50, 545);
                contentStream.showText("Confidence & Evidence:");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.newLineAtOffset(50, 525);
                contentStream.showText("Confidence State: " + sanitize(result.getConfidenceState()));
                contentStream.newLineAtOffset(0, -15);
                contentStream.showText("Evidence Summary: " + sanitize(result.getEvidenceSummary()));
                contentStream.endText();

                // Limitations Section
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.newLineAtOffset(50, 475);
                contentStream.showText("Raster Limitations:");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 10);
                contentStream.newLineAtOffset(50, 455);
                if (result.getLimitations() != null && !result.getLimitations().isEmpty()) {
                    for (String lim : result.getLimitations()) {
                        String cleanLim = sanitize(lim);
                        if (cleanLim.length() > 80) cleanLim = cleanLim.substring(0, 80) + "...";
                        contentStream.showText("- " + cleanLim);
                        contentStream.newLineAtOffset(0, -15);
                    }
                } else {
                    contentStream.showText("No limitations recorded.");
                }
                contentStream.endText();

                // Separator
                contentStream.moveTo(50, 395);
                contentStream.lineTo(550, 395);
                contentStream.stroke();

                // Execution Trace Section
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.newLineAtOffset(50, 365);
                contentStream.showText("Execution Trace Timeline:");
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(PDType1Font.COURIER, 8);
                contentStream.newLineAtOffset(50, 345);
                if (result.getTrace() != null && !result.getTrace().isEmpty()) {
                    int linesPrinted = 0;
                    for (TraceEvent step : result.getTrace()) {
                        if (linesPrinted >= 8) break;
                        String stepText = String.format("[%s] %s -> %s", 
                            sanitize(step.getStatus()), sanitize(step.getEventName()), sanitize(step.getDetail())
                        );
                        if (stepText.length() > 95) stepText = stepText.substring(0, 95) + "...";
                        contentStream.showText(stepText);
                        contentStream.newLineAtOffset(0, -12);
                        linesPrinted++;
                    }
                } else {
                    contentStream.showText("No trace logs recorded.");
                }
                contentStream.endText();

                // Footer stamp
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 8);
                contentStream.newLineAtOffset(50, 50);
                contentStream.showText("This report is generated dynamically by SatQuery AI using Apache PDFBox. Verified by JVM Strategy Engine.");
                contentStream.endText();
            }

            File parentDir = new File(filePath).getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
            document.save(new File(filePath));
        } catch (Exception e) {
            System.err.println("Failed to write PDF report: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static String sanitize(String text) {
        if (text == null) return "";
        return text.replace("“", "\"")
                   .replace("”", "\"")
                   .replace("‘", "'")
                   .replace("’", "'")
                   .replace("•", "-")
                   .replace("—", "-")
                   .replaceAll("[^\\x20-\\x7E]", "?");
    }
}
