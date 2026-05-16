**Specification: Implement "Loved ❤️" and "Bombed 💣" Couples per Judge**  
**Project:** metropolitano2026 (https://github.com/argent0/metropolitano2026)  
**Version:** 1.0  
**Date:** 2026-05-15  
**Target File:** `spec/loved-bombed.md` (create this new file in the `spec/` folder) + implementation in `index.html` (single-file app)  
**Author:** Grok (team lead) + Lucas, Benjamin, Harper  
**Status:** Ready for coding agent / contributor to implement  

### 1. Objective
Extend the existing METRO RADAR app to show, **for every judge**, two explicit lists of couples:

- **❤️ Loved couples** – couples the judge scored **unusually high** relative to their own scoring habits **and** unusually higher than the rest of the panel.
- **💣 Bombed couples** – couples the judge scored **unusually low** relative to their own scoring habits **and** unusually lower than the rest of the panel.

This builds directly on the already-implemented Z-score outlier detection (threshold 1.8) and `computeBenchmarks()` / `getOutlierTypes()` logic. The feature will appear in judge cards, radar charts, comparison tables, and optionally as a new consolidated view.

All changes must remain **pure vanilla JS + Tailwind + Chart.js**, client-side only, and work with the existing `metropolitano_semifinal_clean.json` data format.

### 2. Formal Definitions (must be implemented exactly as described)

For a **Category**, **Judge J**, and **Couple C** (only when `score_JC !== null`):

**Intra-judge (already exists):**
- Let \( \mu_J, \sigma_J \) = mean and standard deviation of all scores given by Judge J in this category.
- \( z_{\text{self}} = \frac{\text{score}_{J,C} - \mu_J}{\sigma_J} \)

**Inter-judge deviation (new):**
- Let \( S_{\text{other}} \) = scores given to Couple C by all judges except J.
- \( \mu_{\text{other}} \) = arithmetic mean of \( S_{\text{other}} \) (use median if >2 judges have null scores for robustness).
- \( \Delta = \text{score}_{J,C} - \mu_{\text{other}} \)

**Constants (make configurable via a top-level `const` object):**
```js
const BIAS_CONFIG = {
  OUTLIER_THRESHOLD: 1.8,   // same as existing Z-score threshold
  DELTA_THRESHOLD: 0.8,     // points on the 0-10 scale (tunable)
  MIN_OTHER_JUDGES: 3       // minimum valid other scores required for delta
};
```

**Loved couple** for Judge J:
- \( z_{\text{self}} > + \text{OUTLIER_THRESHOLD} \) **AND** \( \Delta > + \text{DELTA_THRESHOLD} \)

**Bombed couple** for Judge J:
- \( z_{\text{self}} < - \text{OUTLIER_THRESHOLD} \) **AND** \( \Delta < - \text{DELTA_THRESHOLD} \)

### 3. New Core Function (add to the JS section of index.html)

Add a new function **after** `computeBenchmarks()`:

```js
/**
 * computeJudgeBias(couplesData, judgesList)
 * @param {Array} couplesData - the "scores" array from a category
 * @param {Array} judgesList - array of judge names for this category
 * @returns {Object} { judgeName: { loved: [...], bombed: [...] } }
 */
function computeJudgeBias(couplesData, judgesList) { ... }
```

Each entry in `loved` / `bombed` arrays must be an object:
```js
{
  coupleN: number,           // "Nº"
  coupleName: string,        // "Nombres"
  score: number,
  zSelf: number,             // rounded to 2 decimals
  delta: number,             // rounded to 2 decimals
  otherMean: number,
  rankInCategory: number     // optional: position in judge's personal ranking
}
```

Sort both lists descending by `|delta|` (strongest bias first).

**Integration point:** Call this function inside the existing category processing loop (where `computeBenchmarks()` is already called) and store the result in the global `categoryData` or a new `biasData` object.

### 4. UI / UX Changes (all in index.html)

**4.1 Judge Cards (existing "Judges Breakdown" section)**
- Under each judge card (after the histogram), add two collapsible accordions (Tailwind details/summary or divs with click handlers):
  - **❤️ Loved Couples** (header with heart emoji + count in badge)
  - **💣 Bombed Couples** (header with bomb emoji + count in badge)
- Each list item (use `<ul class="space-y-2">`):
  - Couple Nº + Name (clickable → select that couple in the main radar view)
  - Score (bold)
  - Badge: `z = +2.3` (green) or `z = -2.1` (orange)
  - Delta: `+1.2 vs panel` (green arrow) or `-1.4 vs panel` (red arrow)
- Empty state: "No strong biases detected for this judge."

**4.2 Radar Charts & Single-Couple View**
- When rendering a judge’s point on the radar, if the couple is Loved/Bombed for that judge, add a small ❤️ or 💣 icon next to the score label (Chart.js annotation or custom DOM overlay).

**4.3 Multi-Couple Comparison Table**
- Add two new columns (or a toggle): “Loved by” and “Bombed by”.
- Cells contain judge initials with emoji if the judge loved/bombed that couple.

**4.4 New Optional Tab (recommended)**
- Add a new top-level navigation pill/tab: **"Judge Bias Analysis"**.
- It shows a grid or tabs-per-judge with the full Loved/Bombed lists for the currently selected category.
- Include a small explanation tooltip with the formal definitions (use the math from section 2).

**Styling:** Use existing Tailwind classes + the same emerald-green / vibrant-orange color scheme already used for outliers.

### 5. Data & Edge Cases to Handle
- Skip couples where judge score is `null`.
- If fewer than `MIN_OTHER_JUDGES` valid other scores → skip delta calculation (treat as non-bias).
- Handle categories with different numbers of judges gracefully.
- Recompute everything instantly when category changes (already how the app works).

### 6. Implementation Steps for Coding Agent
1. Create `spec/loved-bombed.md` and paste this entire specification into it.
2. Add `BIAS_CONFIG` constant near the top of the `<script>` in `index.html`.
3. Implement `computeJudgeBias()` (reuse existing Z-score logic from `getOutlierTypes()` and `computeBenchmarks()`).
4. Modify the main data-processing loop to call the new function and attach `biasData` to each category.
5. Update the judge-card rendering function (search for existing judge HTML generation code).
6. Add the new list UI components and event handlers.
7. Update radar/comparison views for icons.
8. (Optional) Add the new "Judge Bias Analysis" tab.
9. Update `README.md` with a new section describing the feature.
10. Test with the existing `metropolitano_semifinal_clean.json` (especially categories with 6 judges).

### 7. Testing Requirements
- All existing functionality (radars, histograms, outliers, multi-couple comparison) must remain unchanged.
- For every judge in every category, the Loved/Bombed counts should match the formal definition.
- UI must be responsive (mobile-first, as the app already is).
- No external dependencies added.
