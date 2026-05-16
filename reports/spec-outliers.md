# Technical Report: Statistical Extras & Outlier Highlighting
**Project**: METRO RADAR (Metropolitano 2026)  
**Date**: May 15, 2026  
**Status**: Implemented & Verified

## 1. Executive Summary
This update introduces advanced statistical analysis to the Metropolitano 2026 visualizer. By moving beyond simple averages, the tool now provides deeper insights into judge consistency, consensus, and identifies significant scoring anomalies through automated outlier detection.

## 2. Statistical Methodology

### 2.1 Outlier Detection (Z-Score)
To identify "out-of-character" scores from judges, we implemented a Z-score analysis. 
- **Calculation**: $z = \frac{|x - \mu|}{\sigma}$ where $x$ is the score, $\mu$ is the judge's mean for the category, and $\sigma$ is the judge's standard deviation.
- **Threshold**: We set a threshold of **1.8**. This was chosen to highlight the top/bottom ~7% of scores, representing significant deviations in the context of tango judging.
- **Categorization**: 
    - **Favorable**: $x > \mu$ (indicated in Emerald Green).
    - **Disfavorable**: $x < \mu$ (indicated in Vibrant Orange).

### 2.2 Consistency Metrics
- **Median**: Used to provide a "typical" score that is less sensitive to extreme outliers than the mean.
- **Standard Deviation (Std Dev)**: Serves as a measure of judge agreement. 
    - **High Consistency**: $\sigma < 0.3$
    - **Medium Consistency**: $0.3 \le \sigma < 0.6$
    - **Low Consistency**: $\sigma \ge 0.6$
- **Consensus**: Calculated as the mode of scores after rounding to the nearest 0.5 (the standard step in Argentine Tango judging).

## 3. Implementation Details

### 3.1 Architecture
The implementation remains within the "Tango Noir" single-file architecture (`index.html`). All calculations are performed in-memory during the `computeBenchmarks` phase, ensuring zero latency when switching couples.

### 3.2 UI/UX Enhancements
- **Single View**: A new three-column grid below the final average displays Median, Std Dev, and Consensus.
- **Side-by-Side View**: Mini-stat cards are injected under each radar chart to allow for rapid cross-comparison of consistency.
- **Radar Visuals**: Points on the radar chart are dynamically styled based on their outlier status. Outliers use larger `pointRadius` and distinct colors with a glow effect (`shadowBlur`).
- **Dynamic Legend**: A contextual legend appears only when outliers are present, reducing UI clutter.

## 4. Localization
All new features are fully localized:
- **English**: Median, Std Dev, Consensus, Consistency, Favorable/Disfavorable Outlier.
- **Spanish**: Mediana, Desv. Est., Consenso, Consistencia, Atípico Favorable/Desfavorable.

## 5. Verification & Acceptance
- [x] Median/Std Dev/Consensus match manual verification against the dataset.
- [x] Emerald/Orange colors correctly reflect scores above/below the mean.
- [x] Side-by-Side mini-stats render correctly for 2-4 couples.
- [x] Tooltips correctly identify outlier types.
- [x] Mobile responsiveness maintained.

---
*Technical Documentation for the Metropolitano 2026 Visualizer.*
