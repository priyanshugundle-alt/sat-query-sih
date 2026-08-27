import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronDown, Download, FileImage, FileText, History, Layers3, MapPin, Orbit, Play, Plus, Radar, ScanSearch, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
const scenarios = {
  vqa: { label: "Single-image VQA", short: "Look", task: "VQA", query: "What land cover is visible in this image?", title: "Read the river-edge scene", summary: "Use one optical scene to answer a focused visual question.", result: "Built-up areas, water channels, and mixed vegetation are visible in the scene.", verdict: "Evidence ready", next: "Ask a follow-up question about one visible region.", evidence: [{ name: "delta_optical_scene.tif", kind: "OPTICAL", date: "2024-01-12", size: "18.4 MB" }] },
  change: { label: "Change detection", short: "Compare", task: "CHANGE ANALYSIS", query: "What changed between these two dates?", title: "Compare the scene across time", summary: "Use a clear date pair to inspect one change hypothesis.", result: "Built-up cover increased near the eastern edge between January and June.", verdict: "Partially supported", next: "Review the eastern boundary with higher-detail evidence.", evidence: [{ name: "delta_optical_t1.tif", kind: "OPTICAL", date: "2024-01-12", size: "18.4 MB" }, { name: "delta_optical_t2.tif", kind: "OPTICAL", date: "2024-06-15", size: "19.2 MB" }] },
  fusion: { label: "Optical\u2013SAR fusion", short: "Investigate", task: "FUSION ANALYSIS", query: "Use both sensors to assess flood evidence.", title: "Investigate the delta fringe", summary: "Combine optical context with radar structure to examine flood evidence.", result: "Flood likelihood is elevated near the eastern shoreline.", verdict: "Partially supported", next: "Add a second clear-date observation to strengthen the case.", evidence: [{ name: "delta_optical_t1.tif", kind: "OPTICAL", date: "2024-01-12", size: "18.4 MB" }, { name: "delta_sar_t1.tif", kind: "SAR", date: "2024-01-14", size: "24.1 MB" }] }
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const stage = (items) => items.map((item) => ({ ...item, id: uid(), included: true }));
const savedCases = () => {
  try {
    return JSON.parse(window.localStorage.getItem("satquery-case-history") ?? "[]");
  } catch {
    return [];
  }
};
export default function Home() {
  const [view, setView] = useState("board");
  const [scenarioId, setScenarioId] = useState("fusion");
  const [question, setQuestion] = useState(scenarios.fusion.query);
  const [evidence, setEvidence] = useState(() => stage(scenarios.fusion.evidence));
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showPath, setShowPath] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [history, setHistory] = useState(savedCases);
  const scenario = scenarios[scenarioId];
  const selectedEvidence = useMemo(() => evidence.filter((item) => item.included), [evidence]);
  const switchScenario = (id) => {
    setScenarioId(id);
    setQuestion(scenarios[id].query);
    setEvidence(stage(scenarios[id].evidence));
    setIsComplete(false);
    setShowPath(false);
    setView("board");
  };
  const upload = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setEvidence((current) => [...current, ...files.slice(0, 3).map((file, index) => ({ id: uid(), name: file.name, kind: /sar|radar|sentinel.?1/i.test(file.name) || files.length > 1 && index > 0 ? "SAR" : "OPTICAL", date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), size: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`, included: true }))]);
    setIsComplete(false);
    event.target.value = "";
    toast.success("Imagery added", { description: "Manage selected sources in Evidence." });
  };
  const runCase = () => {
    if (!question.trim()) {
      toast.error("Add a question first");
      return;
    }
    if (!selectedEvidence.length) {
      toast.error("Select at least one source", { description: "Open Evidence to include imagery in the case." });
      setView("evidence");
      return;
    }
    setIsRunning(true);
    setIsComplete(false);
    window.setTimeout(() => {
      const record = { id: uid(), scenarioId, query: question.trim(), result: scenario.result, createdAt: (/* @__PURE__ */ new Date()).toISOString(), evidenceCount: selectedEvidence.length };
      const next = [record, ...history].slice(0, 10);
      setHistory(next);
      window.localStorage.setItem("satquery-case-history", JSON.stringify(next));
      setIsRunning(false);
      setIsComplete(true);
      toast.success("Case ready", { description: "The local receipt is now in Case history." });
    }, 850);
  };
  const reset = () => {
    setQuestion(scenario.query);
    setIsComplete(false);
    setShowPath(false);
  };
  const toggleEvidence = (id) => {
    setEvidence((current) => current.map((item) => item.id === id ? { ...item, included: !item.included } : item));
    setIsComplete(false);
  };
  const removeEvidence = (id) => {
    setEvidence((current) => current.filter((item) => item.id !== id));
    setIsComplete(false);
  };
  const clearHistory = () => {
    setHistory([]);
    window.localStorage.removeItem("satquery-case-history");
    toast.info("Local case history cleared");
  };
  const reopen = (record) => {
    switchScenario(record.scenarioId);
    setQuestion(record.query);
    setIsComplete(true);
  };
  const download = () => {
    const data = { product: "SatQuery AI", mode: "Demo Mode \u2014 local data", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), scenario: scenario.label, question, verdict: isComplete ? scenario.verdict : "Case staged", finding: isComplete ? scenario.result : "No finding until the case is tested.", evidence: selectedEvidence.map(({ name, kind, date }) => ({ name, kind, date })), limitation: "Client-side walkthrough only. This is not real model inference." };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "satquery-case-receipt.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("JSON receipt downloaded");
  };
  const tabs = [{ id: "board", label: "Build a case", icon: ScanSearch }, { id: "evidence", label: "Evidence", icon: Layers3 }, { id: "history", label: "Case history", icon: History }, { id: "guide", label: "How it works", icon: BookOpen }];
  return <div className="prism-shell min-h-screen text-[#112557]">
    <header className="sticky top-0 z-30 border-b border-[#dfe7fb] bg-[#fbfcff]/95 px-5 backdrop-blur-xl md:px-8">
      <div className="mx-auto flex h-[68px] max-w-[1220px] items-center gap-6"><div className="flex items-center gap-2.5"><img src="/manus-storage/satquery-prism-mark_70ad8e52.png" alt="SatQuery mark" className="h-9 w-9" /><div><p className="font-display text-[17px] font-extrabold tracking-[-.05em]">SatQuery AI</p><p className="font-mono text-[8px] uppercase tracking-[.17em] text-[#7082aa]">Investigator mode</p></div></div><nav className="ml-2 hidden items-center gap-1 md:flex">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold transition ${view === id ? "bg-[#eeeaff] text-[#4134a6]" : "text-[#6b80aa] hover:bg-[#f0f4ff] hover:text-[#30497f]"}`}><Icon size={15} />{label}{id === "history" && history.length > 0 && <span className="rounded-full bg-[#d9f99a] px-1.5 py-0.5 font-mono text-[8px] text-[#3a5e18]">{history.length}</span>}</button>)}</nav><div className="ml-auto mode-badge"><span className="h-2 w-2 rounded-full bg-[#ff6c5c]" /> Demo mode</div></div>
      <nav className="-mx-5 flex overflow-x-auto border-t border-[#edf1fb] px-5 md:hidden">{tabs.map(({ id, label }) => <button key={id} onClick={() => setView(id)} className={`flex-none px-3 py-2.5 text-[11px] font-bold ${view === id ? "border-b-2 border-[#5145d8] text-[#4034a4]" : "text-[#7589ae]"}`}>{label}</button>)}</nav>
    </header>
    <main className="mx-auto max-w-[1220px] px-5 pb-16 pt-10 md:px-8">
      {view === "board" && <Board scenario={scenario} scenarioId={scenarioId} question={question} setQuestion={setQuestion} evidence={selectedEvidence} isRunning={isRunning} isComplete={isComplete} showPath={showPath} setShowPath={setShowPath} onScenario={switchScenario} onUpload={upload} onEvidence={() => setView("evidence")} onRun={runCase} onReset={reset} onReceipt={() => setShowReceipt(true)} />}
      {view === "evidence" && <EvidenceView evidence={evidence} selectedCount={selectedEvidence.length} onUpload={upload} onToggle={toggleEvidence} onRemove={removeEvidence} onBack={() => setView("board")} />}
      {view === "history" && <HistoryView history={history} onBack={() => setView("board")} onClear={clearHistory} onReopen={reopen} />}
      {view === "guide" && <GuideView onBack={() => setView("board")} />}
    </main>
    {showReceipt && <Receipt scenario={scenario} question={question} evidence={selectedEvidence} complete={isComplete} onClose={() => setShowReceipt(false)} onDownload={download} />}
  </div>;
}
function Board({ scenario, scenarioId, question, setQuestion, evidence, isRunning, isComplete, showPath, setShowPath, onScenario, onUpload, onEvidence, onRun, onReset, onReceipt }) {
  return <>
    <section className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow text-[#5145d8]">Investigator mode / Demo</p><h1 className="mt-4 max-w-[720px] font-editorial text-[clamp(3.25rem,7vw,6.2rem)] leading-[.86] tracking-[-.07em] text-[#10245a]">Build the case. <em className="text-[#5145d8]">One step</em> at a time.</h1><p className="mt-5 max-w-[590px] text-[15px] leading-7 text-[#5a709c]">Ask a question, choose the imagery that matters, and test one clear evidence case. Everything else stays out of your way.</p></div><div className="hidden border-l-4 border-[#b7f23a] bg-[#f4ffd9] px-5 py-4 text-right md:block"><p className="eyebrow text-[#597935]">Active route</p><p className="mt-2 font-editorial text-2xl tracking-[-.06em] text-[#274519]">{scenario.short}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.08em] text-[#6d8748]">{evidence.length} source{evidence.length === 1 ? "" : "s"} selected</p></div></section>
    <section className="mt-9 grid overflow-hidden border-t-4 border-[#5145d8] bg-[#dfe7fb] sm:grid-cols-3"><ProgressStep number="01" title="Ask" text="Write the question" ready /><ProgressStep number="02" title="Choose" text="Select evidence" ready={evidence.length > 0} /><ProgressStep number="03" title="Test" text="Review the case" ready={isComplete} /></section>
    <section className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><article className="border-t-5 border-[#5145d8] bg-white/85 p-6 shadow-[0_15px_35px_rgba(54,83,146,.08)]"><SectionTitle number="01" label="Ask the question" title="Start with a clear, simple brief." /><div className="mt-6 flex flex-wrap gap-2">{Object.keys(scenarios).map((id) => <button key={id} onClick={() => onScenario(id)} className={`border px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[.08em] transition ${scenarioId === id ? "border-[#5145d8] bg-[#5145d8] text-white" : "border-[#dfe6fa] bg-[#f9fbff] text-[#7184aa] hover:border-[#aebdf0]"}`}>{scenarios[id].short}</button>)}</div><textarea value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-4 min-h-[118px] w-full resize-none border border-[#dbe4fa] bg-[#f9fbff] p-4 text-[17px] font-bold leading-7 text-[#18366e] outline-none transition focus:border-[#5145d8] focus:bg-white" placeholder="What do you want to know about this place?" /></article>
      <article className="border-t-5 border-[#1179ff] bg-[#f5faff] p-6 shadow-[0_15px_35px_rgba(54,83,146,.08)]"><SectionTitle number="02" label="Choose evidence" title="Keep only what supports the question." tone="blue" /><div className="mt-6 space-y-2">{evidence.length ? evidence.slice(0, 3).map((file) => <CompactEvidence key={file.id} item={file} />) : <p className="bg-white/75 p-3 text-sm text-[#7084ac]">No source selected yet.</p>}</div><div className="mt-5 flex flex-wrap gap-3"><label className="inline-flex items-center gap-2 border border-dashed border-[#8eb6ec] bg-[#edf6ff] px-3 py-2 text-[9px] font-bold uppercase tracking-[.07em] text-[#216fc6]"><Plus size={15} /> Add imagery<input className="hidden" type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" onChange={onUpload} /></label><button onClick={onEvidence} className="quiet-action"><Layers3 size={15} /> Manage evidence</button></div></article></section>
    <section className="mt-6 grid overflow-hidden border-t-[6px] border-[#1179ff] bg-white shadow-[0_24px_50px_rgba(33,75,151,.15)] lg:grid-cols-[.85fr_1.15fr]"><div className="relative z-10 bg-[linear-gradient(135deg,#f9fbff,#f0f6ff)] p-7 md:p-9"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eee3ff] font-mono text-[9px] font-bold text-[#7846d7]">03</span><p className="eyebrow text-[#3562aa]">Test the case</p></div><h2 className="mt-5 font-editorial text-[clamp(2.4rem,4vw,4rem)] leading-[.92] tracking-[-.06em] text-[#10245a]">{scenario.title}</h2><p className="mt-4 max-w-[465px] text-sm leading-6 text-[#526b99]">{scenario.summary}</p><div className="mt-8 flex flex-wrap items-center gap-4"><button onClick={onRun} disabled={isRunning} className="primary-button">{isRunning ? <Orbit size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}{isRunning ? "Testing the case" : "Test this case"}</button>{isComplete && <button onClick={onReceipt} className="inline-flex items-center gap-2 text-sm font-bold text-[#5145d8] hover:text-[#2f237f]"><FileText size={15} /> View receipt</button>}</div></div><div className="relative min-h-[330px] overflow-hidden"><img src="/manus-storage/satquery-prism-hero_fa3e1001.jpg" alt="Satellite view of the delta test area" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(23,69,139,.1),transparent_65%)]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] bg-[size:42px_42px]" /><div className="absolute right-[14%] top-[17%] h-48 w-48 rounded-full border-[28px] border-[#b7f23a]/65 shadow-[0_0_0_18px_rgba(120,70,215,.15),0_0_0_42px_rgba(255,255,255,.1)]" /><span className="absolute right-4 top-4 bg-[#122a5b]/85 px-2 py-1.5 font-mono text-[8px] font-bold tracking-[.12em] text-[#dfff95]">ACTIVE OBSERVATION</span><div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 px-3 py-2 font-mono text-[10px] text-[#21407a]"><MapPin size={14} /> Delta test area</div><div className="absolute bottom-4 right-4 flex gap-1.5"><span className="bg-white/90 px-2 py-1.5 font-mono text-[8px] font-bold tracking-[.08em] text-[#2860a7]">OPTICAL</span>{scenarioId === "fusion" && <span className="bg-white/90 px-2 py-1.5 font-mono text-[8px] font-bold tracking-[.08em] text-[#7143c5]">SAR</span>}</div></div></section>
    <section className={`mt-6 flex flex-col justify-between gap-5 border-l-4 p-6 sm:flex-row sm:items-end ${isComplete ? "border-[#b7f23a] bg-[#f3ffd5]" : "border-[#f4b900] bg-[#fffbea]"}`}><div><p className={`eyebrow ${isComplete ? "text-[#597935]" : "text-[#8d712b]"}`}>{isComplete ? "Case result" : "What happens next"}</p><h2 className={`mt-2 font-editorial text-3xl leading-none tracking-[-.06em] ${isComplete ? "text-[#31541a]" : "text-[#614b12]"}`}>{isComplete ? scenario.verdict : "A clearer path, not more information."}</h2><p className={`mt-3 max-w-[700px] text-sm leading-6 ${isComplete ? "text-[#4c7029]" : "text-[#806c36]"}`}>{isComplete ? scenario.result : "Testing creates one concise finding, one caveat, and one next-best action. Demo Mode never presents the local walkthrough as real inference."}</p></div>{isComplete && <div className="flex shrink-0 items-center gap-4"><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.07em] text-[#52762c]"><Check size={14} /> Ready</span><button onClick={onReset} className="text-sm font-bold text-[#52762c] underline underline-offset-4">Start again</button></div>}</section>
    <section className="mt-5 border-t border-[#dfe7fb]"><button onClick={() => setShowPath(!showPath)} className="flex w-full items-center justify-between py-4 text-sm font-bold text-[#536c9b]"><span className="inline-flex items-center gap-2"><ShieldCheck size={17} /> Show the evidence path</span><ChevronDown size={17} className={showPath ? "rotate-180 transition" : "transition"} /></button>{showPath && <div className="grid bg-[#e1e9fb] sm:grid-cols-4">{[["Brief", "Question captured", true], ["Sources", `${evidence.length} selected`, evidence.length > 0], ["Route", scenario.task, true], ["Receipt", isComplete ? "Saved locally" : "Ready after test", isComplete]].map(([label, detail, ready]) => <div key={String(label)} className="min-h-[92px] bg-white/75 p-4"><span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[9px] ${ready ? "bg-[#dcfaa4] text-[#40651e]" : "bg-[#eff3ff] text-[#7f91b4]"}`}>{ready ? <Check size={13} /> : "\xB7"}</span><strong className="mt-2 block text-xs text-[#426092]">{label}</strong><small className="mt-1 block font-mono text-[8px] text-[#7b8eaf]">{detail}</small></div>)}</div>}</section>
  </>;
}
function EvidenceView({ evidence, selectedCount, onUpload, onToggle, onRemove, onBack }) {
  return <section><ViewHeader eyebrow="Evidence / 02" title="Choose the evidence." detail="Only included sources travel into the active case." action={<label className="secondary-button"><Upload size={15} /> Add imagery<input className="hidden" type="file" multiple accept=".tif,.tiff,.png,.jpg,.jpeg" onChange={onUpload} /></label>} /><div className="mt-8 flex items-center justify-between border-t-4 border-[#5145d8] bg-white/85 px-5 py-4 text-sm text-[#657ca8]"><span><strong className="font-editorial text-2xl text-[#26447c]">{selectedCount}</strong> selected for this case</span><button onClick={onBack} className="quiet-action"><ArrowLeft size={15} /> Back to case</button></div><div className="mt-3 space-y-2">{evidence.map((item) => <article key={item.id} className={`flex flex-wrap items-center gap-3 border-l-4 p-4 ${item.included ? "border-[#1179ff] bg-[#f7fbff]" : "border-[#dbe6fb] bg-white/75"}`}><span className={`flex h-9 w-9 items-center justify-center ${item.kind === "SAR" ? "bg-[#eee5ff] text-[#7846d7]" : "bg-[#ddecff] text-[#1179ff]"}`}>{item.kind === "SAR" ? <Radar size={18} /> : <FileImage size={18} />}</span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-extrabold text-[#26447c]">{item.name}</h2><p className="mt-1 font-mono text-[9px] tracking-[.05em] text-[#7487af]">{item.kind} · {item.date} · {item.size}</p></div><button onClick={() => onToggle(item.id)} className={`include-toggle ${item.included ? "include-toggle-active" : ""}`}><Check size={14} /> {item.included ? "Included" : "Include"}</button><button onClick={() => onRemove(item.id)} className="remove-source" aria-label={`Remove ${item.name}`}><Trash2 size={16} /></button></article>)}</div></section>;
}
function HistoryView({ history, onBack, onClear, onReopen }) {
  return <section><ViewHeader eyebrow="Case history / 03" title="Past cases, kept simple." detail="Completed local demo cases remain in this browser until you clear them." action={history.length ? <button onClick={onClear} className="destructive-action"><Trash2 size={15} /> Clear history</button> : void 0} />{history.length ? <div className="mt-9 space-y-3">{history.map((record) => <article key={record.id} className="flex flex-col gap-4 border-l-4 border-[#5145d8] bg-white/80 p-5 sm:flex-row sm:items-center"><span className="h-3 w-3 shrink-0 rounded-full bg-[#b7f23a] shadow-[0_0_0_6px_rgba(183,242,58,.18)]" /><div className="min-w-0 flex-1"><p className="eyebrow text-[#5e76aa]">{scenarios[record.scenarioId].label} · {new Intl.DateTimeFormat(void 0, { dateStyle: "medium" }).format(new Date(record.createdAt))}</p><h2 className="mt-2 font-editorial text-2xl leading-tight tracking-[-.05em] text-[#243f78]">{record.query}</h2><p className="mt-2 text-sm leading-6 text-[#6279a4]">{record.result}</p></div><button onClick={() => onReopen(record)} className="secondary-button shrink-0"><ScanSearch size={15} /> Reopen</button></article>)}</div> : <EmptyState icon={History} title="No completed cases." detail="Test a case from the main workspace to save a local receipt here." action={<button onClick={onBack} className="secondary-button"><ScanSearch size={15} /> Build a case</button>} />}</section>;
}
function GuideView({ onBack }) {
  const items = [["01", "Ask", "Write the investigation question in plain language."], ["02", "Choose", "Select imagery that can support the question."], ["03", "Test", "Run one evidence case and reveal its limitation."], ["04", "Keep", "Save or download the local case receipt."]];
  return <section><ViewHeader eyebrow="How it works / 04" title="A small, visible workflow." detail="SatQuery keeps the reasoning route clear, so the team can explain each hand-off without a crowded technical screen." action={<button onClick={onBack} className="quiet-action"><ArrowLeft size={15} /> Back to case</button>} /><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map(([number, title, detail], index) => <article key={title} className={`border-t-4 bg-white/80 p-5 ${["border-[#1179ff]", "border-[#7846d7]", "border-[#b7f23a]", "border-[#ff7c70]"][index]}`}><span className="font-mono text-[10px] text-[#7890be]">{number}</span><h2 className="mt-7 font-editorial text-3xl tracking-[-.06em] text-[#234178]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6d82a9]">{detail}</p></article>)}</div><div className="mt-6 flex gap-3 border-l-4 border-[#b7f23a] bg-[#f5ffd9] p-5 text-sm leading-6 text-[#536e30]"><BookOpen size={18} className="mt-1 shrink-0" /><p><strong>Behind the screen:</strong> Java can validate imagery, select a task handler, call a model client, record the trace, and create a receipt. This Demo Mode shows the workflow without pretending to run a real model.</p></div></section>;
}
function ViewHeader({ eyebrow, title, detail, action }) {
  return <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow text-[#5145d8]">{eyebrow}</p><h1 className="mt-4 max-w-[700px] font-editorial text-[clamp(3.1rem,6vw,5.6rem)] leading-[.88] tracking-[-.07em] text-[#10245a]">{title}</h1><p className="mt-5 max-w-[590px] text-[15px] leading-7 text-[#5b719d]">{detail}</p></div>{action}</header>;
}
function ProgressStep({ number, title, text, ready = false }) {
  return <div className="relative grid min-h-[76px] grid-cols-[30px_1fr] gap-x-3 bg-white/85 p-4"><span className={`row-span-2 flex h-7 w-7 items-center justify-center rounded-full font-mono text-[9px] ${ready ? "bg-[#d9f99a] text-[#365d13]" : "bg-[#edf2ff] text-[#8a9bbb]"}`}>{number}</span><strong className="text-sm text-[#34548d]">{title}</strong><small className="mt-1 font-mono text-[9px] text-[#8b9bbb]">{text}</small></div>;
}
function SectionTitle({ number, label, title, tone = "violet" }) {
  return <div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold ${tone === "blue" ? "bg-[#ddecff] text-[#1179ff]" : "bg-[#eeeaff] text-[#5145d8]"}`}>{number}</span><div><p className="eyebrow text-[#5372ac]">{label}</p><h2 className="mt-1 font-editorial text-[27px] leading-none tracking-[-.055em] text-[#193871]">{title}</h2></div></div>;
}
function CompactEvidence({ item }) {
  return <div className="flex items-center gap-3 bg-white/80 p-3"><span className={`flex h-8 w-8 items-center justify-center ${item.kind === "SAR" ? "bg-[#eee5ff] text-[#7846d7]" : "bg-[#ddecff] text-[#1179ff]"}`}>{item.kind === "SAR" ? <Radar size={15} /> : <FileImage size={15} />}</span><div className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#244477]">{item.name}</strong><small className="mt-1 block font-mono text-[8px] text-[#7084ad]">{item.kind} · {item.date}</small></div><Check size={15} className="text-[#4d791f]" /></div>;
}
function EmptyState({ icon: Icon, title, detail, action }) {
  return <div className="mt-9 flex min-h-[300px] flex-col items-center justify-center border border-dashed border-[#b5c7ed] bg-white/70 p-8 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eae7ff] text-[#5145d8]"><Icon size={25} /></span><h2 className="mt-5 font-editorial text-3xl tracking-[-.055em] text-[#1b3975]">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-[#6078a5]">{detail}</p><div className="mt-6">{action}</div></div>;
}
function Receipt({ scenario, question, evidence, complete, onClose, onDownload }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2b60]/35 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="receipt-modal w-full max-w-[720px]"><div className="receipt-header"><div><p className="eyebrow text-[#5e75a9]">Local case receipt</p><h3 className="mt-2 font-editorial text-3xl tracking-[-.055em] text-[#15316a]">{scenario.label}</h3></div><button className="header-button border border-[#dbe4fa] bg-white" onClick={onClose} aria-label="Close receipt"><X size={18} /></button></div><div className="grid gap-7 p-6 md:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><div><p className="eyebrow text-[#6279ab]">Question</p><p className="mt-2 text-[16px] font-semibold text-[#1d3973]">{question}</p></div><div><p className="eyebrow text-[#6279ab]">Finding</p><p className="mt-2 font-editorial text-3xl leading-9 tracking-[-.05em] text-[#203d79]">{complete ? scenario.result : "Test the case to reveal the local walkthrough finding."}</p></div><div className="border-l-4 border-[#ff7c70] bg-[#fff7f5] px-4 py-3 text-sm leading-6 text-[#8c514c]">Demo Mode is a client-side workflow demonstration, not real inference or measured model performance.</div></div><div className="receipt-side"><p className="eyebrow text-[#677caf]">At a glance</p><div className="mt-5 space-y-4 text-sm"><ReceiptLine label="Task" value={scenario.task} /><ReceiptLine label="Sources" value={`${evidence.length} selected`} /><ReceiptLine label="Status" value={complete ? "receipt ready" : "case staged"} /></div><button onClick={onDownload} className="secondary-button mt-7 w-full justify-center"><Download size={15} /> Download JSON</button></div></div></div></div>;
}
function ReceiptLine({ label, value }) {
  return <div className="flex justify-between gap-3"><span className="text-[#7083ac]">{label}</span><span className="font-mono text-[10px] text-[#28447e]">{value}</span></div>;
}
