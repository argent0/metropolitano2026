        // Dom Elements
        const currentCategoryEl = document.getElementById('current-category-name');
        const categoryTabsEl = document.getElementById('category-tabs');
        const roundSemifinalsBtn = document.getElementById('round-semifinals');
        const roundFinalsBtn = document.getElementById('round-finals');
        const roundBadgeEl = document.getElementById('round-badge');
        const tournamentMetroBtn = document.getElementById('tournament-metro2026');
        const tournamentMundialBtn = document.getElementById('tournament-mundial2026');
        const tournamentBadgeEl = document.getElementById('tournament-badge');
        const coupleNumberEl = document.getElementById('couple-number');
        const coupleNamesEl = document.getElementById('couple-names');
        const couplePromedioEl = document.getElementById('couple-promedio');
        const scoresTableBody = document.getElementById('scores-table-body');
        const contentRadar = document.getElementById('content-radar');
        const contentJudges = document.getElementById('content-judges');
        const contentBias = document.getElementById('content-bias');
        const tabRadarBtn = document.getElementById('tab-radar');
        const tabJudgesBtn = document.getElementById('tab-judges');
        const tabBiasBtn = document.getElementById('tab-bias');
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        const modalBody = document.getElementById('modal-body');
        const comparisonBar = document.getElementById('comparison-bar');
        const comparisonPills = document.getElementById('comparison-pills');
        const multiRadarGrid = document.getElementById('multi-radar-grid');
        const radarCanvas = document.getElementById('radar-chart');
        const radarLegend = document.getElementById('radar-legend');
        
        let multiCharts = [];

        // Initial Load
        async function init() {
            document.documentElement.lang = state.lang;
            applyTranslations();

            try {
                const tournamentIds = Object.keys(TOURNAMENTS);
                const responses = await Promise.all(
                    tournamentIds.flatMap(id => [
                        fetch(TOURNAMENTS[id].files.semifinals),
                        fetch(TOURNAMENTS[id].files.finals)
                    ])
                );
                const jsons = await Promise.all(responses.map(r => r.json()));
                tournamentIds.forEach((id, i) => {
                    dataStore.data[id] = {
                        semifinals: jsons[i * 2],
                        finals: jsons[i * 2 + 1]
                    };
                });

                loadFromURL();
                updateTournamentUI();
                updateRoundUI();
                renderCategoryTabs();
                selectCategory(state.category, true);
                
                setupEventListeners();
            } catch (err) {
                console.error("Failed to load data:", err);
                currentCategoryEl.innerText = t('error_loading');
            }
        }

        function applyTranslations() {
            document.getElementById('current-category-name').innerText = state.category ? t(state.category) : t('loading');
            document.querySelector('#couple-card p').innerHTML = `
                <span class="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                ${t('selected_couple')}
            `;
            // Check if promedio-label exists before updating
            const promedioLabel = document.getElementById('promedio-label');
            if (promedioLabel && !state.simulation) promedioLabel.innerText = t('final_average');
            
            document.getElementById('compare-btn').innerText = t('compare');
            document.getElementById('change-couple-btn').innerText = t('change_couple');
            document.getElementById('tab-radar').innerText = t('radar_analysis');
            document.getElementById('tab-judges').innerText = t('judges_breakdown');
            document.getElementById('tab-bias').innerText = t('bias_analysis');
            document.querySelector('#content-radar h3').innerText = t('couple_vs_judges');
            
            if (document.getElementById('bias-title')) document.getElementById('bias-title').innerText = t('bias_title');
            if (document.getElementById('bias-desc')) document.getElementById('bias-desc').innerHTML = t('bias_desc');
            
            document.getElementById('btn-overlay').innerText = t('overlay').toUpperCase();
            document.getElementById('btn-side-by-side').innerText = t('side_by_side').toUpperCase();
            document.getElementById('exit-comparison-btn').innerText = t('exit_comparison').toUpperCase();

            document.getElementById('round-semifinals').innerText = t('semifinals');
            document.getElementById('round-finals').innerText = t('finals');

            tournamentMetroBtn.innerText = t('metropolitano');
            tournamentMundialBtn.innerText = t('mundial');

            const benchButtons = document.querySelectorAll('#benchmark-chips button');
            benchButtons[0].innerText = t('mean');
            benchButtons[1].innerText = t('min');
            benchButtons[2].innerText = t('max');

            document.getElementById('share-btn-top').title = t('share_view');
            document.getElementById('share-couple-btn').title = t('share_couple');
            document.getElementById('share-radar-btn').title = t('share_radar');
        }

        function setupEventListeners() {
            tabRadarBtn.onclick = () => switchTab('radar');
            tabJudgesBtn.onclick = () => switchTab('judges');
            tabBiasBtn.onclick = () => switchTab('bias');
            
            roundSemifinalsBtn.onclick = () => switchRound('semifinals');
            roundFinalsBtn.onclick = () => switchRound('finals');

            tournamentMetroBtn.onclick = () => switchTournament('metro2026');
            tournamentMundialBtn.onclick = () => switchTournament('mundial2026');

            document.getElementById('change-couple-btn').onclick = openCoupleSelector;
            document.getElementById('compare-btn').onclick = openMultiCompareModal;
            document.getElementById('category-trigger').onclick = openCategorySelector;
            document.getElementById('settings-btn').onclick = openSettings;
            
            document.getElementById('share-btn-top').onclick = shareView;
            document.getElementById('share-couple-btn').onclick = shareView;
            document.getElementById('share-radar-btn').onclick = shareChart;

            document.getElementById('btn-overlay').onclick = () => setComparisonMode('overlay');
            document.getElementById('btn-side-by-side').onclick = () => setComparisonMode('side-by-side');
            document.getElementById('exit-comparison-btn').onclick = exitComparison;

            document.querySelectorAll('#benchmark-chips button').forEach(btn => {
                btn.onclick = () => {
                    setBenchmark(btn.dataset.bench);
                };
            });

            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) closeModal();
            };
        }

        function switchRound(round) {
            if (state.round === round) return;
            state.round = round;

            const currentData = dataStore.getCurrentData();
            state.category = getDefaultCategory(state.tournament, state.round, currentData);

            state.selectedCouples = [];
            state.comparisonMode = null;
            state.couple = null; // force re-selection of top couple
            state.simulation = null;

            updateRoundUI();
            renderCategoryTabs();
            selectCategory(state.category);
        }

        function switchTournament(tournamentId) {
            if (state.tournament === tournamentId) return;
            state.tournament = tournamentId;

            const currentData = dataStore.getCurrentData();
            state.category = getDefaultCategory(state.tournament, state.round, currentData);

            state.selectedCouples = [];
            state.comparisonMode = null;
            state.couple = null; // force re-selection of top couple
            state.simulation = null;

            updateTournamentUI();
            renderCategoryTabs();
            selectCategory(state.category);
        }

        function updateTournamentUI() {
            const isMetro = state.tournament === 'metro2026';
            const isMundial = state.tournament === 'mundial2026';

            tournamentMetroBtn.innerText = t('metropolitano');
            tournamentMundialBtn.innerText = t('mundial');

            tournamentMetroBtn.className = `flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 ${isMetro ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500'}`;
            tournamentMundialBtn.className = `flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 ${isMundial ? 'bg-rose-600 text-white shadow-neon-rose' : 'text-zinc-500'}`;

            tournamentBadgeEl.innerText = t(TOURNAMENTS[state.tournament].nameKey);
            tournamentBadgeEl.className = `text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isMundial ? 'bg-rose-600 text-white' : 'bg-zinc-700 text-zinc-300'}`;
            tournamentBadgeEl.classList.remove('hidden');
        }

        function updateRoundUI() {
            const isSemi = state.round === 'semifinals';
            const isFinal = state.round === 'finals';

            roundSemifinalsBtn.innerText = t('semifinals');
            roundFinalsBtn.innerText = t('finals');

            roundSemifinalsBtn.className = `flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 ${isSemi ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500'}`;
            roundFinalsBtn.className = `flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 ${isFinal ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/20' : 'text-zinc-500'}`;

            roundBadgeEl.innerText = t(state.round);
            roundBadgeEl.className = `text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isFinal ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-300'}`;
            roundBadgeEl.classList.remove('hidden');
        }

        function renderCategoryTabs() {
            categoryTabsEl.innerHTML = '';
            dataStore.getCurrentData().forEach(cat => {
                const pill = document.createElement('button');
                pill.className = `whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black transition-all duration-300 tracking-wider ${
                    cat.category === state.category 
                    ? 'bg-rose-600 text-white shadow-neon-rose scale-105' 
                    : 'bg-zinc-900 text-zinc-500 border border-white/5'
                }`;
                pill.innerText = t(cat.category);
                pill.onclick = () => {
                    if (state.comparisonMode) exitComparison();
                    state.simulation = null;
                    selectCategory(cat.category);
                };
                categoryTabsEl.appendChild(pill);
                });
                }

                function selectCategory(catName, skipCoupleSelection = false) {
                const isNewCategory = state.category !== catName;
                if (isNewCategory) {
                    state.selectedCouples = [];
                    state.comparisonMode = null;
                    state.simulation = null;
                    comparisonBar.classList.add('hidden');
                }
                state.category = catName;
                currentCategoryEl.innerText = t(catName);

                computeBenchmarks(catName);            
            const catData = dataStore.getCurrentData().find(c => c.category === catName);
            const judges = Object.keys(state.benchmarks);
            state.biasData = computeJudgeBias(catData.scores, judges);
            
            if (!skipCoupleSelection || !state.couple || isNewCategory) {
                const couples = [...catData.scores].sort((a, b) => b.PROMEDIO - a.PROMEDIO);
                state.couple = couples[0];
            }
            
            renderCategoryTabs();
            updateUI();
            closeModal();
        }
