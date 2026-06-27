/**
 * DeepClaw v3.3.0 — Cross-Validation Engine
 *
 * Extracts factual claims from search results, cross-validates them across
 * sources, computes confidence scores, and detects contradictions.
 */
import type {
  RawClaim,
  ValidatedClaim,
  Contradiction,
  ResearchSearchResult,
  ConfidenceConfig,
} from "./types.js";
import { DEFAULT_CONFIDENCE_CONFIG } from "./types.js";

// ── Claim extraction patterns ─────────────────────────────────────────

const CLAIM_PATTERNS = [
  // Copula statements: "X is Y", "X was Y"
  /\b([A-Z][a-zA-Z]{2,}(?:\s+[a-z]{2,}){0,5})\s+(is|are|was|were)\s+(an?\s+)?([^.]+)/g,
  // Numeric claims: "X% of Y", "$X million", "X billion Y"
  /(\d+(?:\.\d+)?%?\s+(?:of\s+)?[a-z]{3,}(?:\s+[a-z]{3,}){0,3})/g,
  // Comparative: "more than", "less than", "larger/smaller than"
  /(more|less|greater|larger|smaller|higher|lower)\s+than\s+([^,.]+)/g,
];

// ── Text similarity (Jaccard on word sets) ────────────────────────────

function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

// ── Source credibility ────────────────────────────────────────────────

function getSourceCredibility(
  source: string,
  config: ConfidenceConfig,
): number {
  const lower = source.toLowerCase();
  for (const [key, weight] of Object.entries(config.sourceCredibility)) {
    if (lower.includes(key)) return weight;
  }
  return config.sourceCredibility["unknown"] ?? 0.4;
}

// ── CrossValidator ────────────────────────────────────────────────────

export class CrossValidator {
  constructor(private config: ConfidenceConfig = DEFAULT_CONFIDENCE_CONFIG) {}

  /** Extracts factual claims from search result snippets. */
  extractClaims(results: ResearchSearchResult[]): RawClaim[] {
    const claims: RawClaim[] = [];

    for (const result of results) {
      const text = `${result.title}. ${result.snippet}`;

      for (const pattern of CLAIM_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          const claimText = match[1]?.trim();
          if (
            claimText &&
            claimText.length > 10 &&
            claimText.length < 300
          ) {
            // Deduplicate near-identical claims within the same source
            const isDuplicate = claims.some(
              (c) =>
                c.source === result.source &&
                jaccardSimilarity(c.text, claimText) > 0.8,
            );
            if (!isDuplicate) {
              claims.push({
                id: crypto.randomUUID(),
                text: claimText,
                source: result.source,
                sourceUrl: result.url,
                extractedAt: new Date(),
              });
            }
          }
        }
      }
    }

