**Full Specification for Coding Agent: Enhance Main Share Buttons to Include Radar Chart Image**

### 1. Project Overview
- **Repository**: https://github.com/argent0/metropolitano2026
- **Type**: Single-file static web app (`index.html` contains all HTML, Tailwind CSS, and JavaScript).
- **Tech Stack**: Vanilla JS + Chart.js (v4.4.1) + `chartjs-plugin-annotation`.
- **Core Feature**: Interactive radar charts for tango competition scores (Metropolitano 2026). Supports single couple view, overlay comparison, and side-by-side comparison.
- **Current Sharing**:
  - Main share buttons (`#share-btn-top`, `#share-couple-btn`) → `shareView()`: Shares **text + URL only**.
  - Dedicated radar button (`#share-radar-btn`) → `shareChart()`: Exports the **current radar canvas as PNG** and shares the image file (works beautifully on WhatsApp, iOS/Android).

### 2. Objective
Make **every share action** (including the main share buttons) include the **actual radar chart image** (PNG) when the device supports it (Web Share API with files).  
This gives users a rich WhatsApp/Telegram/etc. preview: image + descriptive caption + deep link.

The dedicated "Share Radar Chart" button can remain unchanged (or be kept as a fallback).

### 3. Requirements (MUST-HAVE)
- Update **only** the `shareView()` function (and any related event listeners if needed).
- Reuse the exact same canvas-export logic already present in `shareChart()` (do **not** duplicate code unnecessarily).
- Support **all three modes** correctly:
  - Single couple view (`comparisonMode === null`)
  - Overlay comparison (`comparisonMode === 'overlay'`)
  - Side-by-side comparison (`comparisonMode === 'side-by-side'`)
- Use the **same text** that `shareView()` already generates (language-aware).
- Keep the existing WhatsApp `wa.me` fallback (no image possible there).
- No breaking changes to any other functionality.
- Maintain exact same error handling (`AbortError` silent, others logged).
- Filename should be descriptive and consistent with `shareChart()`:
  - Overlay: `metro-comparison-123-456.png`
  - Side-by-side: `metro-comparison-side-by-side.png`
  - Single: `metro-radar-123.png`

### 4. Acceptance Criteria
1. Clicking **Share View** (top button or couple button) now shares **image + text + URL** on supported browsers (Android Chrome, Safari, etc.).
2. WhatsApp receives the radar PNG as the image + the exact same caption text + link.
3. Side-by-side mode correctly uses the first multi-canvas (`radar-multi-0`) as fallback (matching current `shareChart()` behavior).
4. No console errors; graceful fallback if canvas export fails.
5. Existing `shareChart()` and `shareHistogram()` functions remain **completely untouched**.
6. The page continues to work perfectly on desktop and mobile.
7. No new dependencies or external services.

### 5. Implementation Steps (Exact Changes)

**File to edit**: `index.html` (only the JavaScript section)

**Replace the entire `shareView()` function** with this improved version:

```javascript
async function shareView() {
    let text;
    if (state.selectedCouples.length >= 2) {
        const names = state.selectedCouples.map(c => c.Nombres).join(' vs ');
        text = state.lang === 'es'
            ? `¡Mirá la comparación de ${names} en ${state.category} en METRO RADAR! 💃🕺`
            : `Check out the comparison between ${names} in ${state.category} at METRO RADAR! 💃🕺`;
    } else {
        text = state.lang === 'es' 
            ? `¡Mirá los puntajes de ${state.couple.Nombres} en ${state.category} en METRO RADAR! 💃🕺`
            : `Check out the scores for ${state.couple.Nombres} in ${state.category} at METRO RADAR! 💃🕺`;
    }
    const url = window.location.href;

    // === Generate radar image (reused logic from shareChart) ===
    let imageFile = null;
    try {
        let canvas;
        if (state.comparisonMode === 'overlay') {
            canvas = radarCanvas;
        } else if (state.comparisonMode === 'side-by-side') {
            canvas = document.getElementById('radar-multi-0');
        } else {
            canvas = radarCanvas;
        }

        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            let filename;
            if (state.comparisonMode === 'overlay') {
                filename = `metro-comparison-${state.selectedCouples.map(c => c.Nº).join('-')}.png`;
            } else if (state.comparisonMode === 'side-by-side') {
                filename = `metro-comparison-side-by-side.png`;
            } else {
                filename = `metro-radar-${state.couple?.Nº || 'view'}.png`;
            }
            imageFile = new File([blob], filename, { type: 'image/png' });
        }
    } catch (e) {
        console.warn('Could not generate chart image for sharing:', e);
    }

    // === Share with image if possible ===
    if (navigator.share) {
        try {
            const shareData = {
                title: 'METRO RADAR',
                text: text,
                url: url
            };

            if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                shareData.files = [imageFile];
            }

            await navigator.share(shareData);
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error sharing:', err);
        }
    } else {
        // Fallback: WhatsApp link (image not supported)
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        window.open(shareUrl, '_blank');
    }
}
```

### 6. Testing Instructions
1. Open the page locally or on GitHub Pages.
2. Select a single couple → click main Share button → verify image + text on WhatsApp.
3. Switch to Overlay comparison → test again.
4. Switch to Side-by-side comparison → test (should use multi canvas).
5. Test on mobile (Android + iOS) and desktop.
6. Verify that the dedicated "Share Radar Chart" button still works unchanged.

### 7. Edge Cases to Handle
- No canvas available (very rare).
- `state.couple` is null (should not happen in normal flow).
- Browser does not support `navigator.canShare({files})`.
- Very large canvases (Chart.js toDataURL handles this fine).
- Language switching (ES/EN text must remain correct).

### 8. Optional Nice-to-Haves (Only if time permits – not required)
- Add a small toast "📸 Radar image included!" after successful share.
- Update the share button tooltip to mention "with image".

### 9. Delivery
- Make the change in a single commit titled:  
  `feat: include radar chart image in main shareView()`
- Push directly to `main` (or open a PR if preferred).
- After merge, confirm the live GitHub Pages version works.
