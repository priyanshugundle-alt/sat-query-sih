# SatQuery AI — Integration Checklist

## Phase 1: Core Page Updates (Priority: CRITICAL)

### Home.jsx — Main Application Page

- [ ] **Color Replacements**
  - [ ] Replace all `#112557` (navy) → `#e8a33d` or `#1a1a1c`
  - [ ] Replace all `#1179ff` (blue) → `#ffb84d` or `#e8a33d`
  - [ ] Replace all `#edf5ff` (light blue bg) → `#2a2a2d`
  - [ ] Replace all `#ffffff` (white bg) → `#1a1a1c`
  - [ ] Replace all `#dfe7fb` (blue border) → `#2a2a2d`
  - [ ] Replace all `bg-white` → `bg-[#1a1a1c]`
  - [ ] Remove any `.orbital-halo` decorative elements
  - [ ] Remove `.prism-shell` blue gradient backgrounds

- [ ] **Typography Updates**
  - [ ] Page titles: add `font-serif` class
  - [ ] Data values (IDs, timestamps, coordinates): add `font-mono` class
  - [ ] Confidence scores: use `font-mono`
  - [ ] Sensor names: use `font-mono`

- [ ] **Component Integration**
  ```jsx
  // 1. Add imports at top
  import { CertifiedSeal } from "@/components/CertifiedSeal";
  import { InstrumentCluster } from "@/components/InstrumentCluster";
  import { ScanReveal } from "@/components/ScanReveal";
  
  // 2. Replace hero section static content with:
  <InstrumentCluster 
    analysisCount={history.length}
    isSystemLive={jvmHealth === "JVM CONNECTED"}
    isDemoMode={isDemoMode}
    variant="hero"
  />
  
  // 3. Add to header nav area:
  <InstrumentCluster 
    analysisCount={history.length}
    isSystemLive={!isDemoMode}
    isDemoMode={isDemoMode}
    variant="header"
  />
  
  // 4. Add seal to EVERY result card:
  {analysisResult && (
    <div className="flex gap-4">
      <CertifiedSeal 
        referenceId={`SQ-2026-${activeQueryId?.slice(-5) || '00000'}`}
        model={analysisResult.executionTrace?.modelUsed || "Qwen2-VL"}
        confidence={analysisResult.confidence || 88}
        sensor={activeStagedAssets[0]?.metadata?.sensorPlatform || "Sentinel-2"}
        variant="default"
      />
      <div className="flex-1">
        {/* result content */}
      </div>
    </div>
  )}
  
  // 5. Wrap result imagery in scan-reveal:
  <ScanReveal trigger={isComplete && analysisResult}>
    <img src={analysisResult?.resultImageUrl} alt="Analysis" />
  </ScanReveal>
  
  // 6. Add compact seal to history items:
  {history.map(item => (
    <div className="flex items-center gap-3">
      <CertifiedSeal 
        referenceId={item.id}
        model="UniRS"
        confidence={item.confidenceValue || 85}
        sensor="Satellite"
        variant="compact"
      />
      {/* history item content */}
    </div>
  ))}
  ```

- [ ] **Mode Badge Updates**
  ```jsx
  // Replace current mode badge with:
  <div className={`mode-badge ${isDemoMode ? 'mode-badge-demo' : 'mode-badge-live'}`}>
    <span className={`h-2 w-2 rounded-full ${isDemoMode ? 'bg-[#9a8f7a]' : 'bg-[#ffb84d] live-pulse'}`} />
    <span>{isDemoMode ? 'DEMO MODE' : 'SYSTEM LIVE'}</span>
  </div>
  ```

- [ ] **Headline Copy Review**
  - [ ] Remove any vague marketing adjectives ("cutting-edge", "seamless", "powerful")
  - [ ] Replace with concrete, specific copy:
    - ✅ "Ask a question of any satellite image. Get a sealed answer."
    - ✅ "Every analysis is traced, sealed, and auditable."
    - ❌ "Cutting-edge AI-powered insights for your geospatial workflow"

---

## Phase 2: UI Component Library (Priority: HIGH)

### Input Components

- [ ] **input.jsx**
  ```jsx
  // Update classes:
  border-[#3a3a3e]
  bg-[#2a2a2d]
  text-[#c4baa8]
  focus:border-[#e8a33d]
  placeholder:text-[#8a7f6d]
  ```

- [ ] **textarea.jsx**
  - Same as input.jsx

- [ ] **select.jsx**
  - Update dropdown background to `#1a1a1c`
  - Update border to `#2a2a2d`
  - Update selected item to amber accent

### Feedback Components

