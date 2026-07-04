/**
 * DeepClaw v3.3.0 — Confidence Calibrator
 *
 * Records human feedback on claim validation to optimize confidence thresholds.
 * Supports the 4-phase tuning strategy from the detailed design.
 */
import type { CalibrationStats } from "./types.js";
export declare class ConfidenceCalibrator {
    private records;
    private minSamplesForAdjustment;
    constructor(minSamplesForAdjustment?: number);
    /** Record human feedback for a claim. */
    recordFeedback(claimId: string, humanJudgment: boolean, systemConfidence: number): void;
    /** Get current calibration statistics. */
    getCalibration(): CalibrationStats;
    /**
     * Suggest threshold adjustment based on feedback.
     * Returns null if not enough samples.
     */
    suggestAdjustment(): {
        high: number;
        medium: number;
    } | null;
    /** Reset all feedback records. */
    reset(): void;
    getRecordCount(): number;
    private computeOptimalThreshold;
}
export declare function createConfidenceCalibrator(minSamples?: number): ConfidenceCalibrator;
//# sourceMappingURL=calibrator.d.ts.map