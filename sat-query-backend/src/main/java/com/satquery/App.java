package com.satquery;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.satquery.client.MockModelClient;
import com.satquery.client.ModelClient;
import com.satquery.controller.AgentController;
import com.satquery.metadata.ImageMetadataReader;
import com.satquery.model.*;

import com.satquery.benchmark.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;

public class App {
    private static final int PORT = 8080;
    private static final Map<String, ImageAsset> imageRegistry = new ConcurrentHashMap<>();
    private static final Map<String, TaskResult> reportRegistry = new ConcurrentHashMap<>();
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final ImageMetadataReader metadataReader = new ImageMetadataReader();
    private static final ModelClient modelClient = new MockModelClient(); // default Mock client
    private static final AgentController agentController = new AgentController(modelClient);

    public static void main(String[] args) throws IOException {
        // Ensure directories exist
        Files.createDirectories(Paths.get("uploads"));
        Files.createDirectories(Paths.get("outputs"));

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/upload", new UploadHandler());
        server.createContext("/api/analyze", new AnalyzeHandler());
        server.createContext("/api/report", new ReportHandler());
        server.createContext("/api/evaluate", new EvaluateHandler());

        server.setExecutor(Executors.newFixedThreadPool(10));
        System.out.println("SatQuery Java Backend starting on port " + PORT + "...");
        server.start();
        System.out.println("SatQuery Java Backend is online.");
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, Object responseObj) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        
        byte[] bytes = objectMapper.writeValueAsBytes(responseObj);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void handleCorsOptions(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        exchange.sendResponseHeaders(204, -1);
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            Map<String, String> response = new HashMap<>();
            response.put("status", "OK");
            response.put("service", "SatQuery Java Backend");
            sendJsonResponse(exchange, 200, response);
        }
    }

    static class UploadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
            if (contentType == null || !contentType.startsWith("multipart/form-data")) {
                sendJsonResponse(exchange, 400, Map.of("error", "Content-Type must be multipart/form-data"));
                return;
            }

            try {
                // Parse multipart boundary
                String boundaryStr = null;
                for (String param : contentType.split(";")) {
                    if (param.trim().startsWith("boundary=")) {
                        boundaryStr = "--" + param.split("=")[1].trim();
                        break;
                    }
                }

                if (boundaryStr == null) {
                    sendJsonResponse(exchange, 400, Map.of("error", "Multipart boundary not found"));
                    return;
                }

                byte[] boundaryBytes = boundaryStr.getBytes(StandardCharsets.UTF_8);
                InputStream is = exchange.getRequestBody();
                byte[] bodyBytes = is.readAllBytes();

                // Find file components
                int fileIndex = indexOf(bodyBytes, "filename=".getBytes(StandardCharsets.UTF_8));
                if (fileIndex == -1) {
                    sendJsonResponse(exchange, 400, Map.of("error", "No filename specified in upload"));
                    return;
                }

                // Extract filename
                int nameStart = fileIndex + 10; // length of 'filename="'
                int nameEnd = nameStart;
                while (bodyBytes[nameEnd] != '"') {
                    nameEnd++;
                }
                String filename = new String(bodyBytes, nameStart, nameEnd - nameStart, StandardCharsets.UTF_8);

                // Find start of content
                int headerEndMarker = indexOf(bodyBytes, "\r\n\r\n".getBytes(StandardCharsets.UTF_8), fileIndex);
                if (headerEndMarker == -1) {
                    sendJsonResponse(exchange, 400, Map.of("error", "Malformed form-data"));
                    return;
                }
                int dataStart = headerEndMarker + 4;

                // Find next boundary to end data
                int nextBoundary = indexOf(bodyBytes, boundaryBytes, dataStart);
                if (nextBoundary == -1) {
                    sendJsonResponse(exchange, 400, Map.of("error", "Upload data boundary missing end"));
                    return;
                }
                int dataLength = nextBoundary - dataStart - 2; // exclude \r\n before boundary

                byte[] fileData = new byte[dataLength];
                System.arraycopy(bodyBytes, dataStart, fileData, 0, dataLength);

                String imageId = "img-" + UUID.randomUUID().toString().substring(0, 8);
                Path targetPath = Paths.get("uploads", filename);
                Files.write(targetPath, fileData);

                // Read metadata
                ImageMetadata metadata = metadataReader.read(targetPath);
                ImageAsset asset = new ImageAsset(imageId, filename, targetPath.toAbsolutePath().toString(), metadata);

                imageRegistry.put(imageId, asset);

                sendJsonResponse(exchange, 200, asset);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Upload processing failed: " + e.getMessage()));
            }
        }

        private int indexOf(byte[] outerArray, byte[] smallerArray) {
            return indexOf(outerArray, smallerArray, 0);
        }

        private int indexOf(byte[] outerArray, byte[] smallerArray, int startIndex) {
            for (int i = startIndex; i < outerArray.length - smallerArray.length + 1; ++i) {
                boolean found = true;
                for (int j = 0; j < smallerArray.length; ++j) {
                    if (outerArray[i + j] != smallerArray[j]) {
                        found = false;
                        break;
                    }
                }
                if (found) return i;
            }
            return -1;
        }
    }

    static class AnalyzeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            try {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                
                // Parse request manually or via ObjectMapper
                QueryRequest request = objectMapper.readValue(body, QueryRequest.class);
                if (request.getQueryId() == null) {
                    request.setQueryId("q-" + UUID.randomUUID().toString().substring(0, 8));
                }

                List<ImageAsset> images = new ArrayList<>();
                if (request.getImageIds() != null) {
                    for (String id : request.getImageIds()) {
                        ImageAsset asset = imageRegistry.get(id);
                        if (asset != null) {
                            images.add(asset);
                        }
                    }
                }

                // Process task
                TaskResult result = agentController.processQuery(request, images);

                // Cache reports and build PDF
                if ("SUCCESS".equalsIgnoreCase(result.getStatus())) {
                    reportRegistry.put(result.getQueryId(), result);
                    String reportPath = "outputs/report-" + result.getQueryId() + ".pdf";
                    com.satquery.handler.ReportBuilder.buildPdf(result, reportPath);
                }

                sendJsonResponse(exchange, 200, result);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Analysis failed: " + e.getMessage()));
            }
        }
    }

    static class ReportHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            String[] parts = path.split("/");
            if (parts.length < 4) {
                sendJsonResponse(exchange, 400, Map.of("error", "queryId is required. Pattern: /api/report/{queryId}"));
                return;
            }

            String queryId = parts[3];
            TaskResult report = reportRegistry.get(queryId);

            if (report == null) {
                sendJsonResponse(exchange, 404, Map.of("error", "Report not found for ID: " + queryId));
            } else {
                sendJsonResponse(exchange, 200, report);
            }
        }
    }

    static class EvaluateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            try {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, Object> req = objectMapper.readValue(body, Map.class);

                String datasetStr = req.get("dataset") != null ? req.get("dataset").toString().toUpperCase() : "VRSBENCH";
                boolean evalMode = req.get("evaluationMode") != null && (boolean) req.get("evaluationMode");

                List<BenchmarkSample> samples = new ArrayList<>();
                if ("VRSBENCH".equals(datasetStr)) {
                    samples = new VrsBenchAdapter().getSamples(evalMode);
                } else if ("RSVQA".equals(datasetStr)) {
                    samples = new RsvqaAdapter().getSamples(evalMode);
                } else if ("CDVQA".equals(datasetStr)) {
                    samples = new CdvqaAdapter().getSamples(evalMode);
                }

                List<Map<String, Object>> evaluationResults = new ArrayList<>();

                for (BenchmarkSample sample : samples) {
                    // Create temporary ImageAssets
                    List<ImageAsset> images = new ArrayList<>();
                    List<String> imageIds = new ArrayList<>();
                    for (String path : sample.getImagePaths()) {
                        String imgId = "img-" + UUID.randomUUID().toString().substring(0, 8);
                        
                        ImageMetadata meta = new ImageMetadata();
                        meta.setFormat(path.endsWith(".png") ? "PNG" : (path.endsWith(".tif") || path.endsWith(".tiff") ? "GeoTIFF" : "UNKNOWN"));
                        meta.setModality(path.contains("sar") ? "SAR" : "OPTICAL");
                        meta.setAcquisitionDate("2026-01-01");
                        meta.setGeoreferenced(true);
                        
                        ImageAsset asset = new ImageAsset(imgId, new File(path).getName(), path, meta);
                        registerImageAsset(asset);
                        
                        images.add(asset);
                        imageIds.add(imgId);
                    }

                    // Map to QueryRequest
                    QueryRequest queryReq = new QueryRequest(
                            "eval-q-" + sample.getSampleId(),
                            sample.getQuestion().getQuestionText(),
                            imageIds,
                            Instant.now().toString()
                    );
                    queryReq.setDatasetContext(new DatasetContext(BenchmarkDataset.valueOf(datasetStr), evalMode));

                    // Execute
                    TaskResult result = agentController.processQuery(queryReq, images);

                    // Scorer (simple mock NLP word matching or exact matching)
                    double score = 0.0;
                    String expected = sample.getExpectedAnswer().getAnswerText();
                    String predicted = result.getAnswer();
                    if (expected != null && predicted != null) {
                        String expNorm = expected.toLowerCase().replaceAll("[^a-zA-Z0-9 ]", "");
                        String predNorm = predicted.toLowerCase().replaceAll("[^a-zA-Z0-9 ]", "");
                        if (predNorm.contains(expNorm) || expNorm.contains(predNorm)) {
                            score = 1.0;
                        } else {
                            String[] words = expNorm.split(" ");
                            int matched = 0;
                            for (String w : words) {
                                if (predNorm.contains(w)) matched++;
                            }
                            score = words.length > 0 ? (double) matched / words.length : 0.0;
                        }
                    }

                    Map<String, Object> evalOut = new HashMap<>();
                    evalOut.put("sampleId", sample.getSampleId());
                    evalOut.put("query", sample.getQuestion().getQuestionText());
                    evalOut.put("expectedAnswer", expected);
                    evalOut.put("predictedAnswer", predicted);
                    evalOut.put("score", score);
                    evalOut.put("selectedTool", result.getTraceRecord() != null ? result.getTraceRecord().getSelectedTools() : List.of());
                    evalOut.put("trace", result.getTraceRecord());
                    
                    evaluationResults.add(evalOut);
                }

                sendJsonResponse(exchange, 200, Map.of(
                        "dataset", datasetStr,
                        "evaluationMode", evalMode,
                        "results", evaluationResults
                ));

            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Evaluation failed: " + e.getMessage()));
            }
        }
    }

    // Direct helper to add image assets manually for testing/mocking
    public static void registerImageAsset(ImageAsset asset) {
        imageRegistry.put(asset.getImageId(), asset);
    }
}