    return claims;
  }

  /**
   * Cross-validates claims across sources.
   *
   * Confidence model:
   *   confidence = agreement_weight × agreement_score
   *              + source_credibility_weight × avg_credibility
   *              + freshness_weight × freshness_score
   */
  validate(
    rawClaims: RawClaim[],
    results: ResearchSearchResult[],
  ): ValidatedClaim[] {
    const validated: ValidatedClaim[] = [];

    // Group similar claims across sources
    const clusters = this.clusterClaims(rawClaims);

    for (const cluster of clusters) {
      const mainClaim = cluster[0]!;
      const sources = [...new Set(cluster.map((c) => c.source))];
      const allSourceSnippets = results
        .filter((r) => sources.includes(r.source))
        .map((r) => r.snippet);

      // Detect contradicting sources (sources that mention the topic but
      // with opposite/negative sentiment or conflicting numbers)
      const contradictingSources = this.findContradictingSources(
        mainClaim.text,
        results,
        sources,
      );

      const confidence = this.computeConfidence(
        sources,
        contradictingSources,
        allSourceSnippets,
      );

      let status: ValidatedClaim["status"];
      if (confidence >= this.config.high) {
        status = "verified";
      } else if (confidence >= this.config.medium) {
        status = "disputed";
      } else {
        status = "unverified";
      }

      validated.push({
        id: mainClaim.id,
        claim: mainClaim.text,
        sources,
        contradictingSources,
        confidence,
        status,
      });
    }

    return validated;
  }

  /** Clusters similar claims together using Jaccard similarity. */
  private clusterClaims(claims: RawClaim[]): RawClaim[][] {
    const clusters: RawClaim[][] = [];
    const used = new Set<string>();

    for (const claim of claims) {
      if (used.has(claim.id)) continue;
      const cluster: RawClaim[] = [claim];
      used.add(claim.id);

      for (const other of claims) {
        if (used.has(other.id)) continue;
        if (jaccardSimilarity(claim.text, other.text) > 0.5) {
          cluster.push(other);
          used.add(other.id);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /** Finds sources that contradict the claim. */
  private findContradictingSources(
    claimText: string,
    results: ResearchSearchResult[],
    supportingSources: string[],
  ): string[] {
    const contradictory: string[] = [];
    const negationPatterns = /\b(not|no|never|incorrect|false|wrong|unlikely|disputed|debunked|myth)\b/i;
    const claimKeywords = new Set(
      claimText.toLowerCase().split(/\W+/).filter((w) => w.length > 3),
    );

    for (const result of results) {
      if (supportingSources.includes(result.source)) continue;
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      const hasNegation = negationPatterns.test(text);
      const keywordOverlap = [...claimKeywords].filter((kw) =>
        text.includes(kw),
      ).length;
      if (hasNegation && keywordOverlap >= 2) {
        contradictory.push(result.source);
      }
    }

    return [...new Set(contradictory)];
  }

  /** Computes confidence using the weighted model. */
  computeConfidence(
    supportingSources: string[],
    contradictingSources: string[],
    snippets: string[],
  ): number {
    const totalMentions = supportingSources.length + contradictingSources.length;

    // Agreement score: ratio of agreeing sources
    const agreementScore =
      totalMentions > 0 ? supportingSources.length / totalMentions : 0;

    // Source credibility: average weight of supporting sources
    const avgCredibility =
      supportingSources.length > 0
        ? supportingSources.reduce(
            (sum, s) => sum + getSourceCredibility(s, this.config),
            0,
          ) / supportingSources.length
        : 0.4;

    // Freshness: proxy via snippet length diversity (real impl would use dates)
    const freshnessScore = Math.min(snippets.length / 5, 1);

    const confidence =
      this.config.agreementWeight * agreementScore +
      (1 - this.config.agreementWeight - this.config.freshnessWeight) *
        avgCredibility +
      this.config.freshnessWeight * freshnessScore;

    return Math.round(confidence * 100) / 100;
  }

  /** Detects contradictions between validated claims. */
  findContradictions(claims: ValidatedClaim[]): Contradiction[] {
    const contradictions: Contradiction[] = [];

    for (let i = 0; i < claims.length; i++) {
      for (let j = i + 1; j < claims.length; j++) {
        const claimA = claims[i]!;
        const claimB = claims[j]!;

        // Skip if both are from same sources (can't contradict)
        const sharedSources = claimA.sources.filter((s) =>
          claimB.sources.includes(s),
        );
        if (sharedSources.length > 0) continue;

        const similarity = jaccardSimilarity(claimA.claim, claimB.claim);
        // High similarity but different sources → potential contradiction
        if (similarity > 0.4) {
          const overlapScore = 1 - similarity;

          let resolution: Contradiction["resolution"];
          if (claimA.confidence > claimB.confidence + 0.2) {
            resolution = "prefer_a";
          } else if (claimB.confidence > claimA.confidence + 0.2) {
            resolution = "prefer_b";
          } else {
            resolution = "both_possible";
          }

          contradictions.push({
            claimA,
            claimB,
            overlapScore: Math.round(overlapScore * 100) / 100,
            resolution,
          });
        }
      }
    }

    return contradictions;
  }
}

export function createCrossValidator(
  config?: Partial<ConfidenceConfig>,
): CrossValidator {
  return new CrossValidator({ ...DEFAULT_CONFIDENCE_CONFIG, ...config });
}
