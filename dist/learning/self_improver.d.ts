/**
 * SciClaw v3.0.0-rc.1 — Self Improver
 *
 * Performance self-assessment, strategy adaptation based on outcomes,
 * and error pattern recognition for continuous improvement.
 */
import type { ResearchHistory, Strategy, ErrorPattern } from "./types.js";
export interface SelfImproverConfig {
    minSessionsForAdaptation: number;
    adaptationThreshold: number;
    maxAdaptationsPerSession: number;
    errorPatternMinOccurrences: number;
}
export declare const DEFAULT_SELF_IMPROVER_CONFIG: SelfImproverConfig;
export declare class SelfImprover {
    private config;
    private strategies;
    private errorPatterns;
    private historyScores;
    private currentStrategy;
    constructor(config?: Partial<SelfImproverConfig>);
    /** Optimize strategy based on research history */
    optimizeStrategy(history: ResearchHistory): Promise<Strategy>;
    /** Get current strategy */
    getStrategy(): Strategy;
    /** Get detected error patterns */
    getErrorPatterns(): ErrorPattern[];
    /** Self-assess accuracy based on recent outcomes */
    assessAccuracy(): number;
    /** Get accuracy trend over time */
    getAccuracyTrend(): number[];
    get strategyImprovements(): number;
    private _createInitialStrategy;
    private _assessOutcome;
    private _scoreTrend;
    private _adaptStrategy;
    private _makeAdaptation;
    private _detectErrorPatterns;
    private _suggestMitigation;
}
/** Factory function for SelfImprover */
export declare function createSelfImprover(config?: Partial<SelfImproverConfig>): SelfImprover;
//# sourceMappingURL=self_improver.d.ts.map