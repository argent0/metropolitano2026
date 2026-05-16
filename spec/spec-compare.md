**Feature Specification: Multi-Couple Radar Overlay + Side-by-Side View**

**Version**: 1.1 (for implementation in the single-file `index.html` app)  
**Target**: Extend the existing radar chart (`renderRadar()`) to support comparing **2–4 couples** at once.  
**Two modes**:
- **Overlay mode** (default for multi-select): Multiple couple radars overlaid on a **single Chart.js radar chart** (easy visual comparison).
- **Side-by-side / Tabs mode**: Up to 4 separate radar charts displayed in a responsive grid or tabbed interface.

This keeps the current single-couple experience untouched while adding a powerful new comparison workflow. All existing functionality (benchmarks, null handling, sharing, URL deep-linking, i18n, mobile-first) must continue to work.

### 1. User Stories
- As a coach/fan, I want to **select 2–4 couples** from the current category and **compare them visually** on one radar (overlay) or side-by-side.
- As a user, I want an **obvious entry point** from the current couple view (e.g., “Compare” button).
- As a user, I want to **switch between Overlay and Side-by-Side** instantly.
- As a user, I want the comparison to **respect my current benchmark** (mean/min/max) and `showNullsAsZero` setting.
- As a user, I want the comparison to be **shareable** via deep link and PNG export (like the current single view).
- As a user, I want to **remove a couple** from the comparison easily.

### 2. UI / UX Changes

#### New UI Elements (add to `#content-radar`)
1. **Compare Button** (next to “Change Couple”)
   - Text: `Compare` / `Comparar` (use existing `TRANSLATIONS`)
   - Appears only when a single couple is selected.
   - Opens the multi-select modal (re-use/extend `#modal-overlay`).

2. **Multi-Couple Selection Modal** (extend existing couple selector)
   - Title: “Select couples to compare (2–4)” 
   - Searchable list of all couples in current category (same as current modal).
   - Each row: checkbox + couple number + names + PROMEDIO badge.
   - Max 4 selections enforced (disable further checkboxes).
   - Footer buttons: “Clear”, “Confirm”, “Cancel”.
   - Pre-select the current couple automatically.

3. **Active Comparison Bar** (sticky, appears when ≥2 couples selected)
   - Shows selected couples as **pills/tags** with color dots + “Remove” × button.
   - Two toggle buttons: **Overlay** (default) vs **Side-by-Side**.
   - “Exit comparison” button (returns to single-couple view).

4. **Radar Area Changes**
   - **Overlay mode**:
     - Single `<canvas id="radar-chart">` (existing).
     - Multiple datasets (one per couple + optional benchmark line).
   - **Side-by-Side mode**:
     - Container `#multi-radar-grid` (CSS Grid, 1×2 on mobile → 2×2 on larger screens).
     - Dynamically create 2–4 `<canvas>` elements (e.g., `radar-1`, `radar-2`…).
     - Each small radar shows only that couple + benchmark.

5. **Legend** (new, below radar in both modes)
   - Colored squares + couple names (clickable to highlight/remove).

6. **Responsive**:
   - Mobile: Overlay preferred (side-by-side collapses to vertical stack).
   - Use Tailwind classes already in the project (glassmorphism, neon glows).

### 3. State Management Updates (`state` object)
Add to the existing `state`:
```js
state = {
  ...currentState,
  comparisonMode: null,           // null | 'overlay' | 'side-by-side'
  selectedCouples: [],            // array of couple objects (max 4)
  // existing: couple, category, benchmark, showNullsAsZero, etc.
}
```

- When `selectedCouples.length >= 2`, the app is in “comparison mode”.
- `state.couple` remains the “primary” couple for backward compatibility and single-view fallback.

### 4. New / Modified Functions (all in the `<script>` block)

#### New functions
- `openMultiCompareModal()` – opens the selection modal with checkboxes.
- `addToComparison(couple)` / `removeFromComparison(coupleNumber)` – update `state.selectedCouples`.
- `renderComparison()` – main entry point:
  - If `comparisonMode === 'overlay'` → call `renderOverlayRadar()`
  - If `comparisonMode === 'side-by-side'` → call `renderSideBySideRadars()`
