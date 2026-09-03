        function setBenchmark(b) {
            state.benchmark = b;
            document.querySelectorAll('#benchmark-chips button').forEach(btn => {
                if (btn.dataset.bench === b) {
                    btn.className = 'text-[9px] px-3 py-1.5 rounded-md bg-amber-500 text-black font-black transition-all';
                } else {
                    btn.className = 'text-[9px] px-3 py-1.5 rounded-md text-zinc-500 font-black hover:bg-white/5 transition-all';
                }
            });
            updateUI();
        }

        function switchTab(t) {
            state.tab = t;
            const buttons = [tabRadarBtn, tabJudgesBtn, tabBiasBtn];
            const contents = [contentRadar, contentJudges, contentBias];
            const ids = ['radar', 'judges', 'bias'];

            ids.forEach((id, i) => {
                if (t === id) {
                    buttons[i].className = 'flex-1 py-3 text-[10px] md:text-xs font-black rounded-xl transition-all duration-300 bg-rose-600 text-white shadow-lg';
                    contents[i].classList.remove('hidden');
                } else {
                    buttons[i].className = 'flex-1 py-3 text-[10px] md:text-xs font-black rounded-xl transition-all duration-300 text-zinc-500';
                    contents[i].classList.add('hidden');
                }
            });

            if (t === 'judges') renderJudges();
            if (t === 'bias') renderBiasAnalysis();
        }
