        // Sharing
        async function shareView() {
            let text;
            if (state.selectedCouples.length >= 2) {
                const names = state.selectedCouples.map(c => c.Nombres).join(' vs ');
                text = state.lang === 'es'
                    ? `¡Mirá la comparación de ${names} en ${t(state.category)} en TANGO RADAR! 💃🕺`
                    : `Check out the comparison between ${names} in ${t(state.category)} at TANGO RADAR! 💃🕺`;
            } else {
                const catData = dataStore.getCurrentData().find(c => c.category === state.category);
                const stats = computeRankAndCloseness(catData.scores, state.couple);
                text = state.lang === 'es' 
                    ? `¡Mirá el análisis de ${state.couple.Nombres} (#${stats.rank}/${stats.total}) en ${t(state.category)} en TANGO RADAR! 💃🕺`
                    : `Check out the analysis for ${state.couple.Nombres} (#${stats.rank}/${stats.total}) in ${t(state.category)} at TANGO RADAR! 💃🕺`;
                
                // Try to get verdict from insights
                const verdictEl = document.querySelector('#insights-container p');
                if (verdictEl) {
                    text += `\n\n"${verdictEl.innerText.substring(0, 100)}..."`;
                }
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
                        filename = `tango-comparison-${state.selectedCouples.map(c => c.Nº).join('-')}.png`;
                    } else if (state.comparisonMode === 'side-by-side') {
                        filename = `tango-comparison-side-by-side.png`;
                    } else {
                        filename = `tango-radar-${state.couple?.Nº || 'view'}.png`;
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
                        title: 'TANGO RADAR',
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

        async function shareChart() {
            let canvas;
            let filename;
            let shareText;

            if (state.comparisonMode === 'overlay') {
                canvas = radarCanvas;
                filename = `tango-comparison-${state.selectedCouples.map(c => c.Nº).join('-')}.png`;
                shareText = state.lang === 'es'
                    ? `Comparativa de radar (${t(state.category)})`
                    : `Radar comparison (${t(state.category)})`;
            } else if (state.comparisonMode === 'side-by-side') {
                // In side-by-side, we might just share the first one or alert
                // For now, let's just use the first canvas as a fallback or alert the user
                canvas = document.getElementById('radar-multi-0');
                filename = `tango-comparison-side-by-side.png`;
                shareText = `Side-by-side comparison (${t(state.category)})`;
            } else {
                canvas = radarCanvas;
                filename = `tango-radar-${state.couple.Nº}.png`;
                shareText = state.lang === 'es'
                    ? `Análisis de radar para ${state.couple.Nombres} (${t(state.category)})`
                    : `Radar analysis for ${state.couple.Nombres} (${t(state.category)})`;
            }

            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], filename, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'TANGO RADAR Analysis',
                        text: shareText
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Error sharing file:', err);
                }
            } else {
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.click();
            }
        }

        async function shareHistogram(judge) {
            const canvas = document.getElementById('histogram-chart');
            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `tango-histogram-${judge}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Judge ${judge} Scoring`,
                        text: state.lang === 'es'
                            ? `Distribución de puntajes para ${judge} en ${t(state.category)}`
                            : `Scoring distribution for ${judge} in ${t(state.category)}`
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Error sharing file:', err);
                }
            } else {
                const link = document.createElement('a');
                link.download = `tango-histogram-${judge}.png`;
                link.href = dataUrl;
                link.click();
            }
        }
