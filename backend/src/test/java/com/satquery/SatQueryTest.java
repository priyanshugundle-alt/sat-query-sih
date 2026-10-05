package com.satquery;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.satquery.client.HttpModelClient;
import com.satquery.client.ModelResponse;
import com.satquery.controller.AgentController;
import com.satquery.handler.HandlerFactory;
import com.satquery.handler.SatelliteTask;
import com.satquery.metadata.ImageMetadataReader;
import com.satquery.model.*;
import com.satquery.observer.TraceLogger;
import com.satquery.observer.TraceObserver;
import com.satquery.validation.InputValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class SatQueryTest {

    private ImageMetadataReader metadataReader;
    private InputValidator validator;
    private HandlerFactory factory;
    private HttpModelClient modelClient;
    private AgentController controller;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        metadataReader = new ImageMetadataReader();
        validator = new InputValidator();
        factory = new HandlerFactory();
        modelClient = new HttpModelClient("http://localhost:5000");
        controller = new AgentController(modelClient);
        objectMapper = new ObjectMapper();
    }

    @Test
    public void testQueryRequestSerialization() throws Exception {
        QueryRequest request = new QueryRequest("q-123", "Is there a flood?", List.of("img-1"), "2026-08-24T12:00:00Z");
        String json = objectMapper.writeValueAsString(request);
        assertTrue(json.contains("q-123"));
        assertTrue(json.contains("Is there a flood?"));

        QueryRequest decoded = objectMapper.readValue(json, QueryRequest.class);
        assertEquals("q-123", decoded.getQueryId());
        assertEquals("Is there a flood?", decoded.getQueryText());
    }

    @Test
    public void testTiffMetadataReaderWithFakeTiff() throws IOException {
        // Generate a minimal valid little-endian TIFF file header
        Path tempFile = Paths.get("temp_test.tif");
        try (FileOutputStream fos = new FileOutputStream(tempFile.toFile())) {
            // Little endian byte order II (0x49 0x49) + Magic 42 (0x2A 0x00)
            fos.write(new byte[]{0x49, 0x49, 0x2A, 0x00});
            // First IFD offset = 8 (0x08 0x00 0x00 0x00)
            fos.write(new byte[]{0x08, 0x00, 0x00, 0x00});
            // Number of directory entries = 3
            fos.write(new byte[]{0x03, 0x00});

            // Entry 1: Tag 256 (ImageWidth) - Short(3), count(1), valOffset(1024 = 0x00 0x04)
            fos.write(new byte[]{0x00, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00});
            // Entry 2: Tag 257 (ImageLength/Height) - Short(3), count(1), valOffset(768 = 0x00 0x03)
            fos.write(new byte[]{0x01, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x03, 0x00, 0x00});
            // Entry 3: Tag 277 (SamplesPerPixel/Bands) - Short(3), count(1), valOffset(4)
            fos.write(new byte[]{0x15, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00});
            
            // Next IFD offset = 0
            fos.write(new byte[]{0x00, 0x00, 0x00, 0x00});
        }

        try {
            ImageMetadata metadata = metadataReader.read(tempFile);
            assertEquals("GeoTIFF", metadata.getFormat());
            assertEquals(1024, metadata.getWidth());
            assertEquals(768, metadata.getHeight());
            assertEquals(4, metadata.getBandCount());
            assertFalse(metadata.isGeoreferenced()); // No GeoTags supplied in fake TIFF
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    @Test
    public void testInputValidatorRules() {
        QueryRequest request = new QueryRequest("q-0", "Analyze please", List.of(), "2026-08-24");
        
        ImageMetadata metaOpt1 = new ImageMetadata("GeoTIFF", 256, 256, 3, "OPTICAL", "2026-01-01", "EPSG:4326", null, true);
        ImageMetadata metaOpt2 = new ImageMetadata("GeoTIFF", 256, 256, 3, "OPTICAL", "2026-01-01", "EPSG:4326", null, true);
        ImageMetadata metaSar1 = new ImageMetadata("GeoTIFF", 256, 256, 1, "SAR", "2026-01-01", "EPSG:4326", null, true);

        ImageAsset imgOpt1 = new ImageAsset("img-1", "optical1.tif", "/uploads/optical1.tif", metaOpt1);
        ImageAsset imgOpt2 = new ImageAsset("img-2", "optical2.tif", "/uploads/optical2.tif", metaOpt2);
        ImageAsset imgOptSame = new ImageAsset("img-2-same", "optical1.tif", "/uploads/optical1.tif", metaOpt2);
        ImageAsset imgSar1 = new ImageAsset("img-3", "sar1.tif", "/uploads/sar1.tif", metaSar1);

        // Rule: VQA wants exactly one image
        ValidationResult vqaRes = validator.validate(request, List.of(imgOpt1, imgOpt2), TaskType.VQA);
        assertFalse(vqaRes.isValid());
        assertTrue(vqaRes.getErrors().get(0).contains("Only one image is allowed"));

        // Rule: Change detection requires two images
        ValidationResult changeRes = validator.validate(request, List.of(imgOpt1), TaskType.CHANGE_ANALYSIS);
        assertFalse(changeRes.isValid());
        assertTrue(changeRes.getErrors().get(0).contains("Two images are required"));

        // Rule: Change detection requires different acquisition dates
        ValidationResult changeDateRes = validator.validate(request, List.of(imgOpt1, imgOptSame), TaskType.CHANGE_ANALYSIS);
        assertFalse(changeDateRes.isValid());
        assertTrue(changeDateRes.getErrors().get(0).contains("different acquisition dates"));

        // Rule: Fusion requires one Optical and one SAR
        ValidationResult fusionRes = validator.validate(request, List.of(imgOpt1, imgOpt2), TaskType.FUSION_ANALYSIS);
        assertFalse(fusionRes.isValid());
        assertTrue(fusionRes.getErrors().get(0).contains("requires one optical/multispectral image and one SAR image"));

        ValidationResult fusionOk = validator.validate(request, List.of(imgOpt1, imgSar1), TaskType.FUSION_ANALYSIS);
        assertTrue(fusionOk.isValid());
    }

    @Test
    public void testAgentControllerRouting() {
        QueryRequest vqaRequest = new QueryRequest("q-1", "what is visible in this region?", List.of("img-1"), "2026");
        ImageMetadata metadata = new ImageMetadata("GeoTIFF", 512, 512, 3, "OPTICAL", "2026-01-01", null, null, false);
        ImageAsset img = new ImageAsset("img-1", "optical.tif", "/uploads/optical.tif", metadata);

        TaskType vqaType = controller.classifyTask(vqaRequest, List.of(img));
        assertEquals(TaskType.VQA, vqaType);

        QueryRequest groundRequest = new QueryRequest("q-2", "Highlight the water body", List.of("img-1"), "2026");
        TaskType groundType = controller.classifyTask(groundRequest, List.of(img));
        assertEquals(TaskType.GROUNDING, groundType);
    }

    @Test
    public void testHandlerFactory() {
        SatelliteTask task = factory.create(TaskType.CHANGE_ANALYSIS);
        assertEquals(TaskType.CHANGE_ANALYSIS, task.getTaskType());
        assertEquals("ChangeHandler", task.getClass().getSimpleName());
    }

    @Test
    public void testObserverPattern() {
        final List<String> receivedEvents = new ArrayList<>();
        TraceObserver observer = event -> receivedEvents.add(event.getEventName());

        TraceLogger.addObserver(observer);
        TraceLogger.clearThreadTrace();
        TraceLogger.logEvent("TEST_EVENT", "Observer verification", "JUnit", "SUCCESS");

        assertTrue(receivedEvents.contains("TEST_EVENT"));
        TraceLogger.removeObserver(observer);
    }

    @Test
    public void testHttpModelClientFallback() {
        HttpModelClient client = new HttpModelClient("http://localhost:9999"); // unreachable port
        QueryRequest request = new QueryRequest("q-err", "What is here?", List.of("img-1"), "2026");
        ImageMetadata metadata = new ImageMetadata("GeoTIFF", 512, 512, 3, "OPTICAL", "2026-01-01", null, null, false);
        ImageAsset img = new ImageAsset("img-1", "optical.tif", "/uploads/optical.tif", metadata);

        ModelResponse response = client.run(TaskType.VQA, request, List.of(img));
        assertNotNull(response);
        assertNotNull(response.getAnswer());
        assertTrue(response.getAnswer().contains("SatQuery Satellite Intelligence Analysis"));
    }

    @Test
    public void testTraceRecordAndReportBuilder() throws IOException {
        TaskResult mockResult = new TaskResult(
                "q-test-pdf",
                TaskType.VQA,
                "VqaHandler",
                "MockModelClient",
                "SUCCESS",
                "Built-up sprawl expanded.",
                "HIGH",
                List.of(new Evidence("IMAGE", "uploads/test.tif", "Source Image", "Visual reference")),
                List.of("Uncertain boundary lines"),
                List.of(new TraceEvent("TEST_STEP", "Generating test trace", "AgentController", "2026-08-24T12:00:00Z", "SUCCESS"))
        );

        TraceRecord record = new TraceRecord(
                "How much urban growth?",
                List.of("test.tif"),
                List.of("OPTICAL"),
                "VQA",
                List.of("VqaHandler", "MockModelClient"),
                new java.util.HashMap<>(),
                "success",
                "HIGH",
                List.of("Uncertain boundary lines"),
                150L
        );
        mockResult.setTraceRecord(record);

        // Verify TraceRecord fields
        assertEquals("How much urban growth?", mockResult.getTraceRecord().getQuery());
        assertEquals("VQA", mockResult.getTraceRecord().getSelectedTask());

        // Ensure directories exist
        java.nio.file.Files.createDirectories(Paths.get("outputs"));

        // Verify PDF report generation
        File reportFile = new File("outputs/report-test-pdf.pdf");
        if (reportFile.exists()) {
            reportFile.delete();
        }

        com.satquery.handler.ReportBuilder.buildPdf(mockResult, reportFile.getAbsolutePath());
        assertTrue(reportFile.exists());
        assertTrue(reportFile.length() > 0);

        // Clean up
        reportFile.delete();
    }

    @Test
    public void testQueryClassifier() {
        com.satquery.routing.QueryClassifier classifier = new com.satquery.routing.QueryClassifier();
        QueryRequest req = new QueryRequest("q-test", "Where is the river?", List.of(), "2026");
        TaskType taskType = classifier.classify(req, List.of());
        assertNotNull(taskType);
    }

    @Test
    public void testWorkflowPlanModel() {
        com.satquery.routing.WorkflowPlan plan = new com.satquery.routing.WorkflowPlan(
                "FUSION_ANALYSIS",
                List.of("OPTICAL", "SAR"),
                true,
                "OPTIONAL",
                new java.util.HashMap<>()
        );
        assertEquals("FUSION_ANALYSIS", plan.getIntent());
        assertTrue(plan.isRequiresTemporalPair());
        assertEquals("OPTIONAL", plan.getRequestedEvidence());
    }

    @Test
    public void testTracePublisher() {
        com.satquery.observer.TracePublisher publisher = new com.satquery.observer.ObserverTracePublisher();
        TraceEvent event = new TraceEvent("TEST_PUBLISH", "Checking publish stream", "JUnit", "2026-08-28T18:00:00Z", "SUCCESS");
        
        final List<String> received = new ArrayList<>();
        TraceObserver observer = ev -> received.add(ev.getEventName());
        TraceLogger.addObserver(observer);
        
        publisher.publish(event);
        assertTrue(received.contains("TEST_PUBLISH"));
        
        TraceLogger.removeObserver(observer);
    }
}



