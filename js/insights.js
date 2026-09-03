        /**
         * Dancer-centric insights helpers
         */
        function computeRankAndCloseness(categoryScores, currentCouple) {
            const sorted = [...categoryScores]
                .filter(c => c.PROMEDIO != null)
                .sort((a, b) => {
                    if (b.PROMEDIO !== a.PROMEDIO) return b.PROMEDIO - a.PROMEDIO;
                    return a.Nº - b.Nº; // Stable sort by number
                });
            
            const rank = sorted.findIndex(c => c.Nº === currentCouple.Nº) + 1;
            const total = sorted.length;
            
            const nextCouple = rank > 1 ? sorted[rank - 2] : null;
            const leader = sorted[0];
            
            const cutoffRank = Math.max(12, Math.floor(total * 0.3));
            const cutoffCouple = sorted[Math.min(cutoffRank - 1, total - 1)];

            return {
                rank,
                total,
                pointsToNext: nextCouple ? (nextCouple.PROMEDIO - currentCouple.PROMEDIO) : 0,
                pointsBehindLeader: leader ? (leader.PROMEDIO - currentCouple.PROMEDIO) : 0,
                cutoffRank,
                pointsToCutoff: currentCouple.PROMEDIO < cutoffCouple.PROMEDIO ? (cutoffCouple.PROMEDIO - currentCouple.PROMEDIO) : 0
            };
        }

        function getMyBiases(couple) {
            const biases = [];
            Object.keys(state.benchmarks).forEach(judge => {
                const b = getCoupleBias(couple, judge);
                if (b === 'loved') biases.push(`❤️ ${t('lovedBy')} ${judge}`);
                if (b === 'bombed') biases.push(`💣 ${t('bombedBy')} ${judge}`);
            });
            return biases;
        }

        function generateDancerSummary(couple, catData) {
            const stats = computeRankAndCloseness(catData.scores, couple);
            const validScores = getValidScores(couple);
            const stdDev = calculateStdDev(validScores);
            const biases = getMyBiases(couple);
            
            // Identify target judges for simulations
            const scoreEntries = Object.entries(couple.scores).filter(([j, s]) => s !== null).sort((a, b) => a[1] - b[1]);
            const worstJudge = scoreEntries.length > 0 ? scoreEntries[0][0] : null;
            const bombedJudge = Object.keys(couple.scores).find(j => getCoupleBias(couple, j) === 'bombed');

            let consistencyKey = 'consistencyPolarizing';
            if (stdDev < 0.4) consistencyKey = 'consistencyVery';
            else if (stdDev < 0.7) consistencyKey = 'consistencyFairly';
            
            // Verdict decision tree
            let verdict = t('verdictDefault');
            const bombs = biases.filter(b => b.includes('💣'));
            
            if (bombs.length === 1) {
                // Simulate removing the bomb
                const simulated = simulateAction('remove', couple, true);
                const simStats = computeRankAndCloseness(catData.scores.map(c => c.Nº === couple.Nº ? simulated : c), simulated);
                verdict = t('verdictOneBomb').replace('{rank}', getOrdinal(simStats.rank));
            } else if (bombs.length > 1 && stdDev >= 0.7) {
                verdict = t('verdictPolarizing');
            } else if (biases.length === 0 && stdDev < 0.4 && stats.rank <= stats.cutoffRank) {
                verdict = t('verdictStrong');
            } else if (stdDev < 0.4 && stats.rank > stats.cutoffRank) {
                verdict = t('verdictStyle');
            }

            const isRemoving = state.simulation && state.simulation.action === 'remove';
            const isAveraging = state.simulation && state.simulation.action === 'average';

            const showAverage = !!bombedJudge;
            const showRemove = !!worstJudge && (worstJudge !== bombedJudge);
            const gridCols = (showAverage && showRemove) ? 'grid-cols-2' : 'grid-cols-1';

            return `
                <div class="bg-zinc-900 border border-amber-400/50 rounded-2xl p-6 shadow-neon-amber/10">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-black text-amber-500 uppercase tracking-tight">${t('yourStory')} – ${t(state.category)}</h3>
                        <div class="bg-amber-500 text-black px-3 py-1 rounded-full font-black text-xs">
                            ${getOrdinal(stats.rank)} ${t('rankOf')} ${stats.total}
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                            <span class="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-zinc-400">
                                ${t(consistencyKey)}
                            </span>
                            ${biases.map(b => `
                                <span class="px-3 py-1 ${b.includes('❤️') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'} rounded-full border">
                                    ${b}
                                </span>
                            `).join('')}
                        </div>

                        <p class="text-white text-sm leading-relaxed font-medium">
                            ${verdict}
                        </p>

                        <div class="space-y-3 mt-6">
                            ${showRemove ? `
                            <div onclick="window.handleSimulate('remove')" class="flex items-center justify-between p-4 glass-light rounded-xl cursor-pointer active:scale-[0.98] transition-all group">
                                <span class="text-[10px] font-black uppercase tracking-widest ${isRemoving ? 'text-rose-500' : 'text-zinc-400 group-hover:text-zinc-200'} transition-colors">
                                    ✂️ ${t('whatIfRemoveWorst')}
                                </span>
                                <div class="w-10 h-5 rounded-full transition-all relative ${isRemoving ? 'bg-rose-600 shadow-neon-rose' : 'bg-zinc-800 border border-white/5'}">
                                    <div class="w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isRemoving ? 'right-1' : 'left-1'}"></div>
                                </div>
                            </div>
                            ` : ''}
                            ${showAverage ? `
                            <div onclick="window.handleSimulate('average')" class="flex items-center justify-between p-4 glass-light rounded-xl cursor-pointer active:scale-[0.98] transition-all group">
                                <span class="text-[10px] font-black uppercase tracking-widest ${isAveraging ? 'text-rose-500' : 'text-zinc-400 group-hover:text-zinc-200'} transition-colors">
                                    ⚖️ ${t('whatIfReplaceAverage')}
                                </span>
                                <div class="w-10 h-5 rounded-full transition-all relative ${isAveraging ? 'bg-rose-600 shadow-neon-rose' : 'bg-zinc-800 border border-white/5'}">
                                    <div class="w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isAveraging ? 'right-1' : 'left-1'}"></div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        window.handleSimulate = (action) => {
            if (state.simulation && state.simulation.action === action) {
                window.undoSimulation();
                return;
            }
            const currentCouple = state.simulation ? state.simulation.originalCouple : state.couple;
            const simulated = simulateAction(action, currentCouple);
            state.simulation = {
                action,
                originalCouple: currentCouple,
                simulatedCouple: simulated
            };
            state.couple = simulated;
            updateUI();
        };

        window.undoSimulation = () => {
            if (state.simulation) {
                state.couple = state.simulation.originalCouple;
                state.simulation = null;
                updateUI();
            }
        };

        function simulateAction(action, couple, silent = false) {
            const newCouple = JSON.parse(JSON.stringify(couple));
            const scores = Object.entries(newCouple.scores).filter(([j, s]) => s !== null);
            
            if (action === 'remove') {
                if (scores.length === 0) return newCouple;
                scores.sort((a, b) => a[1] - b[1]);
                const worstJudge = scores[0][0];
                newCouple.scores[worstJudge] = null;
            } else if (action === 'average') {
                const bombed = Object.keys(newCouple.scores).find(j => getCoupleBias(newCouple, j) === 'bombed');
                if (bombed) {
                    const others = scores.filter(([j, s]) => j !== bombed).map(s => s[1]);
                    if (others.length > 0) {
                        newCouple.scores[bombed] = others.reduce((a, b) => a + b, 0) / others.length;
                    }
                } else {
                    // Fallback to remove worst if no bomb
                    return simulateAction('remove', couple, silent);
                }
            }

            // Recalculate PROMEDIO using the current tournament's official scoring rule
            // (Mundial de Tango drops the highest and lowest score before averaging).
            const newValid = getValidScores(newCouple);
            newCouple.PROMEDIO = computePromedio(newValid);

            return newCouple;
        }
