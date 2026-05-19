# Implementation Report: Dancer-Friendly Insights ("Your Story")

## 1. Overview
The "Your Story" feature was implemented to transform technical judge scores into plain-language, dancer-centric narratives. The goal was to provide immediate answers to common dancer questions: "How close was I to the final?", "Was one judge particularly harsh?", and "How would my rank change if my worst score didn't count?".

## 2. Key Features

### 2.1 Rank & Closeness (Header Integration)
The couple header now displays more than just the Nº and Average:
- **Exact Rank**: e.g., "14th of 42".
- **Leader Distance**: Points behind the 1st place couple.
- **Cutoff Distance**: Points needed to reach the finals qualification threshold (calculated as the top 30% or top 12-15 couples).

### 2.2 "Your Story" Card
A prominent amber-bordered card located before the analysis tabs:
- **Consistency Classification**: Automatically categorizes performance as "Very Consistent", "Fairly Consistent", or "Polarizing" based on the standard deviation of scores.
- **Judge Biases**: Visual tags for judges who "Loved" ❤️ or "Bombed" 💣 the couple.
- **The Verdict**: A data-driven paragraph that explains the "story" of the round (e.g., highlighting if a single bomb significantly impacted the final rank).

### 2.3 What-if Simulator
A set of interactive toggle switches that allow users to test scenarios:
- **Remove worst judge**: Recalculates the rank by dropping the single lowest score.
- **Replace bomb with panel average**: Identifies a statistical "bomb" and replaces it with the average of the other judges.
- **Visual Feedback**: Active simulations use a rose-colored neon glow and update the header to show the "Simulated Rank" and the position jump (e.g., `+3`).

## 3. Technical Implementation

### 3.1 Ordinal Helper
A `getOrdinal(n)` function was added to provide professional formatting in both languages:
- **English**: Adds suffixes like `1st`, `2nd`, `3rd`, `4th`.
- **Spanish**: Uses the `º` symbol (e.g., `1º`).

### 3.2 Verdict Decision Tree
The logic engine in `generateDancerSummary` analyzes the couple's data to pick the most relevant verdict:
1. **Single Bomb**: Highlights that one judge "really hurt you" and calculates the potential rank improvement.
2. **Polarizing**: Identifies high-variance performances where judges disagreed.
3. **Strong & Clean**: Recognizes top-tier performances with low variance and no negative biases.
4. **Style Clash**: Detects consistent but lower-than-average scores, suggesting the panel didn't connect with the couple's style.

### 3.3 Simulation Engine
- **Stable Ranking**: The ranking calculation uses a stable sort (PROMEDIO then Nº) to ensure consistent results.
- **Mock Dataset**: When a simulation is active, the application generates a temporary dataset where the original couple is replaced by the simulated version, ensuring the "Simulated Rank" reflects a realistic change in the field.
- **Redundancy Filter**: If the "worst judge" is also the "bombed judge," the UI hides the "Remove" button to focus the user on the more impactful "Replace" action.

## 4. UX & Design Refinements
- **Toggle Switches**: Replaced standard buttons with pill-shaped toggles to match the app's settings menu and provide a clear "on/off" state.
- **Sharing Integration**: The `shareView` logic was updated to include the verdict text, making shared results more meaningful to social media followers.
- **Mobile-First**: All containers use flexible Tailwind grids and spacing to ensure a premium feel on small screens.

## 5. Conclusion
"Your Story" bridges the gap between raw data and human experience. By providing clear narratives and interactive "what-if" tools, TANGO RADAR now serves as both an analytical tool for experts and an accessible insight engine for every dancer in the competition.

**Date:** May 18, 2026
**Status:** Successfully Implemented & Verified
