        // Modals
        function openModal(content) {
            modalBody.innerHTML = content;
            modalBody.scrollTop = 0;
            modalOverlay.classList.remove('hidden');
            setTimeout(() => {
                modalOverlay.classList.remove('opacity-0');
                modalContent.classList.remove('translate-y-full');
            }, 10);
        }

        function closeModal() {
            modalOverlay.classList.add('opacity-0');
            modalContent.classList.add('translate-y-full');
            setTimeout(() => {
                modalOverlay.classList.add('hidden');
            }, 500);
        }

        function openCoupleSelector() {
            const catData = dataStore.getCurrentData().find(c => c.category === state.category);
            const couples = [...catData.scores].sort((a, b) => b.PROMEDIO - a.PROMEDIO);
            
            let html = `
                <div class="sticky top-0 bg-[#0a0a0a] pb-6 z-10">
                    <h3 class="text-2xl font-black text-white mb-6 tracking-tight">${t('browse_couples')}</h3>
                    <div class="relative">
                        <input type="text" id="couple-search" placeholder="${t('search_placeholder')}" class="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all placeholder:text-zinc-600 font-bold text-sm">
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                    </div>
                </div>
                <div id="couple-list" class="space-y-3 pb-8">
                    ${couples.map((c, i) => `
                        <button onclick="selectCoupleByNumber(${c.Nº})" class="w-full flex items-center justify-between p-5 glass-light rounded-2xl text-left active:bg-rose-600 transition-all group active:scale-95">
                            <div class="flex items-center gap-4">
                                <span class="text-[10px] font-black w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 group-active:bg-white/20">
                                    ${i + 1}
                                </span>
                                <div>
                                    <span class="text-[9px] font-black text-rose-500 uppercase tracking-widest group-active:text-white/80">Nº ${c.Nº}</span>
                                    <div class="text-white font-black text-base group-active:text-white">${c.Nombres}</div>
                                </div>
                            </div>
                            <div class="text-amber-500 font-black text-lg group-active:text-white neon-text-amber">${c.PROMEDIO.toFixed(3)}</div>
                        </button>
                    `).join('')}
                    <div id="search-empty" class="hidden py-12 text-center">
                        <div class="text-zinc-700 font-black text-xs uppercase tracking-[0.3em]">${t('no_results')}</div>
                    </div>
                </div>
            `;
            openModal(html);
            
            const searchInput = document.getElementById('couple-search');
            const listItems = document.querySelectorAll('#couple-list button');
            const emptyState = document.getElementById('search-empty');

            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                let visibleCount = 0;
                listItems.forEach(btn => {
                    const text = btn.innerText.toLowerCase();
                    const isVisible = text.includes(term);
                    btn.classList.toggle('hidden', !isVisible);
                    if (isVisible) visibleCount++;
                });
                emptyState.classList.toggle('hidden', visibleCount > 0);
            };
        }

        window.selectCoupleByNumber = (num) => {
            const catData = dataStore.getCurrentData().find(c => c.category === state.category);
            const newCouple = catData.scores.find(c => c.Nº === num);
            if (state.couple && state.couple.Nº !== newCouple.Nº) {
                state.simulation = null;
            }
            state.couple = newCouple;
            updateUI();
            closeModal();
        };

        function openCategorySelector() {
            let html = `
                <h3 class="text-2xl font-black text-white mb-8 tracking-tight">${t('select_category')}</h3>
                <div class="space-y-3 pb-8">
                    ${dataStore.getCurrentData().map(cat => `
                        <button onclick="selectCategory('${cat.category}')" class="w-full p-6 glass-light rounded-2xl text-left font-black transition-all active:scale-95 ${cat.category === state.category ? 'bg-rose-600 text-white shadow-neon-rose' : 'text-zinc-400'}">
                            ${t(cat.category)}
                        </button>
                    `).join('')}
                </div>
            `;
            openModal(html);
        }

        function openSettings() {
            let html = `
                <h3 class="text-2xl font-black text-white mb-8 tracking-tight">${t('settings')}</h3>
                <div class="space-y-6 pb-8">
                    <div class="flex items-center justify-between p-6 glass-light rounded-2xl">
                        <div>
                            <div class="font-black text-white mb-1">${t('show_nulls')}</div>
                            <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">${t('show_nulls_desc')}</div>
                        </div>
                        <button id="toggle-nulls" class="w-12 h-6 rounded-full transition-all relative ${state.showNullsAsZero ? 'bg-rose-600' : 'bg-zinc-800'}">
                            <div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${state.showNullsAsZero ? 'right-1' : 'left-1'}"></div>
                        </button>
                    </div>
                    
                    <div class="p-6 glass-light rounded-2xl">
                        <div class="font-black text-white mb-4">${t('benchmark_mode')}</div>
                        <div class="flex gap-2">
                            ${['mean', 'min', 'max'].map(b => `
                                <button onclick="setBenchmark('${b}'); closeModal();" class="flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${state.benchmark === b ? 'bg-amber-500 text-black shadow-neon-amber' : 'bg-zinc-900 text-zinc-500'}">
                                    ${t(b)}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="p-6 glass-light rounded-2xl flex items-center justify-between">
                        <div class="font-black text-white">Language / Idioma</div>
                        <div class="flex gap-2">
                            <button onclick="changeLanguage('en')" class="px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${state.lang === 'en' ? 'bg-rose-600 text-white' : 'bg-zinc-900 text-zinc-500'}">EN</button>
                            <button onclick="changeLanguage('es')" class="px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${state.lang === 'es' ? 'bg-rose-600 text-white' : 'bg-zinc-900 text-zinc-500'}">ES</button>
                        </div>
                    </div>
                    
                    <div class="p-6 text-center">
                        <div class="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-2">Metropolitano 2026</div>
                        <div class="text-[8px] text-zinc-800 font-bold uppercase tracking-widest">v1.0.0 • ${t('built_for_dancers')}</div>
                    </div>
                </div>
            `;
            openModal(html);
            
            document.getElementById('toggle-nulls').onclick = () => {
                state.showNullsAsZero = !state.showNullsAsZero;
                openSettings();
                updateUI();
            };
        }

        window.changeLanguage = (lang) => {
            state.lang = lang;
            document.documentElement.lang = lang;
            applyTranslations();
            updateUI();
            openSettings(); // Refresh settings modal
        };

        function openJudgeHistogram(judge) {
            const b = state.benchmarks[judge];
            const html = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-2xl font-black text-white tracking-tight">${judge}</h3>
                    <div class="flex items-center gap-2">
                        <button id="share-histogram-btn" class="p-2 text-zinc-500 hover:text-rose-500 transition-colors" title="${t('share_histogram')}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        </button>
                        <span class="text-[10px] font-black bg-rose-600/20 text-rose-500 px-3 py-1 rounded-full uppercase tracking-widest">${t('scoring_spread')}</span>
                    </div>
                </div>
                <p class="text-[9px] text-zinc-500 mb-8 uppercase font-black tracking-[0.2em]">${t(state.category)}</p>

                <div class="w-full mb-8 glass rounded-3xl p-4">
                    <div class="aspect-[1.5/1] w-full">
                        <canvas id="histogram-chart"></canvas>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 pb-8">
                    <div class="glass p-5 rounded-2xl flex flex-col justify-center shadow-lg">
                        <span class="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">${t('global_avg')}</span>
                        <div class="text-3xl font-black text-rose-500 neon-text-rose">${b.mean.toFixed(2)}</div>
                    </div>
                    <div class="glass p-5 rounded-2xl flex flex-col justify-center shadow-lg">
                        <span class="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">${t('total_couples')}</span>
                        <div class="text-3xl font-black text-amber-500 neon-text-amber">${b.all.length}</div>
                    </div>
                </div>
            `;
            openModal(html);
            
            document.getElementById('share-histogram-btn').onclick = () => shareHistogram(judge);
            
            setTimeout(() => {
                const ctx = document.getElementById('histogram-chart').getContext('2d');
                const bins = {};
                for (let i = 0; i <= 10; i += 0.5) bins[i.toFixed(1)] = 0;
                
                b.all.forEach(v => {
                    const bin = (Math.floor(v * 2) / 2).toFixed(1);
                    bins[bin] = (bins[bin] || 0) + 1;
                });

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(bins),
                        datasets: [{
                            data: Object.values(bins),
                            backgroundColor: 'rgba(225, 29, 72, 0.8)',
                            hoverBackgroundColor: '#e11d48',
                            borderRadius: 6,
                            barPercentage: 0.8
                        }]
                    },
                    options: {
                        plugins: { 
                            legend: { display: false },
                            annotation: {
                                annotations: {
                                    line1: {
                                        type: 'line',
                                        xScaleID: 'x',
                                        xMin: b.mean * 2,
                                        xMax: b.mean * 2,
                                        borderColor: '#fbbf24',
                                        borderWidth: 2,
                                        borderDash: [4, 4],
                                        label: {
                                            display: true,
                                            content: t('mean'),
                                            position: 'start',
                                            backgroundColor: '#fbbf24',
                                            color: '#000',
                                            font: { size: 8, weight: 'black' }
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { 
                                grid: { display: false }, 
                                ticks: { 
                                    color: '#52525b', 
                                    font: { size: 9, weight: 'bold' },
                                    callback: function(val, index) {
                                        return index % 4 === 0 ? this.getLabelForValue(val) : '';
                                    }
                                } 
                            },
                            y: { 
                                grid: { color: 'rgba(255,255,255,0.03)' }, 
                                ticks: { color: '#52525b', font: { size: 9, weight: 'bold' } } 
                            }
                        },
                        animation: { duration: 1200, easing: 'easeOutElastic' }
                    }
                });
            }, 100);
        }
