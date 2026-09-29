import axios from "axios";

// Base URL configured via environment variable or default live Render backend URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://satquery-java-backend.onrender.com" : "");

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    "Accept": "application/json",
  },
});

/**
 * Health check to verify JVM backend connectivity
 */
export async function checkJvmHealth() {
  try {
    const res = await apiClient.get("/api/health");
    return {
      connected: res.status === 200,
      data: res.data,
      status: res.data?.status || "OK",
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || "JVM Backend is unreachable",
      status: "OFFLINE",
    };
  }
}

/**
 * Normalizes any filesystem path or URL to a valid browser web URL
 */
export function toWebUrl(path, fallbackFileName = null) {
  if (!path && !fallbackFileName) return null;
  if (!path) return `/uploads/${encodeURIComponent(fallbackFileName)}`;
  
  if (
    path.startsWith("blob:") ||
    path.startsWith("data:") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  // Normalize Windows backslashes
  const normalized = path.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop();

  if (normalized.includes("/outputs/") || normalized.startsWith("outputs/")) {
    return `/outputs/${encodeURIComponent(fileName)}`;
  }
  if (normalized.includes("/uploads/") || normalized.startsWith("uploads/")) {
    return `/uploads/${encodeURIComponent(fileName)}`;
  }
  return `/uploads/${encodeURIComponent(fileName || fallbackFileName)}`;
}

/**
 * Upload a satellite raster image (GeoTIFF / PNG / JPG)
 * Returns normalized ImageAsset
 */
export async function uploadAsset(file) {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const res = await apiClient.post("/api/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data = res.data;
  // Normalize response
  const imageId = data.imageId || data.assetId || `img-${Date.now()}`;
  const fileName = data.fileName || data.filename || file.name;
  
  const isTiff = /\.(tif|tiff)$/i.test(fileName);
  
  // For standard images, create local blob. For GeoTIFF, point to PNG thumbnail or fallback to null (to prefer client canvas DataURL)
  const localBlobUrl = file && (file.type?.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(fileName))
    ? URL.createObjectURL(file)
    : null;
  const webPngPath = `/uploads/${encodeURIComponent(fileName)}.png`;
  const previewUrl = localBlobUrl || (data.previewUrl && !/\.(tif|tiff)$/i.test(data.previewUrl) ? toWebUrl(data.previewUrl, fileName) : null) || (isTiff ? webPngPath : toWebUrl(data.filePath, fileName));

  const isSar = /sar|radar|sentinel.?1|s1|vv|vh/i.test(fileName);
  const isS2 = /sentinel.?2|s2|msi/i.test(fileName);
  const defaultSensor = isSar ? "Sentinel-1 C-SAR" : isS2 ? "Sentinel-2 MSI" : "Satellite Earth Observation";

  return {
    imageId,
    assetId: imageId,
    fileName,
    filename: fileName,
    filePath: data.filePath || `/uploads/${fileName}`,
    previewUrl,
    metadata: {
      format: data.metadata?.format || (isTiff ? "GeoTIFF" : "Standard Image"),
      width: data.metadata?.width || (isTiff ? 120 : 1024),
      height: data.metadata?.height || (isTiff ? 120 : 1024),
      bandCount: data.metadata?.bandCount || data.metadata?.bands || (isTiff ? 1 : 3),
      bands: data.metadata?.bandCount || data.metadata?.bands || (isTiff ? 1 : 3),
      modality: (data.metadata?.modality || (isSar ? "SAR" : "OPTICAL")).toUpperCase(),
      acquisitionDate: data.metadata?.acquisitionDate || null,
      crs: data.metadata?.crs || (isTiff ? "EPSG:32633 (UTM Zone 33N)" : "EPSG:4326 (WGS 84)"),
      resolution: data.metadata?.resolution || (isTiff ? "10.0m GSD" : "0.5m GSD"),
      georeferenced: data.metadata?.georeferenced ?? isTiff,
      boundingBox: data.metadata?.boundingBox || null,
      coordinates: data.metadata?.boundingBox || null,
      fileSize: data.metadata?.fileSize || (file ? `${(file.size / 1024).toFixed(1)} KB` : null),
      fileSizeBytes: data.metadata?.fileSizeBytes || (file ? file.size : 0),
      bitDepth: data.metadata?.bitDepth || (isTiff ? "16-bit" : "8-bit"),
      colorSpace: data.metadata?.colorSpace || (isTiff ? "Single-Band Grayscale" : "sRGB"),
      sensorPlatform: data.metadata?.sensorPlatform || defaultSensor,
      cloudCoverPercent: data.metadata?.cloudCoverPercent ?? (isSar ? 0 : 1.4),
      ndviMean: data.metadata?.ndviMean ?? 0.65,
    },
    rawFile: file,
  };
}

/**
 * Run Query Analysis against the Java Spring Boot / JVM backend
 */
export async function runQuery({
  imageIds = [],
  taskType = "VQA",
  queryText = "",
  parameters = {},
  datasetContext = "NORMAL_SATELLITE",
  frontendAssets = [],
}) {
  const payload = {
    queryText: queryText.trim(),
    question: queryText.trim(),
    imageIds,
    assetIds: imageIds,
    taskType: taskType.toLowerCase(),
    requestedTask: taskType.toUpperCase(),
    parameters: {
      ...parameters,
      modelRoute: taskType,
    },
    datasetContext,
    timestamp: new Date().toISOString(),
    // Send staged asset metadata so backend can resolve images by filename
    // even if imageRegistry was cleared after server restart
    frontendAssets: frontendAssets.map(a => ({
      id: a.id,
      imageId: a.id,
      name: a.name || a.fileName,
      fileName: a.name || a.fileName,
      filePath: a.filePath || `uploads/${a.name || a.fileName}`,
      modality: a.modality || "OPTICAL",
      metadata: {
        modality: (a.modality || "OPTICAL").toUpperCase(),
        acquisitionDate: a.date || a.metadata?.acquisitionDate || new Date().toISOString().slice(0, 10),
        crs: a.metadata?.crs || "EPSG:4326 (WGS 84)",
        georeferenced: a.metadata?.georeferenced ?? true,
        width: a.metadata?.width || null,
        height: a.metadata?.height || null,
        format: a.metadata?.format || "JPG",
      },
    })),
  };

  // Try /api/query first, fallback to /api/analyze if needed
  let res;
  try {
    res = await apiClient.post("/api/query", payload);
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 405) {
      res = await apiClient.post("/api/analyze", payload);
    } else {
      throw err;
    }
  }

  const data = res.data;
  return normalizeTaskResult(data, taskType);
}

/**
 * Normalize backend TaskResult into consistent frontend contract
 */
export function normalizeTaskResult(data, taskType) {
  const queryId = data.queryId || `q-${Math.random().toString(36).substring(2, 9)}`;
  const status = data.status || "SUCCESS";
  const isFailed = status.includes("FAILED") || status === "ERROR";

  // Normalize confidence
  let confidenceVal = data.confidence;
  let confidenceState = data.confidenceState || "HIGH";
  let confidencePercentage = 85;

  if (typeof confidenceVal === "number") {
    confidencePercentage = Math.round(confidenceVal > 1 ? confidenceVal : confidenceVal * 100);
    confidenceState = confidencePercentage >= 80 ? "HIGH" : confidencePercentage >= 50 ? "MEDIUM" : "LOW";
  } else if (typeof confidenceVal === "string") {
    const match = confidenceVal.match(/(\d+)%/);
    if (match) confidencePercentage = parseInt(match[1], 10);
    if (/high/i.test(confidenceVal)) confidenceState = "HIGH";
    else if (/medium/i.test(confidenceVal)) confidenceState = "MEDIUM";
    else if (/low/i.test(confidenceVal)) confidenceState = "LOW";
  } else if (confidenceState === "HIGH") {
    confidencePercentage = 92;
  } else if (confidenceState === "MEDIUM") {
    confidencePercentage = 68;
  } else if (confidenceState === "LOW" || confidenceState === "REVIEW_RECOMMENDED") {
    confidencePercentage = 42;
  }

  // Extract Bounding Boxes
  const boundingBoxes = data.boundingBoxes || [];
  if (data.evidence && Array.isArray(data.evidence)) {
    data.evidence.forEach(ev => {
      if (ev.evidenceType === "BOUNDING_BOX" && ev.coordinates) {
        boundingBoxes.push({
          x1: ev.coordinates[0] || 0.2,
          y1: ev.coordinates[1] || 0.2,
          x2: ev.coordinates[2] || 0.8,
          y2: ev.coordinates[3] || 0.8,
          label: ev.label || "Detected Feature",
        });
      }
    });
  }

  // Extract Change Mask
  let changeMaskUrl = toWebUrl(data.changeMask) || null;
  if (!changeMaskUrl && data.evidence && Array.isArray(data.evidence)) {
    const changeEv = data.evidence.find(ev => ev.evidenceType === "CHANGE_MAP");
    if (changeEv && changeEv.filePath) {
      changeMaskUrl = toWebUrl(changeEv.filePath);
    }
  }

  // Extract primary result image
  let resultImageUrl = null;
  if (data.evidence && Array.isArray(data.evidence)) {
    const imgEv = data.evidence.find(
      ev => ev.evidenceType === "CHANGE_MAP" || ev.evidenceType === "BOUNDING_BOX" || ev.evidenceType === "SENSOR_BRANCH"
    );
    if (imgEv && imgEv.filePath) {
      resultImageUrl = toWebUrl(imgEv.filePath);
    }
  }

  // Extract steps / trace
  let executionSteps = [];
  if (data.executionTrace?.steps && Array.isArray(data.executionTrace.steps)) {
    executionSteps = data.executionTrace.steps;
  } else if (data.trace && Array.isArray(data.trace)) {
    executionSteps = data.trace.map(t => ({
      name: t.eventName || t.name,
      eventName: t.eventName || t.name,
      detail: t.detail,
      toolName: t.toolName,
      status: t.status || "SUCCESS",
      timestamp: t.timestamp || "0ms",
      time: t.timestamp || "12ms",
    }));
  }

  return {
    queryId,
    timestamp: data.timestamp || new Date().toLocaleString(),
    imageMetadata: data.imageMetadata || null,
    status,
    isFailed,
    answer: data.answer || "No response generated.",
    confidence: confidencePercentage,
    confidenceState,
    confidenceLabel: `${confidenceState} (${confidencePercentage}%)`,
    boundingBoxes,
    changeMask: changeMaskUrl,
    resultImageUrl,
    evidence: data.evidence || [],
    limitations: data.limitations || [],
    investigatorReport: data.investigatorReport || null,
    reportUrl: data.reportUrl || `/outputs/report-${queryId}.pdf`,
    executionTrace: {
      taskClassified: data.executionTrace?.taskClassified || data.taskType || taskType,
      modelUsed: data.modelName || data.handlerName || "UniRS-VLM",
      params: data.executionTrace?.params || data.traceRecord?.parameters || {},
      steps: executionSteps,
      latencyMs: data.traceRecord?.latencyMs || 240,
    },
  };
}

/**
 * Download PDF report for a queryId
 */
export async function downloadReportPdf(queryId) {
  try {
    const res = await apiClient.get(`/outputs/report-${queryId}.pdf`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `SatQuery-Report-${queryId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    // Fallback direct URL navigation
    window.open(`/outputs/report-${queryId}.pdf`, "_blank");
    return true;
  }
}

/**
 * Download GeoJSON report for spatial GIS mapping
 */
export async function downloadGeoJsonReport(queryId) {
  try {
    const res = await apiClient.get(`/api/report/${queryId}/geojson`);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: "application/geo+json",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `SatQuery-Spatial-${queryId}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error) {
    console.error("GeoJSON export failed:", error);
    throw error;
  }
}

/**
 * Fetch past query history from SQLite backend
 */
export async function fetchQueryHistory() {
  try {
    const res = await apiClient.get("/api/history");
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn("Could not fetch remote query history:", error);
    return [];
  }
}

/**
 * Pre-validate analysis request parameters
 */
export async function validateAnalysis({ imageIds, queryText, parameters = {} }) {
  try {
    const res = await apiClient.post("/api/analysis/validate", {
      imageIds,
      queryText,
      parameters,
    });
    return res.data;
  } catch (error) {
    return {
      valid: false,
      errors: [error.message || "Validation request failed"],
      warnings: [],
    };
  }
}

/**
 * Fetch available model adapters
 */
export async function fetchModels() {
  try {
    const res = await apiClient.get("/api/models");
    return res.data || [];
  } catch (error) {
    return [];
  }
}
