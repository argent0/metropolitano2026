**Website Specification: Metropolitano 2026 Semifinals Visualizer**

**Project Overview**  
A fully static, single-page website hosted on GitHub Pages that visualizes the cleaned `metropolitano_semifinal_clean.json` data for the Metropolitano 2026 Semifinals (all dance categories).  

The site turns raw judge scores into engaging, glanceable insights focused on one couple at a time. It is **mobile-first and optimized exclusively for cellphone portrait mode** (320–480 px width, tall scrolling layout).  

**Target audience**: 20-something tango dancers, fans, and competitors — energetic, social-media-native users who want fast, beautiful, modern data viz (think TikTok/Instagram Reels aesthetics applied to tango).

**Core User Flow**  
1. Open site → instantly loads JSON.  
2. Default view: **Category = "TANGO DE PISTA ADULT"** + **Couple = highest PROMEDIO** in that category.  
3. User taps category → instantly updates couple list and visuals.  
4. User changes couple → main radar and stats update instantly.  
5. Explore radar comparison + judges histograms.

**Tech Stack (Static GitHub Pages only)**  
- `index.html` (single file or minimal folders)  
- Tailwind CSS v3 via CDN (`<script src="https://cdn.tailwindcss.com">`)  
- Chart.js v4 (via CDN) for radar (spider-web) and histogram charts  
- Vanilla JavaScript (no build step)  
- `metropolitano_semifinal_clean.json` in the repo root  
- Optional: simple SVG icons or Lucide icons via CDN for tango flair  
- All assets loaded from the same repo (no external images except Chart.js CDN)

**Design Language – Modern & Attractive for 20-somethings**  
- **Color palette**:  
  - Background: `#0a0a0a` (near-black) with subtle radial gradient  
  - Primary accent: `#e11d48` (tango red / rose-600)  
  - Secondary accent: `#fbbf24` (amber/gold) for highlights  
  - Text: white + zinc-300  
  - Chart fills: semi-transparent rose-500 for couple, gold-400 dashed for benchmark  
- **Typography**: System sans (Inter fallback) – bold headings, generous line-height.  
- **Style**: Dark mode only, glassmorphic cards (backdrop blur + border), subtle hover scales, micro-animations (Chart.js animate + Tailwind transitions), neon-glow on selected elements.  
- **Tango vibe**: Subtle diagonal lines or faint music-note patterns in background (CSS only), but keep it minimal and contemporary — no old-school tango clichés.  
- **Mobile portrait rules**: No sidebars, large touch targets (>48 px), vertical stacking, bottom-sheet modals for selectors, sticky header.

**Folder Structure (GitHub repo)**  
```
metropolitano-viz/
├── index.html
├── metropolitano_semifinal_clean.json
├── README.md
└── (optional) assets/ for any extra SVGs
```

**UI Layout (Portrait Mobile)**  

**1. Sticky Top Header (always visible)**  
- Left: Logo text “**TANGO RADAR**” in bold rose-600 + tiny gold accent line  
- Center: Current Category name (large, clickable to open category picker)  
- Right: Settings gear icon (opens modal)

**2. Category Selector**  
- Horizontal scrollable pill tabs (overflow-x-auto)  
- Each pill: category name exactly as in JSON (`SEMIFINAL VALS`, `SEMIFINAL MILONGA`, `TANGO DE PISTA ADULT`, etc.)  
- Active pill has rose-600 background + gold underline  
- Default on load: `TANGO DE PISTA ADULT`

**3. Couple Selector / Header Card**  
- Large card right below category tabs  
- Shows:  
  - `Nº` (big number)  
  - `Nombres` (huge font, e.g. “Colodrero - Cartagena”)  
  - `PUNTAJE` and `PROMEDIO` (with gold highlight on PROMEDIO)  
- “Change couple” button (opens bottom-sheet modal)  
- Modal contains: searchable `<input>` + virtualized list of all couples in current category, sorted by PROMEDIO descending. Each row: Nº + Nombres + PROMEDIO (color-coded).  
- Default couple: highest `PROMEDIO` in the selected category (computed on load).

**4. Main Content Area (two tabs)**  

**Tab 1: Radar Analysis (default tab)**  
- Title: “Couple vs Judges”  
- **One prominent full-width Spider Web (Radar) Chart** (Chart.js radar type)  
  - 6 axes = the 6 judges (`SAMETBAND`, `MARTINEZ`, `MISSÉ`, `GALLARDO`, `COLETTI`, `CEJAS` — extracted dynamically from first couple’s `scores` keys)  
  - Scale: 0–10 (nice round ticks)  
  - Two data series:  
    - Filled rose-500 polygon + points = **Couple’s actual scores** (nulls rendered as 0 with small note)  
    - Dashed gold line + points = **Benchmark** (see below)  
  - Legend at bottom  
  - Chart title dynamically updates: “Couple Scores vs Judge [Mean / Min / Max]”  
- **Benchmark selector** (inside Settings modal or small toggle chips directly above chart):  
  - **Mean** (default)  
  - **Minimum**  
  - **Maximum**  
  - These values are pre-computed per judge for the current category (ignoring `null` abstentions).  
- Below the chart: small table showing raw judge scores for the couple + the three benchmark columns for quick reference.

**Tab 2: Judges Breakdown**  
- “How the Judges Scored Everyone”  
- Grid of 6 judge cards (2-column on mobile)  
- Each card shows:  
  - Judge name (bold)  
  - Quick stats: Avg • Min • Max • # of scores given  
  - Click/tap any card → opens bottom sheet with **histogram** (Chart.js bar chart) of that judge’s score distribution across all couples in the current category.  
- Histogram styling: rose bars, gold mean line overlay, nice binning (0.5-point buckets).

**Settings Modal (gear icon)**  
- Toggle benchmark (Mean / Min / Max)  
- Optional: “Show nulls as 0” toggle  
- Theme info / GitHub link / data last-updated note

**Performance & Data Handling**  
- On page load: `fetch('./metropolitano_semifinal_clean.json')` → store in memory.  
- Pre-compute once per category:  
  - Judge globals (mean/min/max per judge, excluding nulls)  
  - Sorted couple list by PROMEDIO  
- All updates are synchronous and instant (no loading spinners after initial load).  
- Graceful handling of `null` scores (show “Abst.” label on hover/tooltip).

**Accessibility & Polish**  
- High contrast, large fonts  
- ARIA labels on charts  
- Keyboard navigation for selectors  
- Smooth 300 ms transitions  
- PWA-ready meta tags (optional but nice for dancers to “Add to Home Screen”)

**Success Criteria**  
- Loads and renders in < 1 second on mid-range phones  
- Zero horizontal scroll in portrait  
- Radar chart instantly understandable at a glance  
- Feels fun and modern — users should want to screenshot and share their couple’s radar on Instagram Stories
