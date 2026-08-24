package com.satquery.handler;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.satquery.model.Evidence;
import com.satquery.model.TaskResult;
import com.satquery.model.TraceEvent;
import java.io.File;
import java.io.FileOutputStream;

public class ReportBuilder {

    public static void buildPdf(TaskResult result, String filePath) {
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, new FileOutputStream(new File(filePath)));
            document.open();
            
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            
            document.add(new Paragraph("SatQuery AI Analysis Report", titleFont));
            document.add(new Paragraph("--------------------------------------------------------------------------------------------------", normalFont));
            document.add(new Paragraph("Query ID: " + result.getQueryId(), normalFont));
            document.add(new Paragraph("Task Type: " + result.getTaskType(), normalFont));
            document.add(new Paragraph("Status: " + result.getStatus(), normalFont));
            document.add(new Paragraph("Confidence: " + result.getConfidenceState(), normalFont));
            document.add(new Paragraph("\n"));
            
            document.add(new Paragraph("Analysis Answer:", sectionFont));
            document.add(new Paragraph(result.getAnswer(), normalFont));
            document.add(new Paragraph("\n"));
            
            if (result.getEvidence() != null && !result.getEvidence().isEmpty()) {
                document.add(new Paragraph("Visual & Technical Evidence:", sectionFont));
                for (Evidence ev : result.getEvidence()) {
                    document.add(new Paragraph("- [" + ev.getEvidenceType() + "] " + ev.getLabel() + ": " + ev.getDescription(), normalFont));
                    document.add(new Paragraph("  Reference File Path: " + ev.getFilePath(), smallFont));
                }
                document.add(new Paragraph("\n"));
            }
            
            if (result.getLimitations() != null && !result.getLimitations().isEmpty()) {
                document.add(new Paragraph("Limitations & Caveats:", sectionFont));
                for (String lim : result.getLimitations()) {
                    document.add(new Paragraph("- " + lim, normalFont));
                }
                document.add(new Paragraph("\n"));
            }
            
            if (result.getTrace() != null && !result.getTrace().isEmpty()) {
                document.add(new Paragraph("Reproducible Execution Trace:", sectionFont));
                for (TraceEvent tr : result.getTrace()) {
                    document.add(new Paragraph("[" + tr.getTimestamp() + "] [" + tr.getEventName() + "] Tool: " + tr.getToolName() + " | Details: " + tr.getDetail() + " | Status: " + tr.getStatus(), smallFont));
                }
            }
            
        } catch (Exception e) {
            System.err.println("Failed to write PDF report: " + e.getMessage());
        } finally {
            document.close();
        }
    }
}
