/**
 * SciClaw v3.0.0-rc.1 — Knowledge Evolution
 *
 * Dynamic knowledge graph updates, fact freshness tracking,
 * outdated information flagging, and knowledge versioning.
 */
import type {
  Fact,
  FactUpdate,
  FreshnessReport,
} from "./types.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface KnowledgeEvolutionConfig {
  freshnessThresholdHigh: number; // ≥ this = fresh
  freshnessThresholdLow: number; // < this = outdated
  freshnessDecayRate: number; // per-day decay
  maxFactVersions: number;
  minConfidenceForFact: number;
}

export const DEFAULT_KNOWLEDGE_EVOLUTION_CONFIG: KnowledgeEvolutionConfig = {
  freshnessThresholdHigh: 0.9,
  freshnessThresholdLow: 0.5,
  freshnessDecayRate: 0.01, // 1% freshness decay per day
  maxFactVersions: 10,
  minConfidenceForFact: 0.3,
};

// ── Knowledge Evolution ────────────────────────────────────────────────

export class KnowledgeEvolution {
  private config: KnowledgeEvolutionConfig;
  private facts: Map<string, Fact> = new Map();
  private updateLog: FactUpdate[] = [];

  constructor(config?: Partial<KnowledgeEvolutionConfig>) {
    this.config = { ...DEFAULT_KNOWLEDGE_EVOLUTION_CONFIG, ...config };
  }

  /** Update knowledge base with new facts */
  async updateKnowledge(newFacts: Fact[]): Promise<void> {
    for (const fact of newFacts) {
      if (fact.confidence < this.config.minConfidenceForFact) continue;
      this._upsertFact(fact);
    }
  }

  /** Get freshness report for all facts */
  getFreshnessReport(): FreshnessReport {
    let fresh = 0;
    let stale = 0;
    let outdated = 0;

    for (const fact of this.facts.values()) {
      const f = this._calculateFreshness(fact);
      if (f >= this.config.freshnessThresholdHigh) fresh++;
      else if (f >= this.config.freshnessThresholdLow) stale++;
      else outdated++;
    }

    const total = this.facts.size || 1;
    return {
      totalFacts: this.facts.size,
      fresh,
      stale,
      outdated,
      freshnessRatio: fresh / total,
    };
  }

  /** Get outdated facts that need review */
  getOutdatedFacts(): Fact[] {
    const result: Fact[] = [];
    for (const fact of this.facts.values()) {
      const f = this._calculateFreshness(fact);
      if (f < this.config.freshnessThresholdLow) {
        result.push(fact);
      }
    }
    return result.sort((a, b) =>
      this._calculateFreshness(a) - this._calculateFreshness(b),
    );
  }

  /** Get facts by domain */
  getFactsByDomain(domain: string): Fact[] {
    return Array.from(this.facts.values())
      .filter((f) => f.domain === domain)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /** Get all facts */
  getAllFacts(): Fact[] {
    return Array.from(this.facts.values());
  }

  /** Get fact update history */
  getUpdateLog(): FactUpdate[] {
    return [...this.updateLog];
  }

  /** Mark facts as verified (reset freshness) */
  verifyFacts(factIds: string[]): void {
    for (const id of factIds) {
      const fact = this.facts.get(id);
      if (fact) {
        fact.lastVerified = new Date();
        fact.freshness = 1;
      }
    }
  }

  /** Calculate current freshness of a fact */
  getFactFreshness(factId: string): number {
    const fact = this.facts.get(factId);
    if (!fact) return 0;
    return this._calculateFreshness(fact);
  }

  get knowledgeUpdates(): number {
    return this.updateLog.length;
  }

  // ── Private ──────────────────────────────────────────────────────────

  private _upsertFact(newFact: Fact): void {
    const existing = this.facts.get(newFact.id);

    if (!existing) {
      this.facts.set(newFact.id, { ...newFact, freshness: 1, version: 1 });
      this.updateLog.push({
        factId: newFact.id,
        field: "statement",
        oldValue: null,
        newValue: newFact.statement,
        reason: "new fact added",
        timestamp: new Date(),
      });
      return;
    }

    // Update existing fact
    if (existing.version >= this.config.maxFactVersions) return;

    const fields: (keyof Fact)[] = [
      "statement",
      "confidence",
      "domain",
      "sources",
    ];

    for (const field of fields) {
      const oldVal = existing[field];
      const newVal = newFact[field];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        this.updateLog.push({
          factId: newFact.id,
          field,
          oldValue: oldVal,
          newValue: newVal,
          reason: "fact updated",
          timestamp: new Date(),
        });

        (existing as unknown as Record<string, unknown>)[field] = newVal;
      }
    }

    existing.version++;
    existing.lastVerified = newFact.lastVerified;
    existing.freshness = 1; // Reset on update
  }

  private _calculateFreshness(fact: Fact): number {
    const daysSinceVerified =
      (Date.now() - fact.lastVerified.getTime()) / (1000 * 60 * 60 * 24);
    const decay = daysSinceVerified * this.config.freshnessDecayRate;
    return Math.max(0, fact.freshness - decay);
  }
}

/** Factory function for KnowledgeEvolution */
export function createKnowledgeEvolution(
  config?: Partial<KnowledgeEvolutionConfig>,
): KnowledgeEvolution {
  return new KnowledgeEvolution(config);
}
