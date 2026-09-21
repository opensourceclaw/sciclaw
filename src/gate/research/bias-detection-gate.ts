/**
 * SciClaw v3.9.0 — Bias Detection Gate
 *
 * GA R1 recalibration (Edith ga-r1-calibration.md §4/§6, Friday ratified C1–C5):
 *  - C1: selection denominator is UNIQUE urls (cross-sub-query re-feeds are not
 *    new evidence) — 1 − uniqueDomains / uniqueUrls.
 *  - C2: confirmation/temporal return `assessed:false` when no input variance
 *    exists (no counter-argument data / no publication dates). They keep their
 *    original score values but are EXCLUDED from aggregation — scoring a factor
 *    that is not measured would be manufacturing a reading.
 *  - C3: selection threshold 0.50 = observed legal-run upper bound (curated
 *    whitelist, single authoritative domain); it cannot detect single-domain
 *    curational bias — corpus extension is deferred (§5).
 *  - C4: structural floor uniqueUrls ≥ 2 — a single source cannot corroborate
 *    itself; the negative case is blocked structurally, not by threshold tuning.
 *  - C5: passed ⇔ uniqueUrls ≥ 2 ∧ every assessed factor within its threshold;
 *    score = mean of assessed factors (no assessed factor ⇒ fail).
 */

import type { ResearchGate, GateResult, GateDetail } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";

/** Observed upper bound over legal runs (R1 C3) — see the R1 calibration record. */
const SELECTION_THRESHOLD = 0.5;
/** Structural corroboration floor (R1 C4). */
const MIN_UNIQUE_URLS = 2;

export class BiasDetectionGate implements ResearchGate {
  readonly name = "bias-detection";
  readonly stage: ResearchStage = "validate";

  async check(context: ResearchContext): Promise<GateResult> {
    const uniqueUrls = new Set(context.searchResults.map((r) => r.url)).size;
    const details: GateDetail[] = [];

    details.push(this.checkSelectionBias(context, uniqueUrls));
    details.push(this.checkConfirmationBias(context));
    details.push(this.checkTemporalBias(context));

    const assessed = details.filter((d) => d.assessed !== false);
    const withinThresholds = assessed.every((d) => d.score <= (d.threshold ?? SELECTION_THRESHOLD));
    const structurallyCorroborated = uniqueUrls >= MIN_UNIQUE_URLS;
    const passed = structurallyCorroborated && assessed.length > 0 && withinThresholds;

    const score =
      assessed.length > 0 ? assessed.reduce((sum, d) => sum + d.score, 0) / assessed.length : 0;

    const recommendations = this.recommendMitigations(details);
    const result: GateResult = {
      passed,
      score,
      threshold: SELECTION_THRESHOLD,
      details,
      recommendations,
    };
    if (!structurallyCorroborated) {
      result.reason = "insufficient_corroboration";
      recommendations.push(
        `insufficient_corroboration: fewer than ${MIN_UNIQUE_URLS} unique sources — a single source cannot corroborate itself`
      );
    }
    return result;
  }

  private checkSelectionBias(context: ResearchContext, uniqueUrls: number): GateDetail {
    if (uniqueUrls === 0) {
      return {
        item: "selection",
        score: 1,
        threshold: SELECTION_THRESHOLD,
        assessed: false,
        reason: "not assessable: no sources retrieved",
      };
    }
    const domains = new Set(context.searchResults.map((r) => this.extractDomain(r.url)));
    const score = Math.max(0, 1 - domains.size / uniqueUrls);
    return {
      item: "selection",
      score,
      threshold: SELECTION_THRESHOLD,
      assessed: true,
      reason: "Source diversity (unique domains / unique urls)",
    };
  }

  private checkConfirmationBias(context: ResearchContext): GateDetail {
    const arguments_ = context.synthesis?.arguments ?? [];
    const hasCounterData = arguments_.some((a) => a.counterArguments !== undefined);
    if (!hasCounterData) {
      return {
        item: "confirmation",
        score: 0.5,
        threshold: SELECTION_THRESHOLD,
        assessed: false,
        reason: "not assessable: no counter-argument data",
      };
    }
    const hasCounter = arguments_.some((a) => a.counterArguments && a.counterArguments.length > 0);
    return {
      item: "confirmation",
      score: hasCounter ? 0.15 : 0.5,
      threshold: SELECTION_THRESHOLD,
      assessed: true,
      reason: "Argument balance",
    };
  }

  private checkTemporalBias(context: ResearchContext): GateDetail {
    const timestamps = context.searchResults
      .map((r) => new Date(r.timestamp).getTime())
      .filter((t) => !isNaN(t));
    const range = timestamps.length >= 2 ? Math.max(...timestamps) - Math.min(...timestamps) : 0;
    if (timestamps.length < 2 || range === 0) {
      return {
        item: "temporal",
        score: 0.5,
        threshold: SELECTION_THRESHOLD,
        assessed: false,
        reason: "not assessable: no publication dates (retrieval-time stamps only)",
      };
    }
    const years = range / (1000 * 60 * 60 * 24 * 365);
    return {
      item: "temporal",
      score: years > 5 ? 0.2 : years > 2 ? 0.3 : 0.5,
      threshold: SELECTION_THRESHOLD,
      assessed: true,
      reason: "Time coverage",
    };
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  private recommendMitigations(details: GateDetail[]): string[] {
    const recs: string[] = [];
    const selection = details.find((d) => d.item === "selection");
    if (selection?.assessed !== false && selection && selection.score > SELECTION_THRESHOLD) {
      recs.push("Diversify information sources");
    }
    const confirmation = details.find((d) => d.item === "confirmation");
    if (confirmation?.assessed !== false && confirmation && confirmation.score > 0.3) {
      recs.push("Add counter-arguments to strengthen analysis");
    }
    return recs;
  }
}
