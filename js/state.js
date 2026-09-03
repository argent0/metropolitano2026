        // State
        // Tournament configuration: data files, official scoring rule, and default category per round.
        // "simple" = plain average of all judges. "trimmed" = drop one highest and one
        // lowest score, then average the rest (Mundial de Tango's official rule).
        const TOURNAMENTS = {
            metro2026: {
                id: 'metro2026',
                nameKey: 'metropolitano',
                scoringRule: 'simple',
                files: {
                    semifinals: './metropolitano_semifinal_clean.json',
                    finals: './metropolitano_final_clean.json'
                },
                defaultCategory: {
                    semifinals: null, // fall back to first category in the file
                    finals: 'TANGO DE PISTA ADULT'
                }
            },
            mundial2026: {
                id: 'mundial2026',
                nameKey: 'mundial',
                scoringRule: 'trimmed',
                files: {
                    semifinals: './mundial_semifinal_clean.json',
                    finals: './mundial_final_clean.json'
                },
                defaultCategory: {
                    semifinals: 'TANGO PISTA SEMIFINAL',
                    finals: 'TANGO PISTA FINAL'
                }
            }
        };

        const dataStore = {
            data: {}, // { metro2026: { semifinals: [...], finals: [...] }, mundial2026: {...} }
            getCurrentData() {
                const tourData = this.data[state.tournament];
                return tourData ? tourData[state.round] : null;
            }
        };

        function getDefaultCategory(tournamentId, round, currentData) {
            const configured = TOURNAMENTS[tournamentId].defaultCategory[round];
            if (configured && currentData && currentData.find(c => c.category === configured)) {
                return configured;
            }
            return currentData && currentData.length > 0 ? currentData[0].category : null;
        }

        /**
         * The official couple average, per the current tournament's scoring rule.
         */
        function computePromedio(validScores, tournamentId = state.tournament) {
            const rule = TOURNAMENTS[tournamentId].scoringRule;
            if (validScores.length === 0) return 0;
            if (rule === 'trimmed' && validScores.length >= 3) {
                const sorted = [...validScores].sort((a, b) => a - b);
                const trimmed = sorted.slice(1, -1);
                return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
            }
            return validScores.reduce((a, b) => a + b, 0) / validScores.length;
        }

        let state = {
            lang: navigator.language.startsWith('es') ? 'es' : 'en',
            tournament: 'metro2026', // metro2026 | mundial2026
            round: 'finals', // semifinals | finals
            category: "TANGO DE PISTA ADULT",
            couple: null,
            benchmark: 'mean', // mean, min, max
            tab: 'radar',
            benchmarks: {},
            biasData: {}, // { judgeName: { loved: [], bombed: [] } }
            showNullsAsZero: false,
            comparisonMode: null, // null | 'overlay' | 'side-by-side'
            selectedCouples: [], // array of couple objects
            simulation: null // { action: 'remove' | 'average', originalCouple: {}, simulatedCouple: {} }
        };

        const BIAS_CONFIG = {
            OUTLIER_THRESHOLD: 1.8,   // same as existing Z-score threshold
            DELTA_THRESHOLD: 0.8,     // points on the 0-10 scale (tunable)
            MIN_OTHER_JUDGES: 3       // minimum valid other scores required for delta
        };

        function t(key) {
            return TRANSLATIONS[state.lang][key] || key;
        }

        let radarChart = null;
