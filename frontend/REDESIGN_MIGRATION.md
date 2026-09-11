# SatQuery AI — UI Redesign Migration Guide

## Overview

This redesign transforms SatQuery AI from a blue/navy "Prism Observatory" aesthetic to a **certified government instrument** design with graphite backgrounds and amber accents.

## What Changed

### 1. ✅ Color System (COMPLETE)

**Removed:**
- All navy/blue tokens (#112557, #1179ff, #edf5ff, #7846d7)
- Prism color names (optical-blue, sar-violet, lime, coral)
- Cool grey backgrounds

**Added:**
- Graphite backgrounds (#0c0c0e to #1a1a1c range)
- Amber accent (#e8a33d primary, #ffb84d live states)
- Desaturated red (#c4453d for anomalies only)
- Warm greys for inactive states (#5c5138 family)
- Warm off-white text (#f2ece2 headings, #c4baa8 body)

### 2. ✅ Typography System (COMPLETE)

**Defined roles:**
- **Serif (Georgia)**: Official content, page titles, seal text, report headings
- **Monospace (IBM Plex Mono)**: Data elements, IDs, timestamps, coordinates, confidence scores
- **Sans (Space Grotesk)**: UI elements, buttons, body copy, navigation

**Updated in:**
- `index.css` — CSS custom properties
- `button.jsx` — Font weight changed to `font-bold`
- `card.jsx` — CardTitle now uses `font-serif`

### 3. ✅ New Components (COMPLETE)

Created three new signature components:

#### `CertifiedSeal.jsx`
- Non-negotiable seal for every AI answer
- Three variants: default, compact, inline
- Abstract geometric mark (NOT government emblem)
- Shows: Reference ID, Model, Confidence, Sensor, Traced/Auditable status

#### `InstrumentCluster.jsx`
- Live, functioning instrument panel (not static image)
- Real UTC clock (updates every second)
- "Analyses sealed" counter
- "SYSTEM LIVE" indicator with pulsing amber dot
- Two variants: hero (full), header (compact)
- Background oversized reference ID typography

#### `ScanReveal.jsx`
- Amber scan-line animation across imagery
- Reveals overlays as scan passes (bounding boxes, diff masks, fusion blends)
- Prefers-reduced-motion fallback
- Motivated by radar/SAR domain practice

### 4. ✅ Updated Base Components (COMPLETE)

#### `index.css`
- Complete color system overhaul
- New CSS custom properties for graphite/amber palette
- Typography CSS variables (serif, mono, sans)
- Updated all component styles:
  - `.prism-shell`, `.prism-nav`, `.mode-badge`
  - `.investigation-plane` variants
  - `.evidence-ticket` variants
  - `.trace-board` and trace steps
  - `.instrument-cluster` and `.certified-seal` classes
  - `.scan-reveal-container` and animation keyframes
- Added `.live-pulse` animation
- Added `.background-ref-id` for oversized typography
- Removed all blue/navy references

#### `button.jsx`
- Updated all variants to use graphite/amber colors
- Changed font-weight to `font-bold` (700)
- Changed border-radius to `rounded` (4px, not 8px)
- Updated hover states to amber
- Added `-translate-y-0.5` hover lift
- Updated focus-visible outline to amber
- Changed disabled opacity to 0.4

#### `card.jsx`
- Background changed to `#1a1a1c`
- Text color `#f2ece2`
- Border `#2a2a2d`
- Border-radius changed to `rounded` (4px)
- Removed shadow
- CardTitle uses `font-serif`
- CardDescription text color `#8a7f6d`

### 5. ✅ Design Documentation (COMPLETE)

#### `DESIGN_SYSTEM.md`
Complete design system documentation including:
- Color rationale (citable MIL-STD-1472 reference)
- Typography system
- Component usage guidelines
- Certified Analysis Seal spec
- Live Instrument Cluster spec
- Scan-Reveal interaction spec
- Anti-AI-slop checklist
- Accessibility requirements
- Implementation priority checklist

---

## What Still Needs Updating

### 6. ⏳ Home.jsx Page Component

**Current state:** Still using old blue/navy color classes

**Required changes:**
1. Replace all color classes:
   - `bg-[#112557]` → `bg-[#1a1a1c]` or appropriate graphite shade
   - `text-[#1179ff]` → `text-[#e8a33d]` or `text-[#ffb84d]`
   - `border-[#dfe7fb]` → `border-[#2a2a2d]`
   - `bg-white` → `bg-[#1a1a1c]`
   - Any remaining blue references

2. Integrate new components:
   - Add `<InstrumentCluster />` to hero section
   - Add `<CertifiedSeal />` to every result card
   - Wrap result imagery in `<ScanReveal />` when analysis completes
   - Update mode badge styling

3. Update typography classes:
   - Page titles should use `font-serif`
   - Data values should use `font-mono`
   - UI elements use `font-sans` (default)

4. Remove old "Prism Observatory" specific styles:
   - `.orbital-halo` decorative elements
   - Blue gradient backgrounds
   - Any remaining navy/blue accent colors

### 7. ⏳ Other UI Components

Check and update remaining Radix UI components in `components/ui/`:
- `input.jsx` — update border/background colors
- `dialog.jsx` — update modal backgrounds
- `badge.jsx` — create amber/neutral/alert variants
- `progress.jsx` — update bar color to amber
- `tabs.jsx` — update active tab styling
- `alert.jsx` — update to use red-anomaly for destructive

### 8. ⏳ Anti-AI-Slop Checklist Pass

Review entire application against checklist:
- [ ] No gradient blobs or glowing orbs
- [ ] No glassmorphism cards
- [ ] No emoji icons
- [ ] Varied card visual weights
- [ ] No generic hero layout
- [ ] No symmetric feature grids
- [ ] No soft drop shadows for depth
- [ ] Concrete, specific copy
- [ ] Deliberate layout asymmetries
- [ ] Intentional spacing variations

### 9. ⏳ Accessibility Pass

- [ ] Verify all amber-on-graphite contrast ratios (WCAG AA)
- [ ] Test keyboard navigation and focus states
- [ ] Verify prefers-reduced-motion works for animations
- [ ] Test with screen readers
- [ ] Verify all interactive elements have proper ARIA labels

---

## Testing Checklist

### Visual Regression
- [ ] Homepage hero with instrument cluster
- [ ] Dashboard with multiple result cards (all have seals)
- [ ] Analysis results with scan-reveal animation
- [ ] Query history list (compact seals)
- [ ] Demo mode indicator
- [ ] System live/offline states

### Functional Testing
- [ ] UTC clock updates every second
- [ ] Analysis counter increments
- [ ] System live indicator pulses when online
- [ ] Scan-reveal animation triggers on result complete
- [ ] Prefers-reduced-motion disables animations
- [ ] Keyboard navigation works
- [ ] Focus states visible

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsiveness

---

## Implementation Steps

### Step 1: Update Home.jsx (Priority 1)
```bash
# Find and replace color tokens in Home.jsx
# Integrate CertifiedSeal, InstrumentCluster, ScanReveal
# Test in development mode
```

### Step 2: Update Remaining UI Components (Priority 2)
```bash
# Update input, dialog, badge, progress, tabs, alert components
# Test in both demo and backend modes
```

### Step 3: Anti-AI-Slop Pass (Priority 3)
```bash
# Review all pages against checklist
# Remove any generic patterns
# Add deliberate asymmetries where appropriate
```

### Step 4: Accessibility Pass (Priority 4)
```bash
# Run axe DevTools
# Test keyboard navigation
# Verify reduced-motion preferences
# Manual screen reader testing
```

### Step 5: Final Polish (Priority 5)
```bash
# Performance optimization
# Animation timing refinement
# Final visual QA
# Prepare for SIH demo
```

---

## Rollback Plan

If issues arise, the old Prism Observatory system is preserved in git history. To rollback:

```bash
git log --oneline | grep "Prism Observatory"
git checkout <commit-hash> -- frontend/client/src/index.css
```

---

## Questions or Issues?

Refer to:
- `DESIGN_SYSTEM.md` for design rationale and component specs
- Component JSDoc comments for usage examples
- MIL-STD-1472 for color choice justification
