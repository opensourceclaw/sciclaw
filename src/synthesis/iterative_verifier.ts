/**
 * DeepClaw v3.0.0-beta.3 — Iterative Verifier
 *
 * Hypothesis → Test → Refine automated verification loop.
 * Validates claims through multi-source evidence, contradiction
 * detection, and confidence calibration.
 */
import type {
  VerificationLoop,
  VerificationIteration,
  DomainEvidence,
} from "./types.js";

// ── Config ───────────────────────────────────────────────────────────

export interface VerifierConfig {
  /** Maximum iterations before forced conclusion */
  maxIterations: number;
  /** Confidence threshold for "confirmed" conclusion */
  confirmThreshold: number;
  /** Confidence threshold below which conclusion is "rejected" */
  rejectThreshold: number;
  /** Minimum number of supporting sources for a "pass" */
  minSourcesForPass: number;
}

export const DEFAULT_VERIFIER_CONFIG: VerifierConfig = {
  maxIterations: 5,
  confirmThreshold: 0.7,
  rejectThreshold: 0.3,
  minSourcesForPass: 2,
};

// ── Contradiction patterns ───────────────────────────────────────────

const CONTRADICTION_PATTERNS: RegExp[] = [
  /\b(?:however|but|on the other hand|conversely|nevertheless|although|然而|但是|相反|尽管如此|虽然)\b/i,
  /\b(?:contradict|disagree|refute|dispute|challenge|矛盾|反驳|质疑)\b/i,
];

const NEGATION_PATTERNS: RegExp[] = [
  /\b(?:not|no|never|neither|nor|cannot|isn't|aren't|don't|doesn't|不|没有|无|非)\b/i,
];

// ── IterativeVerifier ────────────────────────────────────────────────

export class IterativeVerifier {
  private config: VerifierConfig;

  constructor(config?: Partial<VerifierConfig>) {
    this.config = { ...DEFAULT_VERIFIER_CONFIG, ...config };
  }

  /**
   * Run a verification loop for a hypothesis against available evidence.
   */
  verify(
    hypothesis: string,
    evidenceSets: DomainEvidence[],
  ): VerificationLoop {
    const iterations: VerificationIteration[] = [];
    let confidence = 0.5; // start neutral
    const allClaims = evidenceSets.flatMap((e) => e.claims);
    const allSources = evidenceSets.flatMap((e) => e.sources);

    for (let round = 1; round <= this.config.maxIterations; round++) {
      const iter = this._runIteration(
        round,
        hypothesis,
        allClaims,
        allSources,
        confidence,
      );

      iterations.push(iter);

      // Adjust confidence based on result
      confidence = this._updateConfidence(confidence, iter.result, round);
    }

    const conclusion = this._determineConclusion(confidence);

    return {
      hypothesis,
      iterations,
      conclusion,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  // ── Private ──────────────────────────────────────────────────────────

  private _runIteration(
    round: number,
    hypothesis: string,
    claims: string[],
    sources: string[],
    currentConfidence: number,
  ): VerificationIteration {
    const hypoTerms = this._extractKeyTerms(hypothesis);

    // Score each claim against the hypothesis
    const scored = claims.map((claim) => ({
      claim,
      score: this._semanticOverlap(hypoTerms, claim),
    }));

    const supporting = scored.filter((s) => s.score > 0.3);
    const contradicting = scored.filter((s) => s.score < -0.2);

    let result: VerificationIteration["result"];
    let evidence: string[];
    let refinement: string;

    if (supporting.length >= this.config.minSourcesForPass) {
      result = "pass";
      evidence = supporting
        .slice(0, 3)
        .map((s) => s.claim.slice(0, 120));
      refinement = hypothesis;
    } else if (contradicting.length > 0) {
      result = "fail";
      evidence = contradicting
        .slice(0, 3)
        .map((s) => s.claim.slice(0, 120));
      refinement = this._refineHypothesis(
        hypothesis,
        contradicting.map((s) => s.claim),
        round,
      );
    } else {
      result = "partial";
      evidence = scored
        .filter((s) => s.score > 0)
        .slice(0, 3)
        .map((s) => s.claim.slice(0, 120));
      refinement = this._refineHypothesis(hypothesis, [], round);
    }

    // Add source info
    if (sources.length > 0 && evidence.length > 0) {
      evidence.push(`Sources considered: ${sources.length}`);
    }

    return {
      round,
      test: `Round ${round}: Evaluating "${hypothesis.slice(0, 80)}..."`,
      result,
      evidence,
      refinement,
    };
  }

  private _extractKeyTerms(text: string): string[] {
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been",
      "being", "have", "has", "had", "do", "does", "did", "will",
      "would", "could", "should", "may", "might", "can", "shall",
      "to", "of", "in", "for", "on", "with", "at", "by", "from",
      "and", "or", "but", "not", "this", "that", "it", "its",
      "的", "了", "在", "是", "我", "有", "和", "就", "不", "人",
      "都", "一", "一个", "上", "也", "很", "到", "说", "要", "去",
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));
  }

  private _semanticOverlap(
    hypoTerms: string[],
    claim: string,
  ): number {
    const claimLower = claim.toLowerCase();
    const matches = hypoTerms.filter((t) => claimLower.includes(t));

    // Check for negation in claim
    const hasNegation = NEGATION_PATTERNS.some((p) => p.test(claim));
    const hasContradiction = CONTRADICTION_PATTERNS.some((p) =>
      p.test(claim),
    );

    const baseScore =
      hypoTerms.length > 0 ? matches.length / hypoTerms.length : 0;

    // Negation/contradiction inverts the score
    if (hasNegation || hasContradiction) {
      return -baseScore;
    }

    return baseScore;
  }

  private _updateConfidence(
    current: number,
    result: VerificationIteration["result"],
    round: number,
  ): number {
    const learningRate = 0.15 / round; // decreasing step size

    switch (result) {
      case "pass":
        return Math.min(1, current + learningRate * 2);
      case "fail":
        return Math.max(0, current - learningRate);
      case "partial":
        return current; // partial evidence doesn't change confidence
    }
  }

  private _refineHypothesis(
    hypothesis: string,
    contradictions: string[],
    round: number,
  ): string {
    if (contradictions.length === 0 && round === 1) {
      return `${hypothesis} (needs more evidence)`;
    }
    if (contradictions.length > 0) {
      const prefix = round > 2 ? "Partial: " : "";
      return `${prefix}${hypothesis} — contradicted by evidence`;
    }
    return hypothesis;
  }

  private _determineConclusion(
    confidence: number,
  ): VerificationLoop["conclusion"] {
    if (confidence >= this.config.confirmThreshold) return "confirmed";
    if (confidence <= this.config.rejectThreshold) return "rejected";
    return "inconclusive";
  }
}

/** Factory function for IterativeVerifier */
export function createIterativeVerifier(
  config?: Partial<VerifierConfig>,
): IterativeVerifier {
  return new IterativeVerifier(config);
}
