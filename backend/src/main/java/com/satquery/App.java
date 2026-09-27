package com.satquery;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.satquery.client.HttpModelClient;
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
    private static final Map<String, ImageAsset> imageRegistry = new ConcurrentHashMap<>();
    private static final Map<String, TaskResult> reportRegistry = new ConcurrentHashMap<>();
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final ImageMetadataReader metadataReader = new ImageMetadataReader();
    private static final ModelClient modelClient = new HttpModelClient("http://localhost:5000");
    private static final AgentController agentController = new AgentController(modelClient);

    private static int getPort() {
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.trim().isEmpty()) {
            try {
                return Integer.parseInt(envPort.trim());
            } catch (NumberFormatException ignored) {}
        }
        return 8080;
    }


    public static void main(String[] args) throws IOException {
        // Ensure directories exist
        Files.createDirectories(Paths.get("uploads"));
        Files.createDirectories(Paths.get("outputs"));

        // Initialize SQLite DB
        com.satquery.database.DatabaseManager.initialize();
        // Register EvidenceObserver
        com.satquery.observer.TraceLogger.addObserver(new com.satquery.observer.EvidenceObserver());

        int port = getPort();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        System.out.println("SatQuery Java Backend running on port " + port);

        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/upload", new UploadHandler());
        server.createContext("/api/analyze", new AnalyzeHandler());
        server.createContext("/api/analyse", new AnalyzeHandler());
        server.createContext("/api/query", new AnalyzeHandler());
        server.createContext("/api/analysis/validate", new AnalysisValidateHandler());
        server.createContext("/api/analysis/plan", new AnalysisPlanHandler());
        server.createContext("/api/analysis/run", new AnalysisRunHandler());
        server.createContext("/api/analysis/", new AnalysisGetHandler());
        server.createContext("/api/runs/", new RunsGetHandler());
        server.createContext("/api/models", new ModelsHandler());
        server.createContext("/api/benchmarks", new BenchmarksHandler());
        server.createContext("/api/gdal/inspect", new GdalInspectHandler());

        server.createContext("/api/report", new ReportHandler());
        server.createContext("/api/evaluate", new EvaluateHandler());
        server.createContext("/api/history", new HistoryHandler());
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(Executors.newFixedThreadPool(10));
        System.out.println("SatQuery Java Backend starting on port " + port + "...");
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

                if (filename.toLowerCase().endsWith(".tif") || filename.toLowerCase().endsWith(".tiff")) {
                    ensureTiffPreview(targetPath);
                }

                // Read metadata
                ImageMetadata metadata = metadataReader.read(targetPath);
                ImageAsset asset = new ImageAsset(imageId, filename, targetPath.toAbsolutePath().toString(), metadata);

                imageRegistry.put(imageId, asset);
                com.satquery.database.DatabaseManager.saveImageAsset(asset);

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

    public static void ensureTiffPreview(Path tiffPath) {
        if (tiffPath == null || !Files.exists(tiffPath)) return;
        try {
            Path png1 = Paths.get(tiffPath.toString() + ".png");
            String base = tiffPath.toString().replaceAll("(?i)\\.tiff?$", "");
            Path png2 = Paths.get(base + "_preview.png");
            if (Files.exists(png1) && Files.exists(png2)) return;

            Path venvPy = Paths.get(".venv/Scripts/python.exe");
            if (!Files.exists(venvPy)) venvPy = Paths.get("../.venv/Scripts/python.exe");
            if (!Files.exists(venvPy)) venvPy = Paths.get("d:/SIH/sat-query-sih/.venv/Scripts/python.exe");
            String pythonExe = Files.exists(venvPy) ? venvPy.toAbsolutePath().toString() : "python";

            String pyCode = "import sys; from PIL import Image; import numpy as np; " +
                    "p = sys.argv[1]; img = Image.open(p); arr = np.array(img, dtype=np.float32); " +
                    "p2, p98 = np.percentile(arr, (2, 98)); " +
                    "norm = np.clip((arr - p2) / (p98 - p2) * 255.0, 0, 255).astype(np.uint8) if p98 > p2 else np.clip(arr, 0, 255).astype(np.uint8); " +
                    "preview = Image.fromarray(norm); preview.save(sys.argv[2]); preview.save(sys.argv[3])";

            ProcessBuilder pb = new ProcessBuilder(pythonExe, "-c", pyCode,
                    tiffPath.toAbsolutePath().toString(),
                    png1.toAbsolutePath().toString(),
                    png2.toAbsolutePath().toString());
            pb.redirectErrorStream(true);
            Process p = pb.start();
            p.waitFor(10, java.util.concurrent.TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("[Preview] ensureTiffPreview note: " + e.getMessage());
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
                if (request.getDatasetContext() == null) {
                    request.setDatasetContext(new com.satquery.benchmark.DatasetContext(com.satquery.benchmark.BenchmarkDataset.VRSBENCH, false));
                }


                List<ImageAsset> images = resolveImages(request);

                // Process task
                TaskResult result = agentController.processQuery(request, images);

                // Save task result to SQLite Database
                com.satquery.database.DatabaseManager.saveTaskResult(result);

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
                report = com.satquery.database.DatabaseManager.getTaskResult(queryId);
                if (report != null) {
                    reportRegistry.put(queryId, report);
                }
            }

            if (report == null) {
                sendJsonResponse(exchange, 404, Map.of("error", "Report not found for ID: " + queryId));
                return;
            }

            if (parts.length >= 5 && "geojson".equalsIgnoreCase(parts[4])) {
                // Return GeoJSON FeatureCollection
                Map<String, Object> geoJson = new HashMap<>();
                geoJson.put("type", "FeatureCollection");

                Map<String, Object> feature = new HashMap<>();
                feature.put("type", "Feature");

                // Spatial Polygon geometry (Defaulting to WGS84 bounding box or full scene extent)
                double minLon = 77.1025, minLat = 28.7041, maxLon = 77.2025, maxLat = 28.8041;
                Map<String, Object> geometry = new HashMap<>();
                geometry.put("type", "Polygon");
                geometry.put("coordinates", List.of(List.of(
                    List.of(minLon, minLat),
                    List.of(maxLon, minLat),
                    List.of(maxLon, maxLat),
                    List.of(minLon, maxLat),
                    List.of(minLon, minLat)
                )));
                feature.put("geometry", geometry);

                Map<String, Object> props = new HashMap<>();
                props.put("queryId", report.getQueryId());
                props.put("taskType", report.getTaskType() != null ? report.getTaskType().name() : "VQA");
                props.put("status", report.getStatus());
                props.put("answer", report.getAnswer());
                props.put("confidenceState", report.getConfidenceState());
                props.put("timestamp", report.getTimestamp());

                ImageMetadata imgMeta = report.getImageMetadata();
                if (imgMeta != null) {
                    props.put("acquisitionDate", imgMeta.getAcquisitionDate());
                    props.put("crs", imgMeta.getCrs());
                    props.put("resolution", imgMeta.getResolution());
                    props.put("sensorPlatform", imgMeta.getSensorPlatform());
                    props.put("cloudCoverPercent", imgMeta.getCloudCoverPercent());
                    props.put("ndviMean", imgMeta.getNdviMean());
                }

                feature.put("properties", props);
                geoJson.put("features", List.of(feature));

                sendJsonResponse(exchange, 200, geoJson);
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
                Map<String, Object> req = objectMapper.readValue(body, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

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

    static class StaticFileHandler implements HttpHandler {
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
            if (path.equals("/")) {
                path = "/index.html";
            }

            File file;
            if (path.startsWith("/outputs/") || path.startsWith("/uploads/")) {
                String relativePath = path.substring(1);
                file = new File(relativePath);
                if (!file.exists()) {
                    file = new File("backend/" + relativePath);
                }

                // If browser requests a raw .tif/.tiff image, transparently serve the PNG preview if available
                // If browser requests a raw .tif/.tiff image or .tif.png, transparently serve the PNG preview
                String lower = path.toLowerCase();
                if (lower.endsWith(".tif") || lower.endsWith(".tiff") || lower.endsWith(".tif.png")) {
                    File rawTif = file;
                    if (lower.endsWith(".tif.png")) {
                        String rawPath = file.getAbsolutePath().substring(0, file.getAbsolutePath().length() - 4);
                        rawTif = new File(rawPath);
                    }
                    File pngCandidate = new File(rawTif.getAbsolutePath() + ".png");
                    if (!pngCandidate.exists()) {
                        String base = rawTif.getAbsolutePath().replaceAll("(?i)\\.tiff?$", "");
                        pngCandidate = new File(base + "_preview.png");
                    }
                    if (!pngCandidate.exists() && rawTif.exists()) {
                        ensureTiffPreview(rawTif.toPath());
                    }
                    if (pngCandidate.exists()) {
                        file = pngCandidate;
                        path = pngCandidate.getName();
                    }
                }
            } else {
                // Serve files from the "sat-query-backend/web" or "web" folder in the project root
                file = new File("web" + path);
                if (!file.exists() || file.isDirectory()) {
                    file = new File("backend/web" + path);
                }
            }

            if (!file.exists() || file.isDirectory()) {
                exchange.sendResponseHeaders(404, -1);
                return;
            }

            String contentType = "text/plain";
            if (path.endsWith(".html")) contentType = "text/html";
            else if (path.endsWith(".css")) contentType = "text/css";
            else if (path.endsWith(".js")) contentType = "application/javascript";
            else if (path.endsWith(".png")) contentType = "image/png";
            else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (path.endsWith(".pdf")) contentType = "application/pdf";
            else if (path.endsWith(".tif") || path.endsWith(".tiff")) contentType = "image/tiff";

            byte[] bytes = Files.readAllBytes(file.toPath());
            
            // Add CORS headers to static files
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    static class HistoryHandler implements HttpHandler {
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

            try {
                List<TaskResult> history = com.satquery.database.DatabaseManager.getHistory();
                sendJsonResponse(exchange, 200, history);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Failed to fetch history: " + e.getMessage()));
            }
        }
    }

    static class AnalysisValidateHandler implements HttpHandler {
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
                QueryRequest request = objectMapper.readValue(is.readAllBytes(), QueryRequest.class);
                
                List<ImageAsset> images = resolveImages(request);
                
                TaskType taskType = agentController.classifyTask(request, images);
                com.satquery.validation.InputValidator validator = new com.satquery.validation.InputValidator();
                ValidationResult validation = validator.validate(request, images, taskType);
                
                String toolName = switch (taskType) {
                    case VQA -> "VQA_TOOL";
                    case CAPTIONING -> "CAPTIONING_TOOL";
                    case GROUNDING -> "GROUNDING_TOOL";
                    case CHANGE_UNDERSTANDING -> "CHANGE_UNDERSTANDING_TOOL";
                    case CHANGE_ANALYSIS -> "CHANGE_TOOL";
                    case FUSION_ANALYSIS -> "FUSION_TOOL";
                    case INFORMATION_EXTRACTION -> "EXTRACTION_TOOL";
                    default -> "VQA_TOOL";
                };
                
                com.satquery.registry.ToolValidationResult toolValidation = com.satquery.registry.ToolRegistry.validate(
                        toolName, images, request.getParameters()
                );
                
                boolean isValid = validation.isValid() && toolValidation.isValid();
                List<String> errors = new ArrayList<>(validation.getErrors());
                errors.addAll(toolValidation.getErrors());
                List<String> warnings = new ArrayList<>(validation.getWarnings());
                
                Map<String, Object> response = new HashMap<>();
                response.put("valid", isValid);
                response.put("task", taskType.name());
                response.put("errors", errors);
                response.put("warnings", warnings);
                response.put("repairGuidance", validation.getRepairGuidance());
                
                sendJsonResponse(exchange, 200, response);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Validation failed: " + e.getMessage()));
            }
        }
    }

    static class AnalysisPlanHandler implements HttpHandler {
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
                QueryRequest request = objectMapper.readValue(is.readAllBytes(), QueryRequest.class);
                
                List<ImageAsset> images = resolveImages(request);
                
                TaskType taskType = agentController.classifyTask(request, images);
                
                List<String> modalities = new ArrayList<>();
                boolean requiresTemporal = (taskType == TaskType.CHANGE_ANALYSIS);
                for (ImageAsset img : images) {
                    modalities.add(img.getMetadata().getModality());
                }
                if (modalities.isEmpty()) {
                    if (taskType == TaskType.FUSION_ANALYSIS) {
                        modalities.addAll(List.of("OPTICAL", "SAR"));
                    } else {
                        modalities.add("OPTICAL");
                    }
                }
                
                com.satquery.routing.WorkflowPlan plan = new com.satquery.routing.WorkflowPlan(
                        taskType.name(),
                        modalities,
                        requiresTemporal,
                        "OPTIONAL",
                        request.getParameters() != null ? request.getParameters() : new HashMap<>()
                );
                
                sendJsonResponse(exchange, 200, plan);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Planning failed: " + e.getMessage()));
            }
        }
    }

    static class AnalysisRunHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            new AnalyzeHandler().handle(exchange);
        }
    }

    static class AnalysisGetHandler implements HttpHandler {
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
                sendJsonResponse(exchange, 400, Map.of("error", "analysisId is required. Pattern: /api/analysis/{id}"));
                return;
            }
            
            String queryId = parts[3];
            TaskResult result = reportRegistry.get(queryId);
            if (result == null) {
                result = com.satquery.database.DatabaseManager.getTaskResult(queryId);
            }
            
            if (result == null) {
                sendJsonResponse(exchange, 404, Map.of("error", "Analysis request not found for ID: " + queryId));
            } else {
                sendJsonResponse(exchange, 200, result);
            }
        }
    }

    static class RunsGetHandler implements HttpHandler {
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
            if (parts.length < 5) {
                sendJsonResponse(exchange, 400, Map.of("error", "Run ID and action are required. Pattern: /api/runs/{id}/{trace|report}"));
                return;
            }
            
            String runId = parts[3];
            String action = parts[4].toLowerCase();
            
            TaskResult result = reportRegistry.get(runId);
            if (result == null) {
                result = com.satquery.database.DatabaseManager.getTaskResult(runId);
            }
            
            if (result == null) {
                sendJsonResponse(exchange, 404, Map.of("error", "Run not found for ID: " + runId));
                return;
            }
            
            if ("trace".equals(action)) {
                sendJsonResponse(exchange, 200, result.getTrace() != null ? result.getTrace() : List.of());
            } else if ("report".equals(action)) {
                Map<String, Object> reportMeta = new HashMap<>();
                reportMeta.put("reportId", "rep-" + runId);
                reportMeta.put("queryId", runId);
                reportMeta.put("reportType", "PDF");
                reportMeta.put("filePath", "outputs/report-" + runId + ".pdf");
                reportMeta.put("reportUrl", "/outputs/report-" + runId + ".pdf");
                reportMeta.put("timestamp", result.getTimestamp() != null ? result.getTimestamp() : Instant.now().toString());
                if (result.getImageMetadata() != null) {
                    reportMeta.put("imageMetadata", result.getImageMetadata());
                }
                sendJsonResponse(exchange, 200, reportMeta);
            } else {
                sendJsonResponse(exchange, 400, Map.of("error", "Unsupported action: " + action));
            }
        }
    }

    static class ModelsHandler implements HttpHandler {
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
            
            List<Map<String, Object>> models = List.of(
                Map.of(
                    "modelName", "SatQuery-ModelA-ResNet",
                    "version", "v1.0",
                    "supportedTasks", List.of("CLASSIFICATION", "GROUNDING", "EXTRACTION"),
                    "availability", "ONLINE"
                ),
                Map.of(
                    "modelName", "SatQuery-ModelB-Fusion",
                    "version", "v1.0",
                    "supportedTasks", List.of("FUSION_ANALYSIS", "CHANGE_DETECTION"),
                    "availability", "ONLINE"
                ),
                Map.of(
                    "modelName", "SatQuery-QwenVLM",
                    "version", "v2.5",
                    "supportedTasks", List.of("VQA", "CAPTIONING", "CHANGE_UNDERSTANDING"),
                    "availability", "ONLINE"
                )
            );
            
            sendJsonResponse(exchange, 200, models);
        }
    }

    static class BenchmarksHandler implements HttpHandler {
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
            
            Map<String, Object> benchmarks = Map.of(
                "VRSBENCH", Map.of(
                    "description", "Visual Question Answering and Grounding Benchmark for Remote Sensing",
                    "samplesCount", 2
                ),
                "RSVQA", Map.of(
                    "description", "Remote Sensing Visual Question Answering Dataset",
                    "samplesCount", 1
                ),
                "CDVQA", Map.of(
                    "description", "Change Detection Visual Question Answering Dataset",
                    "samplesCount", 1
                )
            );
            
            sendJsonResponse(exchange, 200, benchmarks);
        }
    }

    static class GdalInspectHandler implements HttpHandler {
        private static final com.satquery.gdal.GdalProcessor gdalProcessor = new com.satquery.gdal.GdalProcessor();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod()) && !"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            try {
                String imageId = null;
                if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                    InputStream is = exchange.getRequestBody();
                    byte[] bytes = is.readAllBytes();
                    if (bytes.length > 0) {
                        Map<String, Object> req = objectMapper.readValue(bytes, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                        if (req != null && req.get("imageId") != null) {
                            imageId = req.get("imageId").toString();
                        }
                    }
                } else {
                    String path = exchange.getRequestURI().getPath();
                    String[] parts = path.split("/");
                    if (parts.length >= 5) {
                        imageId = parts[4];
                    }
                }

                ImageAsset asset = null;
                if (imageId != null) {
                    asset = imageRegistry.get(imageId);
                    if (asset == null) {
                        asset = com.satquery.database.DatabaseManager.getImageAsset(imageId);
                    }
                }

                File fileToInspect = null;
                if (asset != null && asset.getFilePath() != null) {
                    fileToInspect = new File(asset.getFilePath());
                } else {
                    File sample = new File("uploads/sample.tif");
                    if (sample.exists()) {
                        fileToInspect = sample;
                    } else {
                        sample = new File("backend/uploads/sample.tif");
                        if (sample.exists()) fileToInspect = sample;
                    }
                }

                if (fileToInspect == null || !fileToInspect.exists()) {
                    sendJsonResponse(exchange, 404, Map.of("error", "No valid image asset found for inspection"));
                    return;
                }

                com.satquery.gdal.GeoRasterMetadata metadata = gdalProcessor.inspect(fileToInspect);
                sendJsonResponse(exchange, 200, metadata);

            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "GDAL inspection failed: " + e.getMessage()));
            }
        }
    }

    static class SpectralHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            try {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, Object> req = body.isEmpty() ? new HashMap<>() : objectMapper.readValue(body, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

                double red = req.get("red") != null ? Double.parseDouble(req.get("red").toString()) : 0.15;
                double green = req.get("green") != null ? Double.parseDouble(req.get("green").toString()) : 0.20;
                double blue = req.get("blue") != null ? Double.parseDouble(req.get("blue").toString()) : 0.10;
                double nir = req.get("nir") != null ? Double.parseDouble(req.get("nir").toString()) : 0.65;
                double swir = req.get("swir") != null ? Double.parseDouble(req.get("swir").toString()) : 0.08;

                double ndvi = (nir + red) == 0 ? 0.0 : (nir - red) / (nir + red);
                double mndwi = (green + swir) == 0 ? 0.0 : (green - swir) / (green + swir);
                double ndbi = (swir + nir) == 0 ? 0.0 : (swir - nir) / (swir + nir);

                Map<String, Object> spectralResult = new HashMap<>();
                spectralResult.put("ndvi", Math.round(ndvi * 1000.0) / 1000.0);
                spectralResult.put("mndwi", Math.round(mndwi * 1000.0) / 1000.0);
                spectralResult.put("ndbi", Math.round(ndbi * 1000.0) / 1000.0);
                spectralResult.put("blue", blue);
                spectralResult.put("status", "SUCCESS");

                sendJsonResponse(exchange, 200, spectralResult);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Spectral Index computation failed: " + e.getMessage()));
            }
        }
    }

    static class AreaHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsOptions(exchange);
                return;
            }
            try {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                Map<String, Object> req = body.isEmpty() ? new HashMap<>() : objectMapper.readValue(body, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

                double x1 = req.get("x1") != null ? Double.parseDouble(req.get("x1").toString()) : 0.2;
                double y1 = req.get("y1") != null ? Double.parseDouble(req.get("y1").toString()) : 0.2;
                double x2 = req.get("x2") != null ? Double.parseDouble(req.get("x2").toString()) : 0.8;
                double y2 = req.get("y2") != null ? Double.parseDouble(req.get("y2").toString()) : 0.8;
                int width = req.get("width") != null ? Integer.parseInt(req.get("width").toString()) : 1024;
                int height = req.get("height") != null ? Integer.parseInt(req.get("height").toString()) : 1024;
                double gsd = req.get("gsd") != null ? Double.parseDouble(req.get("gsd").toString()) : 10.0;

                double pxWidth = Math.abs(x2 - x1) * width;
                double pxHeight = Math.abs(y2 - y1) * height;
                double areaMeters = pxWidth * pxHeight * (gsd * gsd);
                double areaKm2 = areaMeters / 1000000.0;

                Map<String, Object> areaResult = new HashMap<>();
                areaResult.put("areaKm2", Math.round(areaKm2 * 1000.0) / 1000.0);
                areaResult.put("areaM2", Math.round(areaMeters * 10.0) / 10.0);
                areaResult.put("status", "SUCCESS");

                sendJsonResponse(exchange, 200, areaResult);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, Map.of("error", "Spatial Area calculation failed: " + e.getMessage()));
            }
        }
    }

    private static boolean hasAsset(List<ImageAsset> list, ImageAsset candidate) {
        if (candidate == null) return true;
        for (ImageAsset img : list) {
            if (img == candidate) return true;
            if (candidate.getImageId() != null && candidate.getImageId().equals(img.getImageId())) return true;
            if (candidate.getFilePath() != null && candidate.getFilePath().equalsIgnoreCase(img.getFilePath())) return true;
            if (candidate.getFileName() != null && candidate.getFileName().equalsIgnoreCase(img.getFileName())) return true;
        }
        return false;
    }

    private static List<ImageAsset> resolveImages(QueryRequest request) {
        List<ImageAsset> images = new ArrayList<>();
        if (request == null) return images;

        List<String> ids = request.getImageIds();
        if (ids != null) {
            for (String id : ids) {
                ImageAsset asset = resolveSingleAsset(id, request);
                if (asset != null && !hasAsset(images, asset)) {
                    images.add(asset);
                }
            }
        }

        if (images.isEmpty() && request.getFrontendAssets() != null) {
            for (Map<String, Object> fAsset : request.getFrontendAssets()) {
                String fId = fAsset.containsKey("id") ? String.valueOf(fAsset.get("id")) : null;
                if (fId != null) {
                    ImageAsset asset = resolveSingleAsset(fId, request);
                    if (asset != null && !hasAsset(images, asset)) {
                        images.add(asset);
                    }
                }
            }
        }

        // Clamp to 1 image for single-image tasks if multiple duplicates were resolved
        if (request.getRequestedTask() != null && images.size() > 1) {
            String rt = request.getRequestedTask().toUpperCase();
            if ("VQA".equals(rt) || "CAPTIONING".equals(rt) || "GROUNDING".equals(rt) || "INFORMATION_EXTRACTION".equals(rt)) {
                ImageAsset first = images.get(0);
                images.clear();
                images.add(first);
            }
        }

        if (images.isEmpty()) {
            Path uploadsDir = Paths.get("uploads");
            if (Files.exists(uploadsDir)) {
                try (var stream = Files.list(uploadsDir)) {
                    List<Path> files = stream.filter(p -> {
                        String s = p.getFileName().toString().toLowerCase();
                        return s.endsWith(".jpg") || s.endsWith(".jpeg") || s.endsWith(".png") || s.endsWith(".tif") || s.endsWith(".tiff");
                    }).toList();
                    if (!files.isEmpty()) {
                        Path first = files.get(0);
                        ImageMetadata meta = metadataReader.read(first);
                        ImageAsset asset = new ImageAsset("default-img-1", first.getFileName().toString(), first.toAbsolutePath().toString(), meta);
                        imageRegistry.put(asset.getImageId(), asset);
                        images.add(asset);
                    }
                } catch (Exception ignored) {}
            }
        }

        if (request.getFrontendAssets() != null) {
            for (ImageAsset img : images) {
                for (Map<String, Object> fAsset : request.getFrontendAssets()) {
                    String fId = fAsset.containsKey("id") ? String.valueOf(fAsset.get("id")) : "";
                    String fName = fAsset.containsKey("name") ? String.valueOf(fAsset.get("name")) : "";
                    if (img.getImageId().equals(fId) || img.getFileName().equalsIgnoreCase(fName) || (!fName.isEmpty() && img.getFileName().contains(fName))) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> fMeta = (Map<String, Object>) fAsset.get("metadata");
                        if (fMeta != null) {
                            if (fMeta.get("crs") != null) img.getMetadata().setCrs(String.valueOf(fMeta.get("crs")));
                            if (fMeta.get("boundingBox") != null) img.getMetadata().setBoundingBox(String.valueOf(fMeta.get("boundingBox")));
                            if (fMeta.get("resolution") != null) img.getMetadata().setResolution(String.valueOf(fMeta.get("resolution")));
                            if (fMeta.get("width") instanceof Number) img.getMetadata().setWidth(((Number)fMeta.get("width")).intValue());
                            if (fMeta.get("height") instanceof Number) img.getMetadata().setHeight(((Number)fMeta.get("height")).intValue());
                            if (fMeta.get("modality") != null) img.getMetadata().setModality(String.valueOf(fMeta.get("modality")).toUpperCase());
                        }
                        break;
                    }
                }
            }
        }

        return images;
    }

    private static ImageAsset resolveSingleAsset(String id, QueryRequest request) {
        if (id == null || id.isBlank()) return null;

        ImageAsset asset = imageRegistry.get(id);
        if (asset != null) return asset;

        asset = com.satquery.database.DatabaseManager.getImageAsset(id);
        if (asset != null) {
            imageRegistry.put(id, asset);
            return asset;
        }

        Path uploadsDir = Paths.get("uploads");
        if (Files.exists(uploadsDir)) {
            try (var stream = Files.list(uploadsDir)) {
                List<Path> candidates = stream.filter(p -> {
                    String fn = p.getFileName().toString().toLowerCase();
                    String lowerId = id.toLowerCase();
                    return fn.equalsIgnoreCase(id) || fn.contains(lowerId) || lowerId.contains(fn)
                           || (fn.startsWith("change_t1") && lowerId.contains("t1"))
                           || (fn.startsWith("change_t2") && lowerId.contains("t2"))
                           || (fn.startsWith("landcover_sar") && (lowerId.contains("sar") || lowerId.contains("radar")))
                           || (fn.startsWith("landcover_sample") && lowerId.contains("optical"));
                }).toList();

                if (!candidates.isEmpty()) {
                    Path target = candidates.get(0);
                    ImageMetadata meta = metadataReader.read(target);
                    asset = new ImageAsset(id, target.getFileName().toString(), target.toAbsolutePath().toString(), meta);
                    imageRegistry.put(id, asset);
                    com.satquery.database.DatabaseManager.saveImageAsset(asset);
                    return asset;
                }
            } catch (Exception ignored) {}
        }

        if (request != null && request.getFrontendAssets() != null) {
            for (Map<String, Object> fAsset : request.getFrontendAssets()) {
                String fId = fAsset.containsKey("id") ? String.valueOf(fAsset.get("id")) : "";
                String fName = fAsset.containsKey("name") ? String.valueOf(fAsset.get("name")) 
                             : fAsset.containsKey("fileName") ? String.valueOf(fAsset.get("fileName")) : "";
                // Match by ID or by filename substring
                boolean idMatch = id.equals(fId) || fId.equals(id);
                boolean nameMatch = !fName.isEmpty() && (
                    id.contains(fName.replaceAll("\\.[^.]+$", "").toLowerCase())
                    || fName.toLowerCase().contains(id.toLowerCase())
                );
                if (idMatch || nameMatch) {
                    String targetName = fName.isEmpty() ? "airport_sample.jpg" : fName;
                    Path candidate = Paths.get("uploads", targetName);
                    if (!Files.exists(candidate)) {
                        // Try partial name match in uploads dir
                        try {
                            Path innerUploadsDir = Paths.get("uploads");
                            if (Files.exists(innerUploadsDir)) {
                                final String baseTarget = fName.replaceAll("\\.[^.]+$", "").toLowerCase();
                                List<Path> fuzzy = Files.list(innerUploadsDir).filter(p -> {
                                    String fn = p.getFileName().toString().toLowerCase();
                                    return fn.contains(baseTarget) || baseTarget.contains(fn.replaceAll("\\.[^.]+$", ""));
                                }).toList();
                                if (!fuzzy.isEmpty()) candidate = fuzzy.get(0);
                            }
                        } catch (Exception ignored2) {}
                    }
                    if (Files.exists(candidate)) {
                        ImageMetadata meta = metadataReader.read(candidate);
                        // Apply modality from frontendAssets metadata
                        if (fAsset.containsKey("metadata")) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> fMeta = (Map<String, Object>) fAsset.get("metadata");
                            if (fMeta != null && fMeta.get("modality") != null) {
                                meta.setModality(String.valueOf(fMeta.get("modality")).toUpperCase());
                            }
                            if (fMeta != null && fMeta.get("acquisitionDate") != null) {
                                meta.setAcquisitionDate(String.valueOf(fMeta.get("acquisitionDate")));
                            }
                        }
                        asset = new ImageAsset(id, candidate.getFileName().toString(), candidate.toAbsolutePath().toString(), meta);
                        imageRegistry.put(id, asset);
                        com.satquery.database.DatabaseManager.saveImageAsset(asset);
                        return asset;
                    }
                }
            }
        }

        return null;
    }
}
