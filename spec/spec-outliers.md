**FULL IMPLEMENTATION SPEC**  
**Feature: Statistical Extras + Outlier Highlighting on Radar Chart**  
**Project**: metropolitano2026 (single `index.html` + vanilla JS + Chart.js v4)  
**Target**: Low effort, zero new dependencies, high visual/analytical value  
**Scope**: Works for single-couple view, overlay comparison, and side-by-side comparison. All changes stay inside `index.html`.

### 1. Feature Goals
1. **Statistical Extras** (per couple)  
   - **Median** – middle value of the couple’s valid scores  
   - **Std Dev** – sample standard deviation (measure of judge agreement)  
   - **Consensus** – most frequent rounded score + how many judges gave it (e.g. “8.5 (3 judges)”)  

2. **Outlier Highlighting on Radar**  
   - Automatically detect and visually highlight any judge score that is a statistical outlier **relative to the judge’s category-wide distribution** (using z-score > 1.8).  
   - Outliers appear as larger gold points with a subtle glow on the couple’s radar line.

### 2. Data & Calculation Helpers (add these functions)

Insert the following pure helper functions **right after** the existing `computeBenchmarks()` function (search for `function computeBenchmarks`).

```js
/**
 * Returns array of non-null numeric scores for a couple
 */
function getValidScores(couple) {
  return Object.values(couple.scores).filter(s => s !== null && typeof s === 'number');
}

/**
 * Median of an array of numbers (handles even/odd length)
 */
function calculateMedian(numbers) {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Sample standard deviation (divide by n-1)
 */
function calculateStdDev(numbers) {
  if (numbers.length < 2) return null;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
  return Math.sqrt(variance);
}

/**
 * Consensus: most frequent score after rounding to nearest 0.5
 * Returns {value: number, count: number} or null
 */
function calculateConsensus(numbers) {
  if (numbers.length === 0) return null;
  const rounded = numbers.map(n => Math.round(n * 2) / 2); // round to 0.5
  const freq = {};
  rounded.forEach(r => freq[r] = (freq[r] || 0) + 1);
  let maxCount = 0;
  let modeValue = null;
  Object.keys(freq).forEach(key => {
    if (freq[key] > maxCount) {
      maxCount = freq[key];
      modeValue = parseFloat(key);
    }
  });
  return { value: modeValue, count: maxCount };
}

/**
 * Returns array of booleans (same length as judges) indicating outliers
 * Uses judge's benchmarks (mean + stdDev) + z-score threshold of 1.8
 */
function getOutlierFlags(couple, judges) {
  return judges.map(judge => {
    const score = couple.scores[judge];
    if (score === null || !state.benchmarks[judge] || !state.benchmarks[judge].stdDev) return false;
    const z = Math.abs(score - state.benchmarks[judge].mean) / state.benchmarks[judge].stdDev;
    return z > 1.8;
  });
}
```

### 3. Extend Benchmarks (modify existing function)

In `computeBenchmarks(category)` (or the function that builds `state.benchmarks`), after computing `mean`, `min`, `max`, `all`, **add**:

```js
state.benchmarks[judge] = {
  ...state.benchmarks[judge],           // keep existing mean/min/max/all
  median: calculateMedian(vals),
  stdDev: calculateStdDev(vals),
  consensus: calculateConsensus(vals)   // {value, count}
};
```

### 4. New UI: “Couple Statistics” Panel

**Location**: Inside the couple detail card, **right below the existing PROMEDIO line** (search for `PROMEDIO` in the HTML/JS that builds the header).

Add this HTML snippet (Tailwind classes to match current dark/tango-noir style):

```html
<div id="couple-stats" class="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
  <!-- populated by JS -->
</div>
```

**JS rendering** – create a new function `renderCoupleStats(couple)` and call it from `renderSingleView()` and from the multi-couple render functions.

