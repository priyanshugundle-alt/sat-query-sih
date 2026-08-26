/* Prism Observatory design: bright Investigator Mode board where questions become evidence-backed satellite cases. */
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  CloudUpload,
  Download,
  FileImage,
  FileText,
  Filter,
  Fingerprint,
  Gauge,
  Globe2,
  History,
  Layers3,
  MapPin,
  Orbit,
  Play,
  Plus,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const questions = [
  "What changed between these two dates?",
  "Where are the built-up areas?",
  "Use both sensors to assess flood evidence.",
];

type SensorKind = "OPTICAL" | "SAR";
type ScenarioId = "vqa" | "change" | "fusion";
type WorkspaceView = "board" | "library" | "history" | "proof";
type EvidenceSource = "seeded" | "upload";

type SourceSeed = { name: string; kind: SensorKind; date: string; size: string };
type EvidenceItem = SourceSeed & { id: string; source: EvidenceSource; included: boolean };
type CaseRecord = {
  id: string;
  createdAt: string;
  scenarioId: ScenarioId;
  scenarioLabel: string;
  query: string;
  result: string;
  verdict: string;
  evidenceNames: string[];
  evidenceCount: number;
  checks: string;
};

const scenarios: Record<
  ScenarioId,
  {
    label: string;
    shortLabel: string;
    task: string;
    handler: string;
    query: string;
    hypothesis: string;
    title: string;
    evidence: string;
    result: string;
    detail: string;
    caution: string;
    verdict: string;
    nextAction: string;
    files: SourceSeed[];
  }
