/**
 * DeepClaw v3.0.0-beta.3 — Discovery Engine
 *
 * Automated discovery loop: pattern recognition across domains,
 * novel insight generation, and research gap identification.
 */
import type {
  DiscoveredPattern,
  ResearchGap,
  DiscoveryResult,
  DomainEvidence,
} from "./types.js";

// ── Config ───────────────────────────────────────────────────────────

export interface DiscoveryConfig {
  /** Minimum frequency for a term to be considered a pattern */
  minTermFrequency: number;
  /** Minimum number of domains for a cross-domain pattern */
  minCrossDomainCount: number;
  /** Maximum patterns to return */
  maxPatterns: number;
  /** Maximum gaps to report */
  maxGaps: number;
}

export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  minTermFrequency: 2,
  minCrossDomainCount: 2,
  maxPatterns: 10,
  maxGaps: 5,
};

// ── Known research topic categories for gap detection ────────────────

const RESEARCH_TOPIC_TEMPLATES: Array<{
  topic: string;
  keywords: string[];
  requiresDomains: number;
}> = [
  {
    topic: "Ethical implications",
    keywords: ["ethic", "moral", "fair", "bias", "responsible", "伦理", "道德"],
    requiresDomains: 2,
  },
  {
    topic: "Scalability challenges",
    keywords: ["scale", "performance", "throughput", "latency", "扩展", "性能"],
    requiresDomains: 2,
  },
  {
    topic: "Regulatory compliance",
    keywords: ["regulat", "compliance", "legal", "policy", "law", "监管", "合规"],
    requiresDomains: 2,
  },
  {
    topic: "Data privacy concerns",
    keywords: ["privacy", "data protection", "personal data", "gdpr", "隐私"],
    requiresDomains: 2,
  },
  {
    topic: "Implementation feasibility",
    keywords: ["implement", "deploy", "feasib", "practical", "实施", "可行"],
    requiresDomains: 1,
  },
  {
    topic: "Economic impact",
    keywords: ["cost", "economic", "budget", "roi", "investment", "经济", "成本"],
    requiresDomains: 2,
  },
  {
    topic: "Long-term sustainability",
    keywords: ["sustain", "long-term", "future", "maintain", "可持续", "长期"],
    requiresDomains: 2,
  },
];

// ── DiscoveryEngine ──────────────────────────────────────────────────

export class DiscoveryEngine {
  private config: DiscoveryConfig;

  constructor(config?: Partial<DiscoveryConfig>) {
    this.config = { ...DEFAULT_DISCOVERY_CONFIG, ...config };
  }

  /**
   * Discover patterns and research gaps from domain evidence.
   */
  discover(evidence: DomainEvidence[]): DiscoveryResult {
    const patterns = this._findPatterns(evidence);
    const gaps = this._identifyGaps(evidence, patterns);
    const summary = this._buildSummary(patterns, gaps);

    return {
      patterns,
      gaps,
      summary,
      timestamp: new Date(),
    };
  }

  // ── Private ──────────────────────────────────────────────────────────

  private _findPatterns(evidence: DomainEvidence[]): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    let idCounter = 0;

    // Pattern 1: Cross-domain term frequency
    const termDomainMap = new Map<string, Set<string>>();
    for (const e of evidence) {
      for (const term of e.keyTerms) {
        const t = term.toLowerCase();
        if (!termDomainMap.has(t)) termDomainMap.set(t, new Set());
        termDomainMap.get(t)!.add(e.domain);
      }
    }

    for (const [term, domainSet] of termDomainMap) {
      if (domainSet.size >= this.config.minCrossDomainCount && term.length >= 3) {
        patterns.push({
          id: `pattern_${++idCounter}`,
          name: `Cross-domain pattern: "${term}"`,
          description: `Term "${term}" recurs across ${domainSet.size} domains (${[...domainSet].join(", ")})`,
          domains: [...domainSet],
          strength: Math.min(1, domainSet.size / Math.max(evidence.length, 1) + 0.3),
          supportingEvidence: [`Found in ${domainSet.size} of ${evidence.length} domains`],
          firstSeen: new Date(),
        });
      }
    }