```js
function renderCoupleStats(couple) {
  const valid = getValidScores(couple);
  const median = calculateMedian(valid);
  const stdDev = calculateStdDev(valid);
  const consensus = calculateConsensus(valid);

  const consistency = stdDev === null ? 'N/A' : 
    stdDev < 0.3 ? 'High' : stdDev < 0.6 ? 'Medium' : 'Low';

  const html = `
    <div class="bg-zinc-900/70 rounded-lg p-3">
      <div class="text-amber-400 text-xs">MEDIAN</div>
      <div class="text-2xl font-bold">${median ? median.toFixed(2) : '—'}</div>
    </div>
    <div class="bg-zinc-900/70 rounded-lg p-3">
      <div class="text-amber-400 text-xs">STD DEV</div>
      <div class="text-2xl font-bold">${stdDev ? stdDev.toFixed(2) : '—'}</div>
      <div class="text-xs text-zinc-400">Consistency: <span class="font-medium">${consistency}</span></div>
    </div>
    <div class="bg-zinc-900/70 rounded-lg p-3">
      <div class="text-amber-400 text-xs">CONSENSUS</div>
      <div class="text-2xl font-bold">${consensus ? `${consensus.value} <span class="text-base font-normal">(${consensus.count})</span>` : '—'}</div>
    </div>
  `;

  document.getElementById('couple-stats').innerHTML = html;
}
```

For multi-couple views, render a small version under each individual radar.

### 5. Outlier Highlighting – Radar Chart Updates

Modify **all three radar rendering functions** (`renderRadar`, `renderOverlayRadar`, `renderSideBySideRadars`):

When building the dataset for **any couple**, add dynamic point styling:

```js
const judges = Object.keys(state.couple.scores); // or the current judges array
const outlierFlags = getOutlierFlags(couple, judges);

const coupleDataset = {
  label: couple.Nombres,
  data: getRadarData(couple),
  borderColor: '#e11d48',           // keep existing rose color
  backgroundColor: 'rgba(225, 29, 72, 0.15)',
  pointBackgroundColor: judges.map((_, i) => outlierFlags[i] ? '#f59e0b' : '#e11d48'),
  pointBorderColor: '#fff',
  pointRadius: judges.map((_, i) => outlierFlags[i] ? 7 : 4),
  pointHoverRadius: judges.map((_, i) => outlierFlags[i] ? 9 : 6),
  pointBorderWidth: 2,
  // optional glow effect via shadow (Chart.js supports it)
  pointShadowColor: outlierFlags.map(f => f ? 'rgba(245, 158, 11, 0.6)' : 'transparent'),
  // ...
};
```

**Optional legend** (add once below the main radar canvas):

```html
<div id="outlier-legend" class="flex items-center gap-2 text-xs text-amber-400 mt-2">
  <span class="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
  Outlier score (z > 1.8 from judge’s average)
</div>
```

Hide/show the legend based on whether any outliers exist.

### 6. Integration & Reactivity

- Call `renderCoupleStats(selectedCouple)` inside `updateUI()`, `renderSingleView()`, and after every comparison render.
- Re-compute benchmarks + stats whenever category changes or `showNullsAsZero` is toggled.
- All new functions are pure and fast (already <10 ms total for the whole app).

### 7. Edge Cases & Polish
- < 2 valid scores → show “—” for median/stdDev/consensus.
- Round displayed values to **2 decimals** (except consensus which already uses 0.5 steps).
- Add i18n keys if you want (but English is fine for v1).
- Keep existing animations and mobile responsiveness.
- No new libraries – everything is vanilla JS + existing Chart.js.

### 8. Acceptance Criteria
- [ ] Median, Std Dev, and Consensus appear correctly in the new panel.
- [ ] Consistency label updates based on Std Dev thresholds.
- [ ] Outlier points on radar are larger + gold colored (single + multi views).
- [ ] Hover tooltips still work.
- [ ] Performance stays instant (test on mobile).
- [ ] No breakage of existing benchmark toggle, histograms, or deep links.