- `renderOverlayRadar()` – single Chart.js radar with multiple datasets.
- `renderSideBySideRadars()` – destroy old canvases, create new ones, render individual radars.
- `createRadarConfig(couples, isOverlay)` – helper that returns Chart.js options.
- `getCoupleColor(index)` – consistent neon palette (rose, cyan, violet, amber, etc.).
- `updateComparisonURL()` – extend existing `updateURL()` to support `?couples=131,142,155` (comma-separated Nº).

#### Modified functions
- `updateUI()` → call `renderComparison()` when in comparison mode, else current single logic.
- `renderRadar()` → rename to `renderSingleRadar()` or keep as-is and route through new logic.
- `shareView()` / `shareChart()` → detect comparison mode and export the correct canvas(es). For overlay: one PNG. For side-by-side: one combined image (use `html2canvas` or stitch canvases – keep dependency-free if possible).
- `loadFromURL()` → parse new `couples` param and restore comparison.
- `selectCoupleByNumber()` → if in comparison, maybe add to comparison instead of replacing.
- Cleanup: `destroyAllCharts()` helper (existing `radarChart.destroy()` needs extension for multiple instances).

### 5. Chart.js Implementation Details

#### Overlay Mode (single canvas)
```js
datasets: [
  // one per couple
  {
    label: couple.Nombres,
    data: getRadarData(couple),           // handle nulls
    borderColor: getCoupleColor(i),
    backgroundColor: getCoupleColor(i) + '33', // 20% opacity
    borderWidth: 3,
    pointRadius: 4,
    fill: true
  },
  // optional benchmark dataset (dashed line)
  {
    label: state.benchmark.toUpperCase(),
    data: getBenchmarkData(),
    borderColor: '#fbbf24',
    borderDash: [5,5],
    fill: false
  }
]
```
- Labels: same judge names.
- Scale: 0–10, same as current.
- Title: “Comparison – [Category]” + list of couples.

#### Side-by-Side Mode
- Each small radar uses the **single-couple config** (reuse logic).
- Smaller font size, no fill, simpler legend.

**Performance**: Chart.js handles 4 datasets easily. Destroy previous instances before re-creating.

### 6. Data Handling
- No JSON changes needed.
- Reuse `computeBenchmarks(catName)` – it already computes per-judge stats across the whole category.
- `getRadarData(couple)`: existing null handling (`showNullsAsZero`).
- Judges order: consistent across all radars (use `Object.keys(firstCouple.scores)`).

### 7. Deep Linking & Sharing
- URL format: `?cat=SEMIFINAL%20VALS&couples=131,142` (or `&n=131` for single backward compat).
- When loading with multiple couples → automatically enter comparison + overlay mode.
- Sharing PNG: for overlay → single canvas; for side-by-side → either one screenshot of the whole grid or individual downloads.

### 8. Edge Cases & Polish
- Minimum 2 couples, maximum 4 (enforce in UI).
- If a selected couple is from another category → ignore or warn.
- Null scores → consistent across all radars.
- Empty selection → gracefully fall back to single view.
- i18n: all new strings in `TRANSLATIONS`.
- Accessibility: ARIA labels on pills, keyboard selection in modal.
- Mobile: side-by-side stacks vertically; overlay stays primary.
- Dark theme / neon glows preserved (add subtle glow to multiple border lines).

### 9. Implementation Order (recommended for coding agent)
1. Extend `state` + add comparison bar HTML/CSS.
2. Multi-select modal + selection logic.
3. `renderOverlayRadar()` + Chart.js multi-dataset config.
4. Toggle between modes + `renderSideBySideRadars()`.
5. URL sync + deep linking.
6. Sharing + legend + polish.

### 10. Testing Checklist
- Select 2–4 couples → overlay works.
- Switch to side-by-side → 4 small radars render correctly.
- Change benchmark → updates all radars instantly.
- Deep link with multiple couples loads correctly.
- Share PNG includes all selected couples.
- Exit comparison → returns to previous single couple.
- Mobile view looks great.
- No regression on single-couple radar / histogram / table.