    // Pattern 2: Domain pair correlation via claim overlap
    for (let i = 0; i < evidence.length; i++) {
      for (let j = i + 1; j < evidence.length; j++) {
        const a = evidence[i]!;
        const b = evidence[j]!;

        const aText = a.claims.join(" ").toLowerCase();
        const bText = b.claims.join(" ").toLowerCase();

        const aWords = new Set(
          aText.split(/\s+/).filter((w) => w.length > 4),
        );
        const bWords = new Set(
          bText.split(/\s+/).filter((w) => w.length > 4),
        );
        const shared = [...aWords].filter((w) => bWords.has(w));

        if (shared.length >= this.config.minTermFrequency) {
          patterns.push({
            id: `pattern_${++idCounter}`,
            name: `Domain correlation: ${a.domain} ↔ ${b.domain}`,
            description: `${shared.length} shared concepts between "${a.domain}" and "${b.domain}": ${shared.slice(0, 5).join(", ")}`,
            domains: [a.domain, b.domain],
            strength: Math.min(
              1,
              shared.length / Math.max(aWords.size, bWords.size, 1) + 0.2,
            ),
            supportingEvidence: shared.slice(0, 5),
            firstSeen: new Date(),
          });
        }
      }
    }

    return patterns
      .sort((a, b) => b.strength - a.strength)
      .slice(0, this.config.maxPatterns);
  }

  private _identifyGaps(
    evidence: DomainEvidence[],
    patterns: DiscoveredPattern[],
  ): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    let idCounter = 0;

    const allText = evidence
      .flatMap((e) => e.claims)
      .join(" ")
      .toLowerCase();
    const coveredDomains = new Set(evidence.map((e) => e.domain));

    // Gap detection: check known research topics for missing coverage
    for (const template of RESEARCH_TOPIC_TEMPLATES) {
      const isCovered = template.keywords.some((kw) =>
        allText.includes(kw),
      );

      if (!isCovered && evidence.length >= template.requiresDomains) {
        gaps.push({
          id: `gap_${++idCounter}`,
          domain: [...coveredDomains].slice(0, 2).join(" + "),
          topic: template.topic,
          description: `No evidence found for "${template.topic}" across ${evidence.length} domains`,
          priority: evidence.length >= 3 ? "high" : "medium",
          relatedFindings: [],
        });
      }
    }

    // Gap detection: isolated domains with no cross-domain patterns
    for (const e of evidence) {
      const hasPattern = patterns.some((p) =>
        p.domains.includes(e.domain),
      );
      if (!hasPattern && evidence.length >= 2) {
        gaps.push({
          id: `gap_${++idCounter}`,
          domain: e.domain,
          topic: "Cross-domain integration",
          description: `Domain "${e.domain}" has no cross-domain connections — isolated from other domains`,
          priority: "high",
          relatedFindings: [],
        });
      }
    }

    return gaps.slice(0, this.config.maxGaps);
  }

  private _buildSummary(
    patterns: DiscoveredPattern[],
    gaps: ResearchGap[],
  ): string {
    const parts: string[] = [];

    if (patterns.length > 0) {
      const topPatterns = patterns
        .slice(0, 3)
        .map((p) => p.name)
        .join("; ");
      parts.push(
        `Discovered ${patterns.length} cross-domain patterns (top: ${topPatterns})`,
      );
    } else {
      parts.push("No significant cross-domain patterns discovered");
    }

    if (gaps.length > 0) {
      const highGaps = gaps.filter((g) => g.priority === "high").length;
      parts.push(
        `Identified ${gaps.length} research gaps (${highGaps} high priority)`,
      );
    } else {
      parts.push("No significant research gaps identified");
    }

    return parts.join(". ");
  }
}

/** Factory function for DiscoveryEngine */
export function createDiscoveryEngine(
  config?: Partial<DiscoveryConfig>,
): DiscoveryEngine {
  return new DiscoveryEngine(config);
}
