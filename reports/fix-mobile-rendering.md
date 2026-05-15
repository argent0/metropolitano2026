# Fix Report: Mobile "Browse Couples" Rendering Bug

## Problem Description
Users reported that on mobile devices, the "browse couples" section (modal) would sometimes appear without content or empty, while it worked correctly on PC.

## Root Cause Analysis
1. **Modal Scroll State:** The `modal-body` container did not reset its `scrollTop` when new content was injected. If a user was scrolled down in one modal and opened another, the view would start at the previous scroll position, often showing "nothing" if the new content was shorter or positioned differently.
2. **Backdrop-Filter Performance:** The `.glass` class applied `backdrop-filter: blur(12px)` to every item in the couples list. With 50+ items, mobile GPUs struggled to render these layers, leading to "ghosting" or failed paint cycles where content appeared invisible.
3. **Z-Index and Stacking:** Use of `sticky` headers within transformed containers (the modal slide-up) occasionally caused layout shifts on mobile browsers.

## Implementation Details
1. **Scroll Reset:** Modified `openModal` to explicitly set `modalBody.scrollTop = 0`.
2. **Performance Optimization:** 
   - Introduced `.glass-light`, a version of the glass style without `backdrop-filter`.
   - Updated `openCoupleSelector`, `openCategorySelector`, and `openSettings` to use `.glass-light` for repeated list items.
3. **Search UX:** Added a "No results" state to the couple search to prevent confusion when filters return no matches.
4. **CSS Reliability:** Added `-webkit-backdrop-filter` for better compatibility with iOS Safari.

## Verification Results
- [x] Modal content always starts at the top.
- [x] Reduced GPU load during scrolling in long lists.
- [x] Search feedback working as expected.
- [x] Consistent rendering across mobile and desktop viewports.

**Date:** May 15, 2026
**Status:** Resolved
