# SatQuery AI — Live Demo Instructions

## 🎉 Frontend Server is RUNNING!

**Main URL:** http://localhost:5173/  
**Design Demo:** http://localhost:5173/design-demo

## What to See Now

### 1. Design System Demo Page (RECOMMENDED FIRST)

**URL:** http://localhost:5173/design-demo

This page showcases the **complete redesigned system** with:

✅ **Live Instrument Cluster**
- Real UTC clock (ticking every second)
- Analysis counter
- System live indicator with pulsing amber dot

✅ **Certified Analysis Seal**
- All three variants (default, compact, inline)
- Shows reference ID, model, confidence, sensor

✅ **Color System**
- Graphite backgrounds
- Amber accents
- Complete palette with rationale

✅ **Typography Hierarchy**
- Serif for official content
- Monospace for data
- Sans-serif for UI

✅ **Interactive Components**
- Buttons (all variants)
- Badges (6 variants)
- Cards with seals
- Evidence tickets
- Scan-reveal animation (click "Trigger Scan")

✅ **Design Rationale**
- MIL-STD-1472 citation
- Citable references
- Explanation for SIH judges

### 2. Main Application (Home Page)

**URL:** http://localhost:5173/

The main application is currently showing **mixed styling**:
- ⚠️ Old Prism Observatory blue/navy colors still present
- ✅ Base components (buttons, cards) using new graphite/amber
- ⏳ Needs integration from `INTEGRATION_CHECKLIST.md`

**This is expected!** The design system foundation is complete, but Home.jsx hasn't been updated yet.

## What Works Right Now

### In Design Demo Page (/design-demo):

✅ All colors are correct (graphite/amber)
✅ Typography system working
✅ All new components rendering
✅ Animations working (scan-reveal)
✅ Live clock updating every second
✅ Interactive demos functional

### In Base Components:

✅ `<Button>` — Amber primary, graphite secondary
✅ `<Card>` — Graphite backgrounds, serif titles
✅ `<Badge>` — 6 variants with proper colors
✅ `<CertifiedSeal>` — 3 variants ready
✅ `<InstrumentCluster>` — Live and functional
✅ `<ScanReveal>` — Animation working

## Testing Checklist

### Visual Tests (Design Demo Page)

- [ ] Open http://localhost:5173/design-demo
- [ ] Verify UTC clock is ticking (watch for 10 seconds)
- [ ] Check color palette displays correctly
- [ ] All three seal variants render
- [ ] Click "Trigger Scan" button — amber scan line animates
- [ ] Hover over buttons — they lift and change color
- [ ] All badges display with correct colors
- [ ] Cards show graphite backgrounds
- [ ] Evidence tickets have colored left borders
- [ ] Typography uses correct fonts (serif for titles, mono for IDs)

### Interaction Tests

- [ ] Buttons are clickable
- [ ] Scan animation can be triggered and reset
- [ ] Hover states work on all interactive elements
- [ ] Badge variants all visible
- [ ] Page scrolls smoothly

### Browser DevTools Checks

1. **Open DevTools → Elements → Computed**
   ```
   Check on body element:
   background-color: rgb(13, 13, 15) ✅ (should be graphite)
   color: rgb(242, 236, 226) ✅ (should be warm off-white)
   ```

2. **Console Check**
   ```javascript
   // Should have no errors
   // Clock should be updating via setInterval
   ```

3. **Network Tab**
   ```
   Fonts should load:
   - Space Grotesk (from CDN or local)
   - IBM Plex Mono (from CDN or local)
   - Georgia (system font, always available)
   ```

## What to Tell Team/Judges

### Key Points:

1. **Color choice is not arbitrary**
   - Follows MIL-STD-1472G (Department of Defense standard)
   - Amber preserves night vision vs blue
   - Used in aircraft cockpits and satellite ground stations

2. **Every analysis is sealed**
   - Non-negotiable certified seal on every result
   - Includes reference ID, model, confidence, sensor
   - Traceable and auditable

3. **Live instruments, not mockups**
   - Real UTC clock updates every second
   - Actual analysis counts from database
   - System live indicator shows real backend status

4. **Domain-motivated interactions**
   - Scan-reveal inspired by radar/SAR sweeps
   - Typography hierarchy for provenance
   - Accessible with reduced-motion fallback

## Next Steps for Full Integration

Follow the **INTEGRATION_CHECKLIST.md** to:

1. **Update Home.jsx** (Priority 1)
   - Replace blue colors with graphite/amber
   - Add CertifiedSeal to all result cards
   - Add InstrumentCluster to hero section
   - Wrap imagery in ScanReveal

2. **Update UI components** (Priority 2)
   - input.jsx, dialog.jsx, tabs.jsx, alert.jsx
   - Follow color token guide

3. **Anti-AI-slop pass** (Priority 3)
   - Remove gradient blobs
   - Add deliberate asymmetries
   - Ensure concrete copy

4. **Accessibility pass** (Priority 4)
   - Verify contrast ratios
   - Test keyboard navigation
   - Check reduced-motion

## Troubleshooting

### If Styles Don't Load:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check DevTools console for errors

### If Clock Doesn't Update:
1. Check browser console for JavaScript errors
2. Verify component is rendering (inspect element)
3. Check setInterval is running

### If Scan Animation Doesn't Work:
1. Click "Trigger Scan" button
2. Check if prefers-reduced-motion is enabled in OS
3. Try clicking "Reset" then "Trigger Scan" again

## Documentation Reference

All design documentation is complete:

- `DESIGN_SYSTEM.md` — Complete spec with rationale
- `REDESIGN_MIGRATION.md` — What changed
- `REDESIGN_SUMMARY.md` — Executive summary
- `INTEGRATION_CHECKLIST.md` — Step-by-step tasks
- `QUICK_REFERENCE.md` — Color token guide
- `RUNNING_STATUS.md` — Server status

## Screenshots for SIH

Take screenshots of:

1. Design demo page showing instrument cluster
2. Certified seal variants
3. Color system with MIL-STD rationale
4. Scan-reveal animation in progress
5. Evidence cards with colored borders

These demonstrate the thought put into the design system.

---

**Status:** ✅ Design system complete and running  
**Demo Page:** http://localhost:5173/design-demo  
**Ready For:** SIH presentation and Home.jsx integration
