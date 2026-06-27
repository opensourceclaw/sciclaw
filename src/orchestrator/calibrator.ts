/**
 * DeepClaw v3.3.0 — Confidence Calibrator
 *
 * Records human feedback on claim validation to optimize confidence thresholds.
 * Supports the 4-phase tuning strategy from the detailed design.
 */
import type { CalibrationStats, ConfidenceConfig } from "./types.js";

// ── Types ────────────────────────────────────────────────────────────

interface FeedbackRecord {
  claimId: string;
  humanJudgment: boolean; // true = human agrees claim is correct
  systemConfidence: number; // the confidence the system computed
  timestamp: Date;
}

// ── Calibrator ───────────────────────────────────────────────────────

export class ConfidenceCalibrator {
  private records: FeedbackRecord[] = [];
  private minSamplesForAdjustment: number;

  constructor(minSamplesForAdjustment = 50) {
    this.minSamplesForAdjustment = minSamplesForAdjustment;
  }

  /** Record human feedback for a claim. */
  recordFeedback(
    claimId: string,
    humanJudgment: boolean,
    systemConfidence: number,
  ): void {
    this.records.push({
      claimId,
      humanJudgment,
      systemConfidence,
      timestamp: new Date(),
    });
  }

  /** Get current calibration statistics. */
  getCalibration(): CalibrationStats {
    if (this.records.length === 0) {
      return {
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        optimalThreshold: 0.5,
        samplesNeeded: this.minSamplesForAdjustment,
      };
    }

    let falsePositives = 0; // system verified but human disagreed
    let falseNegatives = 0; // system unverified but human agreed
    let truePositives = 0;
    let trueNegatives = 0;

    for (const record of this.records) {
      const systemVerified = record.systemConfidence >= 0.6;
      if (systemVerified && !record.humanJudgment) falsePositives++;
      else if (!systemVerified && record.humanJudgment) falseNegatives++;
      else if (systemVerified && record.humanJudgment) truePositives++;
      else trueNegatives++;
    }

    const total = this.records.length;
    const fpr = falsePositives / Math.max(falsePositives + trueNegatives, 1);
    const fnr = falseNegatives / Math.max(falseNegatives + truePositives, 1);

    // Compute optimal threshold: minimize FPR + FNR
    const optimalThreshold = this.computeOptimalThreshold();

    return {
      falsePositiveRate: Math.round(fpr * 100) / 100,
      falseNegativeRate: Math.round(fnr * 100) / 100,
      optimalThreshold: Math.round(optimalThreshold * 100) / 100,
      samplesNeeded: Math.max(
        0,
        this.minSamplesForAdjustment - this.records.length,
      ),
    };
  }

  /**
   * Suggest threshold adjustment based on feedback.
   * Returns null if not enough samples.
   */
  suggestAdjustment(): { high: number; medium: number } | null {
    const stats = this.getCalibration();

    if (stats.samplesNeeded > 0) {
      return null; // not enough data
    }

    const currentHigh = 0.9;
    const currentMedium = 0.6;

    let adjustedHigh = currentHigh;
    let adjustedMedium = currentMedium;

    // If false positive rate is high, raise the "high" threshold
    if (stats.falsePositiveRate > 0.1) {
      adjustedHigh = Math.min(currentHigh + 0.05, 0.98);
    }

    // If false negative rate is high, lower the "medium" threshold
    if (stats.falseNegativeRate > 0.1) {
      adjustedMedium = Math.max(currentMedium - 0.05, 0.4);
    }

    if (adjustedHigh === currentHigh && adjustedMedium === currentMedium) {
      return { high: currentHigh, medium: currentMedium }; // no change needed
    }

    return { high: adjustedHigh, medium: adjustedMedium };
  }

  /** Reset all feedback records. */
  reset(): void {
    this.records = [];
  }

  getRecordCount(): number {
    return this.records.length;
  }

  // ── Private ────────────────────────────────────────────────────────

  private computeOptimalThreshold(): number {
    let bestThreshold = 0.6;
    let bestScore = Infinity;

    // Grid search over threshold values to minimize FPR + FNR
    for (let t = 0.4; t <= 0.95; t += 0.05) {
      let fp = 0;
      let fn = 0;
      let tp = 0;
      let tn = 0;

      for (const record of this.records) {
        const verified = record.systemConfidence >= t;
        if (verified && !record.humanJudgment) fp++;
        else if (!verified && record.humanJudgment) fn++;
        else if (verified && record.humanJudgment) tp++;
        else tn++;
      }

      const fpr = fp / Math.max(fp + tn, 1);
      const fnr = fn / Math.max(fn + tp, 1);
      const score = fpr + fnr;

      if (score < bestScore) {
        bestScore = score;
        bestThreshold = t;
      }
    }

    return bestThreshold;
  }
}

export function createConfidenceCalibrator(
  minSamples?: number,
): ConfidenceCalibrator {
  return new ConfidenceCalibrator(minSamples);
}
