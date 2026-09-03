        // URL Sync
        function updateURL() {
            const params = new URLSearchParams(window.location.search);
            params.set('tour', state.tournament);
            params.set('round', state.round);
            params.set('cat', state.category);
            
            if (state.selectedCouples.length >= 2) {
                params.set('couples', state.selectedCouples.map(c => c.Nº).join(','));
                params.delete('n');
            } else if (state.couple) {
                params.set('n', state.couple.Nº);
                params.delete('couples');
            }
            
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }

        function loadFromURL() {
            const params = new URLSearchParams(window.location.search);
            const tour = params.get('tour');
            const round = params.get('round');
            const cat = params.get('cat');
            const num = parseInt(params.get('n'));
            const couplesParam = params.get('couples');

            if (TOURNAMENTS[tour]) {
                state.tournament = tour;
            }

            if (round === 'semifinals' || round === 'finals') {
                state.round = round;
            }

            const currentData = dataStore.getCurrentData();
            if (cat && currentData && currentData.find(c => c.category === cat)) {
                state.category = cat;
            } else {
                state.category = getDefaultCategory(state.tournament, state.round, currentData);
            }

            const catData = currentData ? currentData.find(c => c.category === state.category) : null;
            if (catData) {
                if (couplesParam) {
                    const nums = couplesParam.split(',').map(n => parseInt(n));
                    state.selectedCouples = catData.scores.filter(c => nums.includes(c.Nº));
                    if (state.selectedCouples.length >= 2) {
                        state.comparisonMode = 'overlay';
                    }
                } else if (num) {
                    const couple = catData.scores.find(c => c.Nº === num);
                    if (couple) state.couple = couple;
                }
            }
        }
