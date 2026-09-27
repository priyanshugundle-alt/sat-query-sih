# SatQuery AI — Certified Government Instrument Design System

## Design Philosophy

SatQuery AI adopts a **"certified government instrument"** aesthetic — restrained, provenance-driven, and functional. This is NOT a generic AI dashboard. Every visual decision is deliberate and citable to domain standards.

---

## Color System

### Rationale (Critical for SIH Judges)

**Amber/phosphor accent (#e8a33d-#ffb84d)** is the sole "hot" color for live/active states. This follows **MIL-STD-1472 Human Engineering Design Criteria** used in defense and mission-control environments:

- Amber/red instrumentation preserves **night vision** better than blue light
- Reduces operator eye strain during extended observation
- Historically used in aircraft cockpits, submarine control rooms, and satellite ground stations

**Desaturated red (#c4453d)** is reserved **strictly** for anomaly callouts and alerts (e.g. "+18% built-up area detected").

### Color Palette

```css
/* Background */
--graphite-950: #0c0c0e  /* Primary background */
--graphite-900: #0d0d0f  /* Surface */
--graphite-800: #1a1a1c  /* Cards */
--graphite-700: #2a2a2d  /* Borders */

/* Accent Colors */
--amber-live: #ffb84d    /* Active/live states, primary buttons */
--amber-primary: #e8a33d /* Default accent */
--red-anomaly: #c4453d   /* Alerts only */

/* Neutral/Inactive */
--graphite-500: #5c5138  /* Warm grey for inactive states */
--graphite-400: #7a7460
--graphite-300: #9a8f7a

/* Typography */
--text-primary: #f2ece2  /* Warm off-white for headings */
--text-body: #c4baa8     /* Warm mid-grey for body */
--text-muted: #8a7f6d    /* De-emphasized text */
```

### What Was Removed

**All navy/blue tokens** from the previous "Prism Observatory" palette:
- No #112557 (navy)
- No #1179ff (blue accent)
- No #edf5ff (blue backgrounds)
- No #7846d7 (violet/purple)

---

## Typography System

### Font Stack

```css
--font-heading: "Righteous"        /* Display personality, titles, hero headers */
--font-sans: "Roboto"             /* UI elements, body copy, buttons, nav, forms */
--font-mono: "IBM Plex Mono"      /* Data: IDs, timestamps, coordinates, confidence */
```

### Usage Rules

- **Heading / Display (Righteous)**: Page titles, section headers, hero statements, navigation brand titles, key callouts
- **Sans / Body (Roboto)**: Body copy, buttons, form labels, descriptions, chat dialogs
- **Monospace (IBM Plex Mono)**: Reference IDs, timestamps, coordinates, confidence scores, sensor names, trace logs

---

## Certified Analysis Seal

### Purpose

A **non-negotiable signature element** that appears with every AI-generated answer. Provides:

- Reference ID (format: SQ-2026-#####)
- Model Used
- Confidence Score
- Sensor/Source
- "TRACED · AUDITABLE" status

### Visual Spec

- Thin 1px border box, ~130px wide
- Abstract geometric mark at top (circle with rotated square/diamond inside)
- **CRITICAL**: Do NOT use any official Indian government emblem, seal, or Ashoka Chakra
- Serif label ("VERIFIED ANALYSIS")
- Monospace metadata below divider line

### Required Placement

The seal MUST appear:

1. Every VQA/change-detection/fusion/grounding result card
2. Query history list (compact inline version)
3. Exported PDF report (same visual language)

**Nowhere should an answer appear without it.**

### Variants

```jsx
<CertifiedSeal 
  referenceId="SQ-2026-00412"
  model="Qwen2-VL"
  confidence={94}
  sensor="Sentinel-2 MSI"
  variant="default" // "default" | "compact" | "inline"
/>
```

---

## Live Instrument Cluster

### Purpose

A **functioning instrument panel**, not a static hero illustration. Shows:

- Real, ticking UTC clock (updates every second, actual Date object)
- "Analyses sealed" counter (real DB count or simulated increment)
- "SYSTEM LIVE" indicator with pulsing amber dot
- Oversized, low-opacity reference ID as background graphic

### Implementation

```jsx
<InstrumentCluster 
  analysisCount={412}
  isSystemLive={true}
  isDemoMode={false}
  variant="hero" // "hero" | "header"
/>
```

**Variants:**
- `hero`: Full cluster for landing page/dashboard top
- `header`: Compact version for persistent top nav

### Backend Integration

- System live indicator tied to actual backend connectivity detection
- Reuses existing `DEMO MODE` / `backend-offline` detection
- Counter increments from real DB queries where possible

---

## Scan-Reveal Interaction

### Motivation

When a result loads, sweep a thin **amber scan-line** across the satellite image from left to right. As it passes, reveal the analysis overlay (bounding box, diff highlight, fusion blend).

**Domain justification**: Radar/SAR sweep reveals hidden information in imagery.

### Implementation

```jsx
<ScanReveal trigger={isComplete} duration={2000}>
  <img src={satelliteImage} alt="Analysis" />
</ScanReveal>
```

### Technical Details

- Implemented as CSS `clip-path` or `mask` animation
- NOT a generic fade transition
- **Accessibility**: `prefers-reduced-motion` fallback (instant reveal, no sweep)

---

## Anti-AI-Slop Checklist

Before shipping, verify:

- [ ] No gradient blobs, mesh gradients, or glowing orbs
- [ ] No glassmorphism/frosted-blur cards as blanket style
- [ ] No emoji used as icons anywhere
- [ ] Cards have **varied visual weight** by importance (not identical radius/shadow/padding)
- [ ] No centered-hero + two-pill-buttons + vague-illustration layout
- [ ] No symmetric 3-or-6-column "feature card" grid with identical structure
- [ ] No soft drop-shadows to fake depth — use real rules and dividers
- [ ] All copy is **concrete and specific** (real numbers, sensor names, coordinates)
- [ ] At least one **deliberate layout asymmetry** exists
- [ ] Spacing isn't robotically uniform — intentional exceptions exist

---

## Accessibility Requirements

### Contrast Ratios

- Amber-on-graphite must meet **WCAG AA minimum**
- Test at actual size, especially for smaller monospace metadata text

### Keyboard Navigation

- Visible focus states on every interactive element
- Focus outline: 2px solid `rgba(255, 184, 77, 0.5)`

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .scan-line {
    animation: none;
    display: none;
  }
  .scan-reveal-overlay {
    animation: none;
    opacity: 1;
    clip-path: none;
  }
}
```

---

## Component Library Updates

### Buttons

```jsx
// Primary (amber)
<button className="primary-button">
  Analyze
</button>

// Secondary (neutral graphite)
<button className="secondary-button">
  Cancel
</button>
```

### Cards

```jsx
// Default investigation plane
<div className="investigation-plane plane-neutral">
  {content}
</div>

// Amber accent (active analysis)
<div className="investigation-plane plane-amber">
  {content}
</div>

// Alert (anomaly detected)
<div className="investigation-plane plane-alert">
  {content}
</div>
```

### Evidence Tickets

```jsx
<div className="evidence-ticket">
  <div className="evidence-ticket-icon">
    <Icon />
  </div>
  {content}
</div>

// Alert variant
<div className="evidence-ticket evidence-ticket-alert">
  ...
</div>

// Neutral variant
<div className="evidence-ticket evidence-ticket-neutral">
  ...
</div>
```

---

## Implementation Priority

1. ✅ Color system swap (graphite + amber, remove all navy/blue)
2. ✅ Certified Analysis Seal component
3. ✅ Live instrument cluster
4. ✅ Typography system (serif/mono/sans split)
5. ✅ Scan-reveal interaction
6. ⏳ Full anti-AI-slop checklist pass
7. ⏳ Accessibility and reduced-motion pass

---

## Citable References

- **MIL-STD-1472G**: Department of Defense Design Criteria Standard for Human Engineering
- **ANSI/HFES 100-2007**: Human Factors Engineering of Computer Workstations
- **NASA-STD-3000**: Man-Systems Integration Standards (display illumination guidelines)

These standards document why amber/red instrumentation is preferred over blue in high-stakes technical environments.
