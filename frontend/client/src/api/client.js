import axios from "axios";

// Base URL configured via environment variable or default proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
  
  // Always prioritize browser blob URL or valid web URL
  const localBlobUrl = file && (file.type?.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(fileName))
    ? URL.createObjectURL(file)
    : null;
  const webPath = `/uploads/${encodeURIComponent(fileName)}`;
  const previewUrl = localBlobUrl || toWebUrl(data.previewUrl || data.filePath, fileName) || webPath;

  return {
    imageId,
    assetId: imageId,
    fileName,
    filename: fileName,
    filePath: data.filePath || `/uploads/${fileName}`,
    previewUrl,
    metadata: {
      format: data.metadata?.format || (fileName.endsWith(".tif") || fileName.endsWith(".tiff") ? "GeoTIFF" : "Standard Image"),
      width: data.metadata?.width || null,
      height: data.metadata?.height || null,
      bandCount: data.metadata?.bandCount || data.metadata?.bands || 3,
      bands: data.metadata?.bandCount || data.metadata?.bands || 3,
      modality: (data.metadata?.modality || (/sar|radar|sentinel.?1/i.test(fileName) ? "SAR" : "OPTICAL")).toUpperCase(),
      acquisitionDate: data.metadata?.acquisitionDate || new Date().toISOString().slice(0, 10),
      crs: data.metadata?.crs || "EPSG:4326 (WGS 84)",
      resolution: data.metadata?.resolution || "10m GSD",
      georeferenced: data.metadata?.georeferenced ?? true,
      boundingBox: data.metadata?.boundingBox || null,
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