- [ ] **alert.jsx**
  ```jsx
  // Update variants:
  default: border-[#3a3a3e] bg-[#2a2a2d] text-[#c4baa8]
  destructive: border-[#c4453d] bg-[rgba(196,69,61,0.1)] text-[#c4453d]
  ```

- [ ] **progress.jsx**
  ```jsx
  // Update bar color:
  bg-[#2a2a2d]  // track
  bg-[#e8a33d]  // progress bar
  ```

- [ ] **toast/sonner.jsx**
  - Update background to `#1a1a1c`
  - Update border to `#2a2a2d`
  - Success: use amber accent
  - Error: use `#c4453d`

### Navigation Components

- [ ] **tabs.jsx**
  ```jsx
  // Update active tab:
  border-b-[#e8a33d]
  text-[#f2ece2]
  // Inactive tabs:
  text-[#8a7f6d]
  hover:text-[#c4baa8]
  ```

- [ ] **navigation-menu.jsx**
  - Active item: amber accent
  - Hover states: graphite elevated

### Overlay Components

- [ ] **dialog.jsx**
  ```jsx
  // Update overlay and content:
  overlay: bg-[rgba(13,13,15,0.8)]
  content: bg-[#1a1a1c] border-[#2a2a2d]
  ```

- [ ] **popover.jsx**
  - Same as dialog.jsx

- [ ] **dropdown-menu.jsx**
  - Background: `#1a1a1c`
  - Border: `#2a2a2d`
  - Hover item: `#2a2a2d`

---

## Phase 3: Anti-AI-Slop Pass (Priority: MEDIUM)

### Visual Audit

- [ ] **No Gradient Blobs**
  - Search for: `radial-gradient`, `mesh-gradient`, `blur(`
  - Remove decorative blur effects
  - Keep only functional blur (backdrop filters for modals)

- [ ] **No Glassmorphism**
  - Search for: `backdrop-blur`, `backdrop-filter`
  - Remove from card backgrounds
  - Keep only for functional overlays

- [ ] **No Emoji Icons**
  - Search for: emoji characters in JSX
  - Replace all with Lucide icons or custom SVG

- [ ] **Varied Visual Weights**
  - Certified seal: Heavier border, distinct styling
  - Result cards: Medium weight
  - Settings panels: Lighter weight
  - NOT all cards with identical radius/shadow/padding

- [ ] **No Generic Hero Layout**
  - Remove: centered hero + two pill buttons + vague illustration
  - Replace with: instrument cluster + concrete headline + asymmetric layout

- [ ] **No Symmetric Feature Grids**
  - Remove: 3 or 6-column grid with icon + heading + generic sentence
  - Use varied layouts where appropriate

- [ ] **No Soft Drop Shadows for Depth**
  - Remove soft shadows
  - Use borders, dividers, and typographic weight instead

- [ ] **Concrete, Specific Copy**
  - Audit all copy for adjectives ("powerful", "seamless", "cutting-edge")
  - Replace with real numbers, sensor names, coordinates
  - Example: "Sentinel-2 MSI 10m GSD" instead of "high-resolution imagery"

- [ ] **Deliberate Asymmetries**
  - Add at least one asymmetric layout
  - Example: left-aligned hero with oversized ref ID breaking into margin
  - Not everything perfectly centered

- [ ] **Intentional Spacing Variations**
  - Add exceptions around seal and instrument cluster
  - Not robotically uniform spacing everywhere

---

## Phase 4: Accessibility Pass (Priority: MEDIUM)

### Contrast Testing

