        function updateUI() {
            if (state.selectedCouples.length >= 2) {
                renderComparison();
            } else {
                renderSingleView();
            }
            if (state.tab === 'bias') renderBiasAnalysis();
            updateURL();
        }

        function renderSingleView() {
            if (!state.couple) return;

            const catData = dataStore.getCurrentData().find(c => c.category === state.category);
            
            // If simulating, we need a scores list where the original couple is replaced by the simulated one
            const scoresForRanking = state.simulation 
                ? catData.scores.map(c => c.Nº === state.couple.Nº ? state.couple : c)
                : catData.scores;
            
            const rankCloseness = computeRankAndCloseness(scoresForRanking, state.couple);

            comparisonBar.classList.add('hidden');
            radarCanvas.classList.remove('hidden');
            multiRadarGrid.classList.add('hidden');
            radarLegend.innerHTML = '';
            
            coupleNumberEl.innerText = state.couple.Nº;
            coupleNamesEl.innerText = state.couple.Nombres;
            
            if (state.simulation) {
                const originalRank = computeRankAndCloseness(catData.scores, state.simulation.originalCouple).rank;
                const diff = rankCloseness.rank - originalRank;
                const jump = diff < 0 ? ` (+${Math.abs(diff)})` : (diff > 0 ? ` (${diff})` : '');
                
                couplePromedioEl.innerText = state.couple.PROMEDIO.toFixed(3);
                couplePromedioEl.className = "text-4xl font-black text-emerald-500 leading-none neon-text-emerald";
                
                document.getElementById('promedio-label').innerText = `${t('simulatedRank')}: ${rankCloseness.rank}º${jump}`;
                document.getElementById('promedio-label').className = "text-emerald-500 text-[10px] font-black uppercase tracking-tighter";
                
                document.getElementById('couple-rank-closeness').innerHTML = `
                    <button onclick="window.undoSimulation()" class="bg-emerald-500/20 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-2">
                        <span>${t('undo')}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                `;
            } else {
                couplePromedioEl.innerText = state.couple.PROMEDIO.toFixed(3);
                couplePromedioEl.className = "text-4xl font-black text-amber-500 leading-none neon-text-amber";
                document.getElementById('promedio-label').innerText = t('final_average');
                document.getElementById('promedio-label').className = "text-zinc-500 text-[10px] font-bold uppercase tracking-tighter";

                const cutoffText = rankCloseness.pointsToCutoff > 0 
                    ? `<span class="text-zinc-500">·</span> <span class="text-rose-500">-${rankCloseness.pointsToCutoff.toFixed(3)} ${t('pointsToCutoff')}</span>`
                    : '';

                document.getElementById('couple-rank-closeness').innerHTML = `
                    <span class="text-amber-500 text-xs font-black">${rankCloseness.rank}º / ${rankCloseness.total}</span>
                    <span class="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        ${rankCloseness.pointsBehindLeader > 0 ? `-${rankCloseness.pointsBehindLeader.toFixed(3)} ${t('pointsToLeader')}` : 'LEADER'}
                        ${cutoffText}
                    </span>
                `;
            }

            document.querySelector('#couple-card p').innerHTML = `
                <span class="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                ${t('selected_couple')}
            `;
            
            renderCoupleStats(state.couple);
            
            // Render Insights Card
            const insightsContainer = document.getElementById('insights-container');
            if (state.simulation) {
                insightsContainer.innerHTML = ''; // Hide insights during simulation? Spec says "Simulated rank banner"
                // Actually spec says: "Show a temporary 'Simulated rank: 7th (+3 positions)' banner with undo button"
                // I put it in the header. Let's keep the insights card but maybe highlight it?
                // The spec says "Simulation state is temporary and clear on category/couple change".
                // Let's re-render the insights card but keep it simple.
            }
            insightsContainer.innerHTML = generateDancerSummary(state.simulation ? state.simulation.originalCouple : state.couple, catData);
            
            renderRadar();
            renderTable();
            renderJudges();
        }

        function renderCoupleStats(couple, targetId = 'couple-stats') {
            const el = document.getElementById(targetId);
            if (!el) return;

            const valid = getValidScores(couple);
            const median = calculateMedian(valid);
            const stdDev = calculateStdDev(valid);
            const consensus = calculateConsensus(valid);

            const consistencyKey = stdDev === null ? 'N/A' : 
                stdDev < 0.3 ? 'high' : stdDev < 0.6 ? 'medium' : 'low';
            const consistencyLabel = stdDev === null ? 'N/A' : t(consistencyKey);

            const html = `
                <div class="bg-zinc-900/70 rounded-lg p-3">
                    <div class="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">${t('median')}</div>
                    <div class="text-xl font-black text-white">${median ? median.toFixed(2) : '—'}</div>
                </div>
                <div class="bg-zinc-900/70 rounded-lg p-3">
                    <div class="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">${t('stdDev')}</div>
                    <div class="text-xl font-black text-white">${stdDev ? stdDev.toFixed(2) : '—'}</div>
                    <div class="text-[8px] text-zinc-500 font-bold uppercase mt-1">${t('consistency')}: <span class="${consistencyKey === 'high' ? 'text-emerald-500' : consistencyKey === 'medium' ? 'text-amber-500' : 'text-rose-500'} font-black">${consistencyLabel}</span></div>
                </div>
                <div class="bg-zinc-900/70 rounded-lg p-3">
                    <div class="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">${t('consensus')}</div>
                    <div class="text-xl font-black text-white">${consensus ? `${consensus.value} <span class="text-xs font-normal text-zinc-400">(${consensus.count})</span>` : '—'}</div>
                </div>
            `;

            el.innerHTML = html;
            el.classList.remove('hidden');
        }
