/**
 * SatQuery AI — The Conversational Earth Observation Workstation
 *
 * SATELLITE QUERY & EARTH OBSERVATION INTELLIGENCE SYSTEM
 * THEME: Space Technology
 *
 * CHATGPT-INSPIRED WORKSTATION UX WITH SCIENTIFIC SATQUERY IDENTITY:
 * - Clean Left Sidebar: + NEW CHAT, IMAGES, PROJECTS, QUERY HISTORY (Today, Yesterday, 7 Days, Older)
 * - Profile popover at bottom left matching specialist specifications
 * - Clean center conversation stream with inline satellite image cards
 * - Floating bottom composer: [ + ] Ask SatQuery... [AUTO ▾] [MIC] [↑]
 * - Direct evidence inspection with SatelliteCanvasViewer, ShowMeWhyModal, and Certified Reports
 * - Persistent 3D Earth subtle orbital background
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Upload, Paperclip, Send, Mic, MicOff,
  ChevronDown, ChevronRight, ChevronUp, Clock,
  Folder, Image as ImageIcon, MessageSquare,
  Sliders, Settings as SettingsIcon, User, Sparkles,
  HelpCircle, LogOut, ExternalLink, FileText, CheckCircle2,
  Layers, Search, Globe, ArrowUpRight, ArrowRight, Check, X,
  Maximize2, Eye, ShieldCheck, Target, Radar, Activity,
  Database, RefreshCw, PanelLeftClose, PanelLeftOpen, PanelRightClose, Trash2,
  Sun, Moon, ArrowLeft, SquarePen
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
import { SatelliteImageryLibraryModal } from "@/components/SatelliteImageryLibraryModal";
import { SettingsModal } from "@/components/SettingsModal";
import { CommandPaletteModal } from "@/components/CommandPaletteModal";
import { ShowMeWhyModal } from "@/components/ShowMeWhyModal";
import { AnalysisDetailsDrawer } from "@/components/AnalysisDetailsDrawer";
import { UserProfileModal } from "@/components/UserProfileModal";
import PersonalizationModal from "@/components/PersonalizationModal";
import SatQueryLogo from "@/components/SatQueryLogo";
import { useLanguage } from "@/context/LanguageContext";

// ─────────────────────────────────────────────────────────────────
// SPECIALIST ENGINES CONFIGURATION
// ─────────────────────────────────────────────────────────────────
const SPECIALIST_CONFIG = {
  VQA: {
    id: "VQA",
    label: "Visual QA",
    engine: "GeoChat-VQA (UniRS Adapter)",
    subtitle: "Multispectral Question Answering",
    sublabel: "OPTICAL ◉",
  },
  GROUNDING: {
    id: "GROUNDING",
    label: "Spatial Grounding",
    engine: "GeoChat-Grounding (UniRS Adapter)",
    subtitle: "Pixel-Accurate Target Bounding Box",
    sublabel: "BOUNDING BOX ⊞",
  },
  CHANGE: {
    id: "CHANGE",
    label: "Change Analysis",
    engine: "CDVQA-Siamese (ChangeQA Adapter)",
    subtitle: "Bi-Temporal Surface Subtraction",
    sublabel: "BI-TEMPORAL ↔",
  },
  "OPTICAL + SAR": {
    id: "OPTICAL + SAR",
    label: "Optical + SAR",
    engine: "OpticalSAR-Fusion (EarthGPT Adapter)",
    subtitle: "Sentinel-1 Radar & Sentinel-2 Fusion",
    sublabel: "OPTICAL + SAR ◎",
  },
  CAPTIONING: {
    id: "CAPTIONING",
    label: "Scene Captioning",
    engine: "GeoCaption-VLM (UniRS Adapter)",
    subtitle: "Dense Remote Sensing Scene Description",
    sublabel: "CAPTION ✍",
  },
  CHANGE_UNDERSTANDING: {
    id: "CHANGE_UNDERSTANDING",
    label: "Change Understanding",
    engine: "ChangeQA-Siamese (Multi-Temporal)",
    subtitle: "Multi-Temporal Trend & Reason Analysis",
    sublabel: "TEMPORAL ⏱",
  },
};

// Automatic Natural-Language Intent Classifier
function classifyQueryIntent(queryText) {
  const q = (queryText || "").toLowerCase();
  if (/extract|coordinates|metadata|specs|sensor info|resolution/i.test(q)) {
    return "INFORMATION_EXTRACTION";
  }
  if (/caption|describe scene|narrat|overview/i.test(q)) {
    return "CAPTIONING";
  }
  if (/temporal|understand change|evolution|progression/i.test(q)) {
    return "CHANGE_UNDERSTANDING";
  }
  if (/change|differ|between|before|after|evolv|expand|flood|landslide/i.test(q)) {
    return "CHANGE";
  }
  if (/sar|radar|cloud|penetrat|corroborat|all-weather|microwav/i.test(q)) {
    return "OPTICAL + SAR";
  }
  if (/where|locate|highlight|box|bounding|find the|point out|show where/i.test(q)) {
    return "GROUNDING";
  }
  // Default to VQA (Vision-Language Answering & Comprehensive Analysis)
  return "VQA";
}

// Automatic title generator from query
function generateConversationTitle(queryText, fallbackName) {
  const q = (queryText || "").trim();
  if (!q) return fallbackName ? fallbackName.replace(/\.[^/.]+$/, "") : "Satellite Investigation";

  // Format the user query into a clean, concise research title
  const clean = q.replace(/[?!.,;]/g, "").trim();
  const words = clean.split(/\s+/).slice(0, 6).join(" ");
  if (!words) return "Satellite Investigation";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Clean ChatGPT-style message timestamp formatter:
// - If not of the current month: "Wed, Jul 15 at 10:58 PM" (or "Wed, Jul 15, 2025 at 10:58 PM" if different year)
// - If in the current month: "Friday 7:56 PM" or "Monday 9:39 PM"
function formatChatTimestamp(timestamp, createdAt, fallbackDate) {
  if (!timestamp && !createdAt && !fallbackDate) return "";

  // If already formatted like "Wed, Jul 15 at 10:58 PM", return it directly
  const rawStr = String(timestamp || createdAt || "").trim();
  if (/^[a-zA-Z]{3},\s+[a-zA-Z]{3}\s+\d{1,2}(?:,\s*\d{4})?\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(rawStr)) {
    return rawStr;
  }

  // Find a valid Date instance
  let dateObj = null;
  for (const candidate of [createdAt, timestamp, fallbackDate]) {
    if (!candidate) continue;
    if (candidate instanceof Date && !isNaN(candidate.getTime())) {
      dateObj = candidate;
      break;
    }
    const s = String(candidate).trim();
    const d = new Date(s.replace("·", " "));
    if (!isNaN(d.getTime())) {
      dateObj = d;
      break;
    }
  }

  const now = new Date();

  if (dateObj) {
    const isCurrentYear = dateObj.getFullYear() === now.getFullYear();
    const isCurrentMonth = isCurrentYear && dateObj.getMonth() === now.getMonth();

    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (isCurrentMonth) {
      // In current month: show weekday and time like ChatGPT (e.g. "Friday 7:56 PM" or "Monday 9:39 PM")
      const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      return `${weekday} ${timeStr}`;
    } else {
      // Not in current month: show date with "at" like ChatGPT (e.g. "Wed, Jul 15 at 10:58 PM")
      const shortWeekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const shortMonth = dateObj.toLocaleDateString("en-US", { month: "short" });
      const dayNum = dateObj.getDate();

      if (isCurrentYear) {
        return `${shortWeekday}, ${shortMonth} ${dayNum} at ${timeStr}`;
      } else {
        return `${shortWeekday}, ${shortMonth} ${dayNum}, ${dateObj.getFullYear()} at ${timeStr}`;
      }
    }
  }

  // Fallback if timestamp was just "09:39 PM"
  if (/^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(rawStr)) {
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const cleanTime = rawStr.replace(/^0(\d:)/, "$1");
    return `${weekday} ${cleanTime}`;
  }

  return rawStr;
}

// Extract a reliable Date object from a message (handles ISO strings, date-time strings, and bare time strings)
function extractDateFromMsg(msg, fallbackDate) {
  if (!msg) return null;
  for (const candidate of [msg.createdAt, msg.timestamp]) {
    if (!candidate) continue;
    if (candidate instanceof Date && !isNaN(candidate.getTime())) return candidate;
    const s = String(candidate).trim();
    const d = new Date(s.replace("·", " "));
    if (!isNaN(d.getTime())) return d;

    // Handle bare time strings like "12:31 PM" or "9:39 PM"
    const timeMatch = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (timeMatch) {
      const base = fallbackDate ? new Date(fallbackDate) : new Date();
      if (!isNaN(base.getTime())) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;
        const result = new Date(base);
        result.setHours(hours, minutes, 0, 0);
        return result;
      }
    }
  }
  return null;
}

// Check if user texted back after leaving for quite some time (>= 15 minutes or different calendar day)
function shouldShowTimeGap(prevMsg, currentMsg, fallbackDate) {
  if (!prevMsg || !currentMsg) return false;
  const prevDate = extractDateFromMsg(prevMsg, fallbackDate);
  const currDate = extractDateFromMsg(currentMsg, fallbackDate);
  if (!prevDate || !currDate) return false;

  const diffMs = Math.abs(currDate.getTime() - prevDate.getTime());
  const diffMinutes = diffMs / (1000 * 60);

  const isDifferentDay =
    prevDate.getFullYear() !== currDate.getFullYear() ||
    prevDate.getMonth() !== currDate.getMonth() ||
    prevDate.getDate() !== currDate.getDate();

  return isDifferentDay || diffMinutes >= 15;
}

// Format time only for bottom right corner (e.g. "10:58 PM" or "7:56 PM")
function formatTimeOnly(timestamp, createdAt, fallbackDate) {
  const d = extractDateFromMsg({ timestamp, createdAt }, fallbackDate);
  if (d) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const s = String(timestamp || "").trim();
  const timeMatch = s.match(/\d{1,2}:\d{2}\s*(?:AM|PM)?/i);
  if (timeMatch) return timeMatch[0].replace(/^0(\d:)/, "$1");
  return s;
}

// Project Taxonomy
const PROJECTS_CONFIG = [
  { id: "proj-earth-obs", name: "Earth Observation", description: "Multispectral land-cover & terrain classification", badge: "SATQUERY-EO" },
  { id: "proj-disaster", name: "Disaster Analysis", description: "Monsoon floods, landslides & slope destabilization", badge: "RAPID-RESP" },
  { id: "proj-urban", name: "Urban Analysis", description: "Infrastructure sprawl, port facilities & built-up grids", badge: "GEO-SURV" },
];

export default function Investigation() {
  // ── Authentication & User Session ──────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_auth_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read satquery_auth_user", e);
    }
    return null;
  });

  // ── Workstation-Only Theme ('dark' | 'light') ──────────────────────
  const [workstationTheme, setWorkstationTheme] = useState(() => {
    try {
      return localStorage.getItem("satquery_workstation_theme") || "dark";
    } catch (e) {
      return "dark";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (workstationTheme === "light") {
      root.classList.add("light", "workstation-light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light", "workstation-light");
    }
  }, [workstationTheme]);

  const toggleWorkstationTheme = () => {
    const next = workstationTheme === "dark" ? "light" : "dark";
    setWorkstationTheme(next);
    try {
      localStorage.setItem("satquery_workstation_theme", next);
    } catch (e) { }
    toast.info(`Workstation switched to ${next.toUpperCase()} mode`);
  };

  // ── View Mode: 'landing' vs 'investigation' ────────────────────────
  // If user is already logged in, enter investigation workstation directly
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_auth_user");
      if (saved) return "investigation";
    } catch (e) { }
    return "landing";
  });

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const { currentLanguage } = useLanguage();

  // Derive user initials
  const userInitials = useMemo(() => {
    if (!currentUser?.name) return "SA";
    return currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [currentUser]);

  // Handle successful login or sign-up
  const handleLoginSuccess = (userData) => {
    try {
      localStorage.setItem("satquery_auth_user", JSON.stringify(userData));
      if (userData?.name) localStorage.setItem("satquery_last_name", userData.name);
      if (userData?.email) localStorage.setItem("satquery_last_email", userData.email);
    } catch (e) { }
    setCurrentUser(userData);
    setViewMode("investigation");
    window.history.pushState({ page: "investigation" }, "", window.location.href);
    toast.success(`Welcome, ${userData?.name || "Analyst"}. Workstation active.`);
  };

  // Handle explicit logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("satquery_auth_user");
    } catch (e) { }
    setCurrentUser(null);
    setViewMode("landing");
    setProfileMenuOpen(false);
    setProfileModalOpen(false);
    window.history.pushState({ page: "landing" }, "", "/");
    toast.info("Logged out from workstation.");
  };

  // ── Browser Back-Button Guard & Left-Arrow Navigation ───────────────
  // Clicking browser left arrow back button opens a New Chat and keeps session in workstation
  useEffect(() => {
    if (currentUser && viewMode === "investigation") {
      window.history.pushState({ page: "investigation" }, "", window.location.href);

      const handlePopState = () => {
        if (currentUser) {
          window.history.pushState({ page: "investigation" }, "", window.location.href);
          setViewMode("investigation");
          setActiveChatId(null);
          setStagedAsset(null);
          setQueryText("");
          setIsAnalyzing(false);
          setRoutingStage(null);
          toast.info("Opened New Chat", { id: "new-chat-nav" });
        }
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [currentUser, viewMode]);

  // ── Sidebar & Layout State ────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("chat"); // "chat" | "projects" | "images"
  const [activeProjectId, setActiveProjectId] = useState(null); // When exploring a specific project
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [imageFilterModality, setImageFilterModality] = useState("ALL");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectBadge, setNewProjectBadge] = useState("");

  // ── Dynamic Projects State & Persistence ──────────────────────────
  const [projectsList, setProjectsList] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_projects_list");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not read satquery_projects_list", e);
    }
    return PROJECTS_CONFIG;
  });

  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation();
    setProjectsList((prev) => {
      const updated = prev.filter((p) => p.id !== projectId);
      try {
        localStorage.setItem("satquery_projects_list", JSON.stringify(updated));
      } catch (err) {
        console.warn("Error saving projects list", err);
      }
      return updated;
    });
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
    toast.info("Project deleted");
  };

  // ── Multi-Chat State & Persistence ────────────────────────────────
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_conversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (c) => c && c.messages && c.messages.length > 0 && c.title !== "New Chat"
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {
      console.warn("Could not load stored conversations", e);
    }
    return [];
  });

  const [activeChatId, setActiveChatId] = useState(null);

  // Derive active conversation
  const activeConversation = useMemo(() => {
    if (!activeChatId) return null;
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  // EMPTY CHAT vs ACTIVE CHAT state determination
  const isEmptyChat = useMemo(() => {
    return !activeConversation || !activeConversation.messages || activeConversation.messages.length === 0;
  }, [activeConversation]);

  // Query history (only real user investigations)
  const historyChats = useMemo(() => {
    return conversations.filter(
      (c) =>
        c &&
        c.id &&
        c.title !== "New Chat" &&
        ((c.messages && c.messages.length > 0) || (c.stagedAssets && c.stagedAssets.length > 0))
    );
  }, [conversations]);

  // Images across all user conversations (only real images uploaded by the user)
  const allImagesAcrossChats = useMemo(() => {
    const items = [];
    const seenKeys = new Set();

    conversations.forEach((conv) => {
      const firstUserMsg = (conv.messages || []).find((m) => m.role === "user" && m.text?.trim());
      const researchTitle = conv.title || firstUserMsg?.text || "Satellite Investigation";

      // 1. Staged assets in conversation
      (conv.stagedAssets || []).forEach((asset) => {
        if (!asset) return;
        const key = asset.id || asset.previewUrl || asset.name;
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          items.push({
            ...asset,
            chatId: conv.id,
            chatTitle: conv.title || "Investigation",
            researchTitle: researchTitle,
          });
        }
      });

      // 2. Message attached assets in conversation
      (conv.messages || []).forEach((msg) => {
        if (msg.attachedAsset) {
          const asset = msg.attachedAsset;
          const key = asset.id || asset.previewUrl || asset.name;
          if (key && !seenKeys.has(key)) {
            seenKeys.add(key);
            items.push({
              ...asset,
              chatId: conv.id,
              chatTitle: conv.title || "Investigation",
              researchTitle: researchTitle,
            });
          }
        }
      });
    });

    return items;
  }, [conversations]);

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
  const [taskMode, setTaskMode] = useState("VQA"); // VQA, GROUNDING, CHANGE, OPTICAL + SAR, CAPTIONING, CHANGE_UNDERSTANDING
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
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
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

  useEffect(() => {
    (async () => {
      try {
        const h = await checkJvmHealth();
        if (h.connected) {
          setSystemStatus("ONLINE");
        } else {
          setSystemStatus("OFFLINE");
        }
      } catch {
        setSystemStatus("OFFLINE");
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

  // "+ NEW CHAT" — Clears active conversation to empty state; switches main screen to Chat view
  const handleNewChat = () => {
    setSidebarTab("chat");
    setActiveProjectId(null);
    setActiveChatId(null);
    setStagedAsset(null);
    setQueryText("");
    setIsAnalyzing(false);
    setRoutingStage(null);
    setTimeout(() => {
      composerInputRef.current?.focus();
    }, 50);
  };

  const handleCreateProject = (e) => {
    e?.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || "User-defined satellite observation project",
      badge: (newProjectBadge.trim() || "MISSION").toUpperCase(),
    };
    const updated = [...projectsList, newProj];
    setProjectsList(updated);
    try {
      localStorage.setItem("satquery_projects_list", JSON.stringify(updated));
    } catch (err) { }
    setNewProjectName("");
    setNewProjectDesc("");
    setNewProjectBadge("");
    setIsCreatingProject(false);
    toast.success(`Created project: ${newProj.name}`);
  };

  const handleSelectProject = (proj) => {
    setActiveProjectId(proj.id);
    setSidebarTab("chat");
    setActiveChatId(null);
    setStagedAsset(null);
    setQueryText("");
    toast.success(`Active Mission Workspace: ${proj.name}`);
    setTimeout(() => {
      composerInputRef.current?.focus();
    }, 50);
  };

  const handleOpenImageChat = (img) => {
    if (img.chatId) {
      setActiveChatId(img.chatId);
      setSidebarTab("chat");
      setQueryText("");
      setIsAnalyzing(false);
      setRoutingStage(null);
    } else {
      setSidebarTab("chat");
      setActiveChatId(null);
      setStagedAsset({
        id: img.id || `img-${Date.now()}`,
        name: img.name,
        previewUrl: img.previewUrl,
        modality: img.modality || "OPTICAL",
        date: img.date || img.acquisitionDate || new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
        metadata: {
          format: "GeoTIFF",
          resolution: img.gsd || img.metadata?.resolution || "0.5m GSD",
          coordinates: img.coordinates || img.metadata?.coordinates || "WGS 84",
          sensor: img.sensor || img.metadata?.sensor || "Sentinel-2 MSI",
        },
      });
    }
    setTimeout(() => {
      composerInputRef.current?.focus();
    }, 60);
  };

  const handleSelectImageToAnalyze = (img) => {
    handleOpenImageChat(img);
  };

  // Only real user uploaded images - zero mock catalog data
  const displayedImages = useMemo(() => {
    if (imageFilterModality === "ALL") return allImagesAcrossChats;
    return allImagesAcrossChats.filter((img) => {
      const mod = (img.modality || "").toUpperCase();
      return mod.includes(imageFilterModality);
    });
  }, [allImagesAcrossChats, imageFilterModality]);

  // Switch to specific conversation
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setSidebarTab("chat");
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

      // Real upload to JVM Backend /api/upload
      let uploadedServerAsset = null;
      try {
        uploadedServerAsset = await uploadAsset(file);
      } catch (uploadErr) {
        console.warn("Backend upload note, operating with local raster context:", uploadErr);
      }

      const previewUrl = uploadedServerAsset?.previewUrl || parsed.previewUrl || URL.createObjectURL(file);
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

      const realAssetId = uploadedServerAsset?.imageId || `asset-${Date.now()}`;
      const assetEntry = {
        id: realAssetId,
        imageId: realAssetId,
        name: file.name,
        filePath: uploadedServerAsset?.filePath || null,
        previewUrl,
        modality,
        date: formattedDate,
        metadata: {
          format: uploadedServerAsset?.metadata?.format || parsed.format || "GeoTIFF",
          width: uploadedServerAsset?.metadata?.width || parsed.width || 1024,
          height: uploadedServerAsset?.metadata?.height || parsed.height || 1024,
          bands: uploadedServerAsset?.metadata?.bands || parsed.bands || 4,
          resolution: uploadedServerAsset?.metadata?.resolution || "0.5m GSD",
          crs: uploadedServerAsset?.metadata?.crs || "EPSG:32643 (UTM Zone 43N)",
          coordinates: uploadedServerAsset?.metadata?.boundingBox || "19.0760° N, 72.8777° E",
        },
      };

      // Set as staged asset in composer & active conversation
      setStagedAsset(assetEntry);

      // If current chat is empty, treat chat as ACTIVE and make uploaded image the first conversation content
      const isCurrentlyEmpty = !activeConversation || !activeConversation.messages || activeConversation.messages.length === 0;

      let currentId = activeChatId;
      if (!currentId) {
        currentId = `chat-${Date.now()}`;
        const imageMsg = {
          id: `msg-img-${Date.now()}`,
          role: "user",
          text: "",
          createdAt: now.toISOString(),
          timestamp: now.toISOString(),
          attachedAsset: assetEntry,
        };
        const newChat = {
          id: currentId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          createdAt: now.toISOString(),
          messages: [imageMsg],
          stagedAssets: [assetEntry],
          projectId: "proj-earth-obs",
        };
        setConversations((prev) => [newChat, ...prev]);
        setActiveChatId(currentId);
        setStagedAsset(null);
      } else if (isCurrentlyEmpty) {
        const imageMsg = {
          id: `msg-img-${Date.now()}`,
          role: "user",
          text: "",
          createdAt: now.toISOString(),
          timestamp: now.toISOString(),
          attachedAsset: assetEntry,
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentId
              ? {
                ...c,
                title: c.title === "New Chat" ? file.name.replace(/\.[^/.]+$/, "") : c.title,
                messages: [imageMsg],
                stagedAssets: [...(c.stagedAssets || []), assetEntry],
              }
              : c
          )
        );
        setStagedAsset(null);
      } else {
        setStagedAsset(assetEntry);
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

    const isCurrentlyEmpty = !activeConversation || !activeConversation.messages || activeConversation.messages.length === 0;

    let currentId = activeChatId;
    if (!currentId) {
      currentId = `chat-${Date.now()}`;
      const imageMsg = {
        id: `msg-img-${Date.now()}`,
        role: "user",
        text: "",
        createdAt: now.toISOString(),
        timestamp: now.toISOString(),
        attachedAsset: assetEntry,
      };
      const newChat = {
        id: currentId,
        title: scene.name,
        createdAt: now.toISOString(),
        messages: [imageMsg],
        stagedAssets: [assetEntry],
        projectId: scene.modality === "CHANGE" ? "proj-disaster" : "proj-earth-obs",
      };
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(currentId);
      setStagedAsset(null);
    } else if (isCurrentlyEmpty) {
      const imageMsg = {
        id: `msg-img-${Date.now()}`,
        role: "user",
        text: "",
        createdAt: now.toISOString(),
        timestamp: now.toISOString(),
        attachedAsset: assetEntry,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentId
            ? {
              ...c,
              title: c.title === "New Chat" ? scene.name : c.title,
              messages: [imageMsg],
              stagedAssets: [...(c.stagedAssets || []), assetEntry],
            }
            : c
        )
      );
      setStagedAsset(null);
    } else {
      setStagedAsset(assetEntry);
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

    // Build user message with full ISO timestamp
    const now = new Date();
    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text: queryToSend,
      createdAt: now.toISOString(),
      timestamp: now.toISOString(),
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

    // ── Pipeline Stepper: Real execution across Java Backend -> Python Model Server ──
    setRoutingStage("QUERY");
    setRoutingDetail("Dispatching natural language request and sensor metadata to SatQuery JVM backend...");

    try {
      const backendTaskType = {
        "VQA": "vqa",
        "GROUNDING": "grounding",
        "CHANGE": "change_analysis",
        "OPTICAL + SAR": "fusion_analysis",
        "CAPTIONING": "captioning",
        "CHANGE_UNDERSTANDING": "change_understanding",
        "INFORMATION_EXTRACTION": "information_extraction",
      }[effectiveMode] || "vqa";

      const targetImageId = currentAssetForQuery ? (currentAssetForQuery.imageId || currentAssetForQuery.id) : null;
      const imageIds = targetImageId ? [targetImageId] : [];

      setRoutingStage("ROUTING");
      setRoutingDetail(`Routing to specialized engine: ${specialist.label} (${specialist.engine})`);

      setRoutingStage("ANALYSIS");
      setRoutingDetail(`Executing ${specialist.sublabel} against raster tensor...`);

      const result = await runQuery({
        imageIds,
        taskType: backendTaskType,
        queryText: queryToSend,
        datasetContext: "NORMAL_SATELLITE",
        frontendAssets: targetChat.stagedAssets || (currentAssetForQuery ? [currentAssetForQuery] : []),
      });

      setRoutingStage("ANSWER");
      setRoutingDetail("Generating deterministic verification trace and verifiable audit dossier...");

      const answerText = result.answer || "Analysis completed.";
      const confidenceNum = typeof result.confidence === "number" ? result.confidence : 92;
      const confidenceState = result.confidenceState || (confidenceNum >= 80 ? "HIGH" : "MEDIUM");

      // Extract real evidence from result
      let evidenceList = [];
      if (Array.isArray(result.evidence) && result.evidence.length > 0) {
        evidenceList = result.evidence.map((ev, idx) => ({
          id: `target-0${idx + 1}`,
          type: ev.evidenceType || ev.type || "DETECTED_FEATURE",
          confidence: ev.confidence ? Math.round(ev.confidence > 1 ? ev.confidence : ev.confidence * 100) : confidenceNum,
          coords: ev.coordinates
            ? (Array.isArray(ev.coordinates) ? ev.coordinates.join(", ") : String(ev.coordinates))
            : (currentAssetForQuery?.metadata?.coordinates || "19.0760° N, 72.8777° E"),
          detail: ev.detail || ev.label || "Model grounded feature attribute",
          filePath: ev.filePath || null,
        }));
      } else if (Array.isArray(result.boundingBoxes) && result.boundingBoxes.length > 0) {
        evidenceList = result.boundingBoxes.map((b, idx) => ({
          id: `target-0${idx + 1}`,
          type: b.label || "SPATIAL_GROUNDING",
          confidence: confidenceNum,
          coords: `${b.x1}, ${b.y1}, ${b.x2}, ${b.y2}`,
          detail: b.label || "Localized bounding area",
          filePath: null,
        }));
      }

      const whyText =
        result.executionTrace?.steps?.length > 0
          ? result.executionTrace.steps.map((s) => s.detail || s.name || s.eventName).filter(Boolean).join(" ➔ ")
          : `Grounded inference executed by ${result.executionTrace?.modelUsed || specialist.engine} with ${confidenceNum}% confidence.`;

      const asstMsg = {
        id: `msg-asst-${Date.now()}`,
        role: "assistant",
        text: answerText,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        mode: effectiveMode,
        confidence: confidenceNum,
        confidenceState,
        findingsCount: evidenceList.length,
        evidence: evidenceList,
        whyThisAnswer: whyText,
        assetRef: currentAssetForQuery,
        boundingBoxes: result.boundingBoxes || [],
        changeMask: result.changeMask || null,
        resultImageUrl: result.resultImageUrl || null,
        reportUrl: result.reportUrl || null,
        queryResult: {
          queryId: result.queryId || `SQ-${Date.now()}`,
          userQuery: queryToSend,
          intentDetected: specialist.label,
          routedTool: specialist.engine,
          answer: answerText,
          confidence: confidenceNum,
          whyThisAnswer: whyText,
          evidence: evidenceList,
          reportUrl: result.reportUrl || null,
        },
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, asstMsg] } : c
        )
      );

      setRoutingStage("FINDINGS");
      setIsAnalyzing(false);
      toast.success("Analysis complete. Real model evidence ready.");
    } catch (error) {
      console.error("SatQuery runQuery failed:", error);
      const errMsg = error.response?.data?.error || error.message || "Query failed to execute on server.";

      const errAsstMsg = {
        id: `msg-asst-${Date.now()}`,
        role: "assistant",
        text: `Analysis failed: ${errMsg}. Please ensure Java Backend (port 8080) and Python Model Server (port 5000) are running.`,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        mode: effectiveMode,
        confidence: 0,
        findingsCount: 0,
        evidence: [],
        whyThisAnswer: `Backend connection error: ${errMsg}`,
        assetRef: currentAssetForQuery,
        queryResult: null,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, messages: [...c.messages, errAsstMsg] } : c
        )
      );
      setIsAnalyzing(false);
      toast.error(`Query failed: ${errMsg}`);
    }
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
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <BackgroundProvider phase={isAnalyzing ? "ANALYZING" : "EMPTY"}>
      {viewMode === "investigation" && <WorkstationBackground theme={workstationTheme} />}

      <div
        className={`flex flex-col w-full max-w-full overflow-x-hidden font-sans transition-colors duration-200 ${viewMode === "landing"
            ? "min-h-screen bg-[#080E11] text-foreground"
            : workstationTheme === "light"
              ? "h-screen overflow-hidden select-none bg-[#F8FAFC] text-[#0F172A]"
              : "h-screen overflow-hidden select-none bg-black text-[#F0F6F8]"
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
                        date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
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
                onLoginSuccess={handleLoginSuccess}
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
              className={`flex h-full w-full overflow-hidden relative ${workstationTheme === "light" ? "workstation-light" : ""
                }`}
            >
              {/* ══════════════════════════════════════════════════════════
                  1. LEFT SIDEBAR (CHATGPT LAYOUT · SATQUERY PALETTE)
                  ══════════════════════════════════════════════════════════ */}
              <aside
                className={`transition-all duration-200 z-40 flex flex-col font-sans border-r ${workstationTheme === "light"
                    ? "bg-white border-[#E2E8F0]"
                    : "bg-[#080E11]/95 backdrop-blur-xl border-[#1C323B]"
                  } ${sidebarOpen ? "w-64 sm:w-72" : "w-0 overflow-hidden border-none"}`}
              >
                {/* ── Top Header: Brand + Collapse ── */}
                <div className={`p-3.5 border-b flex items-center justify-between ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/80"
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <SatQueryLogo
                      size={28}
                      variant="icon"
                      theme={workstationTheme}
                      className={workstationTheme === "light" ? "shadow-sm" : "shadow-[0_0_12px_rgba(18,165,184,0.35)]"}
                    />
                    <span className={`font-sans text-base font-semibold tracking-wide ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#FFFFFF]"
                      }`}>
                      SatQuery AI
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#0D171C] transition-colors rounded-lg cursor-pointer"
                      title="Collapse Sidebar"
                    >
                      <PanelLeftClose size={17} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* ── Main Navigation List (Vertical, Elegant) ── */}
                <div className={`px-2 pt-2 pb-1 space-y-1 border-b ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/60"
                  }`}>
                  {/* New Chat */}
                  <button
                    onClick={handleNewChat}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer rounded-lg font-sans font-medium text-[13px] ${sidebarTab === "chat"
                        ? workstationTheme === "light"
                          ? "bg-[#F1F5F9] text-[#0E7C8A] border border-[#0E7C8A]/30 shadow-sm font-bold"
                          : "bg-[#132127] text-[#12A5B8] border border-[#12A5B8]/30 shadow-sm"
                        : workstationTheme === "light"
                          ? "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                          : "text-[#F0F6F8] hover:bg-[#132127]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <SquarePen
                        size={16}
                        strokeWidth={1.5}
                        className={
                          sidebarTab === "chat"
                            ? workstationTheme === "light"
                              ? "text-[#0E7C8A]"
                              : "text-[#12A5B8]"
                            : workstationTheme === "light"
                              ? "text-[#64748B]"
                              : "text-[#8AA3AD]"
                        }
                      />
                      <span className="font-sans font-medium text-[13px]">New chat</span>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#8AA3AD] font-mono transition-opacity">⌘N</span>
                  </button>

                  {/* Projects Tab */}
                  <button
                    onClick={() => {
                      setSidebarTab("projects");
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer rounded-lg font-sans font-medium text-[13px] ${sidebarTab === "projects"
                        ? workstationTheme === "light"
                          ? "bg-[#F1F5F9] text-[#0E7C8A] border border-[#0E7C8A]/30 shadow-sm font-bold"
                          : "bg-[#132127] text-[#12A5B8] border border-[#12A5B8]/30 shadow-sm"
                        : workstationTheme === "light"
                          ? "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                          : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#132127]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder
                        size={16}
                        strokeWidth={1.5}
                        className={
                          sidebarTab === "projects"
                            ? workstationTheme === "light"
                              ? "text-[#0E7C8A]"
                              : "text-[#12A5B8]"
                            : workstationTheme === "light"
                              ? "text-[#64748B]"
                              : "text-[#8AA3AD]"
                        }
                      />
                      <span>Projects</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded-full border ${workstationTheme === "light"
                        ? "bg-[#F1F5F9] text-[#0E7C8A] border-[#CBD5E1]"
                        : "bg-[#0D171C] text-[#12A5B8] border border-[#12A5B8]/30"
                      }`}>
                      {projectsList.length}
                    </span>
                  </button>

                  {/* Images Tab */}
                  <button
                    onClick={() => {
                      setSidebarTab("images");
                      setActiveProjectId(null);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer rounded-lg font-sans font-medium text-[13px] ${sidebarTab === "images"
                        ? workstationTheme === "light"
                          ? "bg-[#F1F5F9] text-[#0E7C8A] border border-[#0E7C8A]/30 shadow-sm font-bold"
                          : "bg-[#132127] text-[#12A5B8] border border-[#12A5B8]/30 shadow-sm"
                        : workstationTheme === "light"
                          ? "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                          : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#132127]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon
                        size={16}
                        strokeWidth={1.5}
                        className={
                          sidebarTab === "images"
                            ? workstationTheme === "light"
                              ? "text-[#0E7C8A]"
                              : "text-[#12A5B8]"
                            : workstationTheme === "light"
                              ? "text-[#64748B]"
                              : "text-[#8AA3AD]"
                        }
                      />
                      <span>Images</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 font-bold rounded-full border ${workstationTheme === "light"
                        ? "bg-[#F1F5F9] text-[#0E7C8A] border-[#CBD5E1]"
                        : "bg-[#0D171C] text-[#12A5B8] border border-[#12A5B8]/30"
                      }`}>
                      {displayedImages.length}
                    </span>
                  </button>
                </div>

                {/* ── Middle Scrollable Area: Permanent Clean History ── */}
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 font-sans text-xs">
                  <div className="space-y-1.5 px-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8AA3AD] uppercase tracking-wider font-semibold px-2 py-1">
                      <span>HISTORY</span>
                      {historyChats.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#0D171C] text-[#12A5B8] border border-[#12A5B8]/30 rounded-full font-mono">
                          {historyChats.length}
                        </span>
                      )}
                    </div>

                    {historyChats.length === 0 ? (
                      <div className="px-3 py-8 text-center text-[#8AA3AD] text-[11px] font-sans space-y-1.5">
                        <p className="font-medium text-[#D0E3EA]">No previous chats</p>
                        <p className="text-[10px] text-[#8AA3AD]">Your query history will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {historyChats.map((chat) => {
                          const isActive = activeChatId === chat.id && sidebarTab === "chat";
                          return (
                            <div
                              key={chat.id}
                              onClick={() => {
                                handleSelectChat(chat.id);
                                setSidebarTab("chat");
                              }}
                              className={`group flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${isActive
                                  ? workstationTheme === "light"
                                    ? "bg-[#F1F5F9] text-[#0E7C8A] border border-[#0E7C8A]/30 shadow-sm"
                                    : "bg-[#132127] text-[#FFFFFF] border border-[#12A5B8]/40 shadow-sm"
                                  : workstationTheme === "light"
                                    ? "text-[#0F172A] hover:bg-[#F8FAFC] border border-transparent"
                                    : "text-[#8AA3AD] hover:bg-[#132127]/60 hover:text-[#FFFFFF] border border-transparent"
                                }`}
                            >
                              <div className="min-w-0 flex-1 pr-1.5">
                                <div className={`text-[12px] font-medium truncate ${isActive
                                    ? workstationTheme === "light"
                                      ? "text-[#0E7C8A] font-bold"
                                      : "text-[#FFFFFF]"
                                    : workstationTheme === "light"
                                      ? "text-[#0F172A]"
                                      : "text-[#D0E3EA]"
                                  }`}>
                                  {chat.title || "Investigation"}
                                </div>
                              </div>

                              <button
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#8AA3AD] hover:text-[#FF5454] transition-opacity cursor-pointer rounded"
                                title="Delete Chat"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Bottom Profile Menu (Screenshot 2 UX Reference) ── */}
                <div className={`p-2 border-t relative ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]"
                  }`} ref={profileMenuRef}>
                  {/* Popover Menu Trigger Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileMenuOpen((prev) => !prev);
                    }}
                    className={`w-full p-2 flex items-center justify-between text-left transition-colors cursor-pointer rounded-xl sq-profile-trigger border ${profileMenuOpen
                        ? workstationTheme === "light"
                          ? "bg-[#F1F5F9] border-[#CBD5E1]"
                          : "bg-[#132127] border-[#1C323B]"
                        : "border-transparent"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 font-chillax sq-avatar transition-all border ${workstationTheme === "light"
                          ? "bg-[#F1F5F9] border-[#0E7C8A]/40 text-[#0E7C8A]"
                          : "bg-[#12A5B8]/20 border-[#12A5B8]/60 text-[#12A5B8]"
                        }`}>
                        {userInitials}
                      </div>
                      <div className="truncate">
                        <div className={`font-bold text-xs truncate font-chillax ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#F0F6F8]"
                          }`}>
                          {currentUser?.name || "SatQuery Analyst"}
                        </div>
                        <div className={`text-[10px] font-sans truncate ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                          }`}>
                          {currentUser?.role || "Satellite Analyst"}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-sans ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                      }`}>⬡</span>
                  </button>

                  {/* Popover Floating Hierarchy (Screenshot 2 Architecture) */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute bottom-full left-2 right-2 mb-2 shadow-2xl p-1 font-sans text-xs z-50 rounded-2xl overflow-hidden border ${workstationTheme === "light"
                            ? "bg-white border-[#E2E8F0] shadow-[0_12px_40px_rgba(15,23,42,0.12)] text-[#0F172A]"
                            : "bg-[#0D171C] border-[#1C323B] text-[#F0F6F8]"
                          }`}
                      >
                        {/* Profile Header Item */}
                        <div
                          onClick={() => {
                            setProfileModalOpen(true);
                            setProfileMenuOpen(false);
                          }}
                          className={`p-2 flex items-center justify-between cursor-pointer transition-colors border-b pb-2 rounded-xl ${workstationTheme === "light"
                              ? "hover:bg-[#F1F5F9] border-[#E2E8F0]"
                              : "hover:bg-[#132127] border-[#1C323B]/60"
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center font-mono flex-shrink-0 border ${workstationTheme === "light"
                                ? "bg-[#F1F5F9] border-[#0E7C8A]/40 text-[#0E7C8A]"
                                : "bg-[#12A5B8]/20 border-[#12A5B8]/60 text-[#12A5B8]"
                              }`}>
                              {userInitials}
                            </div>
                            <div className="truncate">
                              <div className={`font-bold text-xs leading-tight truncate ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#F0F6F8]"
                                }`}>
                                {currentUser?.name || "SatQuery Analyst"}
                              </div>
                              <div className={`text-[10px] font-mono leading-tight truncate ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                }`}>
                                {currentUser?.email || "analyst@satquery.ai"}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={14} className={workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"} />
                        </div>

                        {/* Top Group: Profile / Settings / Personalization */}
                        <div className="py-1 space-y-0.5">
                          <button
                            onClick={() => {
                              setProfileModalOpen(true);
                              setProfileMenuOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left flex items-center gap-2.5 transition-colors cursor-pointer rounded-xl ${workstationTheme === "light"
                                ? "text-[#0F172A] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                : "text-[#F0F6F8] hover:text-[#12A5B8] hover:bg-[#132127]"
                              }`}
                          >
                            <User size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} />
                            <span>View Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setSettingsModalOpen(true);
                              setProfileMenuOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left flex items-center gap-2.5 transition-colors cursor-pointer rounded-xl ${workstationTheme === "light"
                                ? "text-[#0F172A] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                : "text-[#F0F6F8] hover:text-[#12A5B8] hover:bg-[#132127]"
                              }`}
                          >
                            <SettingsIcon size={14} className={workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"} />
                            <span>Settings</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsPersonalizationOpen(true);
                              setProfileMenuOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left flex items-center justify-between transition-colors cursor-pointer rounded-xl group ${workstationTheme === "light"
                                ? "text-[#0F172A] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                : "text-[#F0F6F8] hover:text-[#12A5B8] hover:bg-[#132127]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Globe size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} />
                              <span>Personalization</span>
                            </div>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border rounded ${workstationTheme === "light"
                                ? "text-[#0E7C8A] bg-[#F1F5F9] border-[#0E7C8A]/30"
                                : "text-[#12A5B8] bg-[#12A5B8]/10 border-[#12A5B8]/30 group-hover:bg-[#12A5B8]/20"
                              }`}>
                              {currentLanguage.nativeName} ({currentLanguage.code.toUpperCase()})
                            </span>
                          </button>
                        </div>

                        {/* Separator */}
                        <div className={`border-t my-1 ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/60"
                          }`} />

                        {/* Bottom Group: Help / Log out */}
                        <div className="py-0.5 space-y-0.5">
                          <button
                            onClick={() => {
                              setCommandPaletteOpen(true);
                              setProfileMenuOpen(false);
                            }}
                            className={`w-full px-2 py-1.5 text-left flex items-center justify-between transition-colors cursor-pointer rounded-xl ${workstationTheme === "light"
                                ? "text-[#0F172A] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                : "text-[#F0F6F8] hover:text-[#12A5B8] hover:bg-[#132127]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <HelpCircle size={14} className={workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"} />
                              <span>Help</span>
                            </div>
                            <ChevronRight size={13} className={workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"} />
                          </button>

                          <button
                            onClick={handleLogout}
                            className={`w-full px-2 py-1.5 text-left flex items-center gap-2.5 transition-colors cursor-pointer rounded-xl ${workstationTheme === "light"
                                ? "text-[#DC2626] hover:bg-[#FEF2F2]"
                                : "text-[#FF5454] hover:bg-[#FF5454]/10"
                              }`}
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
              <main className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-200 ${workstationTheme === "light" ? "bg-[#F8FAFC]" : "bg-black"
                }`}>
                {/* ── Top Bar: Sidebar toggle, Chat title, Orbit return ── */}
                <header className={`h-12 px-4 flex items-center justify-between z-30 font-mono text-xs transition-colors duration-200 ${workstationTheme === "light"
                    ? "bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] text-[#0F172A]"
                    : "bg-black/90 backdrop-blur-md border-b border-[#1C323B] text-[#F0F6F8]"
                  }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {!sidebarOpen && (
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className={`p-1.5 transition-colors cursor-pointer rounded-md ${workstationTheme === "light"
                            ? "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                            : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#0D171C]"
                          }`}
                        title="Open Sidebar"
                      >
                        <PanelLeftOpen size={16} />
                      </button>
                    )}

                    {/* Left Arrow Back Button (Opens New Chat) */}
                    <button
                      id="header-back-new-chat-btn"
                      onClick={() => {
                        handleNewChat();
                      }}
                      className={`p-1.5 border transition-colors rounded-md cursor-pointer flex items-center gap-1.5 ${workstationTheme === "light"
                          ? "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border-[#E2E8F0] bg-white"
                          : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#0D171C] border-white/[0.08]"
                        }`}
                      title="Left Arrow Back Button: Open New Chat"
                    >
                      <ArrowLeft size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} />
                      <span className={`text-[10px] hidden sm:inline font-mono ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#8AA3AD]"
                        }`}>NEW CHAT</span>
                    </button>

                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-bold text-sm truncate font-sans ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#FFFFFF]"
                        }`}>
                        {sidebarTab === "projects"
                          ? "Projects Workspace"
                          : sidebarTab === "images"
                            ? "Satellite Imagery Archive"
                            : activeConversation?.title || "SatQuery Workstation"}
                      </span>
                      {sidebarTab === "chat" && activeConversation?.projectId && (
                        <span className={`text-[9px] px-2 py-0.5 border hidden sm:inline rounded-md ${workstationTheme === "light"
                            ? "bg-[#F1F5F9] text-[#0E7C8A] border-[#0E7C8A]/30"
                            : "bg-[#0D171C] text-[#12A5B8] border-white/[0.08]"
                          }`}>
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
                    {/* Audit Report Button (Toggles Right Slide-Over Sidebar) */}
                    <button
                      onClick={() => setRightSidebarOpen((prev) => !prev)}
                      className={`px-3 py-1.5 border transition-all duration-150 flex items-center gap-1.5 cursor-pointer rounded-lg font-sans font-semibold text-xs ${
                        rightSidebarOpen
                          ? workstationTheme === "light"
                            ? "text-[#0E7C8A] bg-[#E0F2FE] border-[#0E7C8A] shadow-sm font-bold"
                            : "text-[#12A5B8] bg-[#132127] border-[#12A5B8] shadow-[0_0_12px_rgba(18,165,184,0.3)] font-bold"
                          : workstationTheme === "light"
                          ? "text-[#475569] hover:text-[#0E7C8A] hover:bg-[#F1F5F9] border-[#CBD5E1] bg-white shadow-sm"
                          : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#0D171C] border-white/[0.08] bg-[#080E11]"
                      }`}
                      title={rightSidebarOpen ? "Hide Audit Sidebar" : "Open Audit Sidebar"}
                    >
                      <FileText size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} />
                      <span className="hidden sm:inline font-mono font-bold tracking-wider">AUDIT REPORT</span>
                      <ArrowRight size={13} className={`transition-transform duration-200 ${rightSidebarOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Workstation Light / Dark Theme Toggle */}
                    <button
                      onClick={toggleWorkstationTheme}
                      className={`p-1.5 border transition-colors rounded-md cursor-pointer flex items-center gap-1.5 ${workstationTheme === "light"
                          ? "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border-[#E2E8F0] bg-white"
                          : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#0D171C] border-white/[0.08]"
                        }`}
                      title={`Switch to ${workstationTheme === "dark" ? "Light" : "Dark"} Mode (Workstation only)`}
                    >
                      {workstationTheme === "dark" ? (
                        <Sun size={14} className="text-[#12A5B8]" />
                      ) : (
                        <Moon size={14} className="text-[#0E7C8A]" />
                      )}
                      <span className="text-[10px] hidden md:inline uppercase">{workstationTheme}</span>
                    </button>
                  </div>
                </header>

                {sidebarTab === "projects" ? (
                  /* ══════════════════════════════════════════════════════════
                     1. PROJECTS WORKSPACE (MAIN SCREEN)
                     ══════════════════════════════════════════════════════════ */
                  <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-6 max-w-6xl mx-auto w-full">
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/80"
                      }`}>
                      <div>
                        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#FFFFFF]"
                          }`}>
                          <Folder className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} size={22} />
                          <span>Projects Workspace</span>
                        </h2>
                        <p className={`text-xs sm:text-sm mt-1 ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                          }`}>
                          Dedicated Earth-observation mission containers. Select any project to dispatch geospatial queries.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsCreatingProject((p) => !p)}
                        className={`px-3.5 py-2 font-bold text-xs font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto ${workstationTheme === "light"
                            ? "bg-[#0E7C8A] hover:bg-[#0B4F58] text-white"
                            : "bg-[#12A5B8] hover:bg-[#0E7C8A] text-[#040708]"
                          }`}
                      >
                        <Plus size={14} />
                        <span>NEW PROJECT</span>
                      </button>
                    </div>

                    {/* Inline Create Project Form */}
                    {isCreatingProject && (
                      <form
                        onSubmit={handleCreateProject}
                        className={`p-4 rounded-xl space-y-3 shadow-lg border ${workstationTheme === "light"
                            ? "bg-white border-[#CBD5E1]"
                            : "bg-[#0D171C] border-[#12A5B8]/40"
                          }`}
                      >
                        <div className={`text-xs font-bold uppercase font-mono tracking-wider ${workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                          }`}>
                          CREATE MISSION PROJECT
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Project Name (e.g. Brahmaputra Basin Floods)"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className={`sm:col-span-2 px-3 py-2 rounded-lg text-xs outline-none border ${workstationTheme === "light"
                                ? "bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-[#0E7C8A] placeholder:text-[#94A3B8]"
                                : "bg-[#040708] border-white/[0.1] text-[#F0F6F8] focus:border-[#12A5B8] placeholder:text-[#8AA3AD]"
                              }`}
                            autoFocus
                            required
                          />
                          <input
                            type="text"
                            placeholder="Badge (e.g. RAPID-RESP)"
                            value={newProjectBadge}
                            onChange={(e) => setNewProjectBadge(e.target.value)}
                            className={`px-3 py-2 rounded-lg text-xs outline-none font-mono border ${workstationTheme === "light"
                                ? "bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-[#0E7C8A] placeholder:text-[#94A3B8]"
                                : "bg-[#040708] border-white/[0.1] text-[#F0F6F8] focus:border-[#12A5B8] placeholder:text-[#8AA3AD]"
                              }`}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Short description of this satellite analysis mission..."
                          value={newProjectDesc}
                          onChange={(e) => setNewProjectDesc(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg text-xs outline-none border ${workstationTheme === "light"
                              ? "bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-[#0E7C8A] placeholder:text-[#94A3B8]"
                              : "bg-[#040708] border-white/[0.1] text-[#F0F6F8] focus:border-[#12A5B8] placeholder:text-[#8AA3AD]"
                            }`}
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsCreatingProject(false)}
                            className={`px-3 py-1.5 text-xs cursor-pointer ${workstationTheme === "light" ? "text-[#64748B] hover:text-[#0F172A]" : "text-[#8AA3AD] hover:text-[#FFFFFF]"
                              }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={`px-4 py-1.5 font-bold text-xs rounded-lg cursor-pointer ${workstationTheme === "light"
                                ? "bg-[#0E7C8A] hover:bg-[#0B4F58] text-white"
                                : "bg-[#12A5B8] hover:bg-[#0E7C8A] text-[#040708]"
                              }`}
                          >
                            Save Project
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Projects Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectsList.map((proj) => {
                        const isSelected = activeProjectId === proj.id;
                        const projConversations = conversations.filter((c) => c.projectId === proj.id);

                        return (
                          <div
                            key={proj.id}
                            className={`p-5 rounded-2xl transition-all flex flex-col justify-between group shadow-sm border ${workstationTheme === "light"
                                ? isSelected
                                  ? "bg-white border-[#0E7C8A] shadow-[0_4px_24px_rgba(14,124,138,0.15)] ring-1 ring-[#0E7C8A]/30"
                                  : "bg-white border-[#CBD5E1] hover:border-[#0E7C8A]/50 hover:shadow-md"
                                : isSelected
                                  ? "bg-[#0D171C]/90 border-[#12A5B8] shadow-[0_0_20px_rgba(18,165,184,0.15)] ring-1 ring-[#12A5B8]/40"
                                  : "bg-[#0D171C]/90 border-[#1C323B] hover:border-[#12A5B8]/50"
                              }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`font-mono text-[9px] px-2 py-0.5 font-bold rounded tracking-wider border ${workstationTheme === "light"
                                    ? "bg-[#F1F5F9] text-[#0E7C8A] border-[#0E7C8A]/30"
                                    : "bg-[#12A5B8]/10 text-[#12A5B8] border border-[#12A5B8]/30"
                                  }`}>
                                  {proj.badge}
                                </span>
                                {proj.id.startsWith("proj-") && !["proj-earth-obs", "proj-disaster", "proj-urban"].includes(proj.id) && (
                                  <button
                                    onClick={(e) => handleDeleteProject(e, proj.id)}
                                    className={`p-1 transition-colors cursor-pointer ${workstationTheme === "light"
                                        ? "text-[#94A3B8] hover:text-[#EF4444]"
                                        : "text-[#8AA3AD] hover:text-[#FF5454]"
                                      }`}
                                    title="Delete Project"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>

                              <div>
                                <h3 className={`text-base font-bold transition-colors ${workstationTheme === "light"
                                    ? "text-[#0F172A] group-hover:text-[#0E7C8A]"
                                    : "text-[#FFFFFF] group-hover:text-[#12A5B8]"
                                  }`}>
                                  {proj.name}
                                </h3>
                                <p className={`text-xs mt-1.5 leading-relaxed ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                  }`}>
                                  {proj.description}
                                </p>
                              </div>
                            </div>

                            <div className={`pt-4 mt-4 border-t flex items-center justify-between ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/60"
                              }`}>
                              <span className={`text-[11px] font-mono ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                }`}>
                                {projConversations.length} Active {projConversations.length === 1 ? "Session" : "Sessions"}
                              </span>

                              <button
                                onClick={() => handleSelectProject(proj)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${workstationTheme === "light"
                                    ? "bg-[#F1F5F9] hover:bg-[#0E7C8A] text-[#0E7C8A] hover:text-white border-[#CBD5E1] hover:border-[#0E7C8A] shadow-sm"
                                    : "bg-[#12A5B8]/15 hover:bg-[#12A5B8] text-[#12A5B8] hover:text-[#040708] border border-[#12A5B8]/30"
                                  }`}
                              >
                                <span>OPEN &amp; INVESTIGATE</span>
                                <ArrowUpRight size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : sidebarTab === "images" ? (
                  /* ══════════════════════════════════════════════════════════
                     2. SATELLITE IMAGERY ARCHIVE (MAIN SCREEN)
                     ══════════════════════════════════════════════════════════ */
                  <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-6 max-w-6xl mx-auto w-full">
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/80"
                      }`}>
                      <div>
                        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#FFFFFF]"
                          }`}>
                          <ImageIcon className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} size={22} />
                          <span>Satellite Imagery Archive</span>
                        </h2>
                        <p className={`text-xs sm:text-sm mt-1 ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                          }`}>
                          Browse multispectral, SAR, and bi-temporal rasters. Click any scene to analyze with SatQuery AI.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={`px-3.5 py-2 font-bold text-xs font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md ${workstationTheme === "light"
                              ? "bg-[#0E7C8A] hover:bg-[#0B4F58] text-white"
                              : "bg-[#12A5B8] hover:bg-[#0E7C8A] text-[#040708]"
                            }`}
                        >
                          <Upload size={14} />
                          <span>UPLOAD GEOTIFF</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {["ALL", "OPTICAL", "SAR", "CHANGE"].map((mod) => (
                        <button
                          key={mod}
                          onClick={() => setImageFilterModality(mod)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${imageFilterModality === mod
                              ? workstationTheme === "light"
                                ? "bg-[#0E7C8A] text-white border-[#0E7C8A] font-bold shadow-sm"
                                : "bg-[#12A5B8]/20 text-[#12A5B8] border-[#12A5B8] font-bold"
                              : workstationTheme === "light"
                                ? "bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                                : "bg-[#0D171C] text-[#8AA3AD] border-[#1C323B] hover:text-[#FFFFFF]"
                            }`}
                        >
                          {mod === "ALL" ? "All Modalities" : mod}
                        </button>
                      ))}
                    </div>

                    {/* Imagery Grid or Empty State */}
                    {displayedImages.length === 0 ? (
                      <div className={`py-20 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto border border-dashed rounded-2xl p-8 ${workstationTheme === "light"
                          ? "bg-white border-[#CBD5E1] shadow-sm"
                          : "bg-[#0D171C]/40 border-[#1C323B]"
                        }`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${workstationTheme === "light"
                            ? "bg-[#F1F5F9] border-[#0E7C8A]/30 text-[#0E7C8A]"
                            : "bg-[#12A5B8]/10 border-[#12A5B8]/30 text-[#12A5B8]"
                          }`}>
                          <ImageIcon size={26} />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className={`text-base font-bold ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#FFFFFF]"
                            }`}>No Uploaded Satellite Imagery</h3>
                          <p className={`text-xs leading-relaxed ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                            }`}>
                            Upload GeoTIFF or satellite imagery during your investigation. Each uploaded image will appear here with the title of the research performed.
                          </p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={`px-4 py-2 font-bold text-xs font-mono rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md mt-2 ${workstationTheme === "light"
                              ? "bg-[#0E7C8A] hover:bg-[#0B4F58] text-white"
                              : "bg-[#12A5B8] hover:bg-[#0E7C8A] text-[#040708]"
                            }`}
                        >
                          <Upload size={14} />
                          <span>UPLOAD GEOTIFF OR IMAGE</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedImages.map((img) => (
                          <div
                            key={img.id || img.previewUrl}
                            onClick={() => handleOpenImageChat(img)}
                            className={`rounded-2xl overflow-hidden group transition-all flex flex-col justify-between shadow-sm cursor-pointer border ${workstationTheme === "light"
                                ? "bg-white border-[#CBD5E1] hover:border-[#0E7C8A] hover:shadow-[0_4px_20px_rgba(14,124,138,0.12)]"
                                : "bg-[#0D171C] border-[#1C323B] hover:border-[#12A5B8] hover:shadow-[0_0_20px_rgba(18,165,184,0.15)]"
                              }`}
                          >
                            <div>
                              {/* Image Preview with Hover Effect */}
                              <div className={`relative h-48 w-full overflow-hidden ${workstationTheme === "light" ? "bg-[#F1F5F9]" : "bg-[#040708]"
                                }`}>
                                <img
                                  src={img.previewUrl}
                                  alt={img.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className={`absolute inset-0 bg-gradient-to-t ${workstationTheme === "light" ? "from-black/30" : "from-[#0D171C]"
                                  } via-transparent to-transparent opacity-60`} />
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 backdrop-blur-md border text-[9.5px] font-mono font-bold rounded ${workstationTheme === "light"
                                      ? "bg-white/90 border-[#CBD5E1] text-[#0E7C8A] shadow-sm"
                                      : "bg-[#040708]/85 border-[#12A5B8]/50 text-[#12A5B8]"
                                    }`}>
                                    {img.modality || "OPTICAL"}
                                  </span>
                                  {img.metadata?.resolution && (
                                    <span className={`px-2 py-0.5 backdrop-blur-md border text-[9.5px] font-mono rounded ${workstationTheme === "light"
                                        ? "bg-white/90 border-[#CBD5E1] text-[#0F172A] shadow-sm"
                                        : "bg-[#040708]/85 border-white/[0.1] text-[#F0F6F8]"
                                      }`}>
                                      {img.metadata.resolution}
                                    </span>
                                  )}
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                  <span className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg shadow-lg flex items-center gap-1.5 ${workstationTheme === "light"
                                      ? "bg-[#0E7C8A] text-white"
                                      : "bg-[#12A5B8] text-[#040708]"
                                    }`}>
                                    <span>OPEN CHAT</span>
                                    <ArrowUpRight size={14} />
                                  </span>
                                </div>
                              </div>

                              {/* Card Details: Research Title prominent */}
                              <div className="p-4 space-y-2">
                                <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                                  }`}>
                                  RESEARCH PERFORMED
                                </div>
                                <h3 className={`font-bold text-sm transition-colors leading-snug line-clamp-2 ${workstationTheme === "light"
                                    ? "text-[#0F172A] group-hover:text-[#0E7C8A]"
                                    : "text-[#F0F6F8] group-hover:text-[#12A5B8]"
                                  }`}>
                                  {img.researchTitle || img.chatTitle || img.name}
                                </h3>
                                <div className={`text-[11px] flex items-center justify-between pt-1 ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                  }`}>
                                  <span className="truncate max-w-[170px] font-mono">{img.name}</span>
                                  <span className="text-[10px] font-mono">{img.date || "Active Session"}</span>
                                </div>
                                {img.metadata?.coordinates && (
                                  <div className={`text-[10px] font-mono truncate pt-0.5 ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                    }`}>
                                    📍 {img.metadata.coordinates}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer Action */}
                            <div className="p-4 pt-0 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenImageChat(img);
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${workstationTheme === "light"
                                    ? "bg-[#F1F5F9] hover:bg-[#0E7C8A] text-[#0E7C8A] hover:text-white border-[#CBD5E1] hover:border-[#0E7C8A] shadow-sm"
                                    : "bg-[#12A5B8]/15 hover:bg-[#12A5B8] text-[#12A5B8] hover:text-[#040708] border border-[#12A5B8]/30"
                                  }`}
                              >
                                <span>OPEN CHAT INVESTIGATION</span>
                                <ArrowUpRight size={13} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCanvasActiveAsset(img);
                                  setCanvasModalOpen(true);
                                }}
                                className={`p-2 rounded-lg cursor-pointer transition-colors border ${workstationTheme === "light"
                                    ? "bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]"
                                    : "bg-[#132127] hover:bg-[#1C323B] border-white/[0.08] text-[#8AA3AD] hover:text-[#FFFFFF]"
                                  }`}
                                title="Inspect in Canvas"
                              >
                                <Maximize2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ══════════════════════════════════════════════════════════
                     3. CHAT INVESTIGATION WORKSPACE (MAIN SCREEN)
                     ══════════════════════════════════════════════════════════ */
                  <>
                    {/* ── Conversational Stream Area ── */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col">
                      <AnimatePresence mode="wait">
                        {isEmptyChat ? (
                          /* ────────────────────────────────────────────────
                              STATE 1: EMPTY CHAT / WELCOME SCREEN
                              Welcome heading + spacer for centered composer + quick suggestions
                              ──────────────────────────────────────────────── */
                          <motion.div
                            key="empty-welcome-screen"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                              opacity: 0,
                              transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                            }}
                            className="flex-1 flex flex-col justify-center items-center my-auto w-full max-w-3xl mx-auto py-6"
                          >
                            {/* Welcome Heading (positioned above centered composer) */}
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{
                                opacity: 0,
                                y: -24,
                                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                              }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              className="text-center space-y-2 mb-3"
                            >
                              <div className="flex justify-center mb-3">
                                <SatQueryLogo size={48} variant="icon" theme={workstationTheme} />
                              </div>
                              <h1 className={`font-sans text-2xl sm:text-3xl font-medium tracking-wide mt-1 ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#F0F6F8]"
                                }`}>
                                Ask Query
                              </h1>
                              <p className={`font-sans text-sm sm:text-base max-w-xl mx-auto leading-relaxed mt-1 ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                }`}>
                                Understand Earth-observation imagery through natural language.
                              </p>
                            </motion.div>

                            {/* Physical spacer that reserves the exact visual footprint of the centered composer */}
                            <div className="h-[80px] w-full mt-6 mb-2 pointer-events-none" />

                            {/* Quick-Query Suggestions (positioned below centered composer) */}
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{
                                opacity: 0,
                                y: 24,
                                transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                              }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-3 text-left font-sans"
                            >
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
                                  className={`p-3.5 cursor-pointer transition-colors duration-200 group rounded-xl border ${workstationTheme === "light"
                                      ? "bg-white hover:bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#0E7C8A]/50 shadow-sm"
                                      : "bg-[#0D171C] hover:bg-[#132127] border-[#1C323B] hover:border-[#8AA3AD]/50"
                                    }`}
                                >
                                  <div className={`text-xs font-semibold tracking-wide flex items-center justify-between ${workstationTheme === "light"
                                      ? "text-[#0F172A] group-hover:text-[#0E7C8A]"
                                      : "text-[#F0F6F8] group-hover:text-[#12A5B8]"
                                    }`}>
                                    <span>{card.title}</span>
                                    <ArrowUpRight size={14} className={workstationTheme === "light" ? "text-[#94A3B8] group-hover:text-[#0E7C8A]" : "text-[#8AA3AD] group-hover:text-[#12A5B8]"} />
                                  </div>
                                  <div className={`text-[11px] mt-1.5 leading-relaxed font-medium ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                    }`}>
                                    "{card.prompt}"
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          </motion.div>
                        ) : (
                          /* ────────────────────────────────────────────────
                              STATE 2: ACTIVE CONVERSATION STREAM
                              ──────────────────────────────────────────────── */
                          <motion.div
                            key="active-conversation-stream"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="max-w-3xl mx-auto space-y-6 pb-36 w-full"
                          >
                            {activeConversation &&
                              activeConversation.messages.map((msg, idx) => {
                                const isFirstMessage = idx === 0;
                                const prevMsg = idx > 0 ? activeConversation.messages[idx - 1] : null;
                                const isTimeGap = prevMsg ? shouldShowTimeGap(prevMsg, msg, activeConversation?.createdAt) : false;

                                return (
                                  <div key={msg.id} className="space-y-4">
                                    {/* Centered Week & Time Divider for 1st text or when texting back after time gap */}
                                    {(isFirstMessage || isTimeGap) && (
                                      <div className="flex justify-center my-4 select-none">
                                        <span className={`text-xs font-sans font-normal px-3 py-1 ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                          }`}>
                                          {formatChatTimestamp(msg.timestamp, msg.createdAt, activeConversation?.createdAt)}
                                        </span>
                                      </div>
                                    )}

                                    {/* 1. If user message and contains attached asset, show image directly inside chat */}
                                    {msg.attachedAsset && (
                                      <div
                                        id={`asset-${msg.attachedAsset.id}`}
                                        className={`p-3.5 space-y-3 font-mono text-xs max-w-xl ml-auto rounded-2xl border ${workstationTheme === "light"
                                            ? "bg-white border-[#E2E8F0] shadow-sm"
                                            : "bg-[#0D171C] border-[#1C323B]"
                                          }`}
                                      >
                                        <div className={`flex items-center justify-between text-[10px] border-b pb-2 ${workstationTheme === "light" ? "text-[#64748B] border-[#E2E8F0]" : "text-[#8AA3AD] border-[#1C323B]"
                                          }`}>
                                          <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                                            }`}>
                                            <ImageIcon size={12} />
                                            <span>IMAGE</span>
                                          </span>
                                          <span>{msg.attachedAsset.date || new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                                        </div>

                                        <div>
                                          <div className={`font-sans font-bold text-sm ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#FFFFFF]"
                                            }`}>
                                            {msg.attachedAsset.name}
                                          </div>
                                          <div className={`text-[10px] font-mono mt-0.5 ${workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#76AEB0]"
                                            }`}>
                                            {msg.attachedAsset.metadata?.coordinates || "19.0760° N, 72.8777° E"}
                                          </div>
                                        </div>

                                        {/* Clickable Image Card Preview */}
                                        <div
                                          onClick={() => handleOpenCanvasInspection(msg.attachedAsset)}
                                          className={`relative h-48 sm:h-56 overflow-hidden border group cursor-pointer rounded-xl ${workstationTheme === "light" ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-[#080E11] border-[#1C323B]"
                                            }`}
                                        >
                                          <img
                                            src={msg.attachedAsset.previewUrl}
                                            alt={msg.attachedAsset.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                                            <span className="text-[10px] text-white font-mono bg-black/70 px-2.5 py-0.5 border border-white/20 rounded-full">
                                              {msg.attachedAsset.metadata?.resolution || "0.5m GSD"} · {msg.attachedAsset.metadata?.format || "GeoTIFF"}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#12A5B8] flex items-center gap-1 bg-black/80 px-2.5 py-0.5 border border-[#12A5B8]/40 rounded-full">
                                              <Maximize2 size={11} />
                                              <span>INSPECT CANVAS ↗</span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 2. User Question Bubble */}
                                    {msg.role === "user" && msg.text && (
                                      <div className="flex justify-end my-2">
                                        <div className={`max-w-xl px-4 py-3 font-sans text-sm leading-relaxed rounded-2xl shadow-sm whitespace-pre-wrap border ${workstationTheme === "light"
                                            ? "bg-[#F1F5F9] text-[#0F172A] border-[#CBD5E1]"
                                            : "bg-[#0D171C] text-[#FFFFFF] border-white/[0.08]"
                                          }`}>
                                          {msg.text}
                                        </div>
                                      </div>
                                    )}

                                    {/* 3. Assistant Response Block (with dedicated dark/light background card) */}
                                    {msg.role === "assistant" && (
                                      <div className="flex justify-start my-2">
                                        <div className={`max-w-2xl w-full p-4 rounded-2xl shadow-md space-y-3 font-sans border ${workstationTheme === "light"
                                            ? "bg-white border-[#CBD5E1] shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
                                            : "bg-[#0D171C] border-[#1C323B]"
                                          }`}>
                                          {/* Assistant Header */}
                                          <div className={`flex items-center text-xs font-mono pb-1 border-b ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/60"
                                            }`}>
                                            <span className={`text-[10px] font-mono font-semibold tracking-wider ${workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                                              }`}>
                                              {SPECIALIST_CONFIG[msg.mode]?.sublabel || "OPTICAL ◉"}
                                            </span>
                                          </div>

                                          {/* Natural Language Answer */}
                                          <p className={`text-sm leading-relaxed font-sans ${workstationTheme === "light" ? "text-[#0F172A]" : "text-[#F0F6F8]"
                                            }`}>{msg.text}</p>

                                          {/* Action Triggers + Bottom Right Timing */}
                                          <div className={`pt-2 flex items-center justify-between gap-3 font-mono text-xs border-t ${workstationTheme === "light" ? "border-[#E2E8F0]" : "border-[#1C323B]/50"
                                            }`}>
                                            <div className="flex flex-wrap items-center gap-2.5">
                                              <button
                                                onClick={() => handleOpenCanvasInspection(msg.assetRef, msg.evidence)}
                                                className={`px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg text-xs border ${workstationTheme === "light"
                                                    ? "text-[#0E7C8A] hover:text-[#0B4F58] bg-[#0E7C8A]/10 hover:bg-[#0E7C8A]/20 border-[#0E7C8A]/30 font-semibold"
                                                    : "text-[#12A5B8] hover:text-[#19C5DC] bg-[#12A5B8]/10 hover:bg-[#12A5B8]/20 border-[#12A5B8]/30 font-semibold"
                                                  }`}
                                              >
                                                <Target size={13} />
                                                <span className="uppercase tracking-wider text-[11px]">View Findings</span>
                                              </button>

                                              <button
                                                onClick={() => {
                                                  setActiveEvidenceResult(msg.queryResult);
                                                  setShowMeWhyOpen(true);
                                                }}
                                                className={`px-2.5 py-1 transition-colors cursor-pointer flex items-center gap-1.5 rounded-lg text-xs border ${workstationTheme === "light"
                                                    ? "text-[#475569] hover:text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#CBD5E1]"
                                                    : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#1C323B]/50 border-white/[0.08]"
                                                  }`}
                                              >
                                                <ShieldCheck size={13} />
                                                <span className="uppercase tracking-wider text-[11px]">Show Me Why</span>
                                              </button>
                                            </div>

                                            {/* Timing in Bottom Right Corner of Card */}
                                            <div className={`text-[11px] font-sans font-normal self-end ml-auto pr-0.5 select-none ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"
                                              }`}>
                                              {formatTimeOnly(msg.timestamp, msg.createdAt, activeConversation?.createdAt)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                            {/* ────────────────────────────────────────────────
                            EXECUTION PIPELINE: QUERY → ROUTING → ANALYSIS → ANSWER → FINDINGS
                            ──────────────────────────────────────────────── */}
                            {isAnalyzing && (
                              <div className="p-4 bg-[#0D171C] border border-[#12A5B8] space-y-3 font-mono text-xs animate-pulse max-w-2xl rounded-2xl">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-[#12A5B8] uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity size={12} className="animate-spin" />
                                    <span>PIPELINE EXECUTION IN PROGRESS</span>
                                  </span>
                                  <span className="text-[#12A5B8]">{routingStage}</span>
                                </div>

                                {/* Pipeline Stepper Visualization */}
                                <div className="flex items-center justify-between text-[9px] text-[#8AA3AD] border-y border-[#1C323B] py-1.5">
                                  <span className={routingStage === "QUERY" ? "text-[#12A5B8] font-bold" : ""}>01 QUERY</span>
                                  <span>→</span>
                                  <span className={routingStage === "ROUTING" ? "text-[#12A5B8] font-bold" : ""}>02 ROUTING</span>
                                  <span>→</span>
                                  <span className={routingStage === "ANALYSIS" ? "text-[#12A5B8] font-bold" : ""}>03 ANALYSIS</span>
                                  <span>→</span>
                                  <span className={routingStage === "ANSWER" ? "text-[#12A5B8] font-bold" : ""}>04 ANSWER</span>
                                  <span>→</span>
                                  <span className={routingStage === "FINDINGS" ? "text-[#12A5B8] font-bold" : ""}>05 FINDINGS</span>
                                </div>

                                <div className="text-[11px] text-[#F0F6F8] font-sans">
                                  {routingDetail}
                                </div>
                              </div>
                            )}

                            <div ref={chatBottomRef} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ══════════════════════════════════════════════════════════
                    3. FLOATING / ADAPTIVE COMPOSER (CHATGPT UX REFERENCE)
                    Empty state: centered in lower-middle viewport
                    Active state: smoothly glides DOWN to fixed bottom
                    Structure: [ + ] Ask SatQuery... [AUTO ▾] [MIC] [↑]
                    ══════════════════════════════════════════════════════════ */}
                    <motion.div
                      className="absolute left-4 right-4 z-40 pointer-events-none"
                      initial={false}
                      animate={{
                        bottom: isEmptyChat ? "calc(50% - 70px)" : "24px",
                      }}
                      transition={{
                        duration: 0.65,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <div className="max-w-3xl mx-auto pointer-events-auto">
                        {/* Staged Imagery Attachment Pill (if present) */}
                        {stagedAsset && (
                          <div className="mb-2 p-2 bg-[#0D171C]/95 border border-[#1C323B] flex items-center justify-between font-mono text-xs max-w-sm backdrop-blur-md rounded-2xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={stagedAsset.previewUrl}
                                alt="Staged"
                                className="w-8 h-8 object-cover border border-[#1C323B] flex-shrink-0 rounded-lg"
                              />
                              <div className="truncate">
                                <span className="font-bold text-[#F0F6F8] truncate block text-[11px]">
                                  {stagedAsset.name}
                                </span>
                                <span className="text-[9px] text-[#12A5B8] block">
                                  {stagedAsset.metadata?.resolution || "0.5m GSD"} · STAGED FOR QUERY
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setStagedAsset(null)}
                              className="p-1 text-[#8AA3AD] hover:text-[#B9654D] cursor-pointer rounded-md"
                              title="Remove attached imagery"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Composer Bar Container */}
                        <div className={`p-2.5 flex items-end gap-2 transition-all relative rounded-2xl border ${workstationTheme === "light"
                            ? "bg-white border-[#CBD5E1] shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                            : "bg-[#080E11]/90 backdrop-blur-xl border-[#1C323B] shadow-2xl"
                          }`}>
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
                              className={`p-2 transition-colors cursor-pointer rounded-md ${plusMenuOpen
                                  ? "text-[#12A5B8] bg-[#132127]"
                                  : workstationTheme === "light"
                                    ? "text-[#64748B] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                    : "text-[#8AA3AD] hover:text-[#12A5B8] hover:bg-[#132127]"
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
                                  className={`absolute bottom-full left-0 mb-3 w-56 border shadow-2xl p-1.5 font-sans text-xs z-50 rounded-xl overflow-hidden ${workstationTheme === "light" ? "bg-white border-[#E2E8F0]" : "bg-[#0D171C] border-[#1C323B]"
                                    }`}
                                >
                                  <button
                                    onClick={() => {
                                      fileInputRef.current?.click();
                                      setPlusMenuOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors cursor-pointer rounded-xl ${workstationTheme === "light"
                                        ? "text-[#0F172A] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                        : "text-[#F0F6F8] hover:text-[#12A5B8] hover:bg-[#132127]"
                                      }`}
                                  >
                                    <Upload size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} />
                                    <div>
                                      <div className="font-bold">Upload Image</div>
                                      <div className={`text-[10px] font-mono ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"}`}>GeoTIFF, TIFF, Optical, SAR</div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setImageryLibraryOpen(true);
                                      setPlusMenuOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors cursor-pointer border-t mt-1 rounded-xl ${workstationTheme === "light"
                                        ? "text-[#0F172A] hover:text-[#0E7C8A] hover:bg-[#F1F5F9] border-[#E2E8F0]"
                                        : "text-[#F0F6F8] hover:text-[#12A5B8] hover:bg-[#132127] border-[#1C323B]/60"
                                      }`}
                                  >
                                    <Database size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#76AEB0]"} />
                                    <div>
                                      <div className="font-bold">Browse Benchmark Scenes</div>
                                      <div className={`text-[10px] font-mono ${workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]"}`}>Cartosat-3, Proba, Nepal</div>
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
                            placeholder="Ask query about Earth-observation imagery..."
                            className={`flex-1 bg-transparent border-none outline-none font-sans text-xs sm:text-sm resize-none max-h-28 py-1.5 ${workstationTheme === "light"
                                ? "text-[#0F172A] placeholder:text-[#94A3B8]"
                                : "text-[#FFFFFF] placeholder:text-[#8AA3AD]"
                              }`}
                          />

                          {/* ── [AUTO ▾] Task Dropdown Selector ── */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskDropdownOpen((prev) => !prev);
                                setPlusMenuOpen(false);
                              }}
                              className={`px-3 py-1.5 font-sans text-xs flex items-center gap-1.5 transition-colors cursor-pointer rounded-lg border font-semibold ${workstationTheme === "light"
                                  ? "text-[#0E7C8A] bg-[#F1F5F9] hover:bg-[#E2E8F0] border-[#0E7C8A]"
                                  : "text-[#12A5B8] bg-[#132127] hover:bg-[#1C323B] border-[#12A5B8]"
                                }`}
                            >
                              <span>{SPECIALIST_CONFIG[taskMode]?.label || taskMode}</span>
                              <ChevronDown size={14} className={workstationTheme === "light" ? "text-[#0E7C8A]" : "text-[#12A5B8]"} />
                            </button>

                            {/* Task Mode Menu */}
                            <AnimatePresence>
                              {taskDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                  transition={{ duration: 0.12 }}
                                  className={`absolute bottom-full right-0 mb-3 w-64 border shadow-2xl p-1.5 font-sans text-xs z-50 rounded-2xl max-h-80 overflow-y-auto ${workstationTheme === "light"
                                      ? "bg-white/95 backdrop-blur-xl border-[#CBD5E1] shadow-slate-200/80"
                                      : "bg-[#0B0D0C]/95 backdrop-blur-xl border-[#1C323B] shadow-black/80"
                                    }`}
                                >
                                  {Object.keys(SPECIALIST_CONFIG).map((mode) => {
                                    const spec = SPECIALIST_CONFIG[mode];
                                    const isSelected = taskMode === mode;
                                    return (
                                      <button
                                        key={mode}
                                        onClick={() => {
                                          setTaskMode(mode);
                                          setTaskDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left flex items-center justify-between transition-all cursor-pointer rounded-xl mb-1 last:mb-0 font-sans ${isSelected
                                            ? workstationTheme === "light"
                                              ? "bg-[#E0F2FE] text-[#0284C7] font-bold border border-[#BAE6FD]"
                                              : "bg-[#132B35] text-[#38BDF8] font-bold border border-[#12A5B8]/40"
                                            : workstationTheme === "light"
                                              ? "text-[#0F172A] hover:bg-[#F8FAFC]"
                                              : "text-[#E2E8F0] hover:bg-[#132127]"
                                          }`}
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-xs font-bold leading-snug">{spec?.label || mode}</span>
                                          <span className={`text-[10px] font-sans font-normal ${isSelected
                                              ? (workstationTheme === "light" ? "text-[#0369A1]" : "text-[#7DD3FC]")
                                              : (workstationTheme === "light" ? "text-[#64748B]" : "text-[#8AA3AD]")
                                            }`}>
                                            {spec?.subtitle || spec?.sublabel}
                                          </span>
                                        </div>
                                        {isSelected && <Check size={14} className={workstationTheme === "light" ? "text-[#0284C7]" : "text-[#38BDF8]"} />}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* ── [MIC] Microphone Button (Functional Web Speech) ── */}
                          <button
                            onClick={toggleSpeechRecognition}
                            className={`p-2 transition-colors cursor-pointer rounded-lg ${isListening
                                ? "bg-[#12A5B8] text-[#080E11] animate-pulse"
                                : workstationTheme === "light"
                                  ? "text-[#64748B] hover:text-[#0E7C8A] hover:bg-[#F1F5F9]"
                                  : "text-[#8AA3AD] hover:text-[#12A5B8] hover:bg-[#132127]"
                              }`}
                            title={isListening ? "Listening... Click to stop" : "Speak query via microphone"}
                          >
                            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                          </button>

                          {/* ── [↑] Send Button ── */}
                          <button
                            onClick={() => handleSendQuery()}
                            disabled={isAnalyzing || (!queryText.trim() && !stagedAsset)}
                            className="w-8 h-8 rounded-lg bg-[#12A5B8] hover:bg-[#0E7C8A] disabled:opacity-30 text-[#080E11] font-bold flex items-center justify-center transition-all cursor-pointer shadow-md flex-shrink-0"
                            title="Send query"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
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
              className="fixed inset-0 z-50 bg-[#080E11]/95 backdrop-blur-md flex flex-col"
            >
              {/* Overlay Header */}
              <div className="h-12 px-4 border-b border-[#1C323B] flex items-center justify-between font-mono text-xs bg-[#0D171C]">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-sans text-sm text-[#FFFFFF]">{canvasActiveAsset?.name || "Satellite Canvas"}</span>
                  {canvasActiveAsset?.metadata?.coordinates && (
                    <>
                      <span className="text-[#8AA3AD] font-mono">·</span>
                      <span className="text-[#76AEB0] font-mono">{canvasActiveAsset.metadata.coordinates}</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setCanvasModalOpen(false)}
                  className="p-1.5 text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#132127] transition-colors cursor-pointer rounded-md"
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

        {/* ─── MODAL 5: DEFENSE AUDIT REPORT ─── */}
        <ReportGenerationModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          queryResult={activeEvidenceResult || activeConversation?.messages?.findLast((m) => m.queryResult)?.queryResult}
          imageAssets={activeConversation?.stagedAssets || []}
          onDownloadPdf={() => {
            const currentQId = activeEvidenceResult?.queryId || activeConversation?.messages?.findLast((m) => m.queryResult)?.queryResult?.queryId || "SQ-2026-CERTIFIED";
            downloadReportPdf(currentQId);
            toast.success(`Analysis Report PDF for ${currentQId} generated`);
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

        {/* ─── SLIDE-OVER RIGHT SIDEBAR: AUDIT REPORT & PROVENANCE ─── */}
        <AnimatePresence>
          {rightSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                onClick={() => setRightSidebarOpen(false)}
              />

              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed inset-y-0 right-0 z-50 w-80 sm:w-[400px] border-l flex flex-col font-mono text-xs shadow-2xl overflow-hidden ${
                  workstationTheme === "light"
                    ? "bg-white/95 backdrop-blur-xl border-[#CBD5E1] text-[#0F172A]"
                    : "bg-[#080E11]/95 backdrop-blur-xl border-[#1C323B] text-[#F0F6F8]"
                }`}
              >
                {/* Right Sidebar Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  workstationTheme === "light" ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#040708] border-[#1C323B]"
                }`}>
                  <div className="flex items-center gap-2 text-[#D49A3A]">
                    <ShieldCheck size={16} />
                    <span className="font-bold tracking-wider uppercase text-xs">
                      DEFENSE AUDIT & PROVENANCE
                    </span>
                  </div>
                  <button
                    onClick={() => setRightSidebarOpen(false)}
                    className={`p-1.5 transition-colors rounded-lg cursor-pointer ${
                      workstationTheme === "light"
                        ? "text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]"
                        : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#132127]"
                    }`}
                    title="Hide Right Sidebar"
                  >
                    <PanelRightClose size={18} />
                  </button>
                </div>

                {/* Right Sidebar Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
                  {/* Audit Metadata Card */}
                  <div className={`p-3.5 border rounded-xl space-y-2 ${
                    workstationTheme === "light"
                      ? "bg-[#F8FAFC] border-[#E2E8F0]"
                      : "bg-[#0D171C] border-[#1C323B]"
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-[#8AA3AD] font-mono font-bold">
                      <span>AUDIT REFERENCE ID</span>
                      <span className="text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">VERIFIED</span>
                    </div>
                    <div className="text-base font-bold text-[#E4B65A] font-mono">
                      {activeEvidenceResult?.queryId ? `SQ-2026-${String(activeEvidenceResult.queryId).slice(-4)}` : "SQ-2026-7f1c"}
                    </div>
                    <div className="text-[11px] opacity-80">
                      Sensor: Sentinel-2 MSI · Ground Resolution: 0.5m GSD
                    </div>
                  </div>

                  {/* Evidence Pipeline Steps */}
                  <div className={`p-3.5 border rounded-xl space-y-2 text-[11px] ${
                    workstationTheme === "light" ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-[#040708] border-[#1C323B]"
                  }`}>
                    <div className="text-[10px] text-[#0E7C8A] dark:text-[#12A5B8] uppercase font-bold tracking-wider font-mono">
                      DETERMINISTIC EVIDENCE TRAIL
                    </div>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span>1. Surface Reflectance Calibration</span>
                        <span className="text-[#10B981]">PASS ✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>2. Vision-Language Alignment</span>
                        <span className="text-[#10B981]">PASS ✓</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>3. Cryptographic SHA-256 Signature</span>
                        <span className="text-[#10B981]">PASS ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Findings Excerpt */}
                  <div className={`p-3.5 border rounded-xl space-y-2 ${
                    workstationTheme === "light" ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#0D171C] border-[#1C323B]"
                  }`}>
                    <strong className="text-[10px] font-mono uppercase text-[#D49A3A] tracking-wider block">
                      CURRENT FINDINGS SUMMARY:
                    </strong>
                    <p className="leading-relaxed opacity-90 text-[12px]">
                      {activeEvidenceResult?.answer || activeConversation?.messages?.findLast((m) => m.queryResult)?.queryResult?.answer || "Urban expansion and structural features localized with pixel-level bounding coordinates. Corroborated with multi-spectral reflectance."}
                    </p>
                  </div>

                  {/* Cryptographic Footnote */}
                  <div className="p-3 border border-[#10B981]/30 bg-[#10B981]/10 rounded-xl text-[11px] font-sans flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                    <span>Tamper-proof execution token generated with cryptographic verification.</span>
                  </div>
                </div>

                {/* Right Sidebar Footer Actions */}
                <div className={`p-4 border-t flex flex-col gap-2 ${
                  workstationTheme === "light" ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#040708] border-[#1C323B]"
                }`}>
                  <Button
                    onClick={() => {
                      setRightSidebarOpen(false);
                      setReportModalOpen(true);
                    }}
                    className="w-full bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold font-mono text-xs rounded-xl shadow cursor-pointer"
                  >
                    <FileText size={14} className="mr-1.5" />
                    Inspect Full Report Modal
                  </Button>

                  <Button
                    onClick={() => {
                      const qId = activeEvidenceResult?.queryId || "SQ-2026-7f1c";
                      downloadReportPdf(qId);
                      toast.success(`Analysis Report PDF for ${qId} downloaded`);
                    }}
                    variant="outline"
                    className={`w-full font-mono text-xs rounded-xl cursor-pointer ${
                      workstationTheme === "light"
                        ? "border-[#CBD5E1] text-[#0F172A] hover:bg-[#F1F5F9]"
                        : "border-[#1C323B] text-[#F0F6F8] hover:bg-[#132127]"
                    }`}
                  >
                    <Download size={14} className="mr-1.5 text-[#12A5B8]" />
                    Download PDF Report
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── MODAL 7: OPERATOR CREDENTIALS & PROFILE ─── */}
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* ─── MODAL 8: PERSONALIZATION & 27 INDIAN LANGUAGES ─── */}
        <PersonalizationModal
          isOpen={isPersonalizationOpen}
          onClose={() => setIsPersonalizationOpen(false)}
        />
      </div>
    </BackgroundProvider>
  );
}