- [ ] **WCAG AA Compliance**
  - Test amber (#e8a33d) on graphite (#1a1a1c): Must be ≥4.5:1
  - Test live amber (#ffb84d) on graphite: Must be ≥4.5:1
  - Test body text (#c4baa8) on graphite: Must be ≥4.5:1
  - Test small mono text (#8a7f6d) in seal: Must be ≥4.5:1
  - Use: https://webaim.org/resources/contrastchecker/

### Keyboard Navigation

- [ ] **Focus States**
  - Tab through entire app
  - Verify all interactive elements have visible focus ring
  - Focus ring should be: `outline: 2px solid rgba(255, 184, 77, 0.5)`
  - Test: buttons, inputs, tabs, nav items, cards (if clickable)

- [ ] **Focus Order**
  - Verify logical tab order
  - No focus traps
  - Skip links where appropriate

### Screen Reader Testing

- [ ] **ARIA Labels**
  - All icon-only buttons have `aria-label`
  - Images have descriptive `alt` text
  - Live regions for dynamic content (clock, counter)

- [ ] **Semantic HTML**
  - Headings hierarchy is correct (h1 → h2 → h3)
  - Lists use `<ul>` or `<ol>`
  - Buttons are `<button>`, not `<div onClick>`

### Reduced Motion

- [ ] **Animation Fallbacks**
  - Verify `prefers-reduced-motion` works for:
    - Scan-reveal animation
    - Live pulse animation
    - Instrument cluster transitions
    - Card entrance animations

- [ ] **Test Command**
  ```
  // In DevTools, emulate prefers-reduced-motion
  // Or in macOS: System Preferences → Accessibility → Display → Reduce motion
  ```

---

## Phase 5: Testing & QA (Priority: MEDIUM)

### Visual Regression

- [ ] **Homepage**
  - Hero with instrument cluster renders correctly
  - Background ref ID visible but subtle
  - Headline copy is concrete and specific

- [ ] **Dashboard**
  - Multiple result cards each have certified seal
  - Seals are identical in appearance
  - Scan-reveal triggers on analysis complete

- [ ] **Query History**
  - Compact seals render correctly
  - History items are readable
  - Click to reload works

- [ ] **Demo Mode**
  - Mode badge shows "DEMO MODE" with muted styling
  - System live indicator is inactive (grey)
  - Mock analysis completes with seal

- [ ] **Backend Mode**
  - Mode badge shows "SYSTEM LIVE" with amber pulse
  - Real clock ticks every second
  - Counter increments from database

### Functional Testing

- [ ] **Instrument Cluster**
  - UTC clock updates every second (verify for 1 minute)
  - Clock shows correct UTC time (not local time)
  - Analysis counter increments correctly
  - System live indicator pulses when backend connected
  - Indicator is grey when backend offline

- [ ] **Certified Seal**
  - Appears on every analysis result (zero exceptions)
  - Reference ID format is correct: SQ-2026-#####
  - Model name matches actual model used
  - Confidence percentage is accurate
  - Sensor/source is correct

- [ ] **Scan-Reveal**
  - Animation triggers when analysis completes
  - Amber scan-line sweeps left to right
  - Overlay reveals progressively (not instant fade)
  - Duration feels appropriate (2 seconds default)
  - Reduced-motion fallback works

### Browser Testing

- [ ] **Chrome/Edge** (v120+)
  - All features work
  - Fonts load correctly
  - Animations smooth

- [ ] **Firefox** (v120+)
  - All features work
  - CSS custom properties work
  - Backdrop filters work

- [ ] **Safari** (v16+)
  - Webkit prefixes if needed
  - Fonts load correctly
  - Animations work

- [ ] **Mobile Responsive**
  - Instrument cluster adapts on mobile
  - Sealed cards stack correctly
  - Touch interactions work

---

## Phase 6: Performance & Polish (Priority: LOW)

### Performance

- [ ] **Font Loading**
  - Verify Space Grotesk loads (fallback to system-ui if fails)
  - Verify IBM Plex Mono loads
  - Verify Georgia loads (system font, should always work)
  - Add `font-display: swap` if custom fonts

- [ ] **Animation Performance**
  - Scan-reveal uses GPU-accelerated properties (transform, opacity)
  - No layout thrashing in clock update
  - Live pulse uses CSS animation (not JS)

- [ ] **Image Optimization**
  - Satellite images lazy load where appropriate
  - Preview thumbnails compressed
  - No unnecessary full-res loads

### Final Polish

- [ ] **Spacing Consistency**
  - Verify spacing scale is consistent (4px, 8px, 12px, 16px, 24px, etc.)
  - Intentional exceptions around seal and cluster

- [ ] **Border Consistency**
  - All borders use `#2a2a2d` or `#3a3a3e`
  - Border radius: 4px (sm) by default
  - No mix of rounded-md and rounded-lg randomly

- [ ] **Color Consistency**
  - No blue/navy anywhere
  - Amber only for live/active states
  - Red only for anomaly alerts
  - No other accent colors

---

## Final Verification

Before marking complete, verify:

- [ ] No console errors
- [ ] No accessibility warnings in axe DevTools
- [ ] All links in documentation are valid
- [ ] Git history is clean (meaningful commit messages)
- [ ] README updated if needed
- [ ] Team has been briefed on new design system
- [ ] SIH demo script updated to mention design rationale

---

## Support Resources

- `DESIGN_SYSTEM.md` — Complete design system spec
- `REDESIGN_MIGRATION.md` — Migration guide
- `QUICK_REFERENCE.md` — Color token find/replace
- `REDESIGN_SUMMARY.md` — Executive summary

## Questions?

If you encounter issues or need clarification:
1. Check component JSDoc comments
2. Review DESIGN_SYSTEM.md for rationale
3. Reference MIL-STD-1472 for color choice justification
4. Ask in team channel with specific example

---

**Target Completion:** Before SIH presentation

**Current Status:** Foundation complete, integration in progress
