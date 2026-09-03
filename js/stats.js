        function computeBenchmarks(catName) {
            const catData = dataStore.getCurrentData().find(c => c.category === catName);
            
            const judgesSet = new Set();
            catData.scores.forEach(c => {
                Object.keys(c.scores).forEach(j => judgesSet.add(j));
            });
            const judges = Array.from(judgesSet);
            
            state.benchmarks = {};
            judges.forEach(j => {
                const vals = catData.scores
                    .map(c => c.scores[j])
                    .filter(v => v !== null && typeof v === "number");
                
                state.benchmarks[j] = {
                    mean: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
                    min: vals.length ? Math.min(...vals) : 0,
                    max: vals.length ? Math.max(...vals) : 0,
                    all: vals,
                    median: calculateMedian(vals),
                    stdDev: calculateStdDev(vals),
                    consensus: calculateConsensus(vals)
                };
            });
        }

        /**
         * Returns array of non-null numeric scores for a couple
         */
        function getValidScores(couple) {
            return Object.values(couple.scores).filter(s => s !== null && typeof s === 'number');
        }

        /**
         * Median of an array of numbers (handles even/odd length)
         */
        function calculateMedian(numbers) {
            if (numbers.length === 0) return null;
            const sorted = [...numbers].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 
                ? sorted[mid] 
                : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        /**
         * Sample standard deviation (divide by n-1)
         */
        function calculateStdDev(numbers) {
            if (numbers.length < 2) return null;
            const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
            const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
            return Math.sqrt(variance);
        }

        function getCoupleBias(couple, judge) {
            const bias = state.biasData[judge];
            if (!bias) return null;
            if (bias.loved.some(e => e.coupleN === couple.Nº)) return 'loved';
            if (bias.bombed.some(e => e.coupleN === couple.Nº)) return 'bombed';
            return null;
        }

        /**
         * Consensus: most frequent score after rounding to nearest 0.5
         * Returns {value: number, count: number} or null
         */
        function calculateConsensus(numbers) {
            if (numbers.length === 0) return null;
            const rounded = numbers.map(n => Math.round(n * 2) / 2); // round to 0.5
            const freq = {};
            rounded.forEach(r => freq[r] = (freq[r] || 0) + 1);
            let maxCount = 0;
            let modeValue = null;
            Object.keys(freq).forEach(key => {
                if (freq[key] > maxCount) {
                    maxCount = freq[key];
                    modeValue = parseFloat(key);
                }
            });
            return { value: modeValue, count: maxCount };
        }

        /**
         * computeJudgeBias(couplesData, judgesList)
         * @param {Array} couplesData - the "scores" array from a category
         * @param {Array} judgesList - array of judge names for this category
         * @returns {Object} { judgeName: { loved: [...], bombed: [...] } }
         */
        function computeJudgeBias(couplesData, judgesList) {
            const result = {};
            judgesList.forEach(judge => {
                result[judge] = { loved: [], bombed: [] };
                const judgeBench = state.benchmarks[judge];
                if (!judgeBench || typeof judgeBench.mean === 'undefined' || !judgeBench.stdDev) return;

                couplesData.forEach(couple => {
                    const score = couple.scores[judge];
                    if (score === null) return;

                    // Intra-judge Z-score
                    const zSelf = (score - judgeBench.mean) / judgeBench.stdDev;

                    // Inter-judge deviation
                    const otherScores = judgesList
                        .filter(j => j !== judge)
                        .map(j => couple.scores[j])
                        .filter(s => s !== null && typeof s === 'number');

                    if (otherScores.length < BIAS_CONFIG.MIN_OTHER_JUDGES) return;

                    const otherMean = otherScores.length > 2 
                        ? calculateMedian(otherScores) // robust if >2
                        : (otherScores.reduce((a, b) => a + b, 0) / otherScores.length);
                    
                    const delta = score - otherMean;

                    const entry = {
                        coupleN: couple.Nº,
                        coupleName: couple.Nombres,
                        score: score,
                        zSelf: parseFloat(zSelf.toFixed(2)),
                        delta: parseFloat(delta.toFixed(2)),
                        otherMean: parseFloat(otherMean.toFixed(2))
                    };

                    if (zSelf > BIAS_CONFIG.OUTLIER_THRESHOLD && delta > BIAS_CONFIG.DELTA_THRESHOLD) {
                        result[judge].loved.push(entry);
                    } else if (zSelf < -BIAS_CONFIG.OUTLIER_THRESHOLD && delta < -BIAS_CONFIG.DELTA_THRESHOLD) {
                        result[judge].bombed.push(entry);
                    }
                });

                // Sort by |delta| descending
                result[judge].loved.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
                result[judge].bombed.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
            });
            return result;
        }

        /**
         * Returns array of outlier types (same length as judges)
         * Returns 'favorable', 'disfavorable', or null
         * Uses judge's benchmarks (mean + stdDev) + z-score threshold of 1.8
         */
        function getOutlierTypes(couple, judges) {
            return judges.map(judge => {
                const score = couple.scores[judge];
                if (score === null || !state.benchmarks[judge] || !state.benchmarks[judge].stdDev) return null;
                const diff = score - state.benchmarks[judge].mean;
                const z = Math.abs(diff) / state.benchmarks[judge].stdDev;
                if (z > 1.8) {
                    return diff > 0 ? 'favorable' : 'disfavorable';
                }
                return null;
            });
        }

        function getOrdinal(n) {
            if (state.lang === 'es') return n + 'º';
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        }
