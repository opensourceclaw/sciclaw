import type { Hypothesis, RankedHypothesis, RankingWeights, HypothesisConfig } from "./types.js";
export declare class HypothesisRanker {
    private weights;
    constructor(config?: Partial<HypothesisConfig>);
    rank(hypotheses: Hypothesis[]): RankedHypothesis[];
    rankByConfidence(hypotheses: Hypothesis[]): RankedHypothesis[];
    rankByEvidenceStrength(hypotheses: Hypothesis[]): RankedHypothesis[];
    rankByNovelty(hypotheses: Hypothesis[]): RankedHypothesis[];
    getTopK(hypotheses: Hypothesis[], k: number): RankedHypothesis[];
    getRankingWeights(): RankingWeights;
}
export declare function createHypothesisRanker(config?: Partial<HypothesisConfig>): HypothesisRanker;
//# sourceMappingURL=ranker.d.ts.map