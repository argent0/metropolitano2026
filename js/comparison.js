        // Comparison Logic
        function openMultiCompareModal() {
            const catData = dataStore.getCurrentData().find(c => c.category === state.category);
            const couples = [...catData.scores].sort((a, b) => b.PROMEDIO - a.PROMEDIO);
            
            let tempSelection = [...state.selectedCouples];
            if (tempSelection.length === 0 && state.couple) {
                tempSelection.push(state.couple);
            }

            const renderModalContent = () => {
                let html = `
                    <div class="sticky top-0 bg-[#0a0a0a] pb-6 z-10">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-black text-white tracking-tight">${t('select_compare')}</h3>
                            <span class="text-xs font-bold text-rose-500">${tempSelection.length} / 4</span>
                        </div>
                        <div class="relative">
                            <input type="text" id="compare-search" placeholder="${t('search_placeholder')}" class="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-rose-600 transition-all placeholder:text-zinc-600 font-bold text-sm">
                        </div>
                    </div>
                    <div id="compare-list" class="space-y-2 pb-24">
                        ${couples.map((c, i) => {
                            const isSelected = tempSelection.some(sc => sc.Nº === c.Nº);
                            const isDisabled = !isSelected && tempSelection.length >= 4;
                            return `
                                <div class="w-full flex items-center justify-between p-4 glass-light rounded-2xl ${isDisabled ? 'opacity-40 grayscale' : 'active:scale-[0.98] cursor-pointer'}" 
                                     ${isDisabled ? '' : `onclick="window.toggleInTempSelection(${c.Nº})"`}>
                                    <div class="flex items-center gap-4">
                                        <div class="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-rose-600 border-rose-600' : 'border-white/10 bg-black/20'}">
                                            ${isSelected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                                        </div>
                                        <div>
                                            <span class="text-[8px] font-black text-rose-500 uppercase tracking-widest">Nº ${c.Nº}</span>
                                            <div class="text-white font-bold text-sm leading-tight">${c.Nombres}</div>
                                        </div>
                                    </div>
                                    <div class="text-amber-500 font-black text-sm">${c.PROMEDIO.toFixed(3)}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="fixed bottom-0 left-0 right-0 p-8 glass border-t border-white/10 flex gap-3">
                        <button onclick="window.clearTempSelection()" class="flex-1 py-4 rounded-2xl font-black text-xs uppercase bg-zinc-900 text-zinc-500 border border-white/5">${t('clear')}</button>
                        <button onclick="window.confirmComparison()" class="flex-[2] py-4 rounded-2xl font-black text-xs uppercase bg-rose-600 text-white shadow-lg shadow-rose-900/40">${t('confirm')}</button>
                    </div>
                `;
                modalBody.innerHTML = html;

                const searchInput = document.getElementById('compare-search');
                const listItems = document.querySelectorAll('#compare-list > div');
                searchInput.oninput = (e) => {
                    const term = e.target.value.toLowerCase();
                    listItems.forEach(item => {
                        const text = item.innerText.toLowerCase();
                        item.classList.toggle('hidden', !text.includes(term));
                    });
                };
            };

            window.toggleInTempSelection = (num) => {
                const index = tempSelection.findIndex(c => c.Nº === num);
                if (index > -1) {
                    tempSelection.splice(index, 1);
                } else if (tempSelection.length < 4) {
                    tempSelection.push(couples.find(c => c.Nº === num));
                }
                renderModalContent();
            };

            window.clearTempSelection = () => {
                tempSelection = [];
                renderModalContent();
            };

            window.confirmComparison = () => {
                if (tempSelection.length >= 2) {
                    state.selectedCouples = [...tempSelection];
                    state.comparisonMode = state.comparisonMode || 'overlay';
                    updateUI();
                    closeModal();
                } else if (tempSelection.length === 1) {
                    state.couple = tempSelection[0];
                    state.selectedCouples = [];
                    state.comparisonMode = null;
                    updateUI();
                    closeModal();
                } else {
                    closeModal();
                }
            };

            openModal('');
            renderModalContent();
        }

        function setComparisonMode(mode) {
            state.comparisonMode = mode;
            updateUI();
        }

        function exitComparison() {
            state.comparisonMode = null;
            state.selectedCouples = [];
            updateUI();
        }

        function removeFromComparison(num) {
            state.selectedCouples = state.selectedCouples.filter(c => c.Nº !== num);
            if (state.selectedCouples.length < 2) {
                if (state.selectedCouples.length === 1) {
                    state.couple = state.selectedCouples[0];
                }
                exitComparison();
            } else {
                updateUI();
            }
        }

        function getCoupleColor(index) {
            const colors = [
                '#e11d48', // rose
                '#06b6d4', // cyan
                '#8b5cf6', // violet
                '#f59e0b', // amber
                '#10b981', // emerald
            ];
            return colors[index % colors.length];
        }

        function destroyAllCharts() {
            if (radarChart) {
                radarChart.destroy();
                radarChart = null;
            }
            multiCharts.forEach(chart => chart.destroy());
            multiCharts = [];
        }

        function renderComparison() {
            destroyAllCharts();
            comparisonBar.classList.remove('hidden');
            document.getElementById('couple-stats').classList.add('hidden');
            document.getElementById('insights-container').innerHTML = '';
            document.getElementById('couple-rank-closeness').innerHTML = '';
            
            renderComparisonPills();
            renderComparisonLegend();

            // Update Couple Card for Comparison
            coupleNumberEl.innerText = state.selectedCouples.length;
            coupleNamesEl.innerText = t('comparing_couples');
            document.querySelector('#couple-card p').innerHTML = `
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                ${t('comparison_mode')}
            `;
            
            document.getElementById('promedio-label').innerText = t('avg_range');
            document.getElementById('promedio-label').className = "text-zinc-500 text-[10px] font-bold uppercase tracking-tighter";
            
            const averages = state.selectedCouples.map(c => c.PROMEDIO);
            const minAvg = Math.min(...averages).toFixed(3);
            const maxAvg = Math.max(...averages).toFixed(3);
            couplePromedioEl.innerText = `${minAvg} - ${maxAvg}`;
            couplePromedioEl.className = "text-2xl font-black text-amber-500 leading-none neon-text-amber mt-2";

            // Update mode buttons
            document.getElementById('btn-overlay').className = `text-[9px] px-3 py-1.5 rounded-lg transition-all ${state.comparisonMode === 'overlay' ? 'bg-rose-600 text-white font-black' : 'text-zinc-500 font-black'}`;
            document.getElementById('btn-side-by-side').className = `text-[9px] px-3 py-1.5 rounded-lg transition-all ${state.comparisonMode === 'side-by-side' ? 'bg-rose-600 text-white font-black' : 'text-zinc-500 font-black'}`;

            if (state.comparisonMode === 'overlay') {
                radarCanvas.classList.remove('hidden');
                multiRadarGrid.classList.add('hidden');
                renderOverlayRadar();
            } else {
                radarCanvas.classList.add('hidden');
                multiRadarGrid.classList.remove('hidden');
                renderSideBySideRadars();
            }
            
            renderTable();
            renderJudges();
        }

        function renderComparisonPills() {
            const catData = dataStore.getCurrentData().find(c => c.category === state.category);
            comparisonPills.innerHTML = state.selectedCouples.map((c, i) => {
                const rank = computeRankAndCloseness(catData.scores, c).rank;
                return `
                    <div class="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                        <span class="w-2 h-2 rounded-full" style="background-color: ${getCoupleColor(i)}"></span>
                        <span class="text-[10px] font-black text-white truncate max-w-[100px]">${rank}º ${c.Nombres}</span>
                        <button onclick="removeFromComparison(${c.Nº})" class="text-zinc-500 hover:text-rose-500 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                `;
            }).join('');
        }

        function renderComparisonLegend() {
            radarLegend.innerHTML = state.selectedCouples.map((c, i) => `
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-sm" style="background-color: ${getCoupleColor(i)}"></span>
                    <span class="text-[10px] font-black text-zinc-400">${c.Nombres} (Nº ${c.Nº})</span>
                </div>
            `).join('');
        }

        function getRadarData(couple, targetJudges) {
            return targetJudges.map(j => {
                const val = couple.scores[j];
                if (val === undefined || val === null) {
                    return state.showNullsAsZero ? 0 : null;
                }
                return val;
            });
        }

        function renderOverlayRadar() {
            const ctx = radarCanvas.getContext('2d');
            
            const judgesSet = new Set();
            state.selectedCouples.forEach(c => {
                Object.keys(c.scores).forEach(j => judgesSet.add(j));
            });
            const judges = Array.from(judgesSet);
            
            const datasets = state.selectedCouples.map((c, i) => {
                const outlierTypes = getOutlierTypes(c, judges);
                return {
                    label: `Nº ${c.Nº}`,
                    data: getRadarData(c, judges),
                    fill: true,
                    backgroundColor: getCoupleColor(i) + '33',
                    borderColor: getCoupleColor(i),
                    pointBackgroundColor: judges.map((_, ji) => 
                        outlierTypes[ji] === 'favorable' ? '#10b981' : 
                        outlierTypes[ji] === 'disfavorable' ? '#f97316' : getCoupleColor(i)
                    ),
                    pointBorderColor: '#fff',
                    pointBorderWidth: judges.map((_, ji) => outlierTypes[ji] ? 3 : 1.5),
                    pointRadius: judges.map((_, ji) => outlierTypes[ji] ? 6 : 3),
                    pointHoverRadius: judges.map((_, ji) => outlierTypes[ji] ? 8 : 5),
                    borderWidth: 3,
                    outlierTypes: outlierTypes // Store for tooltip
                };
            });

            // Add benchmark
            datasets.push({
                label: t(state.benchmark),
                data: judges.map(j => (state.benchmarks[j] && state.benchmarks[j][state.benchmark]) ? state.benchmarks[j][state.benchmark] : 0),
                fill: false,
                borderColor: '#fbbf24',
                borderDash: [6, 4],
                pointRadius: 0,
                borderWidth: 2
            });

            let allOutlierTypes = [];
            datasets.forEach(ds => {
                if (ds.outlierTypes) {
                    ds.outlierTypes.forEach(t => { if (t) allOutlierTypes.push(t); });
                }
            });

            radarChart = new Chart(ctx, {
                type: 'radar',
                data: { labels: judges, datasets },
                options: {
                    scales: {
                        r: {
                            min: 0, max: 10, beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.08)' },
                            angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                            pointLabels: {
                                color: '#71717a',
                                font: { size: 10, weight: '900' },
                                padding: 10
                            },
                            ticks: { display: false, stepSize: 2.5 }
                        }
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const ds = context.dataset;
                                    const score = context.raw;
                                    let label = `${ds.label}: ${score !== null ? score.toFixed(2) : 'N/A'}`;
                                    if (ds.outlierTypes && ds.outlierTypes[context.dataIndex]) {
                                        const type = ds.outlierTypes[context.dataIndex];
                                        label += type === 'favorable' ? ` (${t('favorable').toUpperCase()})` : ` (${t('disfavorable').toUpperCase()})`;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    animation: { duration: 800 }
                }
            });

            renderOutlierLegend(allOutlierTypes);
        }

        function renderSideBySideRadars() {
            multiRadarGrid.innerHTML = '';
            
            const judgesSet = new Set();
            state.selectedCouples.forEach(c => {
                Object.keys(c.scores).forEach(j => judgesSet.add(j));
            });
            const judges = Array.from(judgesSet);

            const benchData = judges.map(j => (state.benchmarks[j] && state.benchmarks[j][state.benchmark]) ? state.benchmarks[j][state.benchmark] : 0);

            let globalAllOutlierTypes = [];

            state.selectedCouples.forEach((c, i) => {
                const outlierTypes = getOutlierTypes(c, judges);
                outlierTypes.forEach(t => { if (t) globalAllOutlierTypes.push(t); });

                const container = document.createElement('div');
                container.className = 'glass rounded-3xl p-4 flex flex-col items-center';
                container.innerHTML = `
                    <div class="w-full flex justify-between items-center mb-2 px-2">
                        <span class="text-[10px] font-black text-white">Nº ${c.Nº}</span>
                        <span class="text-[10px] font-black text-amber-500">${c.PROMEDIO.toFixed(3)}</span>
                    </div>
                    <div class="aspect-square w-full">
                        <canvas id="radar-multi-${i}"></canvas>
                    </div>
                    <div class="mt-2 text-[8px] font-bold text-zinc-500 text-center uppercase truncate w-full mb-3">${c.Nombres}</div>
                    <div id="couple-stats-multi-${i}" class="grid grid-cols-3 gap-1 w-full text-[8px]">
                        <!-- populated below -->
                    </div>
                `;
                multiRadarGrid.appendChild(container);

                // Populate mini stats
                const miniStatsEl = document.getElementById(`couple-stats-multi-${i}`);
                const valid = getValidScores(c);
                const median = calculateMedian(valid);
                const stdDev = calculateStdDev(valid);
                const consensus = calculateConsensus(valid);
                
                miniStatsEl.innerHTML = `
                    <div class="bg-black/40 rounded p-1.5 text-center">
                        <div class="text-zinc-500 uppercase font-bold mb-0.5" style="font-size: 6px;">${t('median')}</div>
                        <div class="text-white font-black">${median ? median.toFixed(1) : '—'}</div>
                    </div>
                    <div class="bg-black/40 rounded p-1.5 text-center">
                        <div class="text-zinc-500 uppercase font-bold mb-0.5" style="font-size: 6px;">${t('stdDev')}</div>
                        <div class="text-white font-black">${stdDev ? stdDev.toFixed(1) : '—'}</div>
                    </div>
                    <div class="bg-black/40 rounded p-1.5 text-center">
                        <div class="text-zinc-500 uppercase font-bold mb-0.5" style="font-size: 6px;">${t('consensus')}</div>
                        <div class="text-white font-black">${consensus ? consensus.value : '—'}</div>
                    </div>
                `;

                const ctx = document.getElementById(`radar-multi-${i}`).getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: judges,
                        datasets: [
                            {
                                label: `Nº ${c.Nº}`,
                                data: getRadarData(c, judges),
                                fill: true,
                                backgroundColor: getCoupleColor(i) + '22',
                                borderColor: getCoupleColor(i),
                                pointBackgroundColor: judges.map((_, ji) => 
                                    outlierTypes[ji] === 'favorable' ? '#10b981' : 
                                    outlierTypes[ji] === 'disfavorable' ? '#f97316' : getCoupleColor(i)
                                ),
                                pointBorderColor: '#fff',
                                pointBorderWidth: judges.map((_, ji) => outlierTypes[ji] ? 2 : 1),
                                pointRadius: judges.map((_, ji) => outlierTypes[ji] ? 4 : 2),
                                borderWidth: 2,
                                outlierTypes: outlierTypes
                            },
                            {
                                label: t(state.benchmark),
                                data: benchData,
                                fill: false,
                                borderColor: '#fbbf24',
                                borderDash: [4, 4],
                                pointRadius: 0,
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        scales: {
                            r: {
                                min: 0, max: 10, beginAtZero: true,
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                angleLines: { display: true, color: 'rgba(255, 255, 255, 0.05)' },
                                pointLabels: { 
                                    display: true, 
                                    font: { size: 8, weight: '900' }, 
                                    color: '#52525b',
                                    callback: (label) => {
                                        const bias = getCoupleBias(c, label);
                                        if (bias === 'loved') return label + ' ❤️';
                                        if (bias === 'bombed') return label + ' 💣';
                                        return label;
                                    }
                                },
                                ticks: { display: false, stepSize: 5 }
                            }
                        },
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const ds = context.dataset;
                                        const score = context.raw;
                                        let label = `${ds.label}: ${score !== null ? score.toFixed(2) : 'N/A'}`;
                                        if (ds.outlierTypes && ds.outlierTypes[context.dataIndex]) {
                                            const type = ds.outlierTypes[context.dataIndex];
                                            label += type === 'favorable' ? ` (${t('favorable').toUpperCase()})` : ` (${t('disfavorable').toUpperCase()})`;
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        animation: { duration: 600 }
                    }
                });
                multiCharts.push(chart);
            });

            renderOutlierLegend(globalAllOutlierTypes);
        }
