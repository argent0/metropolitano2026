**Specification for METRO RADAR – Multi-Round Support (Semifinals + Finals)**

### 1. Objective
Extend the existing single-page static web app (`index.html`) so it can display **both** Semifinals and Finals data.  
The **default view** on first load (and on refresh) must be:

- **Round**: Finals  
- **Category**: `TANGO DE PISTA ADULT`  
- **Selected couple**: the top-ranked couple in that category (highest `PROMEDIO`; fallback to highest `PUNTAJE` if needed)

Users must be able to freely browse any round and any category within that round while keeping all existing functionality (radar charts, judge histograms, multi-couple comparison, statistics, deep linking, shareable links, etc.).

### 2. Data Model (unchanged structure)
Both JSON files have the **exact same format**:

```json
[
  {
    "category": "TANGO DE PISTA ADULT",
    "scores": [
      {
        "Nº": 1,
        "Nombres": "Teves - Videla",
        "PROMEDIO": 67.21,
        "PUNTAJE": 10,
        "scores": { "J1": 7, "J2": 8, ... },
        ...
      },
      ...
    ]
  },
  ...
]
```

- `metropolitano_semifinal_clean.json` → **Semifinals** round
- `metropolitano_final_clean.json`   → **Finals** round

### 3. New UI Controls

#### 3.1 Round Selector (highest priority)
- Place it **prominently at the top** of the UI (directly under the app title/header, above the category selector).
- Two large, touch-friendly buttons / tabs / segmented control:
  - **SEMIFINALS**
  - **FINALS** (default, highlighted with a distinct color, e.g. a gold/bright accent)
- When the round changes:
  - Immediately reload the category list with only categories present in the selected round.
  - Automatically switch to the **default category** for that round (see section 4).
  - Automatically select the **top couple** in the new category.
  - Update all charts, tables, and statistics instantly.

#### 3.2 Category Selector (existing + enhanced)
- Keep the current searchable dropdown / selector.
- Dynamically populate it **only with categories from the currently selected round**.
- Keep search/filter functionality.

#### 3.3 Visual feedback
- Show a clear badge next to the title (e.g. `FINALS` in gold, `SEMIFINALS` in silver) so users always know which round they are viewing.
- Subtle loading/transition animation when switching rounds is nice but not required.

### 4. Default Behavior (strict requirements)

| Item              | Default Value                          | Notes |
|-------------------|----------------------------------------|-------|
| Round             | `Finals`                               | Must be the very first thing loaded |
| Category          | `TANGO DE PISTA ADULT`                 | Exact string match from the Finals JSON |
| Selected couple   | Top-ranked couple (highest `PROMEDIO`) | In Finals TANGO DE PISTA ADULT this is currently "Teves - Videla" |

On page load the app must **immediately** render the radar chart, histogram, comparison table, etc. for this exact default combination.

### 5. Deep Linking & URL State (keep & extend)
The app already supports deep linking. Extend it so the URL contains:
- `round=semifinals` or `round=finals`
- `category=TANGO%20DE%20PISTA%20ADULT`
- `couple=Teves%20-%20Videla` (or the couple identifier used today)

Refreshing the page or sharing the link must restore the exact same view (round + category + couple).

### 6. Technical Implementation Requirements
- Load **both** JSON files at startup (use `fetch` or `import` with relative paths).
- Create a simple data manager in JS, e.g.:

```js
const dataStore = {
  semifinals: null,   // parsed JSON
  finals: null,       // parsed JSON
  currentRound: 'finals',
  getCurrentData() { ... }
}
```

- Refactor **all** existing functions that reference the old single dataset so they now call `dataStore.getCurrentData()`.
- Keep the entire existing feature set 100% functional after the change (no regression).
- No new external dependencies. Continue using only Tailwind (CDN), Chart.js (CDN), and vanilla ES6+ JavaScript.
- All changes must be made inside `index.html` (or create small separate `.js` files if you prefer, but the current app is single-file).

### 7. Acceptance Criteria
1. Opening `index.html` immediately shows **Finals → TANGO DE PISTA ADULT** with the top couple selected and all charts populated.
2. Switching to **Semifinals** updates the category list and selects the appropriate default couple for the first category in that round.
3. All existing radar charts, histograms, multi-couple comparison, statistics, outliers, dark theme, mobile layout, and share links continue to work perfectly.
4. URL deep linking works for both rounds.
5. No console errors, no broken charts.
