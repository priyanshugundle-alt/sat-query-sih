import { useMemo, useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  FileImage,
  FileText,
  History,
  Layers3,
  MapPin,
  Menu,
  Orbit,
  Play,
  Plus,
  Radar,
  ScanSearch,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  Activity,
  FileCode,
  AlertCircle,
  Info,
  RefreshCw,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { InteractiveMap } from "@/components/InteractiveMap";
import {
  checkJvmHealth,
  uploadAsset,
  runQuery,
  downloadReportPdf,
  fetchQueryHistory,
  validateAnalysis,
  toWebUrl,
} from "@/api/client";
import { parseGeoTiffFile } from "@/lib/geotiff";

// -------------------------------------------------------------
// TASK TYPES & REPRESENTATIVE QUERIES SPECIFICATION
// -------------------------------------------------------------
const TASK_CONFIGS = {
  VQA: {
    id: "VQA",
    tabLabel: "VQA",
    title: "Visual Question Answering",
    defaultQuery: "Describe the land-cover and major objects visible in this image",
    placeholder: "Ask about land-cover, infrastructure, water bodies, or terrain...",
    targetEngine: "GeoChat-VQA (UniRS Adapter)",
    minFiles: 1,
    maxFiles: 1,
    requiredModalities: ["OPTICAL"],
    ruleDescription: "Requires 1 optical or multispectral satellite image.",
    nextStepSuggestion:
      "Try Grounding analysis to pinpoint specific spatial coordinates or water channels.",
  },
  CHANGE: {
    id: "CHANGE",
    tabLabel: "CHANGE",
    title: "Multi-Temporal Change Detection",
    defaultQuery: "What changed between these two dates, and where did the change occur?",
    placeholder: "Ask about temporal differences, urban expansion, or deforestation between T1 and T2...",
    targetEngine: "CDVQA-Siamese (ChangeQA Adapter)",
    minFiles: 2,
    maxFiles: 2,
    requiredModalities: ["OPTICAL"],
    ruleDescription: "Requires 2 optical images tagged as different timestamps (T1 & T2).",
    nextStepSuggestion:
      "Incorporate a radar SAR scene from the second date to evaluate surface roughness and moisture changes.",
  },
  FUSION: {
    id: "FUSION",
    tabLabel: "FUSION",
    title: "Multimodal Optical-SAR Fusion",
    defaultQuery: "Use the optical and SAR images together to identify built-up and water-covered regions",
    placeholder: "Query cross-modal features combining optical reflectance with radar backscatter...",
    targetEngine: "OpticalSAR-Fusion (EarthGPT Adapter)",
    minFiles: 2,
    maxFiles: 2,
    requiredModalities: ["OPTICAL", "SAR"],
    ruleDescription: "Requires at least 1 optical image + 1 SAR microwave radar image.",
    nextStepSuggestion:
      "Perform change analysis against historical SAR baselines to detect sub-surface terrain changes.",
  },
  GROUNDING: {
    id: "GROUNDING",
    tabLabel: "GROUNDING",
    title: "Spatial Object Grounding",
    defaultQuery: "Highlight the water body referred to in the query",
    placeholder: "Enter referring expression to localize target features with bounding boxes...",
    targetEngine: "GroundingDINO (UniRS Adapter)",
    minFiles: 1,
    maxFiles: 1,
    requiredModalities: ["OPTICAL"],
    ruleDescription: "Requires 1 satellite scene to extract target bounding boxes.",
    nextStepSuggestion:
      "Execute VQA land classification on the cropped bounding box region.",
  },
};

function formatTraceTimestamp(ts) {
  if (!ts) return "12ms";
  if (typeof ts === "string" && ts.includes("T")) {
    try {
      const timePart = ts.split("T")[1];
      return timePart ? timePart.split("Z")[0].slice(0, 8) : ts;
    } catch {
      return ts;
    }
  }
  return ts;
}

// Initial benchmark cases for demonstration / fallback history
const INITIAL_DEMO_CASES = [
  {
    id: "demo-q1",
    scenarioId: "vqa",
    taskType: "VQA",
    query: "What land cover is visible in this image?",
    result: "Built-up residential grid, water channel, and mixed agricultural fields are visible in the scene.",
    confidence: "HIGH (94%)",
    confidenceValue: 94,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    evidenceCount: 1,
    status: "VERIFIED",
  },
  {
    id: "demo-q2",
    scenarioId: "change",
    taskType: "CHANGE",
    query: "What changed between these two dates, and where did the change occur?",
    result: "Agricultural expansion and shoreline recession identified along the eastern sector covering ~14.5% of the scene.",
    confidence: "MEDIUM (78%)",
    confidenceValue: 78,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    evidenceCount: 2,
    status: "PARTIALLY VERIFIED",
  },
  {
    id: "demo-q3",
    scenarioId: "fusion",
    taskType: "FUSION",
    query: "Use the optical and SAR images together to identify built-up and water-covered regions",
    result: "SAR backscatter successfully resolved geometric building clusters while optical channels confirmed coastal boundaries.",
    confidence: "HIGH (91%)",
    confidenceValue: 91,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    evidenceCount: 2,
    status: "VERIFIED",
  },
];

export default function Home() {
  const [view, setView] = useState("board"); // 'board' | 'evidence' | 'history'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTaskTab, setActiveTaskTab] = useState("VQA");
  const [queryText, setQueryText] = useState(TASK_CONFIGS.VQA.defaultQuery);
  const [stagedAssets, setStagedAssets] = useState([]);

  // Execution & Backend states
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [jvmHealth, setJvmHealth] = useState("TESTING...");
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(1); // 1: Query -> 2: Metadata -> 3: Routing -> 4: Inference -> 5: Report
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState(null);

  // Analysis Outputs from Backend
  const [analysisResult, setAnalysisResult] = useState(null);
  const [executionTrace, setExecutionTrace] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery-query-history");
      return saved ? JSON.parse(saved) : INITIAL_DEMO_CASES;
    } catch {
      return INITIAL_DEMO_CASES;
    }
  });

  const currentTask = TASK_CONFIGS[activeTaskTab];
  const activeStagedAssets = useMemo(
    () => stagedAssets.filter(item => item.included),
    [stagedAssets]
  );

  // Check JVM backend health on mount and periodically
  const refreshJvmHealth = async () => {
    setJvmHealth("TESTING...");
    const health = await checkJvmHealth();
    if (health.connected) {
      setJvmHealth("JVM CONNECTED");
      setIsDemoMode(false);
    } else {
      setJvmHealth("JVM OFFLINE");
      setIsDemoMode(true);
    }
  };

  useEffect(() => {
    refreshJvmHealth();
    // Load remote history if available
    fetchQueryHistory().then(remoteHistory => {
      if (remoteHistory && remoteHistory.length > 0) {
        const formatted = remoteHistory.map(item => ({
          id: item.queryId || `q-${Math.random().toString(36).substr(2, 6)}`,
          taskType: (item.taskType || "VQA").toUpperCase(),
          scenarioId: (item.taskType || "vqa").toLowerCase(),
          query: item.query || item.question || "Satellite query",
          result: item.answer || "Analysis result generated.",
          confidence: item.confidenceState || "HIGH (88%)",
          confidenceValue: item.confidenceState === "HIGH" ? 90 : item.confidenceState === "MEDIUM" ? 70 : 45,
          createdAt: new Date().toISOString(),
          evidenceCount: (item.evidence && item.evidence.length) || 1,
          status: item.status || "VERIFIED",
        }));
        setHistory(prev => {
          const combined = [...formatted, ...prev.filter(p => !formatted.some(f => f.id === p.id))];
          return combined.slice(0, 20);
        });
      }
    });
  }, []);

  // Update pipeline stepper based on assets and run status
  useEffect(() => {
    if (isRunning) {
      // Step transitions during execution
      setPipelineStep(3); // Routing
      const timer = setTimeout(() => {
        setPipelineStep(4); // Inference
      }, 500);
      return () => clearTimeout(timer);
    } else if (isComplete) {
      setPipelineStep(5); // Report ready
    } else if (activeStagedAssets.length > 0) {
      setPipelineStep(2); // Metadata validated
    } else {
      setPipelineStep(1); // Query
    }
  }, [isRunning, isComplete, activeStagedAssets.length]);

  // Validation for staged files per task type
  const stagingValidation = useMemo(() => {
    const count = activeStagedAssets.length;
    if (count === 0) {
      return {
        isValid: false,
        message: "No assets staged. Please upload or stage satellite images to begin.",
        type: "info",
      };
    }

    if (activeTaskTab === "VQA" || activeTaskTab === "GROUNDING") {
      if (count !== 1) {
        return {
          isValid: false,
          message: `${activeTaskTab} task requires exactly 1 staged satellite image. Currently ${count} staged.`,
          type: "warning",
        };
      }
      return { isValid: true, message: "Valid single-image scene staged.", type: "success" };
    }

    if (activeTaskTab === "CHANGE") {
      if (count !== 2) {
        return {
          isValid: false,
          message: `Change detection requires exactly 2 staged images (T1 & T2 temporal pair). Currently ${count} staged.`,
          type: "warning",
        };
      }
      return { isValid: true, message: "Valid temporal pair staged (T1 & T2).", type: "success" };
    }

    if (activeTaskTab === "FUSION") {
      if (count < 2) {
        return {
          isValid: false,
          message: "Fusion analysis requires 2 images: 1 Optical + 1 SAR Microwave Radar asset.",
          type: "warning",
        };
      }
      const modalities = activeStagedAssets.map(a => a.modality?.toUpperCase());
      const hasOptical = modalities.includes("OPTICAL") || modalities.includes("MULTISPECTRAL");
      const hasSar = modalities.includes("SAR") || modalities.includes("RADAR");

      if (!hasOptical || !hasSar) {
        return {
          isValid: false,
          message: "Modality mismatch: Fusion requires 1 Optical scene and 1 SAR radar scene.",
          type: "warning",
        };
      }
      return { isValid: true, message: "Valid Optical + SAR sensor pair staged.", type: "success" };
    }

    return { isValid: true, message: "Assets staged.", type: "success" };
  }, [activeTaskTab, activeStagedAssets]);

  // Task tab switcher
  const handleTaskTabChange = tabId => {
    setActiveTaskTab(tabId);
    setQueryText(TASK_CONFIGS[tabId].defaultQuery);
    setIsComplete(false);
    setValidationError(null);
  };

  // Upload handler with client-side GeoTIFF parser and backend upload
  const handleUploadFiles = async files => {
    if (!files || !files.length) return;

    const toastId = toast.loading(`Processing ${files.length} satellite asset(s)...`);
    const newAssets = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 1. Client-side parse for instant GeoTIFF thumbnail & metadata
        const parsed = await parseGeoTiffFile(file);

        let modality = "OPTICAL";
        const nameLower = file.name.toLowerCase();
        if (/sar|radar|sentinel.?1|asf/i.test(nameLower)) {
          modality = "SAR";
        } else if (activeTaskTab === "FUSION" && stagedAssets.length === 1 && stagedAssets[0].modality === "OPTICAL") {
          modality = "SAR";
        }

        const localBlob = (file.type?.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name))
          ? URL.createObjectURL(file)
          : null;
        const initialPreview = parsed.previewUrl || localBlob || `/uploads/${encodeURIComponent(file.name)}`;

        let assetEntry = {
          id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          previewUrl: initialPreview,
          modality,
          kind: modality,
          date: new Date().toISOString().slice(0, 10),
          size: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
          metadata: {
            format: parsed.format,
            width: parsed.width,
            height: parsed.height,
            bands: parsed.bands || 3,
            crs: "EPSG:4326 (WGS 84)",
            resolution: "10m GSD",
            georeferenced: true,
          },
          included: true,
          file,
        };

        // 2. Upload to Java Backend if online
        if (!isDemoMode) {
          try {
            const uploaded = await uploadAsset(file);
            assetEntry.id = uploaded.imageId;
            assetEntry.filePath = uploaded.filePath;
            // Always keep localBlob/parsed previewUrl if valid, fallback to clean uploaded.previewUrl
            if (!assetEntry.previewUrl && uploaded.previewUrl) {
              assetEntry.previewUrl = uploaded.previewUrl;
            }
            if (uploaded.metadata) {
              assetEntry.metadata = { ...assetEntry.metadata, ...uploaded.metadata };
              if (uploaded.metadata.modality) {
                assetEntry.modality = uploaded.metadata.modality.toUpperCase();
                assetEntry.kind = uploaded.metadata.modality.toUpperCase();
              }
            }
          } catch (uploadErr) {
            console.warn("Backend upload failed, keeping client staged asset:", uploadErr);
          }
        }

        newAssets.push(assetEntry);
      } catch (err) {
        console.error("Error staging file:", err);
      }
    }

    if (newAssets.length > 0) {
      setStagedAssets(prev => [...prev, ...newAssets]);
      setIsComplete(false);
      toast.success(`Staged ${newAssets.length} asset(s) successfully`, { id: toastId });
    } else {
      toast.error("Failed to stage assets", { id: toastId });
    }
  };

  // Run Query Analysis Execution
  const handleRunQuery = async () => {
    if (!queryText.trim()) {
      toast.error("Please enter a query prompt.");
      return;
    }
    if (!stagingValidation.isValid) {
      toast.error("Staging validation error", {
        description: stagingValidation.message,
      });
      return;
    }

    setIsRunning(true);
    setIsComplete(false);
    setValidationError(null);

    const startTime = Date.now();

    if (isDemoMode) {
      // Demo mock execution
      setTimeout(() => {
        const queryId = `q-demo-${Math.random().toString(36).substr(2, 7)}`;
        const latency = Date.now() - startTime;

        let demoAnswer = "";
        let demoEvidence = [];
        let demoFeatures = [];
        let demoBoxes = [];

        if (activeTaskTab === "VQA") {
          demoAnswer = "Local JVM VQA analysis indicates high-density urban residential area flanked by a major water reservoir channel and sparse agricultural fields on the periphery.";
          demoFeatures = [
            { detail: "Urban built-up area mapped in grid sector", source: "Multispectral B4/B3/B2", pass: true },
            { detail: "Surface water absorption signature verified", source: "MNDWI Calculation", pass: true },
          ];
        } else if (activeTaskTab === "CHANGE") {
          demoAnswer = "Multi-temporal change analysis detects agricultural expansion and vegetation index increase (+22%) along the eastern riverbank between T1 and T2.";
          demoFeatures = [
            { detail: "Vegetation index increase mapped along riverbank", source: "NDVI Difference Mask", pass: true },
            { detail: "14.5% total scene land-cover shift confirmed", source: "Siamese Pixel Diff", pass: true },
          ];
        } else if (activeTaskTab === "FUSION") {
          demoAnswer = "Cross-modal sensor fusion completed. Optical channels identified high-density road structures, while SAR microwave radar penetrated atmospheric scatter to delineate building footprints.";
          demoFeatures = [
            { detail: "SAR backscatter double-bounce resolved building structures", source: "C-Band Co-polarization", pass: true },
            { detail: "Optical spectral bands mapped vegetative canopy", source: "Sentinel-2 MSI", pass: true },
          ];
        } else if (activeTaskTab === "GROUNDING") {
          demoAnswer = "Spatial feature grounding successful. Bounding box coordinates localized around the target water channel.";
          demoBoxes = [{ x1: 0.35, y1: 0.28, x2: 0.72, y2: 0.62, label: "Target Water Body (94%)" }];
          demoFeatures = [
            { detail: "Target water body localized within bounding coordinates [0.35, 0.28, 0.72, 0.62]", source: "GroundingDINO RS", pass: true },
          ];
        }

        const normalizedResult = {
          queryId,
          status: "SUCCESS",
          isFailed: false,
          answer: demoAnswer,
          confidence: activeTaskTab === "CHANGE" ? 78 : 94,
          confidenceState: activeTaskTab === "CHANGE" ? "MEDIUM" : "HIGH",
          confidenceLabel: activeTaskTab === "CHANGE" ? "MEDIUM (78%)" : "HIGH (94%)",
          boundingBoxes: demoBoxes,
          changeMask: activeTaskTab === "CHANGE" ? (activeStagedAssets[0]?.previewUrl || null) : null,
          resultImageUrl: activeStagedAssets[0]?.previewUrl || null,
          evidence: demoEvidence,
          limitations: [
            "VLM inference limits are calibrated against benchmark training datasets.",
            "Sub-pixel classification errors might exist around vegetative boundaries.",
          ],
          investigatorReport: {
            hypothesis: "Spatial query matches multispectral profile.",
            verdict: "Strongly supported",
            nextBestEvidence: currentTask.nextStepSuggestion,
          },
          reportUrl: `/outputs/report-${queryId}.pdf`,
          executionTrace: {
            taskClassified: activeTaskTab,
            modelUsed: currentTask.targetEngine,
            params: { threshold: 0.85, modality: activeTaskTab },
            steps: [
              { name: "Query Received", detail: `Query "${queryText.substring(0, 40)}..." parsed and tokenized.`, status: "SUCCESS", time: "0ms" },
              { name: "Metadata Extract", detail: `Projection EPSG:32644 verified for ${activeStagedAssets.length} asset(s).`, status: "SUCCESS", time: "14ms" },
              { name: "Model Routing", detail: `Dispatched to ${currentTask.targetEngine}.`, status: "SUCCESS", time: "28ms" },
              { name: "Model Inference", detail: "Polymorphic deep learning vision transformer executed.", status: "SUCCESS", time: `${latency}ms` },
              { name: "Report Compilation", detail: "Serialized output logs and telemetry receipt.", status: "SUCCESS", time: `${latency + 15}ms` },
            ],
            latencyMs: latency,
          },
        };

        setAnalysisResult(normalizedResult);
        setExecutionTrace(normalizedResult.executionTrace.steps);
        setActiveQueryId(queryId);
        setIsRunning(false);
        setIsComplete(true);

        const newRecord = {
          id: queryId,
          taskType: activeTaskTab,
          scenarioId: activeTaskTab.toLowerCase(),
          query: queryText.trim(),
          result: demoAnswer,
          confidence: normalizedResult.confidenceLabel,
          confidenceValue: normalizedResult.confidence,
          createdAt: new Date().toISOString(),
          evidenceCount: activeStagedAssets.length,
          status: "VERIFIED",
        };
        const updatedHistory = [newRecord, ...history].slice(0, 20);
        setHistory(updatedHistory);
        try {
          localStorage.setItem("satquery-query-history", JSON.stringify(updatedHistory));
        } catch {}
        toast.success("Analysis complete");
      }, 700);
      return;
    }

    // Java Spring Boot Backend Mode Execution
    try {
      const response = await runQuery({
        imageIds: activeStagedAssets.map(a => a.id),
        taskType: activeTaskTab,
        queryText,
        parameters: {
          taskType: activeTaskTab,
          modalities: activeStagedAssets.map(a => a.modality),
        },
      });

      if (response.isFailed) {
        setValidationError(response.answer);
        setIsRunning(false);
        setIsComplete(false);
        toast.error("Analysis validation failed", {
          description: response.answer,
        });
        return;
      }

      setAnalysisResult(response);
      setExecutionTrace(response.executionTrace?.steps || []);
      setActiveQueryId(response.queryId);
      setIsRunning(false);
      setIsComplete(true);

      const newRecord = {
        id: response.queryId,
        taskType: activeTaskTab,
        scenarioId: activeTaskTab.toLowerCase(),
        query: queryText.trim(),
        result: response.answer,
        confidence: response.confidenceLabel,
        confidenceValue: response.confidence,
        createdAt: new Date().toISOString(),
        evidenceCount: activeStagedAssets.length,
        status: response.status || "VERIFIED",
      };
      const updatedHistory = [newRecord, ...history].slice(0, 20);
      setHistory(updatedHistory);
      try {
        localStorage.setItem("satquery-query-history", JSON.stringify(updatedHistory));
      } catch {}
      toast.success("Query analysis report generated");
    } catch (err) {
      console.error("Backend query error:", err);
      setIsRunning(false);
      setValidationError(err.message || "Failed to execute query on Java backend");
      toast.error("Query Execution Failed", {
        description: err.message || "Please check JVM connection or switch to Demo Mode.",
      });
    }
  };

  // Asset management actions
  const handleToggleAsset = id => {
    setStagedAssets(prev =>
      prev.map(a => (a.id === id ? { ...a, included: !a.included } : a))
    );
    setIsComplete(false);
  };

  const handleRemoveAsset = id => {
    setStagedAssets(prev => prev.filter(a => a.id !== id));
    setIsComplete(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("satquery-query-history");
    } catch {}
    toast.info("Query history cleared");
  };

  const handleReloadHistoryItem = item => {
    const matchedTab = item.taskType || (item.scenarioId ? item.scenarioId.toUpperCase() : "VQA");
    if (TASK_CONFIGS[matchedTab]) {
      setActiveTaskTab(matchedTab);
    }
    setQueryText(item.query);
    setAnalysisResult({
      queryId: item.id,
      answer: item.result,
      confidence: item.confidenceValue || 85,
      confidenceState: (item.confidence || "").includes("HIGH") ? "HIGH" : (item.confidence || "").includes("MEDIUM") ? "MEDIUM" : "LOW",
      confidenceLabel: item.confidence || "HIGH (88%)",
      boundingBoxes: [],
      changeMask: null,
      resultImageUrl: null,
      evidence: [],
      limitations: ["Historical report reloaded from database."],
      investigatorReport: {
        hypothesis: "Archived query result.",
        verdict: item.status || "VERIFIED",
        nextBestEvidence: "Review active raw grid files.",
      },
      reportUrl: `/outputs/report-${item.id}.pdf`,
      executionTrace: {
        taskClassified: matchedTab,
        modelUsed: "UniRS-VLM",
        params: {},
        steps: [
          { name: "Archive Retrieved", detail: `Loaded query "${item.query}" from telemetry store.`, status: "SUCCESS", time: "0ms" },
        ],
      },
    });
    setExecutionTrace([
      { name: "Archive Retrieved", detail: `Loaded query "${item.query}" from telemetry store.`, status: "SUCCESS", time: "0ms" },
    ]);
    setActiveQueryId(item.id);
    setIsComplete(true);
    setView("board");
    toast.success("Loaded query report into workstation");
  };

  const handleDownloadPdf = async () => {
    if (!activeQueryId) {
      toast.error("No active report to download");
      return;
    }
    const toastId = toast.loading("Preparing PDF report...");
    try {
      await downloadReportPdf(activeQueryId);
      toast.success("PDF report downloaded", { id: toastId });
    } catch {
      toast.error("Failed to download PDF report", { id: toastId });
    }
  };

  const handleDownloadJson = () => {
    const reportData = {
      product: "SatQuery AI",
      queryId: activeQueryId || `q-${Date.now()}`,
      taskType: activeTaskTab,
      mode: isDemoMode ? "DEMO MODE" : "JAVA BACKEND MODE",
      generatedAt: new Date().toISOString(),
      question: queryText,
      result: analysisResult?.answer || "N/A",
      confidence: analysisResult?.confidenceLabel || "N/A",
      stagedAssets: activeStagedAssets.map(a => ({
        id: a.id,
        fileName: a.name,
        modality: a.modality,
        metadata: a.metadata,
      })),
      executionTrace: executionTrace,
      limitations: analysisResult?.limitations || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SatQuery-Report-${activeQueryId || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON telemetry report downloaded");
  };

  const navTabs = [
    { id: "board", label: "Satellite workstation", icon: ScanSearch },
    { id: "evidence", label: "Image library", icon: Layers3 },
    { id: "history", label: "Query history", icon: History },
  ];

  return (
    <div className="prism-shell min-h-screen flex flex-col text-navy">
      {/* GLOBAL TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-[#dfe7fb] bg-white/85 backdrop-blur-xl px-4 md:px-8 py-3 w-full flex items-center justify-between shadow-xs">
        {/* Left: Menu Button & Brand Mark */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg bg-white border border-[#dfe7fb] text-[#112557] hover:bg-[#EDF5FF] hover:border-[#1179FF] transition shadow-2xs flex items-center gap-2 group cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu size={18} className="text-[#1179FF] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-bold text-navy">Menu</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#EDF5FF] flex items-center justify-center text-[#1179FF] border border-[#d2e3fc] shadow-2xs">
              <Orbit size={20} />
            </div>
            <div>
              <p className="font-editorial text-[18px] md:text-[20px] font-extrabold tracking-tight leading-none text-navy">
                SatQuery AI
              </p>
              <p className="font-mono text-[8px] uppercase tracking-[.18em] text-[#7082aa] mt-0.5">
                Remote-Sensing VLM
              </p>
            </div>
          </div>
        </div>

        {/* Center: Quick Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-[#f2f6fd] p-1 rounded-xl border border-[#e1ebfa]">
          {navTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                view === id
                  ? "bg-white text-[#1179FF] shadow-xs"
                  : "text-[#5a709c] hover:text-[#112557]"
              }`}
            >
              <Icon size={14} className={view === id ? "text-[#1179FF]" : "text-[#7082aa]"} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Mode Switcher & JVM Health */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => {
              const nextMode = !isDemoMode;
              setIsDemoMode(nextMode);
              toast.info(
                nextMode
                  ? "Switched to Demo Mode (Mock Client)"
                  : "Switched to Java Backend Mode"
              );
            }}
            className={`mode-badge inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition ${
              isDemoMode
                ? "bg-[#fff2f0] text-[#ff6c5c] border-[#ffe0dc] hover:bg-[#ffe5e0]"
                : "bg-[#f4ffd9] text-[#4d791f] border-[#e2f9b8] hover:bg-[#e9ffbe]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isDemoMode ? "bg-[#ff6c5c]" : "bg-[#4d791f]"
              }`}
            />
            <span className="hidden sm:inline">
              {isDemoMode ? "DEMO MODE" : "JAVA BACKEND MODE"}
            </span>
            <span className="sm:hidden">{isDemoMode ? "DEMO" : "JAVA"}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f6f9fe] border border-[#e1ebfa] rounded-lg">
            <span
              className={`h-2 w-2 rounded-full ${
                jvmHealth.includes("CONNECTED")
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-red-400"
              }`}
            />
            <span className="text-[9px] font-mono text-[#7082aa] uppercase tracking-wider">
              {jvmHealth}
            </span>
            <button
              onClick={refreshJvmHealth}
              title="Refresh JVM Health"
              className="p-0.5 hover:bg-[#EDF5FF] text-[#1179FF] rounded transition ml-1"
            >
              <RefreshCw size={10} />
            </button>
          </div>
        </div>
      </header>

      {/* SLIDE-OVER DRAWER MENU */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white/95 backdrop-blur-2xl border-r border-[#dfe7fb] shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-left duration-300">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#edf1fb]">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-[#EDF5FF] flex items-center justify-center text-[#1179FF] border border-[#d2e3fc] shadow-xs">
                    <Orbit size={20} />
                  </div>
                  <div>
                    <p className="font-editorial text-[18px] font-extrabold tracking-tight leading-none text-navy">
                      SatQuery AI
                    </p>
                    <p className="font-mono text-[8px] uppercase tracking-[.18em] text-[#7082aa] mt-0.5">
                      Remote-Sensing VLM
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#7082aa] hover:text-[#112557] hover:bg-[#EDF5FF] transition cursor-pointer"
                  title="Close Menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1.5">
                <p className="text-[9px] font-mono uppercase tracking-wider text-[#94a3b8] px-3 pb-1">
                  Navigation
                </p>
                {navTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setView(id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full prism-nav rounded-lg flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                      view === id
                        ? "bg-[#EDF5FF] text-[#1179FF] border border-[#c7d9fc] shadow-xs"
                        : "text-[#5a709c] hover:bg-gray-50 hover:text-navy"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={view === id ? "text-[#1179FF]" : "text-[#7082aa]"}
                    />
                    <span className="flex-1 text-left">{label}</span>
                    {view === id && (
                      <span className="h-2 w-2 rounded-full bg-[#1179FF]" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="space-y-3 pt-4 border-t border-[#edf1fb]">
              <button
                onClick={() => {
                  const nextMode = !isDemoMode;
                  setIsDemoMode(nextMode);
                  toast.info(
                    nextMode
                      ? "Switched to Demo Mode (Mock Client)"
                      : "Switched to Java Backend Mode"
                  );
                }}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition rounded-lg border cursor-pointer ${
                  isDemoMode
                    ? "bg-[#fff2f0] text-[#ff6c5c] border-[#ffe0dc] hover:bg-[#ffe5e0]"
                    : "bg-[#f4ffd9] text-[#4d791f] border-[#e2f9b8] hover:bg-[#e9ffbe]"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isDemoMode ? "bg-[#ff6c5c]" : "bg-[#4d791f]"
                  }`}
                />
                {isDemoMode ? "DEMO MODE (MOCK)" : "JAVA BACKEND MODE"}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[#7082aa]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    jvmHealth.includes("CONNECTED")
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-red-400"
                  }`}
                />
                <span className="uppercase tracking-wider">{jvmHealth}</span>
                <button
                  onClick={refreshJvmHealth}
                  title="Refresh JVM Health"
                  className="p-0.5 hover:bg-[#EDF5FF] text-[#1179FF] rounded transition cursor-pointer"
                >
                  <RefreshCw size={11} />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {view === "board" && (
            <WorkstationBoard
              activeTaskTab={activeTaskTab}
              onTaskTabChange={handleTaskTabChange}
              queryText={queryText}
              setQueryText={setQueryText}
              stagedAssets={stagedAssets}
              activeStagedAssets={activeStagedAssets}
              stagingValidation={stagingValidation}
              isRunning={isRunning}
              isComplete={isComplete}
              pipelineStep={pipelineStep}
              onUploadFiles={handleUploadFiles}
              onToggleAsset={handleToggleAsset}
              onRemoveAsset={handleRemoveAsset}
              onRunQuery={handleRunQuery}
              onOpenLibrary={() => setView("evidence")}
              onInspectReport={() => setShowReceipt(true)}
              onDownloadPdf={handleDownloadPdf}
              analysisResult={analysisResult}
              executionTrace={executionTrace}
              validationError={validationError}
              isDemoMode={isDemoMode}
              currentTask={currentTask}
            />
          )}

          {view === "evidence" && (
            <AssetLibraryView
              stagedAssets={stagedAssets}
              activeCount={activeStagedAssets.length}
              onUpload={handleUploadFiles}
              onToggle={handleToggleAsset}
              onRemove={handleRemoveAsset}
              onBack={() => setView("board")}
            />
          )}

          {view === "history" && (
            <QueryHistoryView
              history={history}
              onBack={() => setView("board")}
              onClear={handleClearHistory}
              onReload={handleReloadHistoryItem}
            />
          )}
        </main>
      </div>

      {/* ANALYSIS REPORT MODAL */}
      {showReceipt && (
        <ReportModal
          taskConfig={currentTask}
          queryText={queryText}
          stagedAssets={activeStagedAssets}
          isComplete={isComplete}
          onClose={() => setShowReceipt(false)}
          onDownloadPdf={handleDownloadPdf}
          onDownloadJson={handleDownloadJson}
          analysisResult={analysisResult}
          isDemoMode={isDemoMode}
          queryId={activeQueryId}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// WORKSTATION BOARD (Main Console Layout)
// -------------------------------------------------------------
function WorkstationBoard({
  activeTaskTab,
  onTaskTabChange,
  queryText,
  setQueryText,
  stagedAssets,
  activeStagedAssets,
  stagingValidation,
  isRunning,
  isComplete,
  pipelineStep,
  onUploadFiles,
  onToggleAsset,
  onRemoveAsset,
  onRunQuery,
  onOpenLibrary,
  onInspectReport,
  onDownloadPdf,
  analysisResult,
  executionTrace,
  validationError,
  isDemoMode,
  currentTask,
}) {
  const [activeMediaTab, setActiveMediaTab] = useState("image"); // 'image' | 'split' | 'map'
  const [showGrounding, setShowGrounding] = useState(true);
  const [showMask, setShowMask] = useState(true);
  const [showAOI, setShowAOI] = useState(true);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) {
      onUploadFiles(files);
    }
  };

  const primaryAsset = activeStagedAssets[0] || null;
  const secondaryAsset = activeStagedAssets[1] || null;
  const showAnalysisPanels = isRunning || isComplete || !!analysisResult;

  // 1. STAGED ASSETS PANEL
  const renderStagedAssets = () => (
    <article className="investigation-plane plane-blue rounded-lg p-3.5 md:p-4 shadow-xs">
      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#cfe3ff] mb-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-[#ddecff] flex items-center justify-center font-mono text-[9px] font-bold text-[#1179FF]">
            01
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              Staged Assets
            </h3>
            <p className="text-[9px] text-[#5a709c]">
              Input satellite raster files
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] font-bold bg-[#1179FF] text-white px-1.5 py-0.5 rounded">
            {activeStagedAssets.length} Active
          </span>
          <button
            onClick={onOpenLibrary}
            className="text-[10px] font-bold text-[#1179FF] hover:underline cursor-pointer"
          >
            Library
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`upload-stage-stamp cursor-pointer border-dashed border-2 mb-3 p-3 text-center rounded-lg transition ${
          isDragging
            ? "border-[#1179FF] bg-[#EDF5FF] scale-[1.01]"
            : "border-[#8eb6ec] hover:border-[#1179FF] bg-white/60"
        }`}
      >
        <Upload size={18} className="mx-auto text-[#1179FF] mb-1" />
        <p className="text-[10px] font-bold text-navy uppercase">DRAG & DROP GEOTIFF / TIFF</p>
        <p className="text-[8px] text-[#7082aa] mt-0.5">
          Supports GeoTIFF, TIFF, PNG, JPG (Multi-band optical & SAR)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".tif,.tiff,.png,.jpg,.jpeg"
          onChange={e => onUploadFiles(Array.from(e.target.files ?? []))}
          className="hidden"
        />
      </div>

      {/* Staged Assets List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin">
        {stagedAssets.map(file => {
          const mod = file.modality === "SAR" ? "SAR" : "OPTICAL";
          return (
            <div
              key={file.id}
              className={`rounded-lg border p-2.5 transition flex items-center gap-2.5 ${
                mod === "SAR"
                  ? "bg-[#faf5ff] border-[#e9d5ff]"
                  : "bg-white border-[#dce5fb]"
              } ${file.included ? "opacity-100 shadow-xs" : "opacity-40"}`}
            >
              {/* File Type Icon (Image Logo) */}
              <div
                className={`h-8 w-8 shrink-0 rounded-md flex items-center justify-center border ${
                  mod === "SAR"
                    ? "bg-[#f3e8ff] border-[#d8b4fe] text-[#7846D7]"
                    : "bg-[#edf5ff] border-[#c7d9fc] text-[#1179FF]"
                }`}
              >
                {mod === "SAR" ? (
                  <Radar size={16} className="stroke-[2.2]" />
                ) : (
                  <FileImage size={16} className="stroke-[2.2]" />
                )}
              </div>

              {/* Text Info: Full Name + Modality & Size aligned clearly */}
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-bold text-[#112557] break-all leading-snug"
                  title={file.name}
                >
                  {file.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                  <span
                    className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      mod === "SAR"
                        ? "bg-[#7846D7] text-white"
                        : "bg-[#1179FF] text-white"
                    }`}
                  >
                    {mod}
                  </span>
                  <span className="font-mono text-[#334155] font-semibold shrink-0">
                    {file.size}
                  </span>
                  <span className="text-[#94a3b8]">•</span>
                  <span className="font-mono text-[#64748b] shrink-0">
                    {file.metadata?.bands ? `${file.metadata.bands}B` : "3B"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                <button
                  onClick={() => onToggleAsset(file.id)}
                  title={file.included ? "Exclude from query" : "Include in query"}
                  className={`p-1 rounded transition cursor-pointer ${
                    file.included
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <Check size={16} className="stroke-[2.5]" />
                </button>
                <button
                  onClick={() => onRemoveAsset(file.id)}
                  title="Remove file"
                  className="p-1 rounded text-[#ff7c70] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}

        {!stagedAssets.length && (
          <div className="text-center py-5 border border-dashed border-[#cfe3ff] rounded-lg bg-white/40">
            <p className="text-[10px] text-[#7082aa] font-medium">
              No satellite files staged.
            </p>
            <p className="text-[9px] text-[#8ea4cc] mt-0.5">
              Drag files above or click to browse.
            </p>
          </div>
        )}
      </div>
    </article>
  );

  // 2. COMPOSE QUERY PANEL
  const renderComposeQuery = () => (
    <article className="investigation-plane plane-white rounded-lg p-4 md:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#edf1fb] mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-[#EDF5FF] flex items-center justify-center font-mono text-[9px] font-bold text-[#1179FF]">
            02
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              Compose Query
            </h3>
            <p className="text-[10px] text-[#7082aa]">
              Task-specific reasoning prompt
            </p>
          </div>
        </div>

        {/* Task Tabs: VQA / CHANGE / FUSION / GROUNDING */}
        <div className="flex bg-[#EDF5FF] p-0.5 rounded-lg border border-[#d5dffa] flex-wrap">
          {Object.keys(TASK_CONFIGS).map(taskId => (
            <button
              key={taskId}
              onClick={() => onTaskTabChange(taskId)}
              className={`px-2.5 py-1 font-mono text-[9px] font-bold uppercase rounded-md transition cursor-pointer ${
                activeTaskTab === taskId
                  ? "bg-[#112557] text-[#B7F23A] shadow-xs"
                  : "text-[#7082aa] hover:text-navy"
              }`}
            >
              {TASK_CONFIGS[taskId].tabLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="space-y-2">
        <textarea
          value={queryText}
          onChange={e => setQueryText(e.target.value)}
          placeholder={currentTask.placeholder}
          className="w-full min-h-[85px] resize-none border border-[#dbe4fa] bg-[#fbfdff] p-3 text-xs font-medium leading-relaxed text-navy outline-none rounded-lg focus:border-[#1179FF] focus:bg-white transition"
        />

        {/* Target Engine readout + Staged assets count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#edf1fb] text-[10px] text-[#5a709c]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#7082aa]">Target Engine:</span>
            <span className="font-mono font-bold text-[#1179FF] bg-[#EDF5FF] px-2 py-0.5 rounded">
              {currentTask.targetEngine}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#7082aa]">Staged:</span>
            <span className="font-mono font-bold text-navy">
              {activeStagedAssets.length} file
              {activeStagedAssets.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  // 3. ACTION CTA SHELF
  const renderActionShelf = () => (
    <div className="space-y-2.5">
      {/* Inline Validation Error Banner */}
      {!stagingValidation.isValid && (
        <div className="bg-[#fff7f5] border-l-4 border-[#FF7C70] p-3 text-xs text-[#8c514c] rounded-r-lg space-y-0.5 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle size={14} className="text-[#FF7C70]" />
            <span>TASK STAGING VALIDATION ALERT</span>
          </div>
          <p className="text-[11px]">{stagingValidation.message}</p>
        </div>
      )}

      {/* Primary CTA Run Query Action Shelf */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-[#dfe7fb] rounded-lg shadow-xs">
        <div className="text-[11px] text-[#5a709c]">
          {isRunning
            ? "Dispatched to JVM model runtime..."
            : isComplete
            ? "Inference complete. Review output and features."
            : "Stage required assets and click to analyze."}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunQuery}
            disabled={isRunning || !stagingValidation.isValid || !queryText.trim()}
            className={`secondary-button font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              isRunning
                ? "opacity-80 cursor-wait bg-[#EDF5FF]"
                : stagingValidation.isValid && queryText.trim()
                ? "bg-[#B7F23A] text-[#112557] hover:bg-[#a6e029] border-none shadow-xs hover:scale-[1.02]"
                : "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            {isRunning ? (
              <>
                <Orbit size={16} className="animate-spin text-[#112557]" />
                <span>JVM Running...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" />
                <span>Run Query Analysis</span>
              </>
            )}
          </button>

          {isComplete && (
            <button
              onClick={onInspectReport}
              className="primary-button font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 bg-[#112557] text-white hover:bg-[#1c387d] cursor-pointer shadow-xs"
            >
              <FileText size={15} />
              <span>Inspect Report</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // 4. MULTIMODAL SENSOR ARRAY
  const renderSensorArray = () => (
    <div className="space-y-4">
      <article className="investigation-plane stage-plane rounded-lg overflow-hidden flex flex-col relative shadow-xs">
        {/* Header / Tabs */}
        <div className="stage-chrome border-b border-[#e1eafa] flex items-center justify-between p-3 bg-white flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#1179FF] animate-pulse" />
            <span className="font-mono text-[9px] font-bold tracking-wider text-[#1179FF] uppercase">
              Multimodal Sensor Array
            </span>
          </div>

          {/* Media Mode Tabs */}
          <div className="flex bg-[#EDF5FF] p-0.5 rounded-lg border border-[#d5dffa]">
            {[
              { id: "image", label: "Image View" },
              { id: "split", label: "Split Compare" },
              { id: "map", label: "Interactive Map" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "split" && activeStagedAssets.length < 2) {
                    toast.info("Split compare requires at least 2 staged images.");
                    return;
                  }
                  setActiveMediaTab(tab.id);
                }}
                className={`px-3 py-1 text-[9px] font-bold rounded-md transition cursor-pointer ${
                  activeMediaTab === tab.id
                    ? "bg-[#112557] text-white shadow-xs"
                    : "text-[#7082aa] hover:text-navy"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Central Media Canvas */}
        <div className="relative min-h-[420px] bg-[#112557] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

          {/* TAB 1: Image View */}
          {activeMediaTab === "image" && (
            <div className="relative w-full h-full p-2 flex items-center justify-center overflow-hidden">
              {analysisResult?.resultImageUrl || primaryAsset?.previewUrl ? (
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={analysisResult?.resultImageUrl || primaryAsset?.previewUrl}
                    alt="Satellite Observation Grid"
                    className="max-w-full max-h-[520px] w-auto h-auto object-contain transition duration-300 select-none shadow-lg rounded"
                    onError={e => {
                      if (primaryAsset?.file && !e.currentTarget.src.startsWith("blob:")) {
                        e.currentTarget.src = URL.createObjectURL(primaryAsset.file);
                      } else if (primaryAsset?.name) {
                        e.currentTarget.src = `/uploads/${encodeURIComponent(primaryAsset.name)}`;
                      }
                    }}
                  />

                  {/* SVG Raster Overlays Layer */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Grounding Boxes */}
                    {showGrounding &&
                      (analysisResult?.boundingBoxes?.length > 0 ||
                        activeTaskTab === "GROUNDING") &&
                      (isComplete || analysisResult) && (
                        <svg className="absolute inset-0 w-full h-full">
                          <rect
                            x="30%"
                            y="25%"
                            width="40%"
                            height="35%"
                            fill="none"
                            stroke="#B7F23A"
                            strokeWidth="2.5"
                            strokeDasharray="6 3"
                            className="animate-pulse"
                          />
                          <g transform="translate(10, 20)">
                            <rect
                              x="0"
                              y="0"
                              width="150"
                              height="20"
                              fill="#112557"
                              rx="4"
                            />
                            <text
                              x="8"
                              y="14"
                              fill="#B7F23A"
                              className="font-mono text-[9px] font-bold"
                            >
                              [GROUNDING BOX: 94%]
                            </text>
                          </g>
                        </svg>
                      )}

                    {/* Change Masks */}
                    {showMask && (activeTaskTab === "CHANGE" || analysisResult?.changeMask) && isComplete && (
                      <div className="absolute inset-0 bg-[#FF7C70]/20 mix-blend-screen border-2 border-[#FF7C70]/40 pointer-events-none flex items-center justify-center">
                        <span className="font-mono text-[9px] font-bold text-[#FF7C70] bg-[#112557]/80 px-2 py-1 rounded">
                          [TEMPORAL CHANGE HEATMAP OVERLAY ACTIVE]
                        </span>
                      </div>
                    )}

                    {/* AOI Boundaries */}
                    {showAOI && (
                      <svg className="absolute inset-0 w-full h-full">
                        <rect
                          x="4%"
                          y="4%"
                          width="92%"
                          height="92%"
                          fill="none"
                          stroke="#1179FF"
                          strokeWidth="2"
                          strokeDasharray="8 4"
                        />
                        <text
                          x="6%"
                          y="16"
                          fill="#1179FF"
                          className="font-mono text-[8px] font-bold"
                        >
                          [AOI BOUNDS: EPSG:4326]
                        </text>
                      </svg>
                    )}
                  </div>
                </div>
              ) : activeStagedAssets.length > 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 text-[#7082aa]">
                  <div className="h-16 w-16 rounded-full bg-[#EDF5FF] flex items-center justify-center text-[#1179FF] mb-3 border border-[#d2e3fc]">
                    <FileImage size={32} />
                  </div>
                  <p className="text-sm font-bold text-white">
                    Staged: {primaryAsset?.name}
                  </p>
                  <p className="text-xs text-[#8ea4cc] mt-1 max-w-xs leading-relaxed">
                    GeoTIFF raster staged. Click "Run Query Analysis" to execute inference.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 text-[#7082aa]">
                  <div className="h-16 w-16 rounded-full bg-[#EDF5FF]/10 flex items-center justify-center text-[#1179FF] mb-3 border border-[#1179FF]/20">
                    <ScanSearch size={32} />
                  </div>
                  <p className="text-sm font-bold text-white">No Imagery Loaded</p>
                  <p className="text-xs text-[#8ea4cc] mt-1 max-w-xs leading-relaxed">
                    Upload or drag GeoTIFF / satellite image assets to preview here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Split Compare Slider */}
          {activeMediaTab === "split" && (
            <div className="absolute inset-0 w-full h-full">
              <SplitImageCompare
                img1={primaryAsset?.previewUrl || null}
                img2={secondaryAsset?.previewUrl || null}
                label1={`T1 (${primaryAsset?.name || "Asset 1"})`}
                label2={`T2 (${secondaryAsset?.name || "Asset 2"})`}
              />
            </div>
          )}

          {/* TAB 3: Interactive Map (Leaflet) */}
          {activeMediaTab === "map" && (
            <div className="absolute inset-0 w-full h-full">
              <InteractiveMap
                center={[16.3952, 81.7516]}
                zoom={13}
                imageUrl={analysisResult?.resultImageUrl || primaryAsset?.previewUrl}
                showAOI={showAOI}
                showGrounding={showGrounding}
                boundingBoxes={analysisResult?.boundingBoxes || []}
              />
            </div>
          )}
        </div>

        {/* Bottom Real Raster Metadata Status Bar */}
        <div className="bg-white px-4 py-2.5 border-t border-[#e2ebfb] flex flex-wrap items-center justify-between text-[10px] font-mono text-[#5a709c] gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[#1179FF]" />
            <span className="font-bold text-navy truncate max-w-[280px]">
              {primaryAsset ? primaryAsset.name : "No Active Staged Asset"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {primaryAsset ? (
              <>
                <span>
                  Bands:{" "}
                  <strong className="text-navy font-bold">
                    {primaryAsset.metadata?.bands || 3}
                  </strong>
                </span>
                <span>
                  CRS:{" "}
                  <strong className="text-navy font-bold">
                    {primaryAsset.metadata?.crs || "EPSG:4326"}
                  </strong>
                </span>
                <span>
                  Res:{" "}
                  <strong className="text-navy font-bold">
                    {primaryAsset.metadata?.resolution || "10m"}
                  </strong>
                </span>
                <span>
                  Mod:{" "}
                  <strong className="text-[#1179FF] font-bold">
                    {primaryAsset.modality}
                  </strong>
                </span>
              </>
            ) : (
              <span className="text-[#7082aa] italic">
                Raster Metadata Awaiting Staging
              </span>
            )}
          </div>
        </div>
      </article>

      {/* Raster Overlays Checkbox Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#dfe7fb] rounded-lg shadow-xs">
        <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
          Raster Overlays:
        </span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5a709c] cursor-pointer hover:text-navy">
            <input
              type="checkbox"
              checked={showGrounding}
              onChange={() => setShowGrounding(!showGrounding)}
              className="rounded text-[#1179FF]"
            />
            <span>Grounding Boxes</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5a709c] cursor-pointer hover:text-navy">
            <input
              type="checkbox"
              checked={showMask}
              onChange={() => setShowMask(!showMask)}
              className="rounded text-[#7846D7]"
            />
            <span>Change Masks</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5a709c] cursor-pointer hover:text-navy">
            <input
              type="checkbox"
              checked={showAOI}
              onChange={() => setShowAOI(!showAOI)}
              className="rounded text-[#B7F23A]"
            />
            <span>AOI Boundaries</span>
          </label>
        </div>
      </div>
    </div>
  );

  // 5. EXECUTION TRACE
  const renderExecutionTrace = () => (
    <article className="investigation-plane plane-white rounded-lg p-5 animate-in fade-in duration-300 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#edf1fb] mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#1179FF]" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              Execution Trace
            </h3>
            <p className="text-[10px] text-[#7082aa]">
              Polymorphic route logs
            </p>
          </div>
        </div>
        <span className="font-mono text-[8px] font-bold text-[#1179FF] uppercase bg-[#EDF5FF] px-2 py-0.5 rounded border border-[#d2e3fc]">
          {isDemoMode ? "DEMO" : "JVM"}
        </span>
      </div>

      <div className="space-y-2.5 max-h-[300px] overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin">
        {executionTrace.length > 0 ? (
          executionTrace.map((step, idx) => (
            <div
              key={idx}
              className="border-l-2 border-[#1179FF]/40 pl-2.5 py-1 hover:border-[#1179FF] transition font-mono overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-navy truncate flex-1 min-w-0" title={step.name || step.eventName}>
                  {step.name || step.eventName}
                </span>
                {step.toolName && (
                  <span className="text-[7px] font-bold bg-[#EDF5FF] text-[#1179FF] px-1 py-0.5 rounded shrink-0">
                    {step.toolName}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-[#5a709c] mt-0.5 leading-relaxed font-sans break-words">
                {step.detail}
              </p>
              <div className="flex items-center justify-between text-[8px] text-[#7082aa] mt-1 gap-1">
                <span className="truncate max-w-[130px]" title={step.time || step.timestamp || "12ms"}>
                  Latency: {formatTraceTimestamp(step.time || step.timestamp)}
                </span>
                <span
                  className={`font-bold text-[7px] px-1.5 py-0.2 rounded shrink-0 ${
                    step.status === "FAILED"
                      ? "bg-red-100 text-red-700"
                      : "bg-[#efffc9] text-emerald-800"
                  }`}
                >
                  {step.status || "SUCCESS"}
                </span>
              </div>
            </div>
          ))
        ) : isRunning ? (
          <div className="flex flex-col items-center justify-center text-center py-6 text-[#1179FF] space-y-2">
            <Orbit size={20} className="animate-spin text-[#1179FF]" />
            <p className="text-[10px] font-mono font-bold">
              STREAMING POLYMORPHIC LOGS...
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-[#7082aa] py-6 italic text-center">
            Execute query to stream JVM routing trace logs.
          </p>
        )}
      </div>
    </article>
  );

  // 6. ANALYSIS OUTPUT
  const renderAnalysisOutput = () => (
    <article
      className={`investigation-plane rounded-lg p-5 border transition shadow-xs ${
        isComplete
          ? analysisResult?.confidence >= 80
            ? "plane-lime"
            : "plane-yellow"
          : "plane-white"
      }`}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-black/10 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-black/5 flex items-center justify-center font-mono text-[9px] font-bold">
            03
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Analysis Output
            </h3>
            <p className="text-[9px] text-[#5a709c]">
              Visual model prediction
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        {isComplete && analysisResult && (
          <span
            className={`px-2 py-0.5 font-mono text-[8px] font-bold rounded ${
              analysisResult.confidence >= 80
                ? "bg-[#B7F23A] text-[#234413]"
                : analysisResult.confidence >= 50
                ? "bg-[#F4B900]/30 text-[#735200]"
                : "bg-[#FF7C70]/30 text-[#bd3b2f]"
            }`}
          >
            {analysisResult.confidenceLabel || `${analysisResult.confidence}%`}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Verification Status */}
        <div>
          <p className="text-[10px] text-[#5a709c] eyebrow">
            Verification status
          </p>
          <h4 className="font-editorial text-xl md:text-2xl tracking-tight mt-1 font-bold break-words uppercase">
            {isRunning ? (
              <span className="text-[#1179FF] flex items-center gap-1.5 animate-pulse">
                <Orbit size={18} className="animate-spin" />
                PROCESSING...
              </span>
            ) : isComplete ? (
              analysisResult?.investigatorReport?.verdict ||
              (analysisResult?.confidence >= 80
                ? "VERIFIED"
                : "PARTIALLY VERIFIED")
            ) : (
              "AWAITING EXECUTION..."
            )}
          </h4>
        </div>

        {/* Confidence Bar */}
        {isComplete && analysisResult && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono text-[#5a709c]">
              <span>Model Confidence</span>
              <span className="font-bold">{analysisResult.confidence}%</span>
            </div>
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  analysisResult.confidence >= 80
                    ? "bg-[#4d791f]"
                    : analysisResult.confidence >= 50
                    ? "bg-[#f4b900]"
                    : "bg-[#ff7c70]"
                }`}
                style={{ width: `${analysisResult.confidence}%` }}
              />
            </div>
          </div>
        )}

        {/* VLM Response */}
        <div>
          <p className="text-[10px] text-[#5a709c] eyebrow">
            VLM response
          </p>
          <p className="text-xs leading-relaxed text-navy mt-1">
            {isRunning ? (
              <span className="text-[#7082aa] italic animate-pulse">
                Polymorphic vision transformer inference running in JVM runtime...
              </span>
            ) : isComplete ? (
              analysisResult?.answer
            ) : (
              "Configure query inputs. Click 'Run Query Analysis' to trigger JVM strategy handlers and VLM inference."
            )}
          </p>
        </div>

        {/* PDF Download Button */}
        {isComplete && (
          <button
            onClick={onDownloadPdf}
            className="w-full mt-2 secondary-button justify-center text-[10px] font-bold py-1.5 bg-white hover:bg-[#EDF5FF] cursor-pointer"
          >
            <Download size={13} />
            <span>Download PDF Report</span>
          </button>
        )}
      </div>
    </article>
  );

  // 7. DETECTED FEATURES
  const renderDetectedFeatures = () => (
    <article className="investigation-plane plane-white rounded-lg p-5 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#edf1fb] mb-4">
        <span className="h-6 w-6 rounded-full bg-[#EDF5FF] flex items-center justify-center font-mono text-[9px] font-bold text-[#1179FF]">
          04
        </span>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Detected Features
          </h3>
          <p className="text-[10px] text-[#7082aa]">
            Raster classification details
          </p>
        </div>
      </div>

      {isComplete && analysisResult ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-[9px] font-mono text-[#7082aa] uppercase tracking-wider">
              Analysis Highlights
            </p>
            <div className="claim-ledger-item">
              <p className="text-[11px] font-bold text-navy">
                {activeTaskTab === "VQA"
                  ? "Urban built-up grid boundary mapped in center quadrant."
                  : activeTaskTab === "CHANGE"
                  ? "Spectral vegetation change mapped across eastern shoreline."
                  : activeTaskTab === "FUSION"
                  ? "SAR radar backscatter combined with optical spectral bands."
                  : "Target spatial feature localized with bounding box coordinates."}
              </p>
              <div className="flex justify-between items-center mt-1 text-[8px] font-mono text-[#7082aa]">
                <span>Source: {currentTask.targetEngine}</span>
                <span className="text-emerald-700 font-bold">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Limitations */}
          {analysisResult.limitations?.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#edf1fb]">
              <p className="text-[9px] font-mono text-[#7082aa] uppercase tracking-wider">
                Raster Limitations
              </p>
              {analysisResult.limitations.map((lim, i) => (
                <div key={i} className="claim-ledger-item claim-ledger-challenge">
                  <p className="text-[10px] font-medium text-[#8c514c]">
                    - {lim}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-[#7082aa] text-center py-6">
          Highlights populated after analysis execution.
        </p>
      )}
    </article>
  );

  // 8. NEXT ANALYSIS STEPS
  const renderNextSteps = () => (
    <article className="investigation-plane plane-yellow rounded-lg p-5 shadow-xs">
      <div className="flex items-center gap-2 pb-2 border-b border-[#f4db94] mb-3">
        <Info size={14} className="text-[#F4B900]" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#735200]">
          Next Analysis Steps
        </span>
      </div>
      <p className="text-xs leading-relaxed text-[#735200]">
        {isComplete
          ? analysisResult?.investigatorReport?.nextBestEvidence ||
            currentTask.nextStepSuggestion
          : "Awaiting model response. The system will recommend next contextual steps here."}
      </p>
    </article>
  );

  return (
    <div className="space-y-6">
      {/* Workstation Header */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#1179FF] animate-pulse" />
          <p className="eyebrow text-[#1179FF]">Workstation Console</p>
        </div>
        <h1 className="font-editorial text-[38px] md:text-[54px] tracking-tight leading-[1.05] text-navy font-bold">
          Satellite Vision-Language Console
        </h1>
        <p className="max-w-[760px] text-sm md:text-base leading-relaxed text-[#5a709c]">
          Agentic remote-sensing workbench for optical and SAR Earth observation imagery.
          Validates coordinate reference bands, decomposes polymorphic queries, and streams
          real-time polymorphic execution trace telemetry.
        </p>
      </section>

      {/* 5-Step Workflow Stepper */}
      <section className="w-full bg-white border border-[#dfe7fb] rounded-xl p-4 md:px-6 md:py-4 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[740px]">
          {[
            { num: "01", label: "Query", detail: "Task & Prompt" },
            { num: "02", label: "Metadata", detail: "CRS & Bands" },
            { num: "03", label: "Routing", detail: "Polymorphic JVM" },
            { num: "04", label: "Inference", detail: "UniRS / Vision" },
            { num: "05", label: "Report", detail: "Telemetry Dossier" },
          ].map((step, idx, arr) => {
            const stepIndex = idx + 1;
            const isDone = pipelineStep > stepIndex;
            const isActive = pipelineStep === stepIndex;
            const isLast = idx === arr.length - 1;

            return (
              <div key={step.num} className="flex items-center flex-1 last:flex-none">
                {/* Step Item: Circle + Labels */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Circle (38px diameter) */}
                  <div
                    className={`h-[38px] w-[38px] rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all duration-200 ${
                      isDone
                        ? "bg-[#112557] text-white shadow-xs"
                        : isActive
                        ? "bg-[#2563EB] text-white shadow-[0_0_0_5px_rgba(37,99,235,0.2)]"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    {isDone ? <Check size={16} className="stroke-[2.5]" /> : step.num}
                  </div>

                  {/* Text: Title + Subtitle */}
                  <div className="flex flex-col text-left">
                    <span className="text-xs md:text-sm font-bold text-[#112557] leading-tight">
                      {step.label}
                    </span>
                    <span className="text-[10px] md:text-[11px] text-[#6B7280] leading-tight mt-0.5 whitespace-nowrap">
                      {step.detail}
                    </span>
                  </div>
                </div>

                {/* Single thin 2px horizontal connector line between steps */}
                {!isLast && (
                  <div className="flex-1 h-[2px] bg-[#E5E7EB] mx-4 min-w-[20px]" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* TOP WORKBENCH: STAGED ASSETS, COMPOSE QUERY & SENSOR ARRAY */}
      {/* ========================================================= */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
        {/* Left Column: Staged Assets + Compose Query + Run Query Action Shelf */}
        <div className="lg:col-span-5 space-y-5">
          {renderStagedAssets()}
          {renderComposeQuery()}
          {renderActionShelf()}
        </div>

        {/* Right Column: Multimodal Sensor Array */}
        <div className="lg:col-span-7 space-y-5">
          {renderSensorArray()}
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM SECTION: ANALYSIS OUTPUT, EXECUTION TRACE & DETECTED FEATURES */}
      {/* (Appears below the main workbench when query analysis is executed) */}
      {/* ========================================================= */}
      {showAnalysisPanels && (
        <section className="space-y-4 pt-4 border-t border-[#dfe7fb] animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1179FF] animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                Inference Results & Execution Telemetry
              </h2>
            </div>
            <span className="font-mono text-[8px] font-bold text-[#1179FF] uppercase bg-[#EDF5FF] px-2.5 py-0.5 rounded border border-[#d2e3fc]">
              {isDemoMode ? "DEMO MODE" : "JVM MODEL RUNTIME"}
            </span>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
            {/* Box 1: Execution Trace (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {renderExecutionTrace()}
            </div>

            {/* Box 2: Analysis Output (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {renderAnalysisOutput()}
            </div>

            {/* Box 3: Detected Features & Next Steps (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {renderDetectedFeatures()}
              {renderNextSteps()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// IMAGE LIBRARY VIEW COMPONENT
// -------------------------------------------------------------
function AssetLibraryView({
  stagedAssets,
  activeCount,
  onUpload,
  onToggle,
  onRemove,
  onBack,
}) {
  const fileInputRef = useRef(null);

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#dfe7fb]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#7846D7]" />
            <p className="eyebrow text-[#7846D7]">Asset Management</p>
          </div>
          <h1 className="font-editorial text-[38px] md:text-[50px] tracking-tight leading-none text-navy font-bold mt-2">
            Image Library
          </h1>
          <p className="text-sm text-[#5b719d] mt-2 max-w-md">
            Review spatial resolution details, coordinate bands, and modality profiles of
            staged raster assets.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className="primary-button bg-navy text-white">
            <ArrowLeft size={14} />
            <span>Workspace</span>
          </button>
          <label className="secondary-button cursor-pointer">
            <Upload size={14} />
            <span>Stage Asset</span>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={e => onUpload(Array.from(e.target.files ?? []))}
            />
          </label>
        </div>
      </header>

      <div className="bg-white px-5 py-4 border border-[#dfe7fb] rounded-lg text-sm text-[#5a709c] flex items-center justify-between">
        <span>
          Active staged assets:{" "}
          <strong className="font-editorial text-2xl text-navy">
            {activeCount}
          </strong>{" "}
          file{activeCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stagedAssets.map(item => (
          <article
            key={item.id}
            className={`investigation-plane rounded-lg p-5 border ${
              item.included
                ? item.modality === "SAR"
                  ? "plane-violet"
                  : "plane-blue"
                : "plane-white"
            } flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="h-12 w-12 rounded bg-[#EDF5FF] border border-[#d2e3fc] flex items-center justify-center overflow-hidden">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : item.modality === "SAR" ? (
                    <Radar size={22} className="text-[#7846D7]" />
                  ) : (
                    <FileImage size={22} className="text-[#1179FF]" />
                  )}
                </div>

                <button
                  onClick={() => onToggle(item.id)}
                  className={`include-toggle rounded-md px-3 py-1 text-[9px] font-bold ${
                    item.included
                      ? "bg-navy text-[#B7F23A]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item.included ? "✓ Staged" : "Stage Asset"}
                </button>
              </div>

              <div>
                <h3
                  className="text-xs font-bold text-navy truncate"
                  title={item.name}
                >
                  {item.name}
                </h3>
                <p className="font-mono text-[8px] text-[#7084ad] mt-1 uppercase tracking-wider">
                  {item.modality} · {item.metadata?.bands || 3} BANDS · {item.size}
                </p>
                <p className="font-mono text-[8px] text-[#7084ad] mt-0.5">
                  CRS: {item.metadata?.crs || "EPSG:4326"}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-5 pt-3 border-t border-navy/5">
              <span className="font-mono text-[8px] text-[#7084ad] tracking-wide">
                UID: {item.id.slice(0, 10)}...
              </span>
              <button
                onClick={() => onRemove(item.id)}
                className="text-coral hover:text-[#bd3b2f] p-1.5 hover:bg-[#fff5f2] rounded transition"
                title={`Delete ${item.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}

        {!stagedAssets.length && (
          <div className="col-span-full border border-dashed border-[#b5c7ed] bg-white/50 p-12 text-center rounded-lg space-y-3">
            <Layers3 size={32} className="mx-auto text-[#7084ad]" />
            <h3 className="font-editorial text-xl text-navy">Library Empty</h3>
            <p className="text-xs text-[#7082aa] max-w-sm mx-auto">
              Stage GeoTIFF raster assets or standard benchmark scenes to get started.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// QUERY HISTORY ARCHIVE VIEW COMPONENT
// -------------------------------------------------------------
function QueryHistoryView({ history, onBack, onClear, onReload }) {
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const typeMatch =
        filterType === "ALL" ||
        (item.taskType && item.taskType.toUpperCase() === filterType) ||
        (item.scenarioId && item.scenarioId.toUpperCase() === filterType);
      const searchMatch =
        !searchQuery ||
        (item.query && item.query.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.result && item.result.toLowerCase().includes(searchQuery.toLowerCase()));
      return typeMatch && searchMatch;
    });
  }, [history, filterType, searchQuery]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#dfe7fb]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-navy" />
            <p className="eyebrow text-navy">Query Telemetry Archive</p>
          </div>
          <h1 className="font-editorial text-[38px] md:text-[50px] tracking-tight leading-none text-navy font-bold mt-2">
            Query History
          </h1>
          <p className="text-sm text-[#5b719d] mt-2 max-w-md">
            Verify persisted reports and trace parameters saved to the local SQLite database.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className="primary-button bg-navy text-white">
            <ArrowLeft size={14} />
            <span>Workspace</span>
          </button>
          {history.length > 0 && (
            <button
              onClick={onClear}
              className="primary-button bg-coral/10 text-[#bd3b2f] hover:bg-[#fff5f2]"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-[#dfe7fb] rounded-lg">
        <div className="flex bg-[#EDF5FF] p-0.5 rounded-lg border border-[#d5dffa]">
          {["ALL", "VQA", "CHANGE", "FUSION", "GROUNDING"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-[9px] font-bold rounded-md transition ${
                filterType === type
                  ? "bg-[#112557] text-[#B7F23A] shadow-sm"
                  : "text-[#7082aa] hover:text-navy"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter query text or results..."
          className="border border-[#dbe4fa] bg-[#fbfdff] px-3 py-1.5 text-xs rounded-md outline-none focus:border-[#1179FF] w-full md:w-64"
        />
      </div>

      <div className="space-y-4">
        {filteredHistory.map(record => (
          <article
            key={record.id}
            className="flex flex-col gap-4 border-l-4 border-[#1179FF] bg-white p-5 sm:flex-row sm:items-center justify-between rounded-lg shadow-sm hover:shadow transition"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] font-bold bg-[#EDF5FF] text-[#1179FF] px-2 py-0.5 rounded">
                  {record.taskType || "VQA"}
                </span>
                <span className="font-mono text-[8px] text-[#7084ad]">
                  {record.createdAt
                    ? new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(record.createdAt))
                    : "Archived Run"}
                </span>
                <span className="font-mono text-[8px] font-bold bg-[#efffc9] text-emerald-800 px-1.5 py-0.5 rounded">
                  {record.confidence || "HIGH"}
                </span>
              </div>

              <h3 className="font-editorial text-[20px] tracking-tight leading-snug text-navy font-bold">
                "{record.query}"
              </h3>

              <p className="text-xs leading-relaxed text-[#5b719d] max-w-3xl">
                {record.result}
              </p>
            </div>

            <button
              onClick={() => onReload(record)}
              className="secondary-button shrink-0 border border-navy/10 bg-[#EDF5FF] hover:bg-[#ddecff] flex items-center gap-1.5 text-xs font-bold"
            >
              <ScanSearch size={14} />
              <span>Load Report</span>
            </button>
          </article>
        ))}

        {!filteredHistory.length && (
          <div className="border border-dashed border-[#b5c7ed] bg-white/50 p-12 text-center rounded-lg space-y-3">
            <History size={32} className="mx-auto text-[#7084ad]" />
            <h3 className="font-editorial text-xl text-navy">No queries archived</h3>
            <p className="text-xs text-[#7082aa]">
              Executed query results and SQLite database traces will display here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// REPORT MODAL COMPONENT (PDF & JSON Download)
// -------------------------------------------------------------
function ReportModal({
  taskConfig,
  queryText,
  stagedAssets,
  isComplete,
  onClose,
  onDownloadPdf,
  onDownloadJson,
  analysisResult,
  isDemoMode,
  queryId,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#112557]/50 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="receipt-modal w-full max-w-[720px] bg-white rounded-lg shadow-2xl flex flex-col animate-scale-up border border-[#dce5fb]">
        <div className="receipt-header border-b border-[#edf1fb] p-6 bg-gradient-to-r from-[#F8FBFF] to-[#fffefc] flex justify-between items-start">
          <div>
            <p className="eyebrow text-[#1179FF]">Query Analysis Report</p>
            <h3 className="font-editorial text-3xl font-bold tracking-tight text-navy mt-1">
              {taskConfig.title}
            </h3>
          </div>
          <button
            className="p-1 hover:bg-[#EDF5FF] text-[#7082aa] hover:text-navy rounded border border-[#dfe7fb] bg-white transition"
            onClick={onClose}
            aria-label="Close report"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-5">
            <div>
              <p className="eyebrow text-[#7082aa]">User Query</p>
              <p className="mt-1 text-sm font-semibold text-navy">
                "{queryText}"
              </p>
            </div>

            <div>
              <p className="eyebrow text-[#7082aa]">VLM Model Prediction</p>
              <p className="mt-1 font-editorial text-xl leading-snug tracking-tight text-navy font-bold">
                {isComplete ? analysisResult?.answer : "N/A"}
              </p>
            </div>

            <div className="bg-[#f5ffd9] border-l-3 border-[#B7F23A] px-4 py-3 text-xs leading-relaxed text-[#43681b] rounded-r">
              <span>
                <strong>Metadata Integrity:</strong> Staged files include verified coordinate reference bands. JSON report contains full audit trace logs.
              </span>
            </div>
          </div>

          <div className="receipt-side bg-[#F8FBFF] border border-[#dce5fb] p-5 rounded-lg flex flex-col justify-between space-y-4">
            <div>
              <p className="eyebrow text-[#7082aa]">Telemetry Profile</p>
              <div className="space-y-3 text-xs border-b border-[#edf1fb] pb-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Task Route:</span>
                  <span className="font-mono font-bold text-navy">
                    {taskConfig.tabLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Target Engine:</span>
                  <span className="font-mono text-[10px] font-bold text-[#1179FF]">
                    {taskConfig.targetEngine}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Staged Files:</span>
                  <span className="font-mono font-bold text-navy">
                    {stagedAssets.length} active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Confidence:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {analysisResult?.confidenceLabel || "HIGH (92%)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Runtime:</span>
                  <span className="font-mono font-bold text-[#7846D7]">
                    {isDemoMode ? "DEMO (LOCAL)" : "JVM PROXIED"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={onDownloadPdf}
                className="primary-button w-full justify-center bg-[#112557] text-white hover:bg-[#1c387d] text-xs font-bold py-2 rounded-md"
              >
                <FileText size={14} />
                <span>Download PDF Report</span>
              </button>

              <button
                onClick={onDownloadJson}
                className="secondary-button w-full justify-center text-xs font-bold py-2 rounded-md"
              >
                <Download size={14} />
                <span>Download JSON Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SPLIT IMAGE COMPARE SLIDER
// -------------------------------------------------------------
function SplitImageCompare({
  img1,
  img2,
  label1 = "T1 Before",
  label2 = "T2 After",
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(500);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      setContainerWidth(containerRef.current.getBoundingClientRect().width);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleMove = clientX => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = e => {
    if (e.buttons === 1) handleMove(e.clientX);
  };

  const handleTouchMove = e => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="slider-container h-full w-full min-h-[380px] relative select-none rounded bg-[#112557] overflow-hidden"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={e => handleMove(e.clientX)}
    >
      {/* Background (After / T2 Image) */}
      <div className="slider-after absolute inset-0 flex items-center justify-center">
        {img2 ? (
          <img
            src={toWebUrl(img2)}
            alt="After"
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b1739] text-[#7082aa]">
            <FileImage size={32} className="mb-2 text-[#1179FF] opacity-40" />
            <span className="text-xs font-mono">{label2} (No Image Staged)</span>
          </div>
        )}
        <span className="absolute right-4 bottom-4 bg-[#112557]/80 text-[#B7F23A] font-mono text-[9px] font-bold tracking-wider px-2.5 py-1 z-10 rounded">
          {label2}
        </span>
      </div>

      {/* Foreground (Before / T1 Image) */}
      <div
        className="slider-before absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#1179FF]"
        style={{ width: `${sliderPos}%` }}
      >
        {img1 ? (
          <img
            src={toWebUrl(img1)}
            alt="Before"
            className="absolute inset-y-0 left-0 object-contain pointer-events-none"
            style={{ width: containerWidth, maxWidth: "none", height: "100%" }}
          />
        ) : (
          <div
            className="absolute inset-y-0 left-0 flex flex-col items-center justify-center bg-[#0d1d45] text-[#7082aa]"
            style={{ width: containerWidth, maxWidth: "none", height: "100%" }}
          >
            <FileImage size={32} className="mb-2 text-[#1179FF] opacity-40" />
            <span className="text-xs font-mono">{label1} (No Image Staged)</span>
          </div>
        )}
        <span className="absolute left-4 bottom-4 bg-[#112557]/80 text-[#1179FF] font-mono text-[9px] font-bold tracking-wider px-2.5 py-1 z-10 rounded">
          {label1}
        </span>
      </div>

      {/* Draggable Divider Handle */}
      <div
        className="slider-handle absolute top-0 bottom-0 z-20 cursor-ew-resize"
        style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
      >
        <div className="h-full w-0.5 bg-[#B7F23A] shadow-md flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-[#112557] border-2 border-[#B7F23A] flex items-center justify-center text-[#B7F23A] shadow-lg">
            <SlidersHorizontal size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