> = {
  vqa: {
    label: "Single-image VQA",
    shortLabel: "Look",
    task: "VQA",
    handler: "VqaHandler",
    query: "What land cover is visible in this image?",
    hypothesis: "This scene contains multiple readable land-cover classes.",
    title: "Read the river-edge scene",
    evidence: "One optical observation is staged as a clear field case for visual question answering.",
    result: "Built-up areas, water channels, and mixed vegetation are visible in the scene.",
    detail: "The local VQA path connects its answer to the staged optical observation. It does not claim exact percentages without a measured model result.",
    caution: "DESCRIPTION ONLY",
    verdict: "Evidence ready",
    nextAction: "Ask a follow-up question about a visible region.",
    files: [{ name: "delta_optical_scene.tif", kind: "OPTICAL", date: "2024-01-12", size: "18.4 MB" }],
  },
  change: {
    label: "Change detection",
    shortLabel: "Compare",
    task: "CHANGE_ANALYSIS",
    handler: "ChangeHandler",
    query: "What changed between these two dates?",
    hypothesis: "Built-up cover increased between the two observations.",
    title: "Compare the scene across time",
    evidence: "The staged case validates a date pair before it opens the change-analysis path.",
    result: "Built-up cover increased near the eastern edge between January and June.",
    detail: "The local change result shows a comparison workflow with an explicit date range and a visual-review caveat for the exact boundary.",
    caution: "BOUNDARY REVIEW",
    verdict: "Partially supported",
    nextAction: "Review the eastern boundary with a higher-detail evidence layer.",
    files: [
      { name: "delta_optical_t1.tif", kind: "OPTICAL", date: "2024-01-12", size: "18.4 MB" },
      { name: "delta_optical_t2.tif", kind: "OPTICAL", date: "2024-06-15", size: "19.2 MB" },
    ],
  },
  fusion: {
    label: "Optical–SAR fusion",
    shortLabel: "Investigate",
    task: "FUSION_ANALYSIS",
    handler: "FusionHandler",
    query: "Use both sensors to assess flood evidence.",
    hypothesis: "Water expansion is present near the eastern shoreline.",
    title: "Investigate the delta fringe",
    evidence: "Optical context and radar structure are staged together to test one evidence-backed question.",
    result: "Flood likelihood is elevated near the eastern shoreline.",
    detail: "Optical texture supports surface-water context and SAR backscatter adds a structural signal. The staged sensors agree, but the exact boundary needs review.",
    caution: "REVIEW NEEDED",
    verdict: "Partially supported",
    nextAction: "Add a second clear-date observation to strengthen the case.",
    files: [
      { name: "delta_optical_t1.tif", kind: "OPTICAL", date: "2024-01-12", size: "18.4 MB" },
      { name: "delta_sar_t1.tif", kind: "SAR", date: "2024-01-14", size: "24.1 MB" },
    ],
  },
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function seedEvidence(files: SourceSeed[], source: EvidenceSource = "seeded") {
  return files.map((file) => ({ ...file, id: makeId("evidence"), source, included: true }));
}

function readHistory() {
  if (typeof window === "undefined") return [] as CaseRecord[];
  try {
    const stored = window.localStorage.getItem("satquery-case-history");
    return stored ? (JSON.parse(stored) as CaseRecord[]) : [];
  } catch {
    return [] as CaseRecord[];
  }
}

export default function Home() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("fusion");
  const [query, setQuery] = useState(scenarios.fusion.query);
  const [view, setView] = useState<WorkspaceView>("board");
  const [running, setRunning] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [sensorFilter, setSensorFilter] = useState<"ALL" | SensorKind>("ALL");
  const [proofComplete, setProofComplete] = useState(false);
  const [history, setHistory] = useState<CaseRecord[]>(readHistory);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(() => seedEvidence(scenarios.fusion.files));

  const scenario = useMemo(() => scenarios[scenarioId], [scenarioId]);
  const includedEvidence = useMemo(() => evidence.filter((item) => item.included), [evidence]);
  const filteredEvidence = useMemo(
    () => (sensorFilter === "ALL" ? evidence : evidence.filter((item) => item.kind === sensorFilter)),
    [evidence, sensorFilter],
  );
  const status = running ? "INVESTIGATING" : demoComplete ? "CASE_READY" : "CASE_STAGED";
  const traceItems = [
    ["01", "CASE INTAKE", "natural-language request captured", "done"],
    ["02", "GEO CHECK", `${includedEvidence.length} selected source${includedEvidence.length === 1 ? "" : "s"}`, includedEvidence.length ? "done" : "pending"],
    ["03", "ROUTE", scenario.handler, "done"],
    ["04", "EVIDENCE", running ? "collecting local evidence" : demoComplete ? "support and challenge notes ready" : "waiting to investigate", running || demoComplete ? "active" : "pending"],
    ["05", "RECEIPT", demoComplete ? "case receipt ready" : "waiting for result", demoComplete ? "active" : "pending"],
  ] as const;

  function persistHistory(next: CaseRecord[]) {
    setHistory(next);
    window.localStorage.setItem("satquery-case-history", JSON.stringify(next));
  }

  function handleAnalyze() {
    if (!query.trim()) {
      toast.error("Add an investigation question", { description: "A case needs a clear brief before evidence can be tested." });
      return;
    }
    if (!includedEvidence.length) {
      toast.error("Include at least one source", { description: "Use the Evidence library to add imagery to this case." });
      setView("library");
      return;
    }
    setDemoComplete(false);
    setRunning(true);
    setProofComplete(false);
    toast.success("Investigator Mode started", { description: `${scenario.handler} is staging the selected evidence locally.` });
    window.setTimeout(() => {
      const newRecord: CaseRecord = {
        id: makeId("case"),
        createdAt: new Date().toISOString(),
        scenarioId,
        scenarioLabel: scenario.label,
        query: query.trim(),
        result: scenario.result,
        verdict: scenario.verdict,
        evidenceNames: includedEvidence.map((item) => item.name),
        evidenceCount: includedEvidence.length,
        checks: "06 / 06",
      };
      persistHistory([newRecord, ...history].slice(0, 18));
      setRunning(false);
      setDemoComplete(true);
      toast.success("Case verdict is ready", { description: "A local case receipt was saved in Case history." });
    }, 1050);
  }

  function resetDemo() {
    setRunning(false);
    setDemoComplete(false);
    setProofComplete(false);
    setQuery(scenario.query);
    toast.info("Case reset", { description: "The local Investigator Mode walkthrough is ready again." });
  }

  function selectScenario(nextScenario: ScenarioId) {
    const next = scenarios[nextScenario];
    setScenarioId(nextScenario);
    setQuery(next.query);
    setEvidence(seedEvidence(next.files));
    setRunning(false);
    setDemoComplete(false);
    setProofComplete(false);
    setView("board");
    toast.info(`${next.label} staged`, { description: `${next.handler} is now the active local walkthrough.` });
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    const uploaded = selected.slice(0, 4).map((file, index) => ({
      id: makeId("evidence"),
      name: file.name,
      kind: /sar|radar|sentinel.?1/i.test(file.name) || (index > 0 && selected.length > 1) ? ("SAR" as const) : ("OPTICAL" as const),
      date: new Date().toISOString().slice(0, 10),
      size: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
      source: "upload" as const,
      included: true,
    }));
    setEvidence((current) => [...current, ...uploaded]);
    setDemoComplete(false);
    event.target.value = "";
    toast.success(`${uploaded.length} source${uploaded.length === 1 ? "" : "s"} added`, { description: "Their local metadata is now available in the Evidence library." });
  }

  function toggleEvidence(id: string) {
    setEvidence((current) => current.map((item) => (item.id === id ? { ...item, included: !item.included } : item)));
    setDemoComplete(false);
  }

  function removeEvidence(id: string) {
    setEvidence((current) => current.filter((item) => item.id !== id));
    setDemoComplete(false);
    toast.info("Source removed", { description: "The evidence set was updated locally." });
  }

  function reopenCase(record: CaseRecord) {
    setScenarioId(record.scenarioId);
    setQuery(record.query);
    setEvidence(seedEvidence(scenarios[record.scenarioId].files));
    setDemoComplete(true);
    setView("board");
    toast.success("Case reopened", { description: `${record.scenarioLabel} is back on the investigation board.` });
  }

  function clearHistory() {
    persistHistory([]);
    toast.info("History cleared", { description: "Only saved local demo receipts were removed." });
  }

  function exportReceipt() {
    const payload = {
      product: "SatQuery AI",
      mode: "Demo Mode — local mock data",
      generatedAt: new Date().toISOString(),
      investigation: {
        scenario: scenario.label,
        task: scenario.task,
        handler: scenario.handler,
        question: query,
        verdict: demoComplete ? scenario.verdict : "Case staged",
        finding: demoComplete ? scenario.result : "No finding until the local case is run.",
        evidence: includedEvidence.map(({ name, kind, date, size }) => ({ name, kind, date, size })),
      },
      limitation: "This receipt demonstrates a client-side workflow only. It is not real inference or measured model performance.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `satquery-case-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Case receipt downloaded", { description: "A JSON copy of this local demo case was exported." });
  }

  const navItems: { id: WorkspaceView; label: string; icon: typeof ScanSearch }[] = [
    { id: "board", label: "Investigation board", icon: ScanSearch },
    { id: "library", label: "Evidence library", icon: Layers3 },
    { id: "history", label: "Case history", icon: History },
    { id: "proof", label: "Proof suite", icon: Gauge },
  ];

  return (
    <div className="prism-shell min-h-screen text-[#112557] selection:bg-[#b7f23a]/70">
      <div className="flex min-h-screen">
        <aside className="prism-side hidden w-[258px] shrink-0 flex-col px-5 py-6 xl:flex">
          <div className="brand-block">
            <img src="/manus-storage/satquery-prism-mark_70ad8e52.png" alt="SatQuery graphic mark" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-display text-[18px] font-extrabold tracking-[-0.05em] text-[#112557]">SatQuery AI</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6679a7]">Prism observatory</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="eyebrow px-2">Navigate the case</p>
            <nav className="mt-3 space-y-2" aria-label="Workspace views">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setView(id)} className={`prism-nav ${view === id ? "prism-nav-active" : ""}`}>
                  <Icon size={17} strokeWidth={2} />
                  <span>{label}</span>
                  {id === "history" && history.length > 0 && <span className="nav-count">{history.length}</span>}
                  {view === id && id !== "history" && <span className="ml-auto h-2 w-2 rounded-full bg-[#b7f23a] shadow-[0_0_0_4px_rgba(183,242,58,.24)]" />}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-10 border-t border-[#dce5ff] pt-6">
            <p className="eyebrow px-2">Scenario shelf</p>
            <div className="mt-3 grid gap-2">
              {(Object.keys(scenarios) as ScenarioId[]).map((id, index) => (
                <button key={id} onClick={() => selectScenario(id)} className={`scenario-shelf ${scenarioId === id ? "scenario-shelf-active" : ""}`}>
                  <span className="font-mono text-[10px] text-[#697da9]">0{index + 1}</span>
                  <span>{scenarios[id].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto case-safety-note">
            <ShieldCheck size={17} className="text-[#5145d8]" />
            <div><p className="font-semibold text-[#1c336a]">Evidence-first</p><p>Every displayed result stays labelled as local mock data in Demo Mode.</p></div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="prism-header px-5 md:px-8 xl:px-10">
            <div className="flex items-center gap-3 xl:hidden"><img src="/manus-storage/satquery-prism-mark_70ad8e52.png" alt="SatQuery mark" className="h-9 w-9 object-contain" /><span className="font-display font-extrabold tracking-[-0.04em]">SatQuery AI</span></div>
            <div className="hidden items-center gap-2 text-sm text-[#536b9b] xl:flex"><Orbit size={18} className="text-[#5145d8]" /><span>{navItems.find((item) => item.id === view)?.label}</span><span className="text-[#a9b8d9]">/</span><span className="font-medium text-[#233b71]">Case 042</span></div>
            <div className="ml-auto flex items-center gap-3"><button className="header-button" onClick={() => setShowGuide(true)} aria-label="Open Java and OOP guide"><BookOpen size={18} /></button><div className="mode-badge"><span className="h-2 w-2 rounded-full bg-[#ff6c5c]" /> Demo mode <span className="hidden text-[#9aaccf] sm:inline">· local data</span></div><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#112557] font-mono text-[10px] text-white sm:flex">SQ</div></div>
          </header>

          <div className="mobile-section-nav xl:hidden">
            {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={view === id ? "mobile-section-active" : ""}><Icon size={15} />{label}</button>)}
          </div>

          <div className="mx-auto max-w-[1560px] px-5 pb-10 pt-7 md:px-8 xl:px-10">
            {view === "board" && (
              <InvestigationBoard
                scenario={scenario}
                scenarioId={scenarioId}
                query={query}
                setQuery={setQuery}
                selectScenario={selectScenario}
                evidence={includedEvidence}
                running={running}
                demoComplete={demoComplete}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                traceItems={traceItems}
                onFiles={handleFiles}
                onAnalyze={handleAnalyze}
                onReset={resetDemo}
                onReport={() => setShowReport(true)}
                onOpenLibrary={() => setView("library")}
              />
            )}
            {view === "library" && <EvidenceLibrary evidence={filteredEvidence} totalCount={evidence.length} includedCount={includedEvidence.length} sensorFilter={sensorFilter} setSensorFilter={setSensorFilter} onFiles={handleFiles} onToggle={toggleEvidence} onRemove={removeEvidence} onBack={() => setView("board")} />}
            {view === "history" && <CaseHistory history={history} onReopen={reopenCase} onClear={clearHistory} onBack={() => setView("board")} />}
            {view === "proof" && <ProofSuite evidence={includedEvidence} scenario={scenario} proofComplete={proofComplete} setProofComplete={setProofComplete} onRun={handleAnalyze} onBack={() => setView("board")} />}
          </div>
        </main>
      </div>
      {showReport && <DemoReport scenario={scenario} query={query} evidence={includedEvidence} completed={demoComplete} onClose={() => setShowReport(false)} onExport={exportReceipt} />}
      {showGuide && <OopGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}

function InvestigationBoard({ scenario, scenarioId, query, setQuery, selectScenario, evidence, running, demoComplete, showDetails, setShowDetails, traceItems, onFiles, onAnalyze, onReset, onReport, onOpenLibrary }: { scenario: (typeof scenarios)[ScenarioId]; scenarioId: ScenarioId; query: string; setQuery: (value: string) => void; selectScenario: (id: ScenarioId) => void; evidence: EvidenceItem[]; running: boolean; demoComplete: boolean; showDetails: boolean; setShowDetails: (value: boolean) => void; traceItems: readonly (readonly [string, string, string, "done" | "active" | "pending"])[]; onFiles: (event: React.ChangeEvent<HTMLInputElement>) => void; onAnalyze: () => void; onReset: () => void; onReport: () => void; onOpenLibrary: () => void }) {
  return <>
    <section className="hero-intro">
      <div>
        <div className="flex flex-wrap items-center gap-2"><span className="eyebrow text-[#5145d8]">Investigator mode / 01</span><span className="mini-pill mini-pill-lime">EVIDENCE-LED</span></div>
        <h1 className="mt-4 max-w-[800px] font-editorial text-[clamp(3rem,6vw,6.2rem)] leading-[.86] tracking-[-0.065em] text-[#10245a]">Turn a question into <em className="text-[#5145d8]">a case.</em></h1>
        <p className="mt-5 max-w-[630px] text-[15px] leading-7 text-[#556b98]">SatQuery makes satellite analysis feel like a field investigation: stage the inputs, test the evidence, challenge the weak points, and keep a reusable receipt of what the result can actually support.</p>
      </div>
      <div className="hero-orbit-card"><div className="hero-orbit hero-orbit-a" /><div className="hero-orbit hero-orbit-b" /><div className="relative z-10"><p className="eyebrow text-[#6377aa]">Active brief</p><p className="mt-2 font-display text-lg font-extrabold tracking-[-.04em] text-[#10245a]">{scenario.label}</p><p className="mt-2 text-sm leading-5 text-[#6177a2]">{evidence.length} selected source{evidence.length === 1 ? "" : "s"} · {scenario.task.replaceAll("_", " ")}</p></div></div>
    </section>

    <div className="case-ribbon mt-7" aria-label="Investigation path">
      <RibbonStep number="01" label="Brief" detail="question" state="done" />
      <RibbonStep number="02" label="Check" detail="inputs" state={evidence.length ? "done" : "pending"} />
      <RibbonStep number="03" label="Test" detail="evidence" state={running ? "active" : "done"} />
      <RibbonStep number="04" label="Verdict" detail="support level" state={demoComplete ? "done" : "pending"} />
      <RibbonStep number="05" label="Receipt" detail="case file" state={demoComplete ? "done" : "pending"} />
    </div>

    <section className="investigation-board mt-6 grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)_324px]">
      <div className="space-y-6">
        <section className="investigation-plane plane-blue p-5">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><CloudUpload size={17} className="text-[#1179ff]" /><p className="eyebrow text-[#4773b6]">Evidence intake</p></div><label className="icon-action text-[#1179ff]"><Plus size={18} /><input type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" className="hidden" onChange={onFiles} /></label></div>
          <p className="mt-3 text-sm leading-5 text-[#5571a3]">Load the imagery that can answer this case, then manage whether each source is included from the library.</p>
          <div className="mt-5 space-y-3">{evidence.length ? evidence.map((file) => <InputTicket key={file.id} file={file} />) : <div className="empty-ticket">No sources selected yet.</div>}</div>
          <div className="mt-5 grid gap-2"><label className="upload-stamp"><CloudUpload size={15} /> Add imagery<input type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" className="hidden" onChange={onFiles} /></label><button onClick={onOpenLibrary} className="library-link"><Layers3 size={14} /> Manage evidence library</button></div>
        </section>

        <section className="investigation-plane plane-yellow p-5">
          <div className="flex items-center gap-2"><Fingerprint size={17} className="text-[#ad7400]" /><p className="eyebrow text-[#9b741d]">Case conditions</p></div>
          <div className="mt-4 space-y-3">{[["Format", "GeoTIFF"], ["Bands", scenarioId === "fusion" ? "4 + radar" : "4 optical"], ["Pair", evidence.length === 1 ? "Single scene" : evidence.length > 1 ? "Compatible" : "Awaiting source"], ["Status", evidence.length ? "Ready to route" : "Needs evidence"]].map(([label, value]) => <div key={label} className="meta-row"><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="mt-5 flex items-start gap-2 border-t border-[#f4d983] pt-4 text-xs leading-5 text-[#80662b]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#ad7400]" />The real Java validator will replace this client-side profile in Real Mode.</div>
        </section>
      </div>

      <section className="investigation-plane stage-plane overflow-hidden">
        <div className="stage-chrome"><div className="flex items-center gap-2"><Globe2 size={16} className="text-[#1179ff]" /><p className="eyebrow text-[#4c6faa]">Observation field</p></div><div className="flex items-center gap-2"><span className="mini-pill mini-pill-blue">OPTICAL</span>{scenarioId === "fusion" && <span className="mini-pill mini-pill-violet">SAR</span>}</div></div>
        <div className="relative h-[330px] overflow-hidden md:h-[425px]">
          <img src="/manus-storage/satquery-prism-hero_fa3e1001.jpg" alt="Bright satellite observation of a delta landscape" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,251,255,.96)_0%,rgba(248,251,255,.52)_42%,rgba(248,251,255,.06)_72%)]" />
          <div className="stage-grid-overlay absolute inset-0" />
          <div className="orbital-halo absolute -right-12 top-10 h-56 w-56 md:h-72 md:w-72" />
          <div className="stage-route absolute bottom-14 left-[36%] right-4 h-16" aria-hidden="true" />
          <div className="absolute left-6 top-6 max-w-[350px] md:left-8 md:top-8"><p className="eyebrow text-[#3562aa]">Staged observation / {scenario.task.replaceAll("_", " ")}</p><h2 className="mt-3 font-display text-[clamp(1.8rem,3vw,3rem)] font-extrabold leading-[.95] tracking-[-.055em] text-[#10245a]">{scenario.title}</h2><p className="mt-4 text-sm leading-6 text-[#4d6593]">{scenario.evidence}</p></div>
          <div className="absolute bottom-5 left-6 right-6 flex flex-wrap items-end justify-between gap-3 md:bottom-7 md:left-8 md:right-8"><div className="case-coordinate"><MapPin size={14} /> Delta test area <span>28.6139° N · 77.2090° E</span></div><div className="evidence-dots"><span className="bg-[#1179ff]" /><span className="bg-[#7846d7]" /><span className="bg-[#b7f23a]" /></div></div>
        </div>
        <div className="stage-footer"><Metric label="Scene" value="14.8 km²" /><Metric label="Sources" value={`${evidence.length} selected`} /><Metric label="Resolution" value="10 m" /></div>
      </section>

      <aside className="space-y-6">
        <section className="investigation-plane plane-lime p-5">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[#4f731c]">Investigator verdict</p><h2 className="mt-3 font-editorial text-[2.15rem] leading-[.95] tracking-[-.055em] text-[#234413]">{demoComplete ? scenario.verdict : "Case staged"}</h2></div><div className="verdict-mark"><Check size={18} /></div></div>
          <div className="mt-6 border-y border-[#d0ed95] py-4"><p className="font-mono text-[9px] uppercase tracking-[.13em] text-[#5f7f2d]">Hypothesis</p><p className="mt-2 text-[15px] leading-6 text-[#34591b]">{scenario.hypothesis}</p></div>
          <div className="mt-5"><p className="font-mono text-[9px] uppercase tracking-[.13em] text-[#5f7f2d]">Next-best evidence</p><p className="mt-2 text-sm leading-6 text-[#365b1c]">{demoComplete ? scenario.nextAction : "Run the local case to reveal the next recommended check."}</p></div>
          <button onClick={onAnalyze} disabled={running} className="primary-button mt-6 w-full"><Play size={15} fill="currentColor" /> {running ? "Testing evidence" : "Test the case"}</button>
        </section>

        <section className="investigation-plane plane-coral p-5"><div className="flex items-center gap-2"><CircleAlert size={17} className="text-[#d64f4a]" /><p className="eyebrow text-[#ad514e]">Challenge note</p></div><p className="mt-3 text-sm leading-6 text-[#8d4341]">{demoComplete ? scenario.detail : "The system will show what supports the case and what still needs review. No staged result is presented as real inference."}</p><div className="mt-4 flex items-center justify-between border-t border-[#ffcac1] pt-4"><span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#b95c56]">{demoComplete ? scenario.caution : "DEMO MODE"}</span><button onClick={onReset} className="text-xs font-bold text-[#ad4b46] transition hover:text-[#702a2a]">Reset case</button></div></section>
      </aside>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <section className="investigation-plane plane-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow text-[#667bb0]">Write the brief</p><p className="mt-2 text-sm text-[#6377a4]">Choose a local case or phrase your own investigation question.</p></div><div className="flex gap-2">{(Object.keys(scenarios) as ScenarioId[]).map((id) => <button key={id} onClick={() => selectScenario(id)} className={`mode-tab ${scenarioId === id ? "mode-tab-active" : ""}`}>{scenarios[id].shortLabel}</button>)}</div></div>
        <textarea value={query} onChange={(event) => { setQuery(event.target.value); }} className="prism-textarea mt-5" placeholder="Ask a question about the imagery..." />
        <div className="mt-5 flex flex-wrap gap-2">{questions.map((item) => <button key={item} onClick={() => setQuery(item)} className="question-chip">{item}</button>)}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#e1e8fc] pt-5"><div><p className="eyebrow text-[#667bb0]">Java route preview</p><p className="mt-1 flex items-center gap-2 font-display text-lg font-bold tracking-[-.04em] text-[#18336b]"><span>{scenario.handler}</span><ArrowRight size={16} className="text-[#5145d8]" /><span>ModelClient</span></p></div><button onClick={onAnalyze} disabled={running} className="secondary-button"><Zap size={15} /> {running ? "Case running" : "Build evidence case"}</button></div>
      </section>

      <section className="investigation-plane plane-violet p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Radar size={17} className="text-[#5145d8]" /><p className="eyebrow text-[#6956a6]">Sensor lenses</p></div><span className="font-mono text-[9px] text-[#7c68b4]">{evidence.length} SELECTED</span></div><div className="mt-5 grid grid-cols-2 gap-3"><Evidence image="/manus-storage/satquery-prism-optical_546132c7.jpg" label="Optical" note="surface context" tone="blue" /><Evidence image="/manus-storage/satquery-prism-sar_e14f29aa.jpg" label="SAR" note="structure signal" tone="violet" /></div><p className="mt-5 text-sm leading-6 text-[#5e4c99]">The evidence library preserves distinct sensor sources, so the real fusion path can state whether they agree, complement each other, or need review.</p></section>
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="investigation-plane plane-white p-6"><div className="flex items-center justify-between"><div><p className="eyebrow text-[#667bb0]">Evidence path</p><h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-.05em] text-[#19366f]">A visible investigation, not a black box.</h2></div><button onClick={() => setShowDetails(!showDetails)} className="header-button border border-[#e1e8fc] bg-[#f7f9ff]" aria-label="Toggle trace details"><ChevronDown size={18} className={showDetails ? "rotate-180 transition" : "transition"} /></button></div>{showDetails && <div className="trace-board mt-6">{traceItems.map(([number, title, detail, state]) => <TraceStep key={title} number={number} title={title} detail={detail} state={state} />)}</div>}</section>
      <section className="investigation-plane plane-navy p-6"><p className="eyebrow text-[#aabaff]">Case readout</p><p className="mt-3 font-editorial text-3xl leading-[1.02] tracking-[-.05em] text-white">{demoComplete ? scenario.result : "Run the staged case to surface its supported finding."}</p><p className="mt-4 text-sm leading-6 text-[#c7d2ff]">{demoComplete ? "This local result is saved in Case history with its limitation and evidence list." : "Demo Mode gives your team a working client-side walkthrough before a Java backend or model endpoint is connected."}</p><div className="mt-6 flex items-center justify-between border-t border-white/15 pt-5"><span className="font-mono text-[10px] tracking-[.12em] text-[#b7f23a]">{running ? "INVESTIGATING" : demoComplete ? "CASE_READY" : "CASE_STAGED"}</span><button onClick={onReport} className="flex items-center gap-2 text-sm font-bold text-white transition hover:text-[#b7f23a]"><Download size={15} /> Case receipt</button></div></section>
    </section>

    <section className="mt-6 grid gap-4 md:grid-cols-3"><Stat icon={Zap} label="Route clarity" value="0.92" detail="handler selected" tone="blue" /><Stat icon={Timer} label="Case rhythm" value="01.1s" detail="local workflow" tone="violet" /><Stat icon={ShieldCheck} label="Evidence map" value={`${evidence.length} / ${evidence.length}`} detail="sources selected" tone="lime" /></section>
    <footer className="mt-10 flex flex-col gap-4 border-t border-[#dfe7fb] py-7 text-xs text-[#7184ad] md:flex-row md:items-center md:justify-between"><p>SatQuery AI / Bright Investigator Mode / Client-side local demo</p><button onClick={onReport} className="flex items-center gap-2 font-semibold text-[#5145d8] transition hover:text-[#2f237f]"><Download size={14} /> Preview or export local case receipt</button></footer>
  </>;
}

function EvidenceLibrary({ evidence, totalCount, includedCount, sensorFilter, setSensorFilter, onFiles, onToggle, onRemove, onBack }: { evidence: EvidenceItem[]; totalCount: number; includedCount: number; sensorFilter: "ALL" | SensorKind; setSensorFilter: (filter: "ALL" | SensorKind) => void; onFiles: (event: React.ChangeEvent<HTMLInputElement>) => void; onToggle: (id: string) => void; onRemove: (id: string) => void; onBack: () => void }) {
  return <section className="workspace-view">
    <ViewHeader eyebrow="Evidence library / 02" title="Keep the case file clean." description="Add local imagery metadata, select what belongs in the active case, or remove sources that no longer support the question." action={<label className="secondary-button"><Upload size={15} /> Add local imagery<input type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" className="hidden" onChange={onFiles} /></label>} />
    <div className="library-stats mt-7"><Stat icon={Layers3} label="Library sources" value={`${totalCount}`} detail="stored this session" tone="blue" /><Stat icon={Check} label="Active case" value={`${includedCount}`} detail="sources included" tone="lime" /><Stat icon={Filter} label="Current lens" value={sensorFilter === "ALL" ? "All" : sensorFilter} detail="evidence filter" tone="violet" /></div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="filter-tabs" aria-label="Evidence sensor filter">{(["ALL", "OPTICAL", "SAR"] as const).map((filter) => <button key={filter} onClick={() => setSensorFilter(filter)} className={sensorFilter === filter ? "filter-active" : ""}>{filter === "ALL" ? "All sources" : filter}</button>)}</div><button onClick={onBack} className="quiet-action"><ArrowRight size={15} className="rotate-180" /> Back to investigation</button></div>
    {evidence.length ? <div className="evidence-library-grid mt-6">{evidence.map((item) => <article key={item.id} className={`evidence-library-card ${item.kind === "SAR" ? "evidence-library-sar" : ""}`}><div className="evidence-card-top"><div className="evidence-source-icon">{item.kind === "SAR" ? <Radar size={18} /> : <FileImage size={18} />}</div><div className="flex items-center gap-2"><span className="mini-pill mini-pill-blue">{item.kind}</span><span className="source-origin">{item.source === "upload" ? "LOCAL ADD" : "STAGED"}</span></div></div><h2 className="mt-7 truncate font-display text-xl font-extrabold tracking-[-.05em] text-[#1a3974]">{item.name}</h2><p className="mt-2 font-mono text-[10px] uppercase tracking-[.1em] text-[#6c82af]">{item.date} · {item.size}</p><div className="mt-7 flex items-center justify-between gap-3 border-t border-[#dfe8fa] pt-4"><button onClick={() => onToggle(item.id)} className={`include-toggle ${item.included ? "include-toggle-active" : ""}`}><Check size={14} /> {item.included ? "In active case" : "Include in case"}</button><button onClick={() => onRemove(item.id)} className="remove-source" aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button></div></article>)}</div> : <EmptyState icon={Layers3} title="No sources match this lens." detail="Try another sensor filter or add imagery to build the active case." action={<label className="secondary-button"><Upload size={15} /> Add imagery<input type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" className="hidden" onChange={onFiles} /></label>} />}
  </section>;
}

function CaseHistory({ history, onReopen, onClear, onBack }: { history: CaseRecord[]; onReopen: (record: CaseRecord) => void; onClear: () => void; onBack: () => void }) {
  return <section className="workspace-view">
    <ViewHeader eyebrow="Case history / 03" title="Receipts that stay with the case." description="Completed client-side demo cases are retained in this browser so your team can reopen the question and inspect the saved evidence list." action={history.length ? <button onClick={onClear} className="destructive-action"><Trash2 size={15} /> Clear local history</button> : undefined} />
    {history.length ? <div className="history-list mt-8">{history.map((record, index) => <article key={record.id} className="history-card"><div className="history-sequence">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><span className="mini-pill mini-pill-lime">{record.verdict}</span><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#6b80ac]">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.createdAt))}</span></div><h2 className="mt-3 font-display text-xl font-extrabold tracking-[-.045em] text-[#1c3975]">{record.query}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6077a3]">{record.result}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[.1em] text-[#617bad]"><span>{record.scenarioLabel}</span><span>{record.evidenceCount} source{record.evidenceCount === 1 ? "" : "s"}</span><span>{record.checks} checks</span></div></div><button onClick={() => onReopen(record)} className="secondary-button shrink-0"><ScanSearch size={15} /> Reopen case</button></article>)}</div> : <EmptyState icon={History} title="No completed cases yet." detail="Run an investigation from the board to create a locally saved receipt here." action={<button onClick={onBack} className="secondary-button"><ScanSearch size={15} /> Open investigation board</button>} />}
  </section>;
}

function ProofSuite({ evidence, scenario, proofComplete, setProofComplete, onRun, onBack }: { evidence: EvidenceItem[]; scenario: (typeof scenarios)[ScenarioId]; proofComplete: boolean; setProofComplete: (value: boolean) => void; onRun: () => void; onBack: () => void }) {
  const checks = [
    { label: "Question defined", detail: "A natural-language brief has a selected investigation route.", state: "pass" },
    { label: "Evidence selected", detail: `${evidence.length} source${evidence.length === 1 ? " is" : "s are"} currently included in the active case.`, state: evidence.length ? "pass" : "review" },
    { label: "Sensor logic", detail: scenario.task === "FUSION_ANALYSIS" ? "Optical and SAR paths are visible as separate inputs." : "A single optical-first route has been selected.", state: "pass" },
    { label: "Limitation attached", detail: "All findings are explicitly constrained to Demo Mode local mock data.", state: "pass" },
  ] as const;
  function runChecks() {
    setProofComplete(false);
    window.setTimeout(() => {
      setProofComplete(true);
      toast.success("Proof suite completed", { description: "The active case now has a visible local validation summary." });
    }, 550);
  }
  return <section className="workspace-view">
    <ViewHeader eyebrow="Proof suite / 04" title="Make the argument inspectable." description="The proof suite turns the invisible hand-offs in an analysis workflow into explicit reviewable checks. It validates the client-side demo state, not real model accuracy." action={<div className="flex flex-wrap gap-3"><button onClick={onBack} className="quiet-action"><ArrowRight size={15} className="rotate-180" /> Board</button><button onClick={runChecks} className="secondary-button"><Sparkles size={15} /> Run proof checks</button></div>} />
    <div className="proof-banner mt-8"><div><p className="eyebrow text-[#4f731c]">Current route</p><p className="mt-3 font-editorial text-3xl leading-none tracking-[-.055em] text-[#244714]">{scenario.handler} <span className="text-[#68813a]">→</span> EvidenceVerifier</p><p className="mt-4 max-w-2xl text-sm leading-6 text-[#4f6c2e]">Each check is rooted in visible client-side state: the selected sources, routing rationale, and required limitation label.</p></div><div className={`proof-status ${proofComplete ? "proof-status-ready" : ""}`}><ShieldCheck size={19} /><span>{proofComplete ? "04 checks reviewed" : "Ready to verify"}</span></div></div>
    <div className="proof-grid mt-6">{checks.map((check, index) => <article key={check.label} className={`proof-card ${check.state === "review" ? "proof-card-review" : ""}`}><span className="proof-number">0{index + 1}</span><div><p className="font-display text-lg font-extrabold tracking-[-.04em] text-[#223f79]">{check.label}</p><p className="mt-2 text-sm leading-6 text-[#6178a5]">{check.detail}</p></div><span className={`proof-chip ${check.state === "pass" ? "proof-chip-pass" : "proof-chip-review"}`}>{check.state === "pass" ? "ready" : "review"}</span></article>)}</div>
    <section className="investigation-plane plane-navy mt-6 p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-[#aabaff]">Next working action</p><p className="mt-3 max-w-2xl font-editorial text-3xl leading-[1.02] tracking-[-.05em] text-white">Build the evidence case when the review set is ready.</p></div><button onClick={onRun} className="secondary-button shrink-0"><Play size={15} fill="currentColor" /> Test the case</button></div></section>
  </section>;
}

function ViewHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="view-header"><div><p className="eyebrow text-[#5145d8]">{eyebrow}</p><h1 className="mt-4 max-w-3xl font-editorial text-[clamp(3rem,6vw,5.8rem)] leading-[.88] tracking-[-.065em] text-[#10245a]">{title}</h1><p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#5a709c]">{description}</p></div>{action && <div className="view-header-action">{action}</div>}</header>;
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: typeof Layers3; title: string; detail: string; action: React.ReactNode }) {
  return <div className="empty-state mt-7"><div className="empty-state-icon"><Icon size={25} /></div><h2 className="mt-5 font-editorial text-3xl tracking-[-.055em] text-[#1b3975]">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#6078a5]">{detail}</p><div className="mt-6">{action}</div></div>;
}

function RibbonStep({ number, label, detail, state }: { number: string; label: string; detail: string; state: "done" | "active" | "pending" }) {
  return <div className={`ribbon-step ribbon-${state}`}><span className="ribbon-number">{number}</span><span><strong>{label}</strong><small>{detail}</small></span></div>;
}

function InputTicket({ file }: { file: EvidenceItem }) {
  const isSar = file.kind === "SAR";
  return <div className={`input-ticket ${isSar ? "input-ticket-sar" : ""}`}><div className="input-ticket-icon">{isSar ? <Radar size={16} /> : <FileImage size={16} />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-[#18356d]">{file.name}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.1em] text-[#6a80af]">{file.kind} · {file.date} · {file.size}</p></div><Check size={16} className={isSar ? "text-[#7846d7]" : "text-[#1179ff]"} /></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="eyebrow text-[#5e77aa]">{label}</p><p className="mt-1 font-display text-sm font-bold tracking-[-.03em] text-[#18366e]">{value}</p></div>;
}

function Evidence({ image, label, note, tone }: { image: string; label: string; note: string; tone: "blue" | "violet" }) {
  return <div className="evidence-lens"><img src={image} alt={`${label} evidence`} className="h-[132px] w-full object-cover" /><div className={`evidence-lens-label evidence-lens-${tone}`}><p>{label}</p><span>{note}</span></div></div>;
}

function TraceStep({ number, title, detail, state }: { number: string; title: string; detail: string; state: "done" | "active" | "pending" }) {
  return <div className={`trace-step trace-${state}`}><span className="trace-number">{state === "done" ? <Check size={13} /> : number}</span><div><p>{title}</p><span>{detail}</span></div></div>;
}

function Stat({ icon: Icon, label, value, detail, tone }: { icon: typeof Zap; label: string; value: string; detail: string; tone: "blue" | "violet" | "lime" }) {
  return <div className={`stat-slab stat-${tone}`}><div className="stat-icon"><Icon size={18} /></div><div><p className="eyebrow">{label}</p><div className="mt-1 flex flex-wrap items-baseline gap-x-2"><span className="font-display text-2xl font-extrabold tracking-[-.05em]">{value}</span><span className="text-xs opacity-70">{detail}</span></div></div></div>;
}

function DemoReport({ scenario, query, evidence, completed, onClose, onExport }: { scenario: (typeof scenarios)[ScenarioId]; query: string; evidence: EvidenceItem[]; completed: boolean; onClose: () => void; onExport: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2b60]/35 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Local case receipt preview"><div className="receipt-modal w-full max-w-[800px]"><div className="receipt-header"><div><p className="eyebrow text-[#5e75a9]">Local case receipt</p><h3 className="mt-2 font-editorial text-3xl tracking-[-.055em] text-[#15316a]">{scenario.label}</h3></div><button className="header-button border border-[#dbe4fa] bg-white" onClick={onClose} aria-label="Close case receipt"><X size={18} /></button></div><div className="grid gap-7 p-6 md:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><div><p className="eyebrow text-[#6279ab]">Question</p><p className="mt-2 text-[16px] font-semibold text-[#1d3973]">{query}</p></div><div><p className="eyebrow text-[#6279ab]">Readout</p><p className="mt-2 font-editorial text-3xl leading-9 tracking-[-.05em] text-[#203d79]">{completed ? scenario.result : "Run this local scenario to add its staged evidence."}</p></div><div className="border-l-4 border-[#ff7c70] bg-[#fff7f5] px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#b75b55]">Demo limitation</p><p className="mt-2 text-sm leading-6 text-[#8c514c]">This receipt demonstrates a real client-side workflow only. It does not represent measured model performance or real inference.</p></div></div><div className="receipt-side"><p className="eyebrow text-[#677caf]">Trace summary</p><div className="mt-5 space-y-4 text-sm"><ReportRow label="Task" value={scenario.task} /><ReportRow label="Handler" value={scenario.handler} /><ReportRow label="Inputs" value={`${evidence.length} selected`} /><ReportRow label="Evidence" value={completed ? "local record ready" : "staged"} /><ReportRow label="Mode" value="DEMO MODE" /></div><button onClick={onExport} className="secondary-button mt-7 w-full justify-center"><Download size={15} /> Download JSON receipt</button></div></div></div></div>;
}

function ReportRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-[#7083ac]">{label}</span><span className="font-mono text-[10px] text-[#28447e]">{value}</span></div>; }

function OopGuide({ onClose }: { onClose: () => void }) {
  const lessons = [["AgentController", "Coordinates the request from input validation to the final case receipt."], ["HandlerFactory", "Selects VqaHandler, ChangeHandler, or FusionHandler."], ["Strategy", "Defines how the selected investigation task executes."], ["ModelClient", "Keeps the model endpoint replaceable behind a Java interface."], ["TraceObserver", "Records the visible case events for the UI and report."]];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2b60]/35 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Java and OOP guide"><div className="receipt-modal w-full max-w-[860px]"><div className="receipt-header"><div><p className="eyebrow text-[#5e75a9]">Team learning guide</p><h3 className="mt-2 font-editorial text-3xl tracking-[-.055em] text-[#15316a]">How Java builds the case</h3></div><button className="header-button border border-[#dbe4fa] bg-white" onClick={onClose} aria-label="Close Java and OOP guide"><X size={18} /></button></div><div className="p-6"><p className="max-w-2xl text-sm leading-6 text-[#6177a3]">The model is not the whole project. Your Java application validates imagery, selects the investigation path, calls a replaceable analysis engine, records the trace, and prepares an evidence-linked result.</p><div className="mt-6 grid gap-3 md:grid-cols-2">{lessons.map(([name, detail], index) => <div key={name} className="oop-tile"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#5145d8]">0{index + 1} / {name}</p><p className="mt-2 text-sm leading-6 text-[#426092]">{detail}</p></div>)}</div><div className="mt-6 border-t border-[#e2e9fb] pt-5"><p className="font-mono text-[10px] tracking-[.08em] text-[#25427c]">Request → Validator → AgentController → HandlerFactory → Strategy → ModelClient → Facts → EvidenceVerifier → ReportBuilder</p></div></div></div></div>;
}
