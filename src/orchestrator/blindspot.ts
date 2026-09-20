/**
 * SciClaw v3.3.0 — Blind Spot Detector
 *
 * 7 heuristic rules for detecting information gaps in research results.
 */
import type {
  ResearchContext,
  BlindSpot,
  BlindSpotReason,
  CompletenessReport,
  ResearchSearchResult,
  ValidatedClaim,
} from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────

/** Jaccard similarity for deduplication / redundancy detection. */
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

/** Simple semantic clustering for redundancy detection. */
function clusterBySimilarity(
  results: ResearchSearchResult[],
  threshold: number,
): ResearchSearchResult[][] {
  const clusters: ResearchSearchResult[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < results.length; i++) {
    if (used.has(i)) continue;
    const cluster: ResearchSearchResult[] = [results[i]!];
    used.add(i);

    for (let j = i + 1; j < results.length; j++) {
      if (used.has(j)) continue;
      const text = `${results[j]!.title} ${results[j]!.snippet}`;
      const clusterText = `${cluster[0]!.title} ${cluster[0]!.snippet}`;
      if (jaccardSimilarity(text, clusterText) > threshold) {
        cluster.push(results[j]!);
        used.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

// ── Rule definitions ──────────────────────────────────────────────────

interface BlindSpotRule {
  name: string;
  weight: number;
  detect(ctx: ResearchContext): BlindSpot[];
}

// ── Rule 1: Uncovered aspects ─────────────────────────────────────────

const uncoveredAspectsRule: BlindSpotRule = {
  name: "uncovered_aspects",
  weight: 1.0,
  detect(ctx) {
    // Collect all aspects covered by results
    const covered = new Set<string>();
    for (const r of ctx.results) {
      for (const aspect of r.aspects ?? []) {
        covered.add(aspect.toLowerCase());
      }
      // Also treat the source as a covered dimension
      covered.add(`source:${r.source}`);
    }

    // Each sub-query represents an expected aspect
    return ctx.subQueries
      .filter((q) => {
        const aspectKey = q.aspect.toLowerCase();
        return ![...covered].some((c) => c.includes(aspectKey));
      })
      .map((q) => ({
        id: crypto.randomUUID(),
        aspect: q.aspect,
        reason: "uncovered" as BlindSpotReason,
        priority: q.priority,
        suggestedQueries: [q.query],
      }));
  },
};

// ── Rule 2: Contradiction ─────────────────────────────────────────────

const contradictionRule: BlindSpotRule = {
  name: "contradiction",
  weight: 0.9,
  detect(ctx) {
    const conflicts: BlindSpot[] = [];
    const disputed = ctx.claims.filter((c) => c.status === "disputed");

    for (const claim of disputed) {
      if (claim.contradictingSources.length > 0) {
        conflicts.push({
          id: crypto.randomUUID(),
          aspect: `Contradiction: "${claim.claim.slice(0, 80)}..."`,
          reason: "contradiction",
          priority: 1 - claim.confidence,
          suggestedQueries: [
            `verify: ${claim.claim.slice(0, 100)}`,
            `${claim.claim.slice(0, 100)} fact check`,
          ],
        });
      }
    }

    return conflicts;
  },
};

// ── Rule 3: Shallow coverage ──────────────────────────────────────────

const shallowCoverageRule: BlindSpotRule = {
  name: "shallow_coverage",
  weight: 0.7,
  detect(ctx) {
    return ctx.claims
      .filter(
        (c) =>
          c.sources.length === 1 &&
          c.confidence < 0.8 &&
          c.status !== "verified",
      )
      .map((c) => ({
        id: crypto.randomUUID(),
        aspect: c.claim.slice(0, 100),
        reason: "shallow" as BlindSpotReason,
        priority: 1 - c.confidence,
        suggestedQueries: [
          `additional sources for: ${c.claim.slice(0, 80)}`,
          `${c.claim.slice(0, 80)} corroboration`,
        ],
      }));
  },
};

// ── Rule 4: Staleness ─────────────────────────────────────────────────

const stalenessRule: BlindSpotRule = {
  name: "staleness",
  weight: 0.6,
  detect(ctx) {
    const maxAgeDays = ctx.config?.maxResultAgeDays ?? 365;
    const cutoff = Date.now() - maxAgeDays * 86400000;

    return ctx.results
      .filter((r) => {
        if (!r.timestamp) return false;
        return new Date(r.timestamp).getTime() < cutoff;
      })
      .slice(0, 3) // limit to avoid flooding
      .map((r) => ({
        id: crypto.randomUUID(),
        aspect: `${r.title.slice(0, 80)} (from ${r.source})`,
        reason: "stale" as BlindSpotReason,
        priority: 0.5,
        suggestedQueries: [
          `latest: ${ctx.originalQuery}`,
          `${ctx.originalQuery} 2026`,
        ],
      }));
  },
};

// ── Rule 5: Redundancy (NEW) ──────────────────────────────────────────

const redundancyRule: BlindSpotRule = {
  name: "redundancy",
  weight: 0.4,
  detect(ctx) {
    if (ctx.results.length < 4) return [];

    const clusters = clusterBySimilarity(ctx.results, 0.85);
    return clusters
      .filter((c) => c.length > 3)
      .map((c) => {
        const representative = c[0]!;
        const excludeTerms = representative.title
          .split(" ")
          .slice(0, 3)
          .join(" ");
        return {
          id: crypto.randomUUID(),
          aspect: `Redundant coverage: ${representative.title.slice(0, 80)} (${c.length} similar results)`,
          reason: "shallow" as BlindSpotReason,
          priority: 0.3,
          suggestedQueries: [
            `${ctx.originalQuery} -${excludeTerms}`,
            `${ctx.originalQuery} different perspective`,
          ],
        };
      });
  },
};

// ── Rule 6: Timeliness (NEW) ──────────────────────────────────────────

const TIME_SENSITIVE_PATTERNS = [
  /\b(latest|current|recent|today|202[4-9]|this\s+(year|month|week|quarter))\b/i,
  /\b(stock|price|weather|news|election|breaking|covid|pandemic)\b/i,
  /\b(now|update|breaking|live|ongoing)\b/i,
];

const timelinessRule: BlindSpotRule = {
  name: "timeliness",
  weight: 0.5,
  detect(ctx) {
    const isTimeSensitive = TIME_SENSITIVE_PATTERNS.some((p) =>
      p.test(ctx.originalQuery),
    );
    if (!isTimeSensitive) return [];

    const recentCount = ctx.results.filter((r) => {
      if (!r.timestamp) return true; // assume recent if no timestamp
      return (
        Date.now() - new Date(r.timestamp).getTime() <
        30 * 86400000
      );
    }).length;

    const ratio = ctx.results.length > 0 ? recentCount / ctx.results.length : 0;

    return ratio < 0.5
      ? [
          {
            id: crypto.randomUUID(),
            aspect:
              "Time-sensitive query with mostly old results",
            reason: "stale" as BlindSpotReason,
            priority: 0.8,
            suggestedQueries: [
              `${ctx.originalQuery} latest 2026`,
              `${ctx.originalQuery} this month`,
            ],
          },
        ]
      : [];
  },
};

// ── Rule 7: Low credibility sources (NEW) ─────────────────────────────

const LOW_CREDIBILITY_SOURCES = ["social", "blog", "unknown", "forum", "reddit", "twitter"];

const lowCredibilityRule: BlindSpotRule = {
  name: "low_credibility_sources",
  weight: 0.6,
  detect(ctx) {
    return ctx.claims
      .filter((c) => {
        if (c.confidence >= 0.7) return false;
        if (c.contradictingSources.length > 0) return false;
        return c.sources.every((s) =>
          LOW_CREDIBILITY_SOURCES.some((lcs) =>
            s.toLowerCase().includes(lcs),
          ),
        );
      })
      .slice(0, 3)
      .map((c) => ({
        id: crypto.randomUUID(),
        aspect: c.claim.slice(0, 100),
        reason: "shallow" as BlindSpotReason,
        priority: 0.7,
        suggestedQueries: [
          `${c.claim.slice(0, 80)} site:edu OR site:gov`,
          `${c.claim.slice(0, 80)} authoritative source`,
        ],
      }));
  },
};

// ── All rules ─────────────────────────────────────────────────────────

const ALL_RULES: BlindSpotRule[] = [
  uncoveredAspectsRule,
  contradictionRule,
  shallowCoverageRule,
  stalenessRule,
  redundancyRule,
  timelinessRule,
  lowCredibilityRule,
];

// ── BlindSpotDetector ─────────────────────────────────────────────────

export class BlindSpotDetector {
  private rules: BlindSpotRule[];

  constructor(rules?: BlindSpotRule[]) {
    this.rules = rules ?? ALL_RULES;
  }

  /** Run all detection rules and return aggregated blind spots. */
  detect(context: ResearchContext): BlindSpot[] {
    const spots: BlindSpot[] = [];

    for (const rule of this.rules) {
      try {
        const detected = rule.detect(context);
        spots.push(...detected);
      } catch {
        // Rule failure should not block other rules
      }
    }

    // Deduplicate by aspect similarity
    return this.deduplicate(spots);
  }

  /** Prioritize blind spots by weight * priority. */
  prioritize(spots: BlindSpot[]): BlindSpot[] {
    return [...spots].sort((a, b) => b.priority - a.priority);
  }

  /** Suggest queries for a specific blind spot. */
  suggestQueries(spot: BlindSpot): string[] {
    return spot.suggestedQueries;
  }

  /** Generate a completeness report for the current context. */
  generateCompletenessReport(
    context: ResearchContext,
  ): CompletenessReport {
    const spots = this.detect(context);
    const aspectsCovered = context.claims
      .filter((c) => c.status === "verified")
      .map((c) => c.claim.slice(0, 60));
    const aspectsMissing = spots.map((s) => s.aspect);
    const totalAspects = aspectsCovered.length + aspectsMissing.length;
    const coverageRatio =
      totalAspects > 0 ? aspectsCovered.length / totalAspects : 0;

    // Depth assessment
    const depthPerAspect: Record<string, "deep" | "moderate" | "shallow"> =
      {};
    for (const claim of context.claims) {
      const key = claim.claim.slice(0, 40);
      if (claim.sources.length >= 3 && claim.confidence >= 0.9) {
        depthPerAspect[key] = "deep";
      } else if (claim.sources.length >= 2 || claim.confidence >= 0.7) {
        depthPerAspect[key] = "moderate";
      } else {
        depthPerAspect[key] = "shallow";
      }
    }

    return {
      aspectsCovered,
      aspectsMissing,
      coverageRatio: Math.round(coverageRatio * 100) / 100,
      depthPerAspect,
    };
  }

  private deduplicate(spots: BlindSpot[]): BlindSpot[] {
    const deduped: BlindSpot[] = [];
    for (const spot of spots) {
      const similar = deduped.some(
        (d) =>
          jaccardSimilarity(d.aspect, spot.aspect) > 0.8 &&
          d.reason === spot.reason,
      );
      if (!similar) {
        deduped.push(spot);
      }
    }
    return deduped;
  }
}

export function createBlindSpotDetector(): BlindSpotDetector {
  return new BlindSpotDetector();
}
