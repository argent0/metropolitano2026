        function renderRadar() {
            const ctx = document.getElementById('radar-chart').getContext('2d');
            const judges = Object.keys(state.couple.scores);
            const coupleData = getRadarData(state.couple, judges);
            const benchData = judges.map(j => (state.benchmarks[j] && state.benchmarks[j][state.benchmark]) ? state.benchmarks[j][state.benchmark] : 0);
            
            const outlierTypes = getOutlierTypes(state.couple, judges);

            if (radarChart) radarChart.destroy();

            radarChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: judges,
                    datasets: [
                        {
                            label: t('couple'),
                            data: coupleData,
                            fill: true,
                            backgroundColor: 'rgba(225, 29, 72, 0.35)',
                            borderColor: '#e11d48',
                            pointBackgroundColor: judges.map((_, i) => 
                                outlierTypes[i] === 'favorable' ? '#10b981' : 
                                outlierTypes[i] === 'disfavorable' ? '#f97316' : '#e11d48'
                            ),
                            pointBorderColor: '#fff',
                            pointBorderWidth: judges.map((_, i) => outlierTypes[i] ? 3 : 2),
                            pointRadius: judges.map((_, i) => outlierTypes[i] ? 7 : 4),
                            pointHoverRadius: judges.map((_, i) => outlierTypes[i] ? 9 : 6),
                            borderWidth: 3
                        },
                        {
                            label: t(state.benchmark),
                            data: benchData,
                            fill: false,
                            borderColor: '#fbbf24',
                            borderDash: [6, 4],
                            pointBackgroundColor: '#fbbf24',
                            pointRadius: 2,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    scales: {
                        r: {
                            min: 0,
                            max: 10,
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.08)' },
                            angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                            pointLabels: {
                                color: '#71717a',
                                font: { size: 11, weight: '900', family: 'system-ui' },
                                padding: 15,
                                callback: (label) => {
                                    const bias = getCoupleBias(state.couple, label);
                                    if (bias === 'loved') return label + ' ❤️';
                                    if (bias === 'bombed') return label + ' 💣';
                                    return label;
                                }
                            },
                            ticks: { display: false, stepSize: 2.5 }
                        }
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const score = context.raw;
                                    const type = outlierTypes[context.dataIndex];
                                    let label = `${context.dataset.label}: ${score !== null ? score.toFixed(2) : 'N/A'}`;
                                    if (context.datasetIndex === 0 && type) {
                                        label += type === 'favorable' ? ` (${t('favorable').toUpperCase()})` : ` (${t('disfavorable').toUpperCase()})`;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    animation: { duration: 1000, easing: 'easeOutQuart' }
                }
            });

            // Update outlier legend visibility
            renderOutlierLegend(outlierTypes.filter(t => t !== null));
        }

        function renderOutlierLegend(types) {
            let legendEl = document.getElementById('outlier-legend');
            if (!legendEl) {
                legendEl = document.createElement('div');
                legendEl.id = 'outlier-legend';
                legendEl.className = 'flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] mt-4 font-black uppercase tracking-widest';
                radarCanvas.parentNode.appendChild(legendEl);
            }
            
            const hasFavorable = types.includes('favorable');
            const hasDisfavorable = types.includes('disfavorable');
            
            let html = '';
            if (hasFavorable) {
                html += `
                    <div class="flex items-center gap-2 text-emerald-500">
                        <span class="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                        <span>${t('favorable')} ${t('outlier')}</span>
                    </div>
                `;
            }
            if (hasDisfavorable) {
                html += `
                    <div class="flex items-center gap-2 text-orange-500">
                        <span class="inline-block w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                        <span>${t('disfavorable')} ${t('outlier')}</span>
                    </div>
                `;
            }
            
            legendEl.innerHTML = html;
            legendEl.classList.toggle('hidden', types.length === 0);
        }

        function renderTable() {
            const isComparison = state.selectedCouples.length >= 2;
            const couples = isComparison ? state.selectedCouples : [state.couple];
            
            if (!couples[0]) return;

            // Update Header
            const tableHead = document.querySelector('table thead');
            let headHtml = `
                <tr class="bg-white/5">
                    <th class="p-4 font-black text-zinc-500 uppercase tracking-widest">${t('judge')}</th>
            `;
            
            couples.forEach((c, i) => {
                const label = isComparison ? `Nº ${c.Nº}` : t('score');
                const color = isComparison ? getCoupleColor(i) : '';
                headHtml += `
                    <th class="p-4 font-black text-zinc-500 uppercase tracking-widest text-center" ${color ? `style="color: ${color}"` : ''}>
                        ${label}
                    </th>
                `;
            });

            headHtml += `
                    <th id="bench-header" class="p-4 font-black text-zinc-500 uppercase tracking-widest text-right">${t(state.benchmark)}</th>
                </tr>
            `;
            tableHead.innerHTML = headHtml;

            // Update Body
            scoresTableBody.innerHTML = '';
            
            const judgesSet = new Set();
            couples.forEach(c => {
                Object.keys(c.scores).forEach(j => judgesSet.add(j));
            });
            const judges = Array.from(judgesSet);

            judges.forEach(j => {
                const tr = document.createElement('tr');
                tr.className = 'border-t border-white/5 group active:bg-white/5 transition-colors';
                
                let rowHtml = `<td class="p-4 font-bold text-zinc-400 group-active:text-white">${j}</td>`;
                
                couples.forEach((c, i) => {
                    const score = c.scores[j];
                    const bias = getCoupleBias(c, j);
                    const emoji = bias === 'loved' ? ' ❤️' : bias === 'bombed' ? ' 💣' : '';
                    
                    const color = isComparison ? getCoupleColor(i) : null;
                    const colorClass = !isComparison ? 'text-rose-500 neon-text-rose' : '';
                    const style = color ? `style="color: ${color}; text-shadow: 0 0 10px ${color}80"` : '';
                    
                    rowHtml += `
                        <td class="p-4 font-black text-lg text-center ${score === null ? 'text-zinc-700 italic' : colorClass}" ${score !== null ? style : ''}>
                            ${score === null ? t('abstention') : score.toFixed(2)}<span class="text-xs ml-1">${emoji}</span>
                        </td>
                    `;
                });

                const benchVal = (state.benchmarks[j] && state.benchmarks[j][state.benchmark]) ? state.benchmarks[j][state.benchmark].toFixed(2) : '—';
                rowHtml += `
                    <td class="p-4 text-right font-black text-amber-500/60 group-active:text-amber-400 transition-colors">
                        ${benchVal}
                    </td>
                `;
                tr.innerHTML = rowHtml;
                scoresTableBody.appendChild(tr);
            });
        }

        function renderJudges() {
            contentJudges.innerHTML = '';
            // Change to 1 column on mobile, 2 on desktop if needed, but the cards will be complex now
            contentJudges.className = "grid grid-cols-1 md:grid-cols-2 gap-4 pb-12";

            Object.keys(state.benchmarks).forEach(j => {
                const b = state.benchmarks[j];
                const bias = state.biasData[j] || { loved: [], bombed: [] };
                
                const card = document.createElement('div');
                card.className = 'glass rounded-2xl p-4 transition-all duration-300 shadow-lg hover:shadow-neon-rose/10 flex flex-col gap-4';
                
                const lovedHtml = bias.loved.length > 0 ? bias.loved.map(entry => `
                    <li class="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 cursor-pointer active:scale-[0.98] transition-all" onclick="event.stopPropagation(); window.selectCoupleByNumber(${entry.coupleN})">
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black text-emerald-500">Nº ${entry.coupleN}</span>
                            <span class="text-[11px] font-bold text-white truncate max-w-[120px]">${entry.coupleName}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-sm font-black text-emerald-500">${entry.score.toFixed(1)}</span>
                            <span class="text-[8px] font-bold text-emerald-600/80">+${entry.delta.toFixed(1)} ${t('vs_panel')}</span>
                        </div>
                    </li>
                `).join('') : `<p class="text-[10px] text-zinc-600 italic px-2">${t('no_biases')}</p>`;

                const bombedHtml = bias.bombed.length > 0 ? bias.bombed.map(entry => `
                    <li class="flex items-center justify-between p-2 rounded-lg bg-orange-500/5 border border-orange-500/10 cursor-pointer active:scale-[0.98] transition-all" onclick="event.stopPropagation(); window.selectCoupleByNumber(${entry.coupleN})">
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black text-orange-500">Nº ${entry.coupleN}</span>
                            <span class="text-[11px] font-bold text-white truncate max-w-[120px]">${entry.coupleName}</span>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-sm font-black text-orange-500">${entry.score.toFixed(1)}</span>
                            <span class="text-[8px] font-bold text-orange-600/80">${entry.delta.toFixed(1)} ${t('vs_panel')}</span>
                        </div>
                    </li>
                `).join('') : `<p class="text-[10px] text-zinc-600 italic px-2">${t('no_biases')}</p>`;

                card.innerHTML = `
                    <div class="cursor-pointer" onclick="openJudgeHistogram('${j}')">
                        <h4 class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex justify-between items-center">
                            ${j}
                            <span class="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
                        </h4>
                        <div class="flex justify-between items-end">
                            <div class="flex flex-col">
                                <span class="text-[8px] uppercase text-zinc-600 font-black tracking-tighter leading-none mb-1">${t('judge_average')}</span>
                                <span class="text-xl font-black text-white neon-text-rose">${b.mean.toFixed(2)}</span>
                            </div>
                            <div class="flex gap-4">
                                <div class="flex flex-col items-end">
                                    <span class="text-[7px] uppercase text-zinc-600 font-bold leading-none mb-1">${t('min')}</span>
                                    <span class="text-xs font-black text-zinc-400">${b.min.toFixed(1)}</span>
                                </div>
                                <div class="flex flex-col items-end">
                                    <span class="text-[7px] uppercase text-zinc-600 font-bold leading-none mb-1">${t('max')}</span>
                                    <span class="text-xs font-black text-zinc-400">${b.max.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2 border-t border-white/5 pt-4">
                        <details class="group">
                            <summary class="list-none cursor-pointer flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-500 transition-colors">
                                <span class="flex items-center gap-2">❤️ ${t('loved_couples')} <span class="bg-emerald-500/20 text-emerald-500 px-1.5 rounded-md text-[8px]">${bias.loved.length}</span></span>
                                <svg class="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                            </summary>
                            <ul class="mt-3 space-y-2">
                                ${lovedHtml}
                            </ul>
                        </details>

                        <details class="group">
                            <summary class="list-none cursor-pointer flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-orange-500 transition-colors">
                                <span class="flex items-center gap-2">💣 ${t('bombed_couples')} <span class="bg-orange-500/20 text-orange-500 px-1.5 rounded-md text-[8px]">${bias.bombed.length}</span></span>
                                <svg class="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                            </summary>
                            <ul class="mt-3 space-y-2">
                                ${bombedHtml}
                            </ul>
                        </details>
                    </div>
                `;
                contentJudges.appendChild(card);
            });
        }

        function renderBiasAnalysis() {
            const grid = document.getElementById('bias-analysis-grid');
            grid.innerHTML = '';
            
            Object.keys(state.biasData).forEach(j => {
                const bias = state.biasData[j];
                if (bias.loved.length === 0 && bias.bombed.length === 0) return;

                const card = document.createElement('div');
                card.className = 'glass rounded-3xl p-6 flex flex-col gap-6';
                
                let html = `
                    <div class="flex justify-between items-center">
                        <h4 class="text-lg font-black text-white">${j}</h4>
                        <div class="flex gap-2">
                            <span class="text-[10px] font-black bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full">❤️ ${bias.loved.length}</span>
                            <span class="text-[10px] font-black bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full">💣 ${bias.bombed.length}</span>
                        </div>
                    </div>
                `;

                if (bias.loved.length > 0) {
                    html += `
                        <div class="space-y-4">
                            <h5 class="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                ${t('loved_couples')}
                            </h5>
                            <div class="grid grid-cols-1 gap-2">
                                ${bias.loved.map(e => `
                                    <div class="flex items-center justify-between p-3 glass-light rounded-xl cursor-pointer hover:bg-emerald-500/5 transition-colors" onclick="window.selectCoupleByNumber(${e.coupleN})">
                                        <div class="flex flex-col">
                                            <span class="text-[8px] font-black text-rose-500 uppercase">Nº ${e.coupleN}</span>
                                            <span class="text-xs font-bold text-white">${e.coupleName}</span>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div class="flex flex-col items-end">
                                                <span class="text-[8px] font-bold text-zinc-500 uppercase">${t('score')}</span>
                                                <span class="text-sm font-black text-emerald-500">${e.score.toFixed(1)}</span>
                                            </div>
                                            <div class="flex flex-col items-end border-l border-white/5 pl-4">
                                                <span class="text-[8px] font-bold text-zinc-500 uppercase">${t('delta')}</span>
                                                <span class="text-sm font-black text-emerald-600">+${e.delta.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                if (bias.bombed.length > 0) {
                    html += `
                        <div class="space-y-4">
                            <h5 class="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                ${t('bombed_couples')}
                            </h5>
                            <div class="grid grid-cols-1 gap-2">
                                ${bias.bombed.map(e => `
                                    <div class="flex items-center justify-between p-3 glass-light rounded-xl cursor-pointer hover:bg-orange-500/5 transition-colors" onclick="window.selectCoupleByNumber(${e.coupleN})">
                                        <div class="flex flex-col">
                                            <span class="text-[8px] font-black text-rose-500 uppercase">Nº ${e.coupleN}</span>
                                            <span class="text-xs font-bold text-white">${e.coupleName}</span>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div class="flex flex-col items-end">
                                                <span class="text-[8px] font-bold text-zinc-500 uppercase">${t('score')}</span>
                                                <span class="text-sm font-black text-orange-500">${e.score.toFixed(1)}</span>
                                            </div>
                                            <div class="flex flex-col items-end border-l border-white/5 pl-4">
                                                <span class="text-[8px] font-bold text-zinc-500 uppercase">${t('delta')}</span>
                                                <span class="text-sm font-black text-orange-600">${e.delta.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                card.innerHTML = html;
                grid.appendChild(card);
            });

            if (grid.innerHTML === '') {
                grid.innerHTML = `<div class="col-span-full py-20 text-center text-zinc-600 font-black uppercase tracking-[0.3em]">${t('no_biases')}</div>`;
            }
        }
