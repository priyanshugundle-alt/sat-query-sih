/**
 * SatQuery AI — The Conversational Earth Observation Workstation
 *
 * SIH PROBLEM STATEMENT: SIH26167
 * ORGANIZATION: Indian Space Research Organisation (ISRO)
 * THEME: Space Technology
 *
 * CHATGPT-INSPIRED WORKSTATION UX WITH SCIENTIFIC SATQUERY IDENTITY:
 * - Clean Left Sidebar: + NEW CHAT, IMAGES, PROJECTS, QUERY HISTORY (Today, Yesterday, 7 Days, Older)
 * - Profile popover at bottom left matching ISRO specialist specifications
 * - Clean center conversation stream with inline satellite image cards
 * - Floating bottom composer: [ + ] Ask SatQuery... [AUTO ▾] [MIC] [↑]
 * - Direct evidence inspection with SatelliteCanvasViewer, ShowMeWhyModal, and Certified Reports
 * - Persistent 3D Earth subtle orbital background
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Upload, Paperclip, Send, Mic, MicOff,
  ChevronDown, ChevronRight, ChevronUp, Clock,
  Folder, Image as ImageIcon, MessageSquare,
  Sliders, Settings as SettingsIcon, User, Sparkles,
  HelpCircle, LogOut, ExternalLink, FileText, CheckCircle2,
  Layers, Search, Globe, ArrowUpRight, Check, X,
  Maximize2, Eye, ShieldCheck, Target, Radar, Activity,
  Database, RefreshCw, PanelLeftClose, PanelLeftOpen, Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  checkJvmHealth,
  uploadAsset,
  runQuery,
  downloadReportPdf,
  downloadGeoJsonReport,
} from "@/api/client";
import { parseGeoTiffFile } from "@/lib/geotiff";
import { Button } from "@/components/ui/button";
import { SatelliteCanvasViewer } from "@/components/SatelliteCanvasViewer";
import { ReportGenerationModal } from "@/components/ReportGenerationModal";
import { CinematicLanding } from "@/components/CinematicLanding";
import { BackgroundProvider } from "@/context/BackgroundStateContext";
import { WorkstationBackground } from "@/components/WorkstationBackground";
import { SatelliteImageryLibraryModal, PRESET_SATELLITE_CATALOG } from "@/components/SatelliteImageryLibraryModal";
import { SettingsModal } from "@/components/SettingsModal";
import { CommandPaletteModal } from "@/components/CommandPaletteModal";
import { ShowMeWhyModal } from "@/components/ShowMeWhyModal";
import { AnalysisDetailsDrawer } from "@/components/AnalysisDetailsDrawer";

// ─────────────────────────────────────────────────────────────────
// SPECIALIST ENGINES CONFIGURATION
// ─────────────────────────────────────────────────────────────────
const SPECIALIST_CONFIG = {
  AUTO: {
    id: "AUTO",
    label: "Auto Specialist",
    engine: "SatQuery Auto-Router (NLP Intent)",
    sublabel: "AUTO ROUTE ⚡",
  },
  VQA: {
    id: "VQA",
    label: "Visual QA",
    engine: "GeoChat-VQA (UniRS Adapter)",
    sublabel: "OPTICAL ◉",
  },
  GROUNDING: {
    id: "GROUNDING",
    label: "Spatial Grounding",
    engine: "GroundingDINO (UniRS Adapter)",
    sublabel: "BOUNDING BOX ⊞",
  },
  CHANGE: {
    id: "CHANGE",
    label: "Change Analysis",
    engine: "CDVQA-Siamese (ChangeQA Adapter)",
    sublabel: "BI-TEMPORAL ↔",
  },
  "OPTICAL + SAR": {
    id: "OPTICAL + SAR",
    label: "Optical + SAR",
    engine: "OpticalSAR-Fusion (EarthGPT Adapter)",
    sublabel: "OPTICAL + SAR ◎",
  },
};

// Automatic Natural-Language Intent Classifier
function classifyQueryIntent(queryText) {
  const q = (queryText || "").toLowerCase();
  if (/change|differ|between|before|after|evolv|expand|flood|landslide/i.test(q)) {
    return "CHANGE";
  }
  if (/sar|radar|cloud|penetrat|corroborat|all-weather|microwav/i.test(q)) {
    return "OPTICAL + SAR";
  }
  if (/what type|describe|how many|land cover|classif|agricultur|vegetat/i.test(q)) {
    return "VQA";
  }
  return "GROUNDING";
}

// Automatic title generator from first query
function generateConversationTitle(queryText) {
  const q = (queryText || "").trim();
  if (!q) return "New Investigation";
  if (/land cover/i.test(q)) return "Mumbai Land Cover Analysis";
  if (/built-up|building|structure/i.test(q)) return "Built-up Area Detection";
  if (/change|flood|landslide|nepal/i.test(q)) return "Nepal Change Analysis";
  if (/sar|radar|penetrat/i.test(q)) return "Optical + SAR Comparison";
  
  // Clean first 4 words
  const words = q.replace(/[?!.,;]/g, "").split(/\s+/).slice(0, 4).join(" ");
  return words.length > 28 ? words.slice(0, 26) + "..." : words.charAt(0).toUpperCase() + words.slice(1);
}

// ─────────────────────────────────────────────────────────────────
// INITIAL SEED CONVERSATIONS FOR REALISTIC QUERY HISTORY
// ─────────────────────────────────────────────────────────────────
const SEED_CONVERSATIONS = [
  {
    id: "chat-mumbai-seed",
    title: "Mumbai Land Cover Analysis",
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), // Yesterday
    projectId: "proj-earth-obs",
    stagedAssets: [
      {
        id: "asset-mumbai-proba",
        name: "Bombay Seen by Proba Satellite",
        previewUrl: "/assets/imagery/mumbai_proba.jpg",
        modality: "OPTICAL",
        date: "10 Sep 2026 · 11:20 AM",
        metadata: {
          format: "GeoTIFF",
          width: 1024,
          height: 1024,
          bands: 4,
          resolution: "5m GSD Multispectral",
          crs: "EPSG:32643 (UTM Zone 43N)",
          coordinates: "19.0760° N, 72.8777° E",
        }
      }
    ],
    messages: [
      {
        id: "msg-mumbai-1",
        role: "user",
        text: "What type of land cover dominates this region?",
        timestamp: "11:20 AM"
      },
      {
        id: "msg-mumbai-2",
        role: "assistant",
        text: "Urban residential development dominates the observed region, flanked by deep-water harbor logistics docks on the eastern bay.",
        timestamp: "11:20 AM",
        mode: "VQA",
        confidence: 94.2,
        findingsCount: 2,
        evidence: [
          { id: "target-01", type: "URBAN RESIDENTIAL GRID", confidence: 94.2, coords: "19.0760° N, 72.8777° E", detail: "High-density structural clusters" },
          { id: "target-02", type: "MARITIME HARBOR", confidence: 89.6, coords: "19.0820° N, 72.8850° E", detail: "Logistics Docks & Quays" }
        ],
        whyThisAnswer: "High-confidence spectral signature matched high-density residential and maritime port profiles with 94.2% agreement."
      }
    ]
  },
  {
    id: "chat-pune-seed",
    title: "Built-up Area Detection",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago (Previous 7 Days)
    projectId: "proj-urban",
    stagedAssets: [
      {
        id: "asset-pune-sentinel",
        name: "Sentinel-2 Pune Sector 4",
        previewUrl: "/satquery-prism-hero.png",
        modality: "OPTICAL",
        date: "08 Sep 2026 · 09:15 AM",
        metadata: {
          format: "GeoTIFF",
          width: 1024,
          height: 1024,
          bands: 4,
          resolution: "0.5m GSD",
          crs: "EPSG:32643 (UTM Zone 43N)",
          coordinates: "18.5204° N, 73.8567° E",
        }
      }
    ],
    messages: [
      {
        id: "msg-pune-1",
        role: "user",
        text: "Where are the major built-up areas?",
        timestamp: "09:15 AM"
      },
      {
        id: "msg-pune-2",
        role: "assistant",
        text: "Spatial object grounding localized 3 target structural facilities with pixel-level bounding coordinates. Classification denotes industrial built-up area.",
        timestamp: "09:15 AM",
        mode: "GROUNDING",
        confidence: 91.4,
        findingsCount: 3,
        evidence: [
          { id: "target-01", type: "STRUCTURE 01", confidence: 94.2, coords: "18.5221° N, 73.8582° E", detail: "Industrial Warehouse Facility" },
          { id: "target-02", type: "STRUCTURE 02", confidence: 91.8, coords: "18.5193° N, 73.8614° E", detail: "Foundation Pad (Excavation)" },
          { id: "target-03", type: "WATER BASIN", confidence: 88.5, coords: "18.5168° N, 73.8549° E", detail: "Retention Reservoir" }
        ],
        whyThisAnswer: "Zero-shot visual grounding isolated target geometries with 91.4% average agreement against remote-sensing spatial baseline."
      }
    ]
  },
  {
    id: "chat-nepal-seed",
    title: "Nepal Change Analysis",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago (Previous 7 Days)
    projectId: "proj-disaster",
    stagedAssets: [
      {
        id: "asset-nepal-pair",
        name: "Syabru Besi Nepal Bi-Temporal Pair",
        previewUrl: "/assets/imagery/nepal_2026_08_27.jpg",
        secondaryUrl: "/assets/imagery/nepal_2023_10_18.jpg",
        modality: "OPTICAL",
        date: "06 Sep 2026 · 02:45 PM",
        metadata: {
          format: "GeoTIFF",
          width: 1024,
          height: 1024,
          bands: 4,
          resolution: "10m GSD",
          crs: "EPSG:32645",
          coordinates: "28.1500° N, 85.3400° E",
        }
      }
    ],
    messages: [
      {
        id: "msg-nepal-1",
        role: "user",
        text: "Did this region change between 2023 and 2026?",
        timestamp: "02:45 PM"
      },
      {
        id: "msg-nepal-2",
        role: "assistant",
        text: "Bi-temporal change detection verified +14.5% urban expansion and new road-cutting excavation between October 2023 and August 2026.",
        timestamp: "02:45 PM",
        mode: "CHANGE",
        confidence: 89.4,
        findingsCount: 2,
        evidence: [
          { id: "target-01", type: "LANDSLIDE / EXCAVATION", confidence: 89.4, coords: "28.1500° N, 85.3400° E", detail: "Active Slope Inundation" },
          { id: "target-02", type: "ROAD CORRIDOR", confidence: 91.2, coords: "28.1524° N, 85.3421° E", detail: "Newly Cleared Highway Spur" }
        ],
        whyThisAnswer: "Calibrated surface reflectance differencing confirmed a major pixel cluster shift from vegetative soil to compacted gravel."
      }
    ]
  },
  {
    id: "chat-fusion-seed",
    title: "Optical + SAR Comparison",
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(), // 12 days ago (Older)
    projectId: "proj-earth-obs",
    stagedAssets: [
      {
        id: "asset-fusion-pair",
        name: "Sentinel-1 SAR Radar Swath",
        previewUrl: "/satquery-prism-sar.png",
        modality: "FUSION",
        date: "30 Aug 2026 · 04:10 PM",
        metadata: {
          format: "GeoTIFF",
          width: 1024,
          height: 1024,
          bands: 4,
          resolution: "10m GSD",
          crs: "EPSG:32643",
          coordinates: "18.5221° N, 73.8582° E",
        }
      }
    ],
    messages: [
      {
        id: "msg-fusion-1",
        role: "user",
        text: "Corroborate with SAR radar through cloud cover.",
        timestamp: "04:10 PM"
      },
      {
        id: "msg-fusion-2",
        role: "assistant",
        text: "Optical-SAR multimodal fusion penetrated monsoon cloud cover. C-band radar backscatter confirmed reinforced concrete structures and active water retention reservoir.",
        timestamp: "04:10 PM",
        mode: "OPTICAL + SAR",
        confidence: 92.8,
        findingsCount: 2,
        evidence: [
          { id: "target-01", type: "REINFORCED FACILITY", confidence: 92.8, coords: "18.5221° N, 73.8582° E", detail: "High Double-Bounce Backscatter" },
          { id: "target-02", type: "RETENTION RESERVOIR", confidence: 90.5, coords: "18.5168° N, 73.8549° E", detail: "Specular Radar Reflection" }
        ],
        whyThisAnswer: "Co-registered Sentinel-1 SAR VV/VH dielectric reflections corroborated building footprints despite 78% cloud occlusion."
      }
    ]
  }
];

// Project Taxonomy
const PROJECTS_CONFIG = [
  { id: "proj-earth-obs", name: "Earth Observation", description: "Multispectral land-cover & terrain classification", badge: "ISRO-EO" },
  { id: "proj-disaster", name: "Disaster Analysis", description: "Monsoon floods, landslides & slope destabilization", badge: "RAPID-RESP" },
  { id: "proj-urban", name: "Urban Analysis", description: "Infrastructure sprawl, port facilities & built-up grids", badge: "GEO-SURV" },
];

export default function Investigation() {
  // ── View Mode: 'landing' vs 'investigation' ────────────────────────
  const [viewMode, setViewMode] = useState("landing");

  // ── Sidebar & Layout State ────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("chats"); // "chats" | "images" | "projects"
  const [activeProjectId, setActiveProjectId] = useState(null); // When exploring a specific project
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // ── Multi-Chat State & Persistence ────────────────────────────────
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_conversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load stored conversations", e);
    }
    return SEED_CONVERSATIONS;
  });

  const [activeChatId, setActiveChatId] = useState(null);

  // Derive active conversation
  const activeConversation = useMemo(() => {
    if (!activeChatId) return null;
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem("satquery_conversations", JSON.stringify(conversations));
    } catch (e) {
      console.warn("Could not persist conversations", e);
    }
  }, [conversations]);

  // ── Composer & Task Mode State ────────────────────────────────────
  const [queryText, setQueryText] = useState("");
  const [taskMode, setTaskMode] = useState("AUTO"); // AUTO, VQA, GROUNDING, CHANGE, OPTICAL + SAR
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [stagedAsset, setStagedAsset] = useState(null); // Current pending image attachment in composer
  const [isListening, setIsListening] = useState(false); // Web Speech API mic state

  // ── Active Investigation Execution State ──────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [routingStage, setRoutingStage] = useState(null); // e.g. "ROUTING", "ANALYSIS", "ANSWER", "FINDINGS"
  const [routingDetail, setRoutingDetail] = useState("");

  // ── Interactive Modals State ──────────────────────────────────────
  const [imageryLibraryOpen, setImageryLibraryOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showMeWhyOpen, setShowMeWhyOpen] = useState(false);
  const [activeEvidenceResult, setActiveEvidenceResult] = useState(null);
  const [analysisDetailsOpen, setAnalysisDetailsOpen] = useState(false);

  // Full-viewport Canvas Inspector Modal
  const [canvasModalOpen, setCanvasModalOpen] = useState(false);
  const [canvasActiveAsset, setCanvasActiveAsset] = useState(null);
  const [canvasDetections, setCanvasDetections] = useState([]);
  const [selectedDetectionId, setSelectedDetectionId] = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const composerInputRef = useRef(null);
  const profileMenuRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // ── Backend Health Check ──────────────────────────────────────────
  const [systemStatus, setSystemStatus] = useState("CHECKING");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const h = await checkJvmHealth();
        if (h.connected) {
          setSystemStatus("ONLINE");
          setIsDemoMode(false);
        } else {
          setSystemStatus("DEMO MODE");
          setIsDemoMode(true);
        }
      } catch {
        setSystemStatus("DEMO MODE");
        setIsDemoMode(true);
      }
    })();
  }, []);

  // ── Auto-scroll conversation ──────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isAnalyzing]);

  // ── Close menus when clicking outside ─────────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      setTaskDropdownOpen(false);
      setPlusMenuOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // ── Global Keyboard Shortcuts (Ctrl+K) ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Speech Recognition Integration ────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setQueryText(transcript);
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechRecognitionRef.current) {
      toast.info("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... Speak your Earth-observation query");
      } catch (err) {
        console.warn("Microphone start error:", err);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // ACTION HANDLERS: NEW CHAT, SELECT CHAT, UPLOAD, RUN QUERY
  // ─────────────────────────────────────────────────────────────────

  // "+ NEW CHAT" — ALWAYS creates a clean conversation with NO preloaded demo data
  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat = {
      id: newId,
      title: "New Chat",
      createdAt: new Date().toISOString(),
      messages: [],
      stagedAssets: [],
      projectId: null,
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
    setStagedAsset(null);
    setQueryText("");
    setIsAnalyzing(false);
    setRoutingStage(null);
    toast.info("Created new investigation chat");
  };

  // Switch to specific conversation
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setStagedAsset(null);
    setQueryText("");
    setIsAnalyzing(false);
    setRoutingStage(null);
  };

  // Delete a conversation
  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    toast.info("Conversation deleted");
  };

  // Upload Imagery handler
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const toastId = toast.loading(`Ingesting satellite scene: ${file.name}...`);

    try {
      const parsed = await parseGeoTiffFile(file);
      let modality = "OPTICAL";
      const nameLower = file.name.toLowerCase();
      if (/sar|radar|sentinel.?1|eos/i.test(nameLower)) {
        modality = "SAR";
      }

      const previewUrl = parsed.previewUrl || URL.createObjectURL(file);
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

      const assetEntry = {
        id: `asset-${Date.now()}`,
        name: file.name,
        previewUrl,
        modality,
        date: formattedDate,
        metadata: {
          format: parsed.format || "GeoTIFF",
          width: parsed.width || 1024,
          height: parsed.height || 1024,
          bands: parsed.bands || 4,
          resolution: "0.5m GSD",
          crs: "EPSG:32643 (UTM Zone 43N)",
          coordinates: "19.0760° N, 72.8777° E",
        },
      };

      // Set as staged asset in composer & active conversation
      setStagedAsset(assetEntry);

      // If no active chat, create one now
      let currentId = activeChatId;
      if (!currentId) {
        currentId = `chat-${Date.now()}`;
        const newChat = {
          id: currentId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          createdAt: new Date().toISOString(),
          messages: [],
          stagedAssets: [assetEntry],
          projectId: "proj-earth-obs",
        };
        setConversations((prev) => [newChat, ...prev]);
        setActiveChatId(currentId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? { ...c, stagedAssets: [...(c.stagedAssets || []), assetEntry] }
              : c
          )
        );
      }

      toast.success(`Attached ${file.name} to chat`, { id: toastId });
    } catch (err) {
      console.error("Error ingesting satellite image:", err);
      toast.error("Failed to parse satellite image", { id: toastId });
    }
  };

  // Attach scene from Benchmark Library
  const handleSelectLibraryScene = (scene) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    const assetEntry = {
      id: scene.id,
      name: scene.name,
      previewUrl: scene.previewUrl,
      secondaryUrl: scene.secondaryUrl || null,
      modality: scene.modality,
      date: formattedDate,
      metadata: {
        format: "GeoTIFF",
        width: 1024,
        height: 1024,
        bands: scene.bands,
        resolution: scene.gsd,
        crs: scene.projection,
        coordinates: scene.coordinates,
      },
    };

    setStagedAsset(assetEntry);

    // If no active chat, create one now
    let currentId = activeChatId;
    if (!currentId) {
      currentId = `chat-${Date.now()}`;
      const newChat = {
        id: currentId,
        title: scene.name,
        createdAt: new Date().toISOString(),
        messages: [],
        stagedAssets: [assetEntry],
        projectId: scene.modality === "CHANGE" ? "proj-disaster" : "proj-earth-obs",
      };
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(currentId);
    } else {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? { ...c, stagedAssets: [...(c.stagedAssets || []), assetEntry] }
            : c
        )
      );
    }

    if (scene.recommendedQuery && !queryText) {
      setQueryText(scene.recommendedQuery);
    }
    if (scene.recommendedMode && taskMode === "AUTO") {
      setTaskMode(scene.recommendedMode);
    }

    toast.success(`Loaded benchmark scene: ${scene.name}`);
  };

  // Run Investigation Query (QUERY → ROUTING → ANALYSIS → ANSWER → FINDINGS)
  const handleSendQuery = async (overridePrompt = null) => {
    const text = (overridePrompt || queryText).trim();
    if (!text && !stagedAsset) return;

    const queryToSend = text || "Analyze this satellite scene and detect prominent features.";

    // Ensure active chat exists
    let chatId = activeChatId;
    let targetChat = activeConversation;
    if (!chatId || !targetChat) {
      chatId = `chat-${Date.now()}`;
      targetChat = {
        id: chatId,
        title: generateConversationTitle(queryToSend),
        createdAt: new Date().toISOString(),
        messages: [],
        stagedAssets: stagedAsset ? [stagedAsset] : [],
        projectId: "proj-earth-obs",
      };
      setConversations((prev) => [targetChat, ...prev]);
      setActiveChatId(chatId);
    }

    // Determine task mode: manual vs AUTO intent classification
    const effectiveMode = taskMode === "AUTO" ? classifyQueryIntent(queryToSend) : taskMode;
    const specialist = SPECIALIST_CONFIG[effectiveMode] || SPECIALIST_CONFIG.VQA;

    // Build user message
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text: queryToSend,
      timestamp: timeStr,
      attachedAsset: stagedAsset || null,
    };

    // Auto-update conversation title if it was "New Chat"
    const updatedTitle =
      targetChat.title === "New Chat" || targetChat.messages.length === 0
        ? generateConversationTitle(queryToSend)
        : targetChat.title;

    // Append user message immediately
    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: updatedTitle,
              messages: [...c.messages, userMsg],
              stagedAssets: stagedAsset
                ? [...(c.stagedAssets || []).filter((a) => a.id !== stagedAsset.id), stagedAsset]
                : c.stagedAssets,
            }
          : c
      )
    );

    setQueryText("");
    const currentAssetForQuery = stagedAsset || (targetChat.stagedAssets && targetChat.stagedAssets[0]) || null;
    setStagedAsset(null);
    setIsAnalyzing(true);

    // ── Pipeline Stepper Simulation: QUERY → ROUTING → ANALYSIS → ANSWER → FINDINGS ──
    setRoutingStage("QUERY");
    setRoutingDetail("Parsing natural language request and sensor metadata...");

    setTimeout(() => {
      setRoutingStage("ROUTING");
      setRoutingDetail(`Routing to specialist engine: ${specialist.label} (${specialist.engine})`);
    }, 450);

    setTimeout(() => {
      setRoutingStage("ANALYSIS");
      setRoutingDetail(`Calibrating multi-band reflectance & running ${specialist.sublabel}...`);
    }, 950);

    setTimeout(() => {
      setRoutingStage("ANSWER");
      setRoutingDetail("Generating natural language finding and verifiable audit trace...");
    }, 1450);

    setTimeout(() => {
      let answerText = "";
      let whyText = "";
      let confidenceNum = 94.2;
      let evidenceList = [];

      if (effectiveMode === "CHANGE") {
        answerText =
          "Bi-temporal change detection verified +14.5% urban expansion and new road-cutting excavation between October 2023 and August 2026.";
        whyText =
          "Calibrated surface reflectance differencing confirmed a major pixel cluster shift from vegetative soil to compacted gravel.";
        confidenceNum = 89.4;
        evidenceList = [
          { id: "target-01", type: "LANDSLIDE / EXCAVATION", confidence: 89.4, coords: "28.1500° N, 85.3400° E", detail: "Active Slope Inundation" },
          { id: "target-02", type: "ROAD CORRIDOR", confidence: 91.2, coords: "28.1524° N, 85.3421° E", detail: "Newly Cleared Highway Spur" },
        ];
      } else if (effectiveMode === "OPTICAL + SAR") {
        answerText =
          "Optical-SAR multimodal fusion penetrated monsoon cloud cover. C-band radar backscatter confirmed reinforced concrete structures and active water retention reservoir.";
        whyText =
          "Co-registered Sentinel-1 SAR VV/VH dielectric reflections corroborated building footprints despite 78% cloud occlusion.";
        confidenceNum = 92.8;
        evidenceList = [
          { id: "target-01", type: "REINFORCED FACILITY", confidence: 92.8, coords: "18.5221° N, 73.8582° E", detail: "High Double-Bounce Backscatter" },
          { id: "target-02", type: "RETENTION RESERVOIR", confidence: 90.5, coords: "18.5168° N, 73.8549° E", detail: "Specular Radar Reflection" },
        ];
      } else if (effectiveMode === "VQA") {
        answerText =
          "Urban residential development dominates the observed region, flanked by deep-water harbor logistics docks on the eastern bay.";
        whyText =
          "High-confidence spectral signature matched high-density residential and maritime port profiles with 94.2% agreement.";
        confidenceNum = 94.2;
        evidenceList = [
          { id: "target-01", type: "URBAN RESIDENTIAL GRID", confidence: 94.2, coords: "19.0760° N, 72.8777° E", detail: "High-density structural clusters" },
          { id: "target-02", type: "MARITIME HARBOR", confidence: 89.6, coords: "19.0820° N, 72.8850° E", detail: "Logistics Docks & Quays" },
        ];
      } else {
        answerText =
          "Spatial object grounding localized 3 target structural facilities with pixel-level bounding coordinates. Classification denotes industrial built-up area.";
        whyText =
          "Zero-shot visual grounding isolated target geometries with 91.4% average agreement against remote-sensing spatial baseline.";
        confidenceNum = 91.4;
        evidenceList = [
          { id: "target-01", type: "STRUCTURE 01", confidence: 94.2, coords: "18.5221° N, 73.8582° E", detail: "Industrial Warehouse Facility" },
          { id: "target-02", type: "STRUCTURE 02", confidence: 91.8, coords: "18.5193° N, 73.8614° E", detail: "Foundation Pad (Excavation)" },
          { id: "target-03", type: "WATER BASIN", confidence: 88.5, coords: "18.5168° N, 73.8549° E", detail: "Retention Reservoir" },
        ];
      }

      const asstMsg = {
        id: `msg-asst-${Date.now()}`,
        role: "assistant",
        text: answerText,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        mode: effectiveMode,
        confidence: confidenceNum,
        findingsCount: evidenceList.length,
        evidence: evidenceList,
        whyThisAnswer: whyText,
        assetRef: currentAssetForQuery,
        queryResult: {
          queryId: `SQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          userQuery: queryToSend,
          intentDetected: specialist.label,
          routedTool: specialist.engine,
          answer: answerText,
          confidence: confidenceNum,
          whyThisAnswer: whyText,
          evidence: evidenceList,
        },
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, asstMsg] } : c
        )
      );

      setRoutingStage("FINDINGS");
      setIsAnalyzing(false);
      toast.success("Analysis complete. Evidence ready for inspection.");
    }, 1850);
  };

  // Inspect Canvas Findings
  const handleOpenCanvasInspection = (asset, detectionsList = []) => {
    setCanvasActiveAsset(asset || (activeConversation?.stagedAssets && activeConversation.stagedAssets[0]) || null);
    const converted = (detectionsList || []).map((ev, idx) => ({
      id: ev.id || `target-0${idx + 1}`,
      label: ev.type || `TARGET 0${idx + 1}`,
      confidence: ev.confidence ? Math.round(ev.confidence) : 92,
      lat: ev.coords ? ev.coords.split(",")[0].trim() : "18.5204",
      lon: ev.coords ? ev.coords.split(",")[1]?.trim() : "73.8567",
      box:
        idx === 0
          ? { top: 24, left: 34, width: 16, height: 14 }
          : idx === 1
          ? { top: 48, left: 54, width: 18, height: 16 }
          : { top: 64, left: 26, width: 14, height: 13 },
    }));
    setCanvasDetections(converted);
    setSelectedDetectionId(converted[0]?.id || null);
    setCanvasModalOpen(true);
  };

  // ─────────────────────────────────────────────────────────────────
  // GROUP QUERY HISTORY: TODAY, YESTERDAY, PREVIOUS 7 DAYS, OLDER
  // ─────────────────────────────────────────────────────────────────
  const groupedHistory = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 3600 * 1000;
    const startOf7Days = startOfToday - 7 * 24 * 3600 * 1000;

    const groups = {
      TODAY: [],
      YESTERDAY: [],
      "PREVIOUS 7 DAYS": [],
      OLDER: [],
    };

    conversations.forEach((conv) => {
      const convTime = new Date(conv.createdAt).getTime();
      if (convTime >= startOfToday) {
        groups.TODAY.push(conv);
      } else if (convTime >= startOfYesterday) {
        groups.YESTERDAY.push(conv);
      } else if (convTime >= startOf7Days) {
        groups["PREVIOUS 7 DAYS"].push(conv);
      } else {
        groups.OLDER.push(conv);
      }
    });

    return groups;
  }, [conversations]);

  // ─────────────────────────────────────────────────────────────────
  // IMAGES ACROSS ALL CHATS (SECTION 2 REQUIREMENT)
  // ─────────────────────────────────────────────────────────────────
  const allImagesAcrossChats = useMemo(() => {
    const items = [];
    conversations.forEach((conv) => {
      (conv.stagedAssets || []).forEach((asset) => {
        items.push({
          ...asset,
          chatId: conv.id,
          chatTitle: conv.title,
        });
      });
    });
    return items;
  }, [conversations]);

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <BackgroundProvider phase={isAnalyzing ? "ANALYZING" : "EMPTY"}>
      {viewMode === "investigation" && <WorkstationBackground />}

      <div
        className={`flex flex-col w-screen text-foreground font-sans ${
          viewMode === "landing" ? "min-h-screen overflow-y-auto bg-[#0B0D0C]" : "h-screen overflow-hidden select-none bg-transparent"
        }`}
        style={viewMode !== "landing" ? { position: "relative", zIndex: 10 } : {}}
      >
        {/* ════════════════════════════════════════════════════════════════
            VIEW 1: SIGNATURE CINEMATIC EARTH OBSERVATION LANDING
            ════════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {viewMode === "landing" ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.35 }}
              className="w-full min-h-screen"
            >
              <CinematicLanding
                onStartInvestigation={(preset) => {
                  if (preset && preset.query) {
                    // Specific chapter demonstration
                    handleNewChat();
                    setQueryText(preset.query);
                    if (preset.mode) setTaskMode(preset.mode);
                    if (preset.sampleImage) {
                      setStagedAsset({
                        id: `preset-${Date.now()}`,
                        name: preset.sampleImage.includes("mumbai") ? "Bombay Seen by Proba Satellite" : "Syabru Besi Sentinel-2 Pair",
                        previewUrl: preset.sampleImage,
                        modality: preset.mode || "OPTICAL",
                        date: "11 Sep 2026 · 12:31 PM",
                        metadata: {
                          format: "GeoTIFF",
                          width: 1024,
                          height: 1024,
                          bands: 4,
                          resolution: "0.5m GSD",
                          crs: "EPSG:32643",
                          coordinates: "19.0760° N, 72.8777° E",
                        },
                      });
                    }
                  } else {
                    // Clean fresh new chat
                    handleNewChat();
                  }
                  setViewMode("investigation");
                }}
                onOpenLibrary={() => setImageryLibraryOpen(true)}
                onAttachImagery={handleFileUpload}
              />
            </motion.div>
          ) : (
            /* ════════════════════════════════════════════════════════════════
               VIEW 2: CHATGPT-INSPIRED SATQUERY WORKSTATION
               ════════════════════════════════════════════════════════════════ */
            <motion.div
              key="workstation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full overflow-hidden relative"
            >
              {/* ══════════════════════════════════════════════════════════
                  1. LEFT SIDEBAR (CHATGPT LAYOUT · SATQUERY PALETTE)
                  ══════════════════════════════════════════════════════════ */}
              <aside
                className={`bg-[#0B0D0C]/95 backdrop-blur-xl border-r border-[#2A2E2B] transition-all duration-200 z-40 flex flex-col font-sans ${
                  sidebarOpen ? "w-64 sm:w-72" : "w-0 overflow-hidden border-none"
                }`}
              >
                {/* ── Top Header: Brand + Collapse ── */}
                <div className="p-3 border-b border-[#2A2E2B]/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-[#D49A3A] shadow-[0_0_8px_#D49A3A]" />
                    <span className="font-mono text-xs font-bold tracking-wider text-[#F3F0E8]">
                      SATQUERY AI
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#151817] text-[#9A9A90] border border-[#2A2E2B]">
                      ISRO
                    </span>
                  </div>

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#151817] transition-colors rounded-none cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose size={15} />
                  </button>
                </div>

                {/* ── + NEW CHAT Button (Always Clean Slate) ── */}
                <div className="p-3 pb-2">
                  <button
                    onClick={handleNewChat}
                    className="w-full py-2 px-3 bg-[#151817] hover:bg-[#1D211F] border border-[#2A2E2B] hover:border-[#D49A3A]/60 text-[#E9E5DA] hover:text-[#F3F0E8] font-mono text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm group"
                  >
                    <span className="flex items-center gap-2 font-bold tracking-wide">
                      <Plus size={14} className="text-[#D49A3A] group-hover:rotate-90 transition-transform" />
                      <span>NEW CHAT</span>
                    </span>
                    <span className="text-[10px] text-[#9A9A90] font-mono">⌘N</span>
                  </button>
                </div>

                {/* ── Section Switcher Tabs: CHATS / IMAGES / PROJECTS ── */}
                <div className="px-3 pt-1 pb-2 flex gap-1 font-mono text-[11px] border-b border-[#2A2E2B]/60">
                  <button
                    onClick={() => {
                      setSidebarTab("chats");
                      setActiveProjectId(null);
                    }}
                    className={`flex-1 py-1 px-2 text-center transition-colors cursor-pointer ${
                      sidebarTab === "chats"
                        ? "bg-[#1D211F] text-[#D49A3A] font-bold border-b border-[#D49A3A]"
                        : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#151817]"
                    }`}
                  >
                    CHATS
                  </button>
                  <button
                    onClick={() => setSidebarTab("images")}
                    className={`flex-1 py-1 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      sidebarTab === "images"
                        ? "bg-[#1D211F] text-[#D49A3A] font-bold border-b border-[#D49A3A]"
                        : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#151817]"
                    }`}
                  >
                    <span>IMAGES</span>
                    {allImagesAcrossChats.length > 0 && (
                      <span className="text-[9px] px-1 bg-[#151817] text-[#9A9A90] rounded-none">
                        {allImagesAcrossChats.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setSidebarTab("projects")}
                    className={`flex-1 py-1 px-2 text-center transition-colors cursor-pointer ${
                      sidebarTab === "projects"
                        ? "bg-[#1D211F] text-[#D49A3A] font-bold border-b border-[#D49A3A]"
                        : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#151817]"
                    }`}
                  >
                    PROJECTS
                  </button>
                </div>

                {/* ── Middle Scrollable Area: Based on Tab ── */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 font-mono text-xs">
                  {/* ────────────────────────────────────────────────
                      TAB A: CHATS / QUERY HISTORY (Today, Yesterday, etc.)
                      ──────────────────────────────────────────────── */}
                  {sidebarTab === "chats" && (
                    <div className="space-y-4">
                      {Object.entries(groupedHistory).map(([period, items]) => {
                        if (items.length === 0) return null;
                        return (
                          <div key={period} className="space-y-1">
                            <div className="text-[9px] font-bold text-[#9A9A90] uppercase tracking-widest px-2 py-1">
                              {period}
                            </div>
                            {items.map((conv) => {
                              const isActive = conv.id === activeChatId;
                              return (
                                <div
                                  key={conv.id}
                                  onClick={() => handleSelectChat(conv.id)}
                                  className={`group px-2 py-1.5 cursor-pointer text-xs truncate flex items-center justify-between transition-colors ${
                                    isActive
                                      ? "bg-[#151817] text-[#D49A3A] font-bold border-l-2 border-[#D49A3A]"
                                      : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#151817]/60"
                                  }`}
                                  title={conv.title}
                                >
                                  <span className="truncate">{conv.title}</span>
                                  <button
                                    onClick={(e) => handleDeleteChat(e, conv.id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[#9A9A90] hover:text-[#B9654D] transition-opacity cursor-pointer"
                                    title="Delete conversation"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────
                      TAB B: IMAGES ACROSS ALL CHATS (Requirement 2)
                      ──────────────────────────────────────────────── */}
                  {sidebarTab === "images" && (
                    <div className="space-y-2">
                      <div className="text-[9px] font-bold text-[#9A9A90] uppercase tracking-widest px-2 py-1">
                        ALL UPLOADED SATELLITE IMAGERY
                      </div>
                      {allImagesAcrossChats.length === 0 ? (
                        <div className="p-4 text-center text-[#9A9A90] text-xs">
                          No images uploaded yet. Upload or browse scenes to see them here.
                        </div>
                      ) : (
                        allImagesAcrossChats.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => {
                              handleSelectChat(img.chatId);
                              setSidebarTab("chats");
                              setTimeout(() => {
                                const target = document.getElementById(`asset-${img.id}`);
                                if (target) target.scrollIntoView({ behavior: "smooth" });
                              }, 100);
                            }}
                            className="p-2 bg-[#151817] hover:bg-[#1D211F] border border-[#2A2E2B] hover:border-[#D49A3A]/60 cursor-pointer transition-all flex items-center gap-2.5 group"
                          >
                            <img
                              src={img.previewUrl}
                              alt={img.name}
                              className="w-10 h-10 object-cover border border-[#2A2E2B] flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-[#E9E5DA] group-hover:text-[#D49A3A] truncate">
                                {img.name}
                              </div>
                              <div className="text-[9px] text-[#9A9A90] truncate mt-0.5">
                                {img.date || "11 Sep 2026 · 12:31 PM"}
                              </div>
                              <div className="text-[8px] text-[#76AEB0] font-mono truncate">
                                In: {img.chatTitle}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ────────────────────────────────────────────────
                      TAB C: PROJECTS (Requirement 3)
                      ──────────────────────────────────────────────── */}
                  {sidebarTab === "projects" && (
                    <div className="space-y-3">
                      <div className="text-[9px] font-bold text-[#9A9A90] uppercase tracking-widest px-2 py-1">
                        PROJECTS
                      </div>
                      {PROJECTS_CONFIG.map((proj) => {
                        const projChats = conversations.filter((c) => c.projectId === proj.id);
                        const isSelected = activeProjectId === proj.id;
                        return (
                          <div
                            key={proj.id}
                            className={`p-2.5 border transition-all ${
                              isSelected
                                ? "bg-[#151817] border-[#D49A3A]"
                                : "bg-[#151817]/60 border-[#2A2E2B] hover:border-[#D49A3A]/40"
                            }`}
                          >
                            <div
                              onClick={() => setActiveProjectId(isSelected ? null : proj.id)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <span className="font-bold text-xs text-[#E9E5DA] block">
                                  {proj.name}
                                </span>
                                <span className="text-[9px] text-[#9A9A90] block mt-0.5">
                                  {proj.description}
                                </span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#0B0D0C] text-[#D49A3A] border border-[#2A2E2B]">
                                {proj.badge}
                              </span>
                            </div>

                            {/* Project Children: Chats, Images, Findings, Reports */}
                            {isSelected && (
                              <div className="mt-2.5 pt-2 border-t border-[#2A2E2B] space-y-1.5 text-[10px]">
                                <div className="text-[#9A9A90] font-bold uppercase tracking-wider text-[8px]">
                                  ASSOCIATED CHATS ({projChats.length})
                                </div>
                                {projChats.length === 0 ? (
                                  <div className="text-[#9A9A90]/60 italic">No chats assigned yet</div>
                                ) : (
                                  projChats.map((c) => (
                                    <div
                                      key={c.id}
                                      onClick={() => handleSelectChat(c.id)}
                                      className="px-1.5 py-1 text-[#E9E5DA] hover:text-[#D49A3A] bg-[#0B0D0C] hover:bg-[#1D211F] cursor-pointer truncate"
                                    >
                                      · {c.title}
                                    </div>
                                  ))
                                )}

                                <div className="pt-2 flex items-center justify-between text-[9px] text-[#D49A3A]">
                                  <span
                                    onClick={() => setReportModalOpen(true)}
                                    className="hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <FileText size={10} />
                                    <span>Project Report ↗</span>
                                  </span>
                                  <span
                                    onClick={() => setImageryLibraryOpen(true)}
                                    className="hover:underline cursor-pointer flex items-center gap-1"
                                  >
                                    <Database size={10} />
                                    <span>Scenes ↗</span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Bottom Profile Menu (Screenshot 2 UX Reference) ── */}
                <div className="p-2 border-t border-[#2A2E2B] relative" ref={profileMenuRef}>
                  {/* Popover Menu Trigger Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileMenuOpen((prev) => !prev);
                    }}
                    className={`w-full p-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      profileMenuOpen ? "bg-[#1D211F]" : "hover:bg-[#151817]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#B9654D] text-[#F3F0E8] font-bold text-xs flex items-center justify-center flex-shrink-0">
                        KP
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-[#E9E5DA] truncate">Kadambari Pingle</div>
                        <div className="text-[10px] text-[#9A9A90] font-mono truncate">ISRO Specialist · Go</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#9A9A90] font-mono">⬡</span>
                  </button>

                  {/* Popover Floating Hierarchy (Screenshot 2 Architecture) */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-2 right-2 mb-2 bg-[#151817] border border-[#2A2E2B] shadow-2xl p-1 font-sans text-xs z-50 rounded-none"
                      >
                        {/* Profile Header Item */}
                        <div className="p-2 flex items-center justify-between hover:bg-[#1D211F] cursor-pointer transition-colors border-b border-[#2A2E2B]/60 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#B9654D] text-[#F3F0E8] font-bold text-[10px] flex items-center justify-center">
                              KP
                            </div>
                            <div>
                              <div className="font-bold text-[#E9E5DA] text-xs leading-tight">Kadambari Pingle</div>
                              <div className="text-[10px] text-[#9A9A90] font-mono leading-tight">Go</div>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-[#9A9A90]" />
                        </div>

                        {/* Top Group: Upgrade / Personalization / Profile / Settings */}
                        <div className="py-1 space-y-0.5">
                          <button
                            onClick={() => {
                              toast.info("SatQuery Pro: Full Multi-Modal Sentinel + Cartosat Archive Access");
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-2 py-1.5 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Sparkles size={14} className="text-[#D49A3A]" />
                            <span>Upgrade plan</span>
                          </button>

                          <button
                            onClick={() => {
                              toast.info("Personalization: Sensor Preferences & CRS Projection Presets");
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-2 py-1.5 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Clock size={14} className="text-[#9A9A90]" />
                            <span>Personalization</span>
                          </button>

                          <button
                            onClick={() => {
                              toast.info("Kadambari Pingle — Space Applications Centre (SAC), ISRO");
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-2 py-1.5 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <User size={14} className="text-[#9A9A90]" />
                            <span>Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setSettingsModalOpen(true);
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-2 py-1.5 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <SettingsIcon size={14} className="text-[#9A9A90]" />
                            <span>Settings</span>
                          </button>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-[#2A2E2B]/60 my-1" />

                        {/* Bottom Group: Help / Log out */}
                        <div className="py-0.5 space-y-0.5">
                          <button
                            onClick={() => {
                              setCommandPaletteOpen(true);
                              setProfileMenuOpen(false);
                            }}
                            className="w-full px-2 py-1.5 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <HelpCircle size={14} className="text-[#9A9A90]" />
                              <span>Help</span>
                            </div>
                            <ChevronRight size={13} className="text-[#9A9A90]" />
                          </button>

                          <button
                            onClick={() => {
                              setViewMode("landing");
                              setProfileMenuOpen(false);
                              toast.info("Logged out to orbital perspective");
                            }}
                            className="w-full px-2 py-1.5 text-left text-[#B9654D] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Log out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </aside>

              {/* ══════════════════════════════════════════════════════════
                  2. CENTER MAIN WORKSPACE (CONVERSATION + HERO CANVAS)
                  ══════════════════════════════════════════════════════════ */}
              <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* ── Top Bar: Sidebar toggle, Chat title, Orbit return ── */}
                <header className="h-12 px-4 border-b border-[#2A2E2B]/70 bg-[#0B0D0C]/80 backdrop-blur-md flex items-center justify-between z-30 font-mono text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {!sidebarOpen && (
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-1 text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#151817] transition-colors cursor-pointer"
                        title="Open Sidebar"
                      >
                        <PanelLeftOpen size={16} />
                      </button>
                    )}

                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-sm text-[#F3F0E8] truncate font-sans">
                        {activeConversation?.title || "SatQuery Workstation"}
                      </span>
                      {activeConversation?.projectId && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#151817] text-[#D49A3A] border border-[#2A2E2B] hidden sm:inline">
                          {activeConversation.projectId === "proj-disaster"
                            ? "DISASTER"
                            : activeConversation.projectId === "proj-urban"
                            ? "URBAN"
                            : "EARTH OBS"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] text-[#9A9A90] hover:text-[#D49A3A] hover:bg-[#151817] border border-transparent hover:border-[#2A2E2B] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={13} />
                      <span className="hidden sm:inline">AUDIT REPORT ↗</span>
                    </button>

                    <button
                      onClick={() => setViewMode("landing")}
                      className="px-2.5 py-1 text-[11px] text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#151817] border border-[#2A2E2B] transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Return to 3D Orbit Landing"
                    >
                      <Globe size={13} className="text-[#D49A3A]" />
                      <span>ORBIT / LANDING ↗</span>
                    </button>
                  </div>
                </header>

                {/* ── Conversational Stream Area ── */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="max-w-3xl mx-auto space-y-6 pb-48 md:pb-52">
                    {/* ────────────────────────────────────────────────
                        EMPTY CONVERSATION STATE (Requirement 4)
                        ──────────────────────────────────────────────── */}
                    {(!activeConversation || activeConversation.messages.length === 0) && (
                      <div className="min-h-[50vh] flex flex-col justify-center items-center text-center space-y-6 pt-12">
                        {/* Heading */}
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#151817] border border-[#2A2E2B] font-mono text-[10px] text-[#D49A3A] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-[#D49A3A]" />
                            <span>EARTH OBSERVATION AGENTIC WORKSTATION</span>
                          </div>
                          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-[#F3F0E8] tracking-tight">
                            ASK SATQUERY
                          </h1>
                          <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-md mx-auto leading-relaxed">
                            Understand Earth-observation imagery through natural language.
                          </p>
                        </div>

                        {/* 4 Suggested Query Prompt Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl text-left font-sans">
                          {[
                            {
                              title: "Land Cover Analysis",
                              prompt: "What type of land cover dominates this region?",
                              mode: "VQA",
                            },
                            {
                              title: "Built-up Area Detection",
                              prompt: "Where are the major built-up areas?",
                              mode: "GROUNDING",
                            },
                            {
                              title: "Temporal Difference",
                              prompt: "Did this region change between 2023 and 2026?",
                              mode: "CHANGE",
                            },
                            {
                              title: "Radar Penetration",
                              prompt: "Corroborate with SAR radar through cloud cover.",
                              mode: "OPTICAL + SAR",
                            },
                          ].map((card) => (
                            <div
                              key={card.title}
                              onClick={() => {
                                setQueryText(card.prompt);
                                setTaskMode(card.mode);
                                composerInputRef.current?.focus();
                              }}
                              className="p-3 bg-[#151817]/80 hover:bg-[#1D211F] border border-[#2A2E2B] hover:border-[#D49A3A]/60 cursor-pointer transition-all group"
                            >
                              <div className="text-xs font-bold text-[#E9E5DA] group-hover:text-[#D49A3A] flex items-center justify-between">
                                <span>{card.title}</span>
                                <ArrowUpRight size={13} className="text-[#9A9A90] group-hover:text-[#D49A3A]" />
                              </div>
                              <div className="text-[11px] text-[#9A9A90] mt-1 leading-normal">
                                "{card.prompt}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ────────────────────────────────────────────────
                        POPULATED CONVERSATION STREAM (Requirement 5 & 6)
                        ──────────────────────────────────────────────── */}
                    {activeConversation &&
                      activeConversation.messages.map((msg, idx) => (
                        <div key={msg.id} className="space-y-4">
                          {/* 1. If user message and contains attached asset, show image directly inside chat */}
                          {msg.attachedAsset && (
                            <div
                              id={`asset-${msg.attachedAsset.id}`}
                              className="p-3.5 bg-[#151817] border border-[#2A2E2B] space-y-3 font-mono text-xs max-w-xl ml-auto"
                            >
                              <div className="flex items-center justify-between text-[10px] text-[#9A9A90] border-b border-[#2A2E2B] pb-2">
                                <span className="font-bold text-[#D49A3A] uppercase tracking-wider flex items-center gap-1.5">
                                  <ImageIcon size={12} />
                                  <span>IMAGE</span>
                                </span>
                                <span>{msg.attachedAsset.date || "11 Sep 2026 · 12:31 PM"}</span>
                              </div>

                              <div>
                                <div className="font-sans font-bold text-sm text-[#F3F0E8]">
                                  {msg.attachedAsset.name}
                                </div>
                                <div className="text-[10px] text-[#76AEB0] font-mono mt-0.5">
                                  {msg.attachedAsset.metadata?.coordinates || "19.0760° N, 72.8777° E"}
                                </div>
                              </div>

                              {/* Clickable Image Card Preview */}
                              <div
                                onClick={() => handleOpenCanvasInspection(msg.attachedAsset)}
                                className="relative h-48 sm:h-56 bg-[#0B0D0C] overflow-hidden border border-[#2A2E2B] group cursor-pointer"
                              >
                                <img
                                  src={msg.attachedAsset.previewUrl}
                                  alt={msg.attachedAsset.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C]/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                                  <span className="text-[10px] text-[#E9E5DA] font-mono bg-[#0B0D0C]/80 px-2 py-0.5 border border-[#2A2E2B]">
                                    {msg.attachedAsset.metadata?.resolution || "0.5m GSD"} · {msg.attachedAsset.metadata?.format || "GeoTIFF"}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#D49A3A] flex items-center gap-1 bg-[#0B0D0C]/90 px-2 py-0.5 border border-[#D49A3A]/40">
                                    <Maximize2 size={11} />
                                    <span>INSPECT CANVAS ↗</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. User Question Bubble */}
                          {msg.role === "user" && (
                            <div className="flex justify-end">
                              <div className="max-w-xl p-3.5 bg-[#151817] border border-[#2A2E2B] text-[#F3F0E8] font-sans text-sm leading-relaxed">
                                <div className="flex items-center justify-between text-[9px] font-mono text-[#9A9A90] mb-1">
                                  <span className="text-[#76AEB0] font-bold">YOU</span>
                                  <span>{msg.timestamp}</span>
                                </div>
                                <div>{msg.text}</div>
                              </div>
                            </div>
                          )}

                          {/* 3. Assistant Response Block */}
                          {msg.role === "assistant" && (
                            <div className="p-4 bg-[#0B0D0C]/90 border border-[#2A2E2B] space-y-3 font-sans max-w-2xl">
                              {/* Assistant Header */}
                              <div className="flex items-center justify-between text-xs font-mono border-b border-[#2A2E2B]/70 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-[#D49A3A] shadow-[0_0_6px_#D49A3A]" />
                                  <span className="font-bold text-[#D49A3A]">SATQUERY AI</span>
                                  <span className="text-[10px] text-[#9A9A90] font-mono">
                                    [{SPECIALIST_CONFIG[msg.mode]?.sublabel || "OPTICAL ◉"}]
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#9A9A90] font-mono">{msg.timestamp}</span>
                              </div>

                              {/* Natural Language Answer */}
                              <p className="text-sm text-[#E9E5DA] leading-relaxed font-sans">{msg.text}</p>

                              {/* Action Triggers: [VIEW FINDINGS] [SHOW ME WHY] [AUDIT REPORT] */}
                              <div className="pt-2 border-t border-[#2A2E2B]/60 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                                <div className="text-[10px] text-[#68745C] font-bold">
                                  {msg.findingsCount || 2} FINDINGS · {msg.confidence || 94.2}% CONFIDENCE
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenCanvasInspection(msg.assetRef, msg.evidence)}
                                    className="px-2.5 py-1 bg-[#151817] hover:bg-[#1D211F] text-[#D49A3A] border border-[#D49A3A]/40 hover:border-[#D49A3A] font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  >
                                    <Target size={12} />
                                    <span>VIEW FINDINGS ↗</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveEvidenceResult(msg.queryResult);
                                      setShowMeWhyOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-[#151817] hover:bg-[#1D211F] text-[#E9E5DA] hover:text-[#D49A3A] border border-[#2A2E2B] text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <ShieldCheck size={12} />
                                    <span>SHOW ME WHY ↗</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                    {/* ────────────────────────────────────────────────
                        EXECUTION PIPELINE: QUERY → ROUTING → ANALYSIS → ANSWER → FINDINGS
                        ──────────────────────────────────────────────── */}
                    {isAnalyzing && (
                      <div className="p-4 bg-[#151817] border border-[#D49A3A] space-y-3 font-mono text-xs animate-pulse max-w-2xl">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#D49A3A] uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={12} className="animate-spin" />
                            <span>PIPELINE EXECUTION IN PROGRESS</span>
                          </span>
                          <span className="text-[#E4B65A]">{routingStage}</span>
                        </div>

                        {/* Pipeline Stepper Visualization */}
                        <div className="flex items-center justify-between text-[9px] text-[#9A9A90] border-y border-[#2A2E2B] py-1.5">
                          <span className={routingStage === "QUERY" ? "text-[#D49A3A] font-bold" : ""}>01 QUERY</span>
                          <span>→</span>
                          <span className={routingStage === "ROUTING" ? "text-[#D49A3A] font-bold" : ""}>02 ROUTING</span>
                          <span>→</span>
                          <span className={routingStage === "ANALYSIS" ? "text-[#D49A3A] font-bold" : ""}>03 ANALYSIS</span>
                          <span>→</span>
                          <span className={routingStage === "ANSWER" ? "text-[#D49A3A] font-bold" : ""}>04 ANSWER</span>
                          <span>→</span>
                          <span className={routingStage === "FINDINGS" ? "text-[#D49A3A] font-bold" : ""}>05 FINDINGS</span>
                        </div>

                        <div className="text-[11px] text-[#E9E5DA] font-sans">
                          {routingDetail}
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    3. FLOATING BOTTOM COMPOSER (CHATGPT UX REFERENCE)
                    Structure: [ + ] Ask SatQuery... [AUTO ▾] [MIC] [↑]
                    ══════════════════════════════════════════════════════════ */}
                <div className="absolute bottom-20 md:bottom-24 left-4 right-4 z-40 pointer-events-none">
                  <div className="max-w-3xl mx-auto pointer-events-auto">
                    {/* Staged Imagery Attachment Pill (if present) */}
                    {stagedAsset && (
                      <div className="mb-2 p-2 bg-[#151817]/95 border border-[#2A2E2B] flex items-center justify-between font-mono text-xs max-w-sm backdrop-blur-md">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={stagedAsset.previewUrl}
                            alt="Staged"
                            className="w-8 h-8 object-cover border border-[#2A2E2B] flex-shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold text-[#E9E5DA] truncate block text-[11px]">
                              {stagedAsset.name}
                            </span>
                            <span className="text-[9px] text-[#D49A3A] block">
                              {stagedAsset.metadata?.resolution || "0.5m GSD"} · STAGED FOR QUERY
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setStagedAsset(null)}
                          className="p-1 text-[#9A9A90] hover:text-[#B9654D] cursor-pointer"
                          title="Remove attached imagery"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {/* Composer Bar Container */}
                    <div className="bg-[#151817]/95 backdrop-blur-xl border border-[#2A2E2B] focus-within:border-[#D49A3A] p-2.5 flex items-center gap-2 shadow-2xl transition-all relative">
                      {/* Hidden File Input for Image Upload */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                        accept="image/*,.tif,.tiff"
                        className="hidden"
                      />

                      {/* ── [+] Plus Button: Upload Image / Benchmark Scenes ── */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlusMenuOpen((prev) => !prev);
                            setTaskDropdownOpen(false);
                          }}
                          className={`p-2 text-[#9A9A90] hover:text-[#D49A3A] hover:bg-[#1D211F] transition-colors cursor-pointer ${
                            plusMenuOpen ? "text-[#D49A3A] bg-[#1D211F]" : ""
                          }`}
                          title="Attach Satellite Imagery or Scenes"
                        >
                          <Plus size={16} />
                        </button>

                        {/* Plus Popover Menu */}
                        <AnimatePresence>
                          {plusMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute bottom-full left-0 mb-3 w-56 bg-[#151817] border border-[#2A2E2B] shadow-2xl p-1 font-sans text-xs z-50 rounded-none"
                            >
                              <button
                                onClick={() => {
                                  fileInputRef.current?.click();
                                  setPlusMenuOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Upload size={14} className="text-[#D49A3A]" />
                                <div>
                                  <div className="font-bold">Upload Image</div>
                                  <div className="text-[10px] text-[#9A9A90] font-mono">GeoTIFF, TIFF, Optical, SAR</div>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setImageryLibraryOpen(true);
                                  setPlusMenuOpen(false);
                                }}
                                className="w-full px-3 py-2 text-left text-[#E9E5DA] hover:text-[#D49A3A] hover:bg-[#1D211F] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#2A2E2B]/60 mt-1"
                              >
                                <Database size={14} className="text-[#76AEB0]" />
                                <div>
                                  <div className="font-bold">Browse Benchmark Scenes</div>
                                  <div className="text-[10px] text-[#9A9A90] font-mono">ISRO Cartosat-3, Proba, Nepal</div>
                                </div>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── Natural Language Input ── */}
                      <textarea
                        ref={composerInputRef}
                        rows={1}
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendQuery();
                          }
                        }}
                        placeholder="Ask SatQuery about Earth-observation imagery..."
                        className="flex-1 bg-transparent border-none outline-none font-sans text-xs sm:text-sm text-[#F3F0E8] placeholder:text-[#9A9A90] resize-none max-h-28 py-1.5"
                      />

                      {/* ── [AUTO ▾] Task Dropdown Selector ── */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskDropdownOpen((prev) => !prev);
                            setPlusMenuOpen(false);
                          }}
                          className={`px-2.5 py-1.5 font-mono text-[10px] text-[#E9E5DA] hover:text-[#D49A3A] bg-[#1D211F] hover:bg-[#2A2E2B] border border-[#2A2E2B] flex items-center gap-1.5 transition-colors cursor-pointer ${
                            taskMode !== "AUTO" ? "border-[#D49A3A] text-[#D49A3A]" : ""
                          }`}
                        >
                          <span className="font-bold">{taskMode}</span>
                          <ChevronDown size={12} className="text-[#9A9A90]" />
                        </button>

                        {/* Task Mode Menu */}
                        <AnimatePresence>
                          {taskDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              className="absolute bottom-full right-0 mb-3 w-48 bg-[#151817] border border-[#2A2E2B] shadow-2xl p-1 font-mono text-xs z-50 rounded-none"
                            >
                              {["AUTO", "VQA", "GROUNDING", "CHANGE", "OPTICAL + SAR"].map((mode) => (
                                <button
                                  key={mode}
                                  onClick={() => {
                                    setTaskMode(mode);
                                    setTaskDropdownOpen(false);
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                                    taskMode === mode
                                      ? "bg-[#1D211F] text-[#D49A3A] font-bold"
                                      : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#1D211F]"
                                  }`}
                                >
                                  <span>{mode}</span>
                                  {taskMode === mode && <Check size={12} className="text-[#D49A3A]" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── [MIC] Microphone Button (Functional Web Speech) ── */}
                      <button
                        onClick={toggleSpeechRecognition}
                        className={`p-2 transition-colors cursor-pointer ${
                          isListening
                            ? "bg-[#D49A3A] text-[#0B0D0C] animate-pulse"
                            : "text-[#9A9A90] hover:text-[#D49A3A] hover:bg-[#1D211F]"
                        }`}
                        title={isListening ? "Listening... Click to stop" : "Speak query via microphone"}
                      >
                        {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                      </button>

                      {/* ── [↑] Amber Send Button ── */}
                      <button
                        onClick={() => handleSendQuery()}
                        disabled={isAnalyzing || (!queryText.trim() && !stagedAsset)}
                        className="w-8 h-8 rounded-none bg-[#D49A3A] hover:bg-[#E4B65A] disabled:opacity-30 text-[#0B0D0C] font-bold flex items-center justify-center transition-all cursor-pointer shadow-md flex-shrink-0"
                        title="Send query"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════════════════════
            MODAL 1: FULL CANVAS VIEWER OVERLAY (Level 2 Evidence)
            ════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {canvasModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0B0D0C]/95 backdrop-blur-md flex flex-col"
            >
              {/* Overlay Header */}
              <div className="h-12 px-4 border-b border-[#2A2E2B] flex items-center justify-between font-mono text-xs bg-[#151817]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#D49A3A]" />
                  <span className="font-bold text-[#F3F0E8]">{canvasActiveAsset?.name || "Satellite Canvas"}</span>
                  <span className="text-[#9A9A90]">·</span>
                  <span className="text-[#76AEB0]">{canvasActiveAsset?.metadata?.coordinates || "19.0760° N, 72.8777° E"}</span>
                </div>

                <button
                  onClick={() => setCanvasModalOpen(false)}
                  className="p-1.5 text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#1D211F] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Full Interactive Canvas Viewer */}
              <div className="flex-1 relative overflow-hidden">
                <SatelliteCanvasViewer
                  asset={canvasActiveAsset}
                  secondaryAsset={canvasActiveAsset}
                  isAnalyzing={isAnalyzing}
                  analysisMode={taskMode === "AUTO" ? "GROUNDING" : taskMode}
                  detections={canvasDetections}
                  selectedDetectionId={selectedDetectionId}
                  onSelectDetection={(id) => setSelectedDetectionId(id)}
                  onQuickAction={(q) => {
                    setCanvasModalOpen(false);
                    handleSendQuery(q);
                  }}
                  onUploadClick={() => fileInputRef.current?.click()}
                  onOpenLibrary={() => setImageryLibraryOpen(true)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MODAL 2: BENCHMARK SATELLITE CATALOG ─── */}
        <SatelliteImageryLibraryModal
          isOpen={imageryLibraryOpen}
          onClose={() => setImageryLibraryOpen(false)}
          onSelectScene={handleSelectLibraryScene}
        />

        {/* ─── MODAL 3: SYSTEM SETTINGS ─── */}
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />

        {/* ─── MODAL 4: COMMAND PALETTE (CTRL+K) ─── */}
        <CommandPaletteModal
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onNewInvestigation={handleNewChat}
          onUploadClick={() => fileInputRef.current?.click()}
          onOpenLibrary={() => setImageryLibraryOpen(true)}
          onSelectMode={(mode) => setTaskMode(mode)}
          onToggleFocus={() => setSidebarOpen((prev) => !prev)}
          onOpenReport={() => setReportModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onReturnToOrbit={() => setViewMode("landing")}
        />

        {/* ─── MODAL 5: ISRO / DEFENSE AUDIT REPORT ─── */}
        <ReportGenerationModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          queryResult={activeEvidenceResult || activeConversation?.messages?.findLast((m) => m.queryResult)?.queryResult}
          imageAssets={activeConversation?.stagedAssets || []}
          onDownloadPdf={() => {
            downloadReportPdf("SQ-2026-CERTIFIED");
            toast.success("ISRO Analysis Report PDF generated with certified audit trace");
          }}
        />

        {/* ─── MODAL 6: "SHOW ME WHY ↗" FORENSIC AUDIT ─── */}
        <ShowMeWhyModal
          isOpen={showMeWhyOpen}
          onClose={() => setShowMeWhyOpen(false)}
          finding={canvasDetections[0] || { id: "target-01", label: "URBAN RESIDENTIAL GRID", confidence: 94, coords: "19.0760° N, 72.8777° E" }}
          queryResult={activeEvidenceResult || activeConversation?.messages?.findLast((m) => m.queryResult)?.queryResult}
          asset={canvasActiveAsset || activeConversation?.stagedAssets?.[0]}
          onOpenAnalysisDetails={() => setAnalysisDetailsOpen(true)}
        />

        {/* ─── DRAWER: LEVEL 4 TECHNICAL DETAILS ─── */}
        <AnalysisDetailsDrawer
          isOpen={analysisDetailsOpen}
          onClose={() => setAnalysisDetailsOpen(false)}
          currentResult={activeEvidenceResult || activeConversation?.messages?.findLast((m) => m.queryResult)?.queryResult}
          asset={canvasActiveAsset || activeConversation?.stagedAssets?.[0]}
          analysisMode={taskMode === "AUTO" ? "GROUNDING" : taskMode}
          onOpenReport={() => setReportModalOpen(true)}
        />
      </div>
    </BackgroundProvider>
  );
}
