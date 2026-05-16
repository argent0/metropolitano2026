# METRO RADAR 🌹
### Metropolitano 2026 Semifinals Visualizer

A sleek, mobile-first data visualization tool for the Metropolitano 2026 Tango Semifinals. This tool turns raw judge scores into interactive "Spider Web" (Radar) charts and judge distribution histograms, designed specifically for the tango community.

![Mobile First](https://img.shields.io/badge/Mobile--First-Portrait-rose)
![License](https://img.shields.io/badge/License-MIT-amber)

## ✨ Features

- **Couple vs. Judges Radar**: Compare any couple's performance against category benchmarks (Mean, Min, or Max).
- **Multi-Couple Comparison**: Compare 2–4 couples simultaneously with Overlay or Side-by-Side views.
- **Judge Distribution**: Dive deep into how individual judges score the field with interactive histograms.
- **Shareable Insights**: One-tap sharing to WhatsApp, Instagram Stories, and more. Export charts as images directly from the app.
- **Deep Linking**: URLs automatically sync with your current view. Share a specific couple, category, or comparison simply by copying the link.
- **Localization**: Full support for English and Spanish (Argentinian). Automatically detects device language with manual override in settings.
- **Searchable Selectors**: Quickly find any couple by name or number across all 4 major categories.
- **Tango Noir Aesthetic**: A modern, high-contrast dark theme with neon accents inspired by the energy of the dance floor.
- **Instant Interaction**: Zero build steps. Data is processed in-memory for lightning-fast switching between couples and categories.

## 🔗 Live Demo
[**View the Metropolitano 2026 Radar Analysis**](https://argent0.github.io/metropolitano2026/)

## 🚀 Getting Started

Since this is a fully static project, there is no installation required.

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/metropolitano2026.git
   ```
2. Open `index.html` in your favorite web browser.

*Note: For the best experience, use Chrome/Safari on a mobile device or toggle "Device Toolbar" (Ctrl+Shift+M) in your browser's developer tools set to a mobile resolution (e.g., iPhone SE/12 Pro).*

## 🛠️ Tech Stack

- **[Tailwind CSS v3](https://tailwindcss.com/)**: Utility-first styling via CDN.
- **[Chart.js v4](https://www.chartjs.org/)**: Powerful data visualization.
- **[Vanilla JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)**: No frameworks, no build tools, just ES6+.
- **JSON Data**: Powered by a cleaned dataset of the semifinal scores.

## 📁 Project Structure

```text
metropolitano2026/
├── index.html                           # Main application
├── metropolitano_semifinal_clean.json   # Source data
├── reports/
│   ├── first-version.md                 # Technical implementation report
│   └── comparison-view.md               # Multi-couple comparison implementation
└── README.md                            # You are here
```

## 📈 Data Insights

The visualizer provides three benchmark modes:
- **MEAN**: The average score given by a judge across the entire category.
- **MIN**: The lowest score given by that judge.
- **MAX**: The highest score given by that judge.

These help dancers and fans understand not just the raw score, but the *context* of each judge's scoring behavior.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Created for the Tango Community. 👠🕺*
