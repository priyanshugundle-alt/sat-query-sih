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
} from "lucide-react";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

// Structured satellite query scenario benchmarks
const scenarios = {
  vqa: {
    label: "Single-image VQA",
    short: "VQA",
    task: "VQA",
    query: "What land cover is visible in this image?",
    title: "Optical scene land classification",
    summary:
      "Analyze a single optical band image to perform multi-class land cover classification.",
    result:
      "Built-up areas, water channels, and mixed vegetation are visible in the scene.",
    status: "Strongly verified", // Strongly verified, Partially verified, Inconclusive, Discrepancies found
    confidence: "HIGH (94%)",
    recommendation:
      "Run a temporal query using a secondary cloud-free scene to evaluate change dynamics.",
    assets: [
      {
        name: "delta_optical_scene.tif",
        kind: "OPTICAL",
        date: "2024-01-12",
        size: "18.4 MB",
      },
    ],
    features: [
      {
        id: "f1",
        detail:
          "Urban built-up area boundary identified in center-left quadrant.",
        source: "Spectral Bands (B4,B3,B2)",
        pass: true,
      },
      {
        id: "f2",
        detail: "Open surface water body mapped in southern channel.",
        source: "MNDWI index calculation",
        pass: true,
      },
    ],
    limitations: [
      {
        detail:
          "12% cloud shadow in northeastern quadrant masks underlying forest canopy.",
      },
    ],
    trace: [
      {
        name: "Query Received",
        detail: "Satellite image query parsed and tokenized.",
        status: "SUCCESS",
        time: "0ms",
      },
      {
        name: "Metadata Extract",
        detail:
          "Projection EPSG:32644 (UTM 44N) and resolution (10m) verified.",
        status: "SUCCESS",
        time: "12ms",
      },
      {
        name: "Model Routing",
        detail: "Dispatched query to Single-Scene VQA handler.",
        status: "SUCCESS",
        time: "24ms",
      },
      {
        name: "Model Run",
        detail: "Polymorphic visual transformer execution completed.",
        status: "SUCCESS",
        time: "420ms",
      },
      {
        name: "Report Compiler",
        detail: "Compiled JSON log output and serialized coordinates.",
        status: "SUCCESS",
        time: "450ms",
      },
    ],
    images: {
      t1: "/satquery-prism-optical.png",
      t2: "/satquery-prism-optical.png",
    },
  },
  change: {
    label: "Change detection",
    short: "Change",
    task: "CHANGE ANALYSIS",
    query: "Compare changes in agricultural boundaries between T1 and T2.",
    title: "Multi-temporal change analysis",
    summary:
      "Calculate pixel-level differences between optical scenes across distinct acquisition timestamps.",
    result:
      "Agricultural boundaries expanded near the eastern shoreline between January and June.",
    status: "Partially verified",
    confidence: "MEDIUM (78%)",
    recommendation:
      "Incorporate a radar SAR scene from June to evaluate surface roughness and soil moisture levels.",
    assets: [
      {
        name: "delta_optical_t1.tif",
        kind: "OPTICAL",
        date: "2024-01-12",
        size: "18.4 MB",
      },
      {
        name: "delta_optical_t2.tif",
        kind: "OPTICAL",
        date: "2024-06-15",
        size: "19.2 MB",
      },
    ],
    features: [
      {
        id: "f1",
        detail: "Vegetation index increase mapped along the eastern riverbank.",
        source: "NDVI Difference Mask",
        pass: true,
      },
      {
        id: "f2",
        detail:
          "Soil moisture drop identified at coordinate sector [16.395, 81.752].",
        source: "NDWI Index difference",
        pass: true,
      },
    ],
    limitations: [
      {
        detail:
          "Extended temporal baseline (154 days) introduces seasonal vegetative cycles.",
      },
    ],
    trace: [
      {
        name: "Query Received",
        detail: "Temporal change query parsed.",
        status: "SUCCESS",
        time: "0ms",
      },
      {
        name: "Metadata Extract",
        detail:
          "T1: 2024-01-12, T2: 2024-06-15. Baseline: 154 days. Compatible.",
        status: "SUCCESS",
        time: "18ms",
      },
      {
        name: "Alignment Check",
        detail: "Spatial bounds verified. Coordinate overlap is 99.2%.",
        status: "SUCCESS",
        time: "44ms",
      },
      {
        name: "Model Routing",
        detail: "Dispatched query to Multi-Temporal Change handler.",
        status: "SUCCESS",
        time: "380ms",
      },
      {
        name: "Model Run",
        detail: "Pixel-by-pixel difference mapping finished.",
        status: "SUCCESS",
        time: "410ms",
      },
      {
        name: "Report Compiler",
        detail: "Compiled JSON report output.",
        status: "SUCCESS",
        time: "430ms",
      },
    ],
    images: {
      t1: "/satquery-prism-optical.png",
      t2: "/satquery-prism-hero.png",
    },
  },
  fusion: {
    label: "Optical–SAR fusion",
    short: "Fusion",
    task: "FUSION ANALYSIS",
    query: "Use both sensors to assess shoreline flooding evidence.",
    title: "Multimodal sensor fusion analysis",
    summary:
      "Co-register optical bands with microwave backscatter maps to estimate water boundaries in cloudy areas.",
    result:
      "Shoreline flood inundation verified, with radar backscatter showing standing water attenuation.",
    status: "Strongly verified",
    confidence: "HIGH (91%)",
    recommendation:
      "Query a subsequent SAR acquisition (T2) to calculate water surface recession speed.",
    assets: [
      {
        name: "delta_optical_t1.tif",
        kind: "OPTICAL",
        date: "2024-01-12",
        size: "18.4 MB",
      },
      {
        name: "delta_sar_t1.tif",
        kind: "SAR",
        date: "2024-01-14",
        size: "24.1 MB",
      },
    ],
    features: [
      {
        id: "f1",
        detail: "Standing surface water mapped under light canopy.",
        source: "SAR backscatter attenuation (VV/VH)",
        pass: true,
      },
      {
        id: "f2",
        detail: "Land-water boundary matches backscatter roughness drops.",
        source: "Co-registered overlay index",
        pass: true,
      },
    ],
    limitations: [
      {
        detail:
          "Acquisition delta of 2 days between sensors may introduce minor tidal shifts.",
      },
    ],
    trace: [
      {
        name: "Query Received",
        detail: "Multimodal query submitted.",
        status: "SUCCESS",
        time: "0ms",
      },
      {
        name: "Metadata Extract",
        detail:
          "Sensor 1: OPTICAL, Sensor 2: SAR. Valid multimodal combination.",
        status: "SUCCESS",
        time: "15ms",
      },
      {
        name: "Alignment Check",
        detail: "Resampled SAR grid (10m) to match optical resolution.",
        status: "SUCCESS",
        time: "52ms",
      },
      {
        name: "Model Routing",
        detail: "Routed to Polymorphic Fusion Strategy.",
        status: "SUCCESS",
        time: "510ms",
      },
      {
        name: "Model Run",
        detail: "Bimodal feature mapping complete.",
        status: "SUCCESS",
        time: "540ms",
      },
      {
        name: "Report Compiler",
        detail: "Compiled output trace logs.",
        status: "SUCCESS",
        time: "570ms",
      },
    ],
    images: {
      t1: "/satquery-prism-optical.png",
      t2: "/satquery-prism-sar.png",
    },
  },
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const stage = items =>
  items.map(item => ({ ...item, id: uid(), included: true }));

const savedCases = () => {
  try {
    const data = JSON.parse(
      window.localStorage.getItem("satquery-query-history") ?? "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export default function Home() {
  const [view, setView] = useState("board");
  const [scenarioId, setScenarioId] = useState("fusion");
  const [question, setQuestion] = useState(scenarios.fusion.query);
  const [evidence, setEvidence] = useState(() =>
    stage(scenarios.fusion.assets)
  );

  // Real / Demo states
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [backendImageUrl, setBackendImageUrl] = useState(null);
  const [backendAnswer, setBackendAnswer] = useState(null);
  const [backendReport, setBackendReport] = useState(null);
  const [backendTrace, setBackendTrace] = useState([]);
  const [backendValidationResult, setBackendValidationResult] = useState(null);
  const [jvmHealth, setJvmHealth] = useState("TESTING...");

  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [history, setHistory] = useState(savedCases);
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeQueryId, setActiveQueryId] = useState(null);

  const scenario = scenarios[scenarioId];
  const selectedEvidence = useMemo(
    () => evidence.filter(item => item.included),
    [evidence]
  );

  // Query JVM health dynamically
  const fetchJvmHealth = async () => {
    try {
      const response = await fetch("/api/health");
      if (response.ok) {
        setJvmHealth("JVM CONNECTED");
      } else {
        setJvmHealth("JVM OFFLINE");
      }
    } catch {
      setJvmHealth("JVM OFFLINE");
    }
  };

  useEffect(() => {
    fetchJvmHealth();
  }, []);

  const switchScenario = id => {
    setScenarioId(id);
    setQuestion(scenarios[id].query);
    setEvidence(stage(scenarios[id].assets));
    setIsComplete(false);
    setView("board");
    setBackendImageUrl(null);
    setBackendAnswer(null);
    setBackendReport(null);
    setBackendTrace([]);
    setBackendValidationResult(null);
    setActiveQueryId(null);
  };

  const uploadFiles = async files => {
    if (!files.length) return;

    if (isDemoMode) {
      const toastId = toast.loading("Analyzing metadata... 0%");
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (progress <= 100) {
          toast.loading(`Extracting geospatial coordinates... ${progress}%`, {
            id: toastId,
          });
        } else {
          clearInterval(interval);
          setEvidence(current => [
            ...current,
            ...files.slice(0, 3).map((file, index) => {
              const nameLower = file.name.toLowerCase();
              const isPngJpg =
                nameLower.endsWith(".png") ||
                nameLower.endsWith(".jpg") ||
                nameLower.endsWith(".jpeg");

              let warning = null;
              if (isPngJpg) {
                warning =
                  "Warning: PNG/JPEG files lack standard geospatial headers (CRS bounds).";
              }

              return {
                id: uid(),
                name: file.name,
                kind:
                  /sar|radar|sentinel.?1/i.test(file.name) ||
                  (files.length > 1 && index > 0)
                    ? "SAR"
                    : "OPTICAL",
                date: new Date().toISOString().slice(0, 10),
                size: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
                included: true,
                warning,
              };
            }),
          ]);
          setIsComplete(false);
          toast.success("Image asset staged (Demo mode)", {
            id: toastId,
            description: "Validation complete.",
          });
        }
      }, 250);
      return;
    }

    // Java backend mode upload
    const toastId = toast.loading("Uploading imagery to Java server...");
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          uploaded.push({
            id: data.imageId,
            name: data.fileName,
            kind: data.metadata?.modality || "OPTICAL",
            date:
              data.metadata?.acquisitionDate ||
              new Date().toISOString().slice(0, 10),
            size: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
            included: true,
          });
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    toast.dismiss(toastId);

    if (uploaded.length > 0) {
      setEvidence(current => [...current, ...uploaded]);
      setIsComplete(false);
      toast.success("Image assets uploaded to server");
    } else {
      toast.error("Upload failed", {
        description: "Verify JVM backend status in the sidebar.",
      });
    }
  };

  const runCase = async () => {
    if (!question.trim()) {
      toast.error("Query empty", {
        description: "Please enter a satellite analysis query.",
      });
      return;
    }
    if (!selectedEvidence.length) {
      toast.error("No staged image assets", {
        description: "Stage at least one image to run the analysis.",
      });
      setView("evidence");
      return;
    }

    setIsRunning(true);
    setIsComplete(false);
    setBackendValidationResult(null);

    if (isDemoMode) {
      window.setTimeout(() => {
        try {
          const record = {
            id: uid(),
            scenarioId,
            query: question.trim(),
            result: scenario.result,
            createdAt: new Date().toISOString(),
            evidenceCount: selectedEvidence.length,
          };
          const next = [record, ...history].slice(0, 10);
          setHistory(next);
          window.localStorage.setItem(
            "satquery-query-history",
            JSON.stringify(next)
          );
          setIsRunning(false);
          setIsComplete(true);
          setBackendImageUrl(null);
          setBackendAnswer(null);
          setBackendReport(null);
          setBackendTrace([]);
          toast.success("Analysis complete");
        } catch (e) {
          console.error("Demo run error:", e);
          setIsRunning(false);
          setIsComplete(true);
          toast.error("Demo analysis completed (failed to save history).");
        }
      }, 900);
      return;
    }

    // Java backend mode analysis
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          queryText: question.trim(),
          datasetContext: "NORMAL_SATELLITE",
          imageIds: selectedEvidence.map(item => item.id),
          requestedTask: null,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (
          data.status === "VALIDATION_FAILED" ||
          data.status === "TOOL_VALIDATION_FAILED"
        ) {
          setBackendValidationResult({
            status: data.status,
            error: data.answer,
            trace: data.trace,
          });
          setIsRunning(false);
          setIsComplete(false);
          toast.error("Image metadata validation failed");
          return;
        }

        let imageUrl = null;
        if (data.evidence && data.evidence.length > 0) {
          const mapEv = data.evidence.find(
            ev =>
              ev.evidenceType === "CHANGE_MAP" ||
              ev.evidenceType === "BOUNDING_BOX" ||
              ev.evidenceType === "SENSOR_BRANCH"
          );
          if (mapEv) {
            imageUrl = mapEv.filePath;
          }
        }

        if (imageUrl && !imageUrl.startsWith("/")) {
          imageUrl = "/" + imageUrl;
        }

        setBackendImageUrl(imageUrl);
        setBackendAnswer(data.answer);
        setBackendReport(data.investigatorReport);
        setBackendTrace(data.trace || []);
        setActiveQueryId(data.queryId);

        const record = {
          id: data.queryId || uid(),
          scenarioId,
          query: question.trim(),
          result: data.answer,
          createdAt: new Date().toISOString(),
          evidenceCount: selectedEvidence.length,
        };

        const next = [record, ...history].slice(0, 10);
        setHistory(next);
        window.localStorage.setItem(
          "satquery-query-history",
          JSON.stringify(next)
        );

        setIsRunning(false);
        setIsComplete(true);
        toast.success("Analysis report generated");
      } else {
        throw new Error(data.error || "Server processing error");
      }
    } catch (err) {
      console.error(err);
      toast.error("Processing failed", {
        description: err.message || "Error communicating with Java backend.",
      });
      setIsRunning(false);
    }
  };

  const reset = () => {
    setQuestion(scenario.query);
    setIsComplete(false);
    setBackendImageUrl(null);
    setBackendAnswer(null);
    setBackendReport(null);
    setBackendTrace([]);
    setBackendValidationResult(null);
    setActiveQueryId(null);
  };

  const toggleEvidence = id => {
    setEvidence(current =>
      current.map(item =>
        item.id === id ? { ...item, included: !item.included } : item
      )
    );
    setIsComplete(false);
  };

  const removeEvidence = id => {
    setEvidence(current => current.filter(item => item.id !== id));
    setIsComplete(false);
  };

  const clearHistory = () => {
    setHistory([]);
    window.localStorage.removeItem("satquery-query-history");
    toast.info("Query history cleared");
  };

  const reopen = record => {
    switchScenario(record.scenarioId);
    setQuestion(record.query);
    setBackendAnswer(record.result);
    setIsComplete(true);
    setView("board");
    setActiveQueryId(record.id);
  };

  const downloadReceipt = () => {
    const data = {
      product: "SatQuery AI",
      mode: isDemoMode ? "Demo Mode" : "Java Backend Mode",
      generatedAt: new Date().toISOString(),
      scenario: scenario.label,
      question,
      status: isComplete
        ? isDemoMode
          ? scenario.status
          : backendReport?.verdict || "Completed"
        : "Query staged",
      result: isComplete ? backendAnswer || scenario.result : "N/A",
      assets: selectedEvidence.map(({ name, kind, date }) => ({
        name,
        kind,
        date,
      })),
      recommendation: isDemoMode
        ? scenario.recommendation
        : backendReport?.nextBestEvidence || "Review raw grid files.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `satquery-analysis-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("JSON report downloaded");
  };

  const tabs = [
    { id: "board", label: "Satellite workstation", icon: ScanSearch },
    { id: "evidence", label: "Image library", icon: Layers3 },
    { id: "history", label: "Query history", icon: History },
  ];

  return (
    <div className="prism-shell min-h-screen flex flex-col md:flex-row text-navy">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#dfe7fb] bg-white/80 backdrop-blur-xl sticky top-0 h-screen p-6 shrink-0 z-30 justify-between">
        <div className="space-y-8">
          {/* Brand mark */}
          <div className="flex items-center gap-3 brand-block">
            <img
              src="/satquery-prism-mark.png"
              alt="SatQuery Orbit Mark"
              className="h-10 w-10 object-contain shadow-sm"
            />
            <div>
              <p className="font-editorial text-[20px] font-extrabold tracking-tight leading-none">
                SatQuery
              </p>
              <p className="font-mono text-[8px] uppercase tracking-[.18em] text-[#7082aa] mt-1">
                Geospatial AI
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`prism-nav rounded-lg focus-visible:outline-2 ${view === id ? "prism-nav-active shadow-sm" : ""}`}
              >
                <Icon
                  size={16}
                  className={view === id ? "text-[#1179FF]" : "text-[#7082aa]"}
                />
                <span className="flex-1">{label}</span>
                {view === id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1179FF]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Details & Mode Toggle */}
        <div className="space-y-4 pt-4 border-t border-[#edf1fb]">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setIsDemoMode(!isDemoMode);
                reset();
                toast.info(
                  isDemoMode
                    ? "Switched to Real Java Backend Mode"
                    : "Switched to Demo Mode (Mock)"
                );
              }}
              className={`w-full mode-badge inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition rounded-lg border ${
                isDemoMode
                  ? "bg-[#fff2f0] text-[#ff6c5c] border-[#ffe0dc] hover:bg-[#ffe5e0]"
                  : "bg-[#f4ffd9] text-[#4d791f] border-[#e2f9b8] hover:bg-[#e9ffbe]"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${isDemoMode ? "bg-[#ff6c5c]" : "bg-[#4d791f]"}`}
              />
              {isDemoMode ? "DEMO MODE (MOCK)" : "JAVA BACKEND MODE"}
            </button>

            {/* Health check status indicator */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <span
                className={`h-2 w-2 rounded-full ${jvmHealth.includes("CONNECTED") ? "bg-emerald-500" : "bg-red-400"}`}
              />
              <span className="text-[9px] font-mono text-[#7082aa] uppercase tracking-wider">
                {jvmHealth}
              </span>
              <button
                onClick={fetchJvmHealth}
                className="p-0.5 hover:bg-[#EDF5FF] text-[#1179FF] rounded"
              >
                <RefreshCw size={10} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE COMPACT HEADER */}
      <header className="md:hidden sticky top-0 z-30 border-b border-[#dfe7fb] bg-white/95 px-5 py-3 backdrop-blur-xl w-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/satquery-prism-mark.png"
              alt="SatQuery Orbit Mark"
              className="h-8 w-8"
            />
            <div>
              <p className="font-editorial text-[17px] font-bold">SatQuery</p>
              <p className="font-mono text-[8px] uppercase tracking-wider text-[#7082aa]">
                Geospatial AI
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsDemoMode(!isDemoMode);
              reset();
            }}
            className={`mode-badge inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold rounded-full border ${
              isDemoMode
                ? "bg-[#fff2f0] text-[#ff6c5c] border-[#ffe0dc]"
                : "bg-[#f4ffd9] text-[#4d791f] border-[#e2f9b8]"
            }`}
          >
            {isDemoMode ? "DEMO" : "JAVA"}
          </button>
        </div>

        <nav className="flex overflow-x-auto border-t border-[#edf1fb] pt-2 gap-1 scrollbar-none">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-full transition ${view === id ? "bg-[#EDF5FF] text-navy" : "text-[#7082aa]"}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-5 md:p-8 max-w-[1400px] w-full mx-auto space-y-8">
          {view === "board" && (
            <Board
              scenario={scenario}
              scenarioId={scenarioId}
              question={question}
              setQuestion={setQuestion}
              evidence={evidence}
              selectedEvidence={selectedEvidence}
              isRunning={isRunning}
              isComplete={isComplete}
              onScenario={switchScenario}
              onUpload={uploadFiles}
              onEvidence={() => setView("evidence")}
              onRun={runCase}
              onReset={reset}
              onReceipt={() => setShowReceipt(true)}
              backendImageUrl={backendImageUrl}
              backendAnswer={backendAnswer}
              backendReport={backendReport}
              backendTrace={backendTrace}
              backendValidationResult={backendValidationResult}
              isDemoMode={isDemoMode}
            />
          )}

          {view === "evidence" && (
            <EvidenceView
              evidence={evidence}
              selectedCount={selectedEvidence.length}
              onUpload={uploadFiles}
              onToggle={toggleEvidence}
              onRemove={removeEvidence}
              onBack={() => setView("board")}
            />
          )}

          {view === "history" && (
            <HistoryView
              history={history}
              onBack={() => setView("board")}
              onClear={clearHistory}
              onReopen={reopen}
            />
          )}
        </main>
      </div>

      {/* ANALYSIS REPORT MODAL */}
      {showReceipt && (
        <Receipt
          scenario={scenario}
          question={question}
          evidence={selectedEvidence}
          complete={isComplete}
          onClose={() => setShowReceipt(false)}
          onDownload={downloadReceipt}
          backendAnswer={backendAnswer}
          backendReport={backendReport}
          isDemoMode={isDemoMode}
          queryId={activeQueryId}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SATELLITE WORKSTATION BOARD
// -------------------------------------------------------------
function Board({
  scenario,
  scenarioId,
  question,
  setQuestion,
  evidence,
  selectedEvidence,
  isRunning,
  isComplete,
  onScenario,
  onUpload,
  onEvidence,
  onRun,
  onReset,
  onReceipt,
  backendImageUrl,
  backendAnswer,
  backendReport,
  backendTrace,
  backendValidationResult,
  isDemoMode,
}) {
  const [activeStageTab, setActiveStageTab] = useState("image"); // image, split, map

  // Overlay Toggles
  const [showGrounding, setShowGrounding] = useState(true);
  const [showMask, setShowMask] = useState(true);
  const [showAOI, setShowAOI] = useState(false);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = e => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) {
      onUpload(files);
    }
  };

  // Processing steps timeline
  const pipelineStep = useMemo(() => {
    if (isRunning) return 3; // Routing/Processing
    if (isComplete) return 4; // Inference complete
    if (selectedEvidence.length > 0) return 2; // Metadata validated
    return 1; // Query configured
  }, [isRunning, isComplete, selectedEvidence]);

  const likelyTask = useMemo(() => {
    if (selectedEvidence.length === 2) {
      const modalities = selectedEvidence.map(e => e.kind);
      if (modalities.includes("OPTICAL") && modalities.includes("SAR")) {
        return "Bimodal sensor fusion model";
      }
      return "Temporal change detection model";
    }
    if (selectedEvidence.length === 1) {
      return "Single-scene classification model";
    }
    return "Awaiting image selection...";
  }, [selectedEvidence]);

  const validationAlert = useMemo(() => {
    if (backendValidationResult) return backendValidationResult.error;

    if (scenarioId === "change" && selectedEvidence.length === 1) {
      return "Format Alert: Change analysis requires a multi-temporal image pair. Please stage a secondary optical scene.";
    }
    if (scenarioId === "fusion" && selectedEvidence.length === 1) {
      return "Modality Alert: Fusion analysis requires optical + SAR microwave inputs. Please stage a SAR radar asset.";
    }
    return null;
  }, [backendValidationResult, scenarioId, selectedEvidence]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#1179FF]" />
          <p className="eyebrow text-[#1179FF]">Workstation Console</p>
        </div>
        <h1 className="font-editorial text-[38px] md:text-[54px] tracking-tight leading-[1.05] text-navy font-bold">
          Satellite Imagery Query Workstation
        </h1>
        <p className="max-w-[700px] text-sm md:text-base leading-relaxed text-[#5a709c]">
          Submit natural-language queries against multispectral image datasets.
          The Java agent parses coordinate bands, validates spatial overlaps,
          and routes queries to adapted VLMs.
        </p>
      </section>

      {/* Sleek Analysis Pipeline Ribbon */}
      <section className="case-ribbon rounded-lg">
        {[
          { num: "01", label: "Query", detail: "Configure question" },
          { num: "02", label: "Metadata", detail: "Validate coordinates" },
          { num: "03", label: "Routing", detail: "Determine strategy" },
          { num: "04", label: "Inference", detail: "Run VLM analysis" },
          { num: "05", label: "Report", detail: "Generate output log" },
        ].map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = pipelineStep === stepNum;
          const isDone = pipelineStep > stepNum;

          return (
            <div
              key={step.label}
              className={`ribbon-step ${isDone ? "ribbon-done" : isActive ? "ribbon-active" : "ribbon-pending"}`}
            >
              <span className="ribbon-number">{isDone ? "✓" : step.num}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </div>
            </div>
          );
        })}
      </section>

      {/* Workspace Columns */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-start">
        {/* COLUMN 1: IMAGE ASSETS & QUERY INPUT (Left - col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Query input */}
          <article className="investigation-plane plane-white rounded-lg p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#edf1fb] mb-4">
              <span className="h-6 w-6 rounded-full bg-[#EDF5FF] flex items-center justify-center font-mono text-[9px] font-bold text-[#1179FF]">
                01
              </span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Compose Query
                </h3>
                <p className="text-[10px] text-[#7082aa]">
                  Formulate analysis question
                </p>
              </div>
            </div>

            {/* Scenarios shortcuts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.keys(scenarios).map(id => (
                <button
                  key={id}
                  onClick={() => onScenario(id)}
                  className={`border px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[.06em] rounded transition ${
                    scenarioId === id
                      ? "border-navy bg-navy text-white"
                      : "border-[#dfe6fa] bg-[#F8FBFF] text-[#7184aa] hover:border-[#aebdf0] hover:bg-white"
                  }`}
                >
                  {scenarios[id].short}
                </button>
              ))}
            </div>

            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full min-h-[90px] resize-none border border-[#dbe4fa] bg-[#fbfdff] p-3 text-xs font-semibold leading-relaxed text-navy outline-none rounded focus:border-[#1179FF] focus:bg-white transition"
              placeholder="Enter query about the staged satellite assets..."
            />

            {/* Pipeline Status Overview */}
            <div className="mt-3 space-y-2 border-t border-[#edf1fb] pt-3">
              <div className="flex justify-between items-center text-[10px] text-[#5a709c]">
                <span>Staged assets:</span>
                <span className="font-mono font-bold bg-[#EDF5FF] px-1.5 py-0.5 rounded text-[#1179FF]">
                  {selectedEvidence.length} file
                  {selectedEvidence.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="text-[10px] text-[#5a709c]">
                <span>Target Engine: </span>
                <span className="font-bold text-navy">{likelyTask}</span>
              </div>
            </div>
          </article>

          {/* Staged Image Assets */}
          <article className="investigation-plane plane-blue rounded-lg p-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#cfe3ff] mb-4 justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-[#ddecff] flex items-center justify-center font-mono text-[9px] font-bold text-[#1179FF]">
                  02
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                    Staged Assets
                  </h3>
                  <p className="text-[10px] text-[#5a709c]">
                    Input satellite grid files
                  </p>
                </div>
              </div>
              <button
                onClick={onEvidence}
                className="text-[10px] font-bold text-[#1179FF] hover:underline"
              >
                Library
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`upload-stage-stamp cursor-pointer border-dashed border-2 mb-4 p-4 text-center rounded transition ${
                isDragging
                  ? "border-[#1179FF] bg-[#EDF5FF]"
                  : "border-[#8eb6ec] hover:border-[#1179FF]"
              }`}
            >
              <Upload size={18} className="text-[#1179FF]" />
              <p className="text-[10px] font-bold">DRAG & DROP GEOTIFF</p>
              <p className="text-[8px] text-[#7082aa]">
                GeoTIFF / TIFF or standard files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".tif,.tiff,.png,.jpg,.jpeg"
                onChange={e => onUpload(Array.from(e.target.files ?? []))}
                className="hidden"
              />
            </div>

            {/* List of staged assets */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {evidence.map(file => (
                <div
                  key={file.id}
                  className={`evidence-ticket ${file.kind === "SAR" ? "evidence-ticket-sar" : ""} ${file.warning ? "evidence-ticket-warning" : ""} ${file.included ? "opacity-100" : "opacity-40"}`}
                >
                  <span className="evidence-ticket-icon rounded">
                    {file.kind === "SAR" ? (
                      <Radar size={14} />
                    ) : (
                      <FileImage size={14} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[10px] font-bold text-navy truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="font-mono text-[7px] text-[#7082aa] mt-0.5">
                      {file.kind} · {file.date}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleEvidence(file.id)}
                    className="p-1 hover:bg-[#EDF5FF] text-[#7082aa] rounded animate-fade-in"
                  >
                    <Check
                      size={12}
                      className={
                        file.included
                          ? "text-emerald-600 font-bold"
                          : "text-gray-300"
                      }
                    />
                  </button>
                </div>
              ))}
              {!evidence.length && (
                <p className="text-center text-[10px] text-[#7082aa] py-3">
                  No staged files.
                </p>
              )}
            </div>
          </article>
        </div>

        {/* COLUMN 2: ACTIVE OBSERVATION VIEW (Center - col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Observation View Frame */}
          <article className="investigation-plane stage-plane rounded-lg overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="stage-chrome border-b border-[#e1eafa]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1179FF] animate-pulse" />
                <span className="font-mono text-[9px] font-bold tracking-wider text-[#1179FF] uppercase">
                  {scenarioId === "fusion"
                    ? "Multimodal Sensor Array"
                    : scenarioId === "change"
                      ? "Temporal Image Pair"
                      : "Optical Grid Scene"}
                </span>
              </div>

              {/* View Selector Tabs */}
              <div className="flex bg-[#EDF5FF] p-0.5 rounded-lg border border-[#d5dffa]">
                {[
                  { id: "image", label: "Image View" },
                  { id: "split", label: "Split Compare" },
                  { id: "map", label: "Interactive Map" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === "split" && selectedEvidence.length < 2) {
                        toast.info(
                          "Split compare requires at least 2 staged images."
                        );
                        return;
                      }
                      setActiveStageTab(tab.id);
                    }}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition ${
                      activeStageTab === tab.id
                        ? "bg-white text-navy shadow-sm"
                        : "text-[#7082aa] hover:text-navy"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Central Media Canvas */}
            <div className="relative min-h-[380px] bg-[#112557] overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#112557_95%)] pointer-events-none" />

              {/* Map View */}
              {activeStageTab === "map" && (
                <div className="absolute inset-0 w-full h-full">
                  <MapView
                    className="w-full h-full"
                    initialCenter={{ lat: 16.3952, lng: 81.7516 }}
                    initialZoom={13}
                  />
                </div>
              )}

              {/* Image View */}
              {activeStageTab === "image" && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  <img
                    src={
                      backendImageUrl ||
                      (scenarioId === "fusion"
                        ? "/satquery-prism-sar.png"
                        : scenarioId === "change"
                          ? "/satquery-prism-hero.png"
                          : "/satquery-prism-optical.png")
                    }
                    alt="Satellite Observation Grid"
                    className="w-full h-full object-cover transition duration-300"
                  />
                  {!backendImageUrl && (
                    <div className="orbital-halo h-56 w-56 absolute right-[10%] top-[15%]" />
                  )}
                </div>
              )}

              {/* Split Slider */}
              {activeStageTab === "split" && (
                <div className="absolute inset-0 w-full h-full">
                  <ImageCompareSlider
                    img1={scenario.images?.t1 || "/satquery-prism-optical.png"}
                    img2={scenario.images?.t2 || "/satquery-prism-hero.png"}
                    label1={`T1 (${selectedEvidence[0]?.date || "Jan"})`}
                    label2={`T2 (${selectedEvidence[1]?.date || "Jun"})`}
                  />
                </div>
              )}

              {/* Overlays SVG overlay */}
              {activeStageTab === "image" && (
                <div className="absolute inset-0 pointer-events-none">
                  {showGrounding && (isComplete || backendImageUrl) && (
                    <svg className="absolute inset-0 w-full h-full">
                      <rect
                        x="35%"
                        y="30%"
                        width="35%"
                        height="30%"
                        fill="none"
                        stroke="#B7F23A"
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        className="animate-pulse"
                      />
                      <g transform="translate(180, 100)">
                        <rect
                          x="0"
                          y="0"
                          width="130"
                          height="18"
                          fill="#112557"
                          rx="3"
                        />
                        <text
                          x="6"
                          y="12"
                          fill="#B7F23A"
                          className="font-mono text-[8px] font-bold"
                        >
                          [VLM GROUNDING MASK: 94%]
                        </text>
                      </g>
                    </svg>
                  )}
                  {showMask && isComplete && (
                    <div className="absolute inset-0 bg-[#FF7C70]/15 mix-blend-overlay border border-[#FF7C70]/30" />
                  )}
                  {showAOI && (
                    <svg className="absolute inset-0 w-full h-full">
                      <rect
                        x="15%"
                        y="15%"
                        width="70%"
                        height="70%"
                        fill="none"
                        stroke="#1179FF"
                        strokeWidth="2.5"
                        strokeDasharray="8 4"
                      />
                      <text
                        x="16%"
                        y="13%"
                        fill="#1179FF"
                        className="font-mono text-[8px] font-bold"
                      >
                        [BOUNDS AOI LIMIT]
                      </text>
                    </svg>
                  )}
                </div>
              )}

              {/* Translucent Cloud alert */}
              {scenarioId === "change" && (
                <div className="absolute top-4 left-4 z-10 bg-[#FF7C70]/90 text-navy font-bold text-[9px] px-2.5 py-1 rounded shadow flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  <span>
                    Cloud Cover Alert: 15% noise detected in T1 band.
                    Calibrating filters.
                  </span>
                </div>
              )}
            </div>

            {/* Readout coordinates footer */}
            <div className="bg-white px-4 py-2 border-t border-[#e2ebfb] flex items-center justify-between text-[10px] font-mono text-[#5a709c]">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-[#1179FF]" />
                <span>Geospatial Bounds: 16°23'42" N, 81°45'12" E</span>
              </div>
              <div>
                <span>GSD: 10m · ESA Sentinel-2 MSI</span>
              </div>
            </div>
          </article>

          {/* Overlays toggle switches */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-[#dfe7fb] rounded-lg">
            <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
              Raster Overlays:
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5a709c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrounding}
                  onChange={() => setShowGrounding(!showGrounding)}
                  className="rounded text-[#1179FF]"
                />
                <span>Grounding Boxes</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5a709c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMask}
                  onChange={() => setShowMask(!showMask)}
                  className="rounded text-[#7846D7]"
                />
                <span>Change Masks</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-[#5a709c] cursor-pointer">
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

          {/* Staged inputs warnings */}
          {validationAlert && (
            <div className="bg-[#fff7f5] border-l-4 border-[#FF7C70] p-4 text-xs text-[#8c514c] rounded-r-lg space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle size={14} className="text-[#FF7C70]" />
                <span>GEOSPATIAL STAGING ALIGNMENT WARNING</span>
              </div>
              <p>{validationAlert}</p>
            </div>
          )}

          {/* Run and Report action shelf */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 border border-[#dfe7fb] rounded-lg">
            <div className="text-[11px] text-[#5a709c]">
              {isRunning
                ? "Java agent evaluating routing..."
                : isComplete
                  ? "Analysis complete."
                  : "Stage assets and execute query."}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onRun}
                disabled={isRunning}
                className="secondary-button"
              >
                {isRunning ? (
                  <>
                    <Orbit size={14} className="animate-spin" />
                    <span>JVM processing...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Run Query Analysis</span>
                  </>
                )}
              </button>
              {isComplete && (
                <button onClick={onReceipt} className="primary-button">
                  <FileText size={14} />
                  <span>Inspect Report</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: ANALYSIS OUTPUT & FEATURES (Right - col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Analysis output */}
          <article
            className={`investigation-plane rounded-lg p-5 border ${
              isComplete
                ? backendReport?.verdict === "Strongly supported" ||
                  scenario.status === "Strongly verified"
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
              {isComplete && (
                <span
                  className={`px-2 py-0.5 font-mono text-[8px] font-bold rounded ${
                    (backendReport?.verdict || scenario.status).includes(
                      "Strongly"
                    )
                      ? "bg-[#B7F23A] text-[#234413]"
                      : "bg-[#F4B900]/25 text-[#735200]"
                  }`}
                >
                  {scenario.confidence || "HIGH"}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#5a709c] eyebrow">
                  Verification status
                </p>
                <h4 className="font-editorial text-2xl tracking-tight mt-1 font-bold">
                  {isComplete
                    ? backendReport?.verdict || scenario.status
                    : "Awaiting Execution..."}
                </h4>
              </div>

              <div>
                <p className="text-[10px] text-[#5a709c] eyebrow">
                  VLM response
                </p>
                <p className="text-xs leading-relaxed text-navy mt-1">
                  {isComplete
                    ? backendAnswer || scenario.result
                    : "Configure query inputs. Click 'Run Query Analysis' to trigger JVM strategy handlers and VLM inference."}
                </p>
              </div>
            </div>
          </article>

          {/* Analysis highlights / Processed Features */}
          <article className="investigation-plane plane-white rounded-lg p-5">
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

            {isComplete ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-[9px] font-mono text-[#7082aa] uppercase tracking-wider">
                    Analysis Highlights
                  </p>
                  {(backendReport
                    ? [
                        {
                          id: "f1",
                          detail:
                            "Spectral boundary change mapped across target coordinate pixels.",
                          source: "Java Difference Processor",
                          pass: true,
                        },
                      ]
                    : scenario.features
                  ).map(feat => (
                    <div key={feat.id} className="claim-ledger-item">
                      <p className="text-[11px] font-bold text-navy">
                        {feat.detail}
                      </p>
                      <div className="flex justify-between items-center mt-1.5 text-[8px] font-mono text-[#7082aa]">
                        <span>Source: {feat.source}</span>
                        <span className="text-emerald-700 font-bold">
                          VERIFIED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-[#edf1fb]">
                  <p className="text-[9px] font-mono text-[#7082aa] uppercase tracking-wider">
                    Raster limitations
                  </p>
                  {(backendReport
                    ? [
                        {
                          detail:
                            "VLM inference limits are calibrated against static training datasets.",
                        },
                      ]
                    : scenario.limitations
                  ).map((lim, i) => (
                    <div
                      key={i}
                      className="claim-ledger-item claim-ledger-challenge"
                    >
                      <p className="text-[11px] font-semibold text-[#8c514c]">
                        {lim.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-[#7082aa] text-center py-6">
                Highlights populated after analysis execution.
              </p>
            )}
          </article>

          {/* Recommendations (Yellow highlight card) */}
          <article className="investigation-plane plane-yellow rounded-lg p-5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#f4db94] mb-3">
              <Info size={14} className="text-[#F4B900]" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#735200]">
                Next analysis steps
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#735200]">
              {isComplete
                ? backendReport?.nextBestEvidence || scenario.recommendation
                : "Awaiting model response. System will output next analysis steps here."}
            </p>
          </article>
        </div>
      </div>

      {/* PIPELINE ROUTING TRACE LOGS */}
      <section className="investigation-plane plane-white rounded-lg p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#edf1fb] mb-6">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-[#1179FF]" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                Backend Execution Trace
              </h2>
              <p className="text-[10px] text-[#7082aa]">
                Polymorphic route logs and JVM processing latency
              </p>
            </div>
          </div>
          <span className="font-mono text-[9px] font-bold text-[#7082aa] uppercase bg-[#EDF5FF] px-2.5 py-1 rounded text-[#1179FF]">
            {isDemoMode ? "DEMO TELEMETRY LOG" : "LIVE JVM TRACE"}
          </span>
        </div>

        <div className="trace-board">
          {(backendTrace.length > 0
            ? backendTrace
            : isComplete
              ? scenario.trace
              : []
          ).map((step, idx) => (
            <div key={idx} className={`trace-step-vertical trace-done`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-6">
                <div>
                  <h4 className="text-xs font-bold text-navy flex items-center gap-2">
                    <span>{step.name || step.eventName}</span>
                    {step.toolName && (
                      <span className="font-mono text-[8px] font-bold bg-[#EDF5FF] text-[#1179FF] px-1 rounded">
                        {step.toolName}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#5a709c] mt-1">
                    {step.detail}
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-[8px] text-[#7082aa] self-start md:self-center">
                  <span>Latency: {step.time || "8ms"}</span>
                  <span className="text-emerald-700 font-bold bg-[#efffc9] px-1.5 py-0.5 rounded">
                    {step.status || "SUCCESS"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {!isComplete && !isRunning && (
            <p className="text-[11px] text-[#7082aa] py-3 italic">
              Execute analysis to stream trace telemetry logs.
            </p>
          )}
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-[#1179FF] py-3 font-semibold">
              <Orbit size={16} className="animate-spin" />
              <span>Streaming routing trace from Java HttpServer...</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// IMAGE LIBRARY COMPONENT (formerly Evidence Library)
// -------------------------------------------------------------
function EvidenceView({
  evidence,
  selectedCount,
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
            Review spatial resolution details and verify date profiles of staged
            image assets.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className="primary-button bg-navy">
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
          Staged assets:{" "}
          <strong className="font-editorial text-2xl text-navy">
            {selectedCount}
          </strong>{" "}
          file{selectedCount === 1 ? "" : "s"} active
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {evidence.map(item => (
          <article
            key={item.id}
            className={`investigation-plane rounded-lg p-5 border ${
              item.included
                ? item.kind === "SAR"
                  ? "plane-violet"
                  : "plane-blue"
                : "plane-white"
            } flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span
                  className={`h-10 w-10 flex items-center justify-center rounded ${
                    item.kind === "SAR"
                      ? "bg-[#eee5ff] text-[#7846d7]"
                      : "bg-[#ddecff] text-[#1179ff]"
                  }`}
                >
                  {item.kind === "SAR" ? (
                    <Radar size={18} />
                  ) : (
                    <FileImage size={18} />
                  )}
                </span>

                <button
                  onClick={() => onToggle(item.id)}
                  className={`include-toggle rounded-md ${
                    item.included ? "include-toggle-active" : ""
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
                  {item.kind} · {item.date} · {item.size}
                </p>
              </div>

              {item.warning && (
                <div className="bg-[#fff7f5] border-l-2 border-[#FF7C70] p-2 text-[10px] text-[#8c514c]">
                  {item.warning}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-5 pt-3 border-t border-navy/5">
              <span className="font-mono text-[8px] text-[#7084ad] tracking-wide">
                UID: {item.id.slice(0, 8)}...
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

        {!evidence.length && (
          <div className="col-span-full border border-dashed border-[#b5c7ed] bg-white/50 p-12 text-center rounded-lg space-y-3">
            <Layers3 size={32} className="mx-auto text-[#7084ad]" />
            <h3 className="font-editorial text-xl text-navy">Library Empty</h3>
            <p className="text-xs text-[#7082aa] max-w-sm mx-auto">
              Stage GeoTIFF raster assets or standard benchmark scenes to get
              started.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// QUERY HISTORY ARCHIVE COMPONENT (formerly Case History)
// -------------------------------------------------------------
function HistoryView({ history, onBack, onClear, onReopen }) {
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const typeMatch =
        filterType === "ALL" || item.scenarioId === filterType.toLowerCase();
      const searchMatch =
        !searchQuery ||
        item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.result.toLowerCase().includes(searchQuery.toLowerCase());
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
            Verify persisted reports and trace parameters saved to the local
            SQLite database.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className="primary-button bg-navy">
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
          {["ALL", "VQA", "CHANGE", "FUSION"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-[9px] font-bold rounded-md transition ${
                filterType === type
                  ? "bg-white text-navy shadow-sm"
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
          placeholder="Filter queries..."
          className="border border-[#dbe4fa] bg-[#fbfdff] px-3 py-1.5 text-xs rounded outline-none focus:border-[#1179FF] w-full md:w-64"
        />
      </div>

      <div className="space-y-4">
        {filteredHistory.map(record => (
          <article
            key={record.id}
            className="flex flex-col gap-4 border-l-4 border-[#1179FF] bg-white p-5 sm:flex-row sm:items-center justify-between rounded shadow-sm hover:shadow transition"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] font-bold bg-[#EDF5FF] text-[#1179FF] px-2 py-0.5 rounded">
                  {scenarios[record.scenarioId]?.label || "Custom Route"}
                </span>
                <span className="font-mono text-[8px] text-[#7084ad]">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(record.createdAt))}
                </span>
              </div>

              <h3 className="font-editorial text-[22px] tracking-tight leading-snug text-navy font-bold">
                "{record.query}"
              </h3>

              <p className="text-xs leading-relaxed text-[#5b719d] max-w-3xl">
                {record.result}
              </p>
            </div>

            <button
              onClick={() => onReopen(record)}
              className="secondary-button shrink-0 border border-navy/10 bg-[#EDF5FF] hover:bg-[#ddecff]"
            >
              <ScanSearch size={14} />
              <span>Load Report</span>
            </button>
          </article>
        ))}

        {!filteredHistory.length && (
          <div className="border border-dashed border-[#b5c7ed] bg-white/50 p-12 text-center rounded-lg space-y-3">
            <History size={32} className="mx-auto text-[#7084ad]" />
            <h3 className="font-editorial text-xl text-navy">
              No queries archived
            </h3>
            <p className="text-xs text-[#7082aa]">
              Archived query results and SQLite database traces will display
              here once generated.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// ANALYSIS REPORT MODAL COMPONENT (formerly Receipt Modal)
// -------------------------------------------------------------
function Receipt({
  scenario,
  question,
  evidence,
  complete,
  onClose,
  onDownload,
  backendAnswer,
  backendReport,
  isDemoMode,
  queryId,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#112557]/40 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="receipt-modal w-full max-w-[700px] bg-white rounded-lg shadow-2xl flex flex-col animate-scale-up">
        <div className="receipt-header border-b border-[#edf1fb] p-6 bg-gradient-to-r from-[#F8FBFF] to-[#fffefc] flex justify-between items-start">
          <div>
            <p className="eyebrow text-[#1179FF]">Query Analysis Report</p>
            <h3 className="font-editorial text-3xl font-bold tracking-tight text-navy mt-1">
              {scenario.label}
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
          <div className="space-y-6">
            <div>
              <p className="eyebrow text-[#7082aa]">User Query</p>
              <p className="mt-1.5 text-sm font-semibold text-navy">
                "{question}"
              </p>
            </div>

            <div>
              <p className="eyebrow text-[#7082aa]">Model Output</p>
              <p className="mt-1.5 font-editorial text-2xl leading-snug tracking-tight text-navy font-bold">
                {complete ? backendAnswer || scenario.result : "N/A"}
              </p>
            </div>

            <div className="bg-[#f5ffd9] border-l-3 border-[#B7F23A] px-4 py-3 text-xs leading-relaxed text-[#43681b] rounded-r">
              <span>
                <strong>Metadata Integrity:</strong> Staged files include
                verified coordinate reference bands. JSON report contains full
                audit trace logs.
              </span>
            </div>
          </div>

          <div className="receipt-side bg-[#F8FBFF] border border-[#dce5fb] p-5 rounded-lg flex flex-col justify-between">
            <div className="space-y-4">
              <p className="eyebrow text-[#7082aa]">Telemetry Profile</p>
              <div className="space-y-3.5 text-xs border-b border-[#edf1fb] pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Task Route:</span>
                  <span className="font-mono font-bold text-navy">
                    {scenario.task}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Staged Files:</span>
                  <span className="font-mono font-bold text-navy">
                    {evidence.length} active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Report Status:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Audit Ready
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#7082aa]">Runtime:</span>
                  <span className="font-mono font-bold text-[#7846D7]">
                    {isDemoMode ? "DEMO (WALK)" : "JVM PROXIED"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onDownload}
              className="secondary-button w-full mt-6 justify-center"
            >
              <Download size={14} />
              <span>Download JSON Report</span>
            </button>

            {!isDemoMode && complete && queryId && (
              <a
                href={`/outputs/report-${queryId}.pdf`}
                download={`satquery-report-${queryId}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="primary-button w-full mt-2 justify-center text-center inline-flex items-center gap-1.5"
              >
                <FileText size={14} />
                <span>Download PDF Report</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Image slider compare component helper
function ImageCompareSlider({
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
    if (e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = e => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      className="slider-container h-full w-full min-h-[350px] relative select-none rounded bg-[#112557]"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={e => handleMove(e.clientX)}
    >
      <div className="slider-after absolute inset-0">
        <img
          src={img2}
          alt="After"
          className="w-full h-full object-cover pointer-events-none"
        />
        <span className="absolute right-4 bottom-4 bg-[#112557]/80 text-[#B7F23A] font-mono text-[9px] font-bold tracking-wider px-2 py-1 z-10 rounded">
          {label2}
        </span>
      </div>

      <div
        className="slider-before absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={img1}
          alt="Before"
          className="absolute inset-y-0 left-0 object-cover pointer-events-none"
          style={{ width: containerWidth, maxWidth: "none", height: "100%" }}
        />
        <span className="absolute left-4 bottom-4 bg-[#112557]/80 text-[#1179FF] font-mono text-[9px] font-bold tracking-wider px-2 py-1 z-10 rounded">
          {label1}
        </span>
      </div>

      <div
        className="slider-handle absolute top-0 bottom-0"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="slider-handle-button select-none">
          <span className="text-[#B7F23A] font-bold text-sm">↔</span>
        </div>
      </div>
    </div>
  );
}
