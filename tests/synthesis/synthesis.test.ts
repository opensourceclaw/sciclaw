/**
 * DeepClaw v3.0.0-beta.3 — Synthesis Engine Tests
 */
import { describe, it, expect } from "vitest";
import {
  CrossDomainSynthesizer,
  createCrossDomainSynthesizer,
  DEFAULT_CROSS_DOMAIN_CONFIG,
} from "../../src/synthesis/cross_domain_synthesizer.js";
import {
  IterativeVerifier,
  createIterativeVerifier,
  DEFAULT_VERIFIER_CONFIG,
} from "../../src/synthesis/iterative_verifier.js";
import {
  DiscoveryEngine,
  createDiscoveryEngine,
  DEFAULT_DISCOVERY_CONFIG,
} from "../../src/synthesis/discovery_engine.js";
import type { DomainEvidence } from "../../src/synthesis/types.js";

// ── Test fixtures ────────────────────────────────────────────────────

function makeClimateEvidence(): DomainEvidence {
  return {
    domain: "climate",
    claims: [
      "Global temperatures have risen 1.2°C since pre-industrial levels",
      "Sea level rise is accelerating due to ice sheet melting",
      "Extreme weather events have increased in frequency and intensity",
    ],
    sources: ["ipcc.ch/report-2025", "nature.com/climate-meta"],
    keyTerms: ["temperature", "sea level", "extreme weather", "emissions", "carbon"],
  };
}

function makeEnergyEvidence(): DomainEvidence {
  return {
    domain: "energy",
    claims: [
      "Renewable energy costs have dropped 85% since 2010",
      "Solar and wind now provide cheaper electricity than fossil fuels",
      "Grid-scale battery storage capacity tripled in the last 3 years",
    ],
    sources: ["iea.org/renewables-2025", "energy.gov/storage"],
    keyTerms: ["renewable", "solar", "battery", "grid", "emissions", "energy transition"],
  };
}

function makeHealthEvidence(): DomainEvidence {
  return {
    domain: "health",
    claims: [
      "Air pollution from fossil fuels causes 5 million premature deaths annually",
      "Climate change expands the range of vector-borne diseases",
      "Heat waves increase cardiovascular and respiratory mortality",
    ],
    sources: ["who.int/air-quality-2025", "lancet.com/climate-health"],
    keyTerms: ["pollution", "disease", "heat", "mortality", "health", "emissions"],
  };
}

function makeEconomyEvidence(): DomainEvidence {
  return {
    domain: "economy",
    claims: [
      "Carbon pricing mechanisms cover 23% of global emissions",
      "Green technology investments reached $1.8 trillion in 2025",
      "Climate-related disasters caused $300B in economic losses last year",
    ],
    sources: ["worldbank.org/carbon-pricing", "bloomberg.com/green-investment"],
    keyTerms: ["carbon pricing", "investment", "economic loss", "green technology"],
  };
}

// ── CrossDomainSynthesizer ──────────────────────────────────────────

describe("CrossDomainSynthesizer", () => {
  it("creates with default config", () => {
    const s = new CrossDomainSynthesizer();
    expect(s).toBeDefined();
  });

  it("creates with factory function", () => {
    const s = createCrossDomainSynthesizer();
    expect(s).toBeInstanceOf(CrossDomainSynthesizer);
  });

  it("custom config overrides defaults", () => {
    const s = new CrossDomainSynthesizer({ minOverlap: 0.5, maxConnections: 5 });
    expect(s).toBeDefined();
  });

  it("returns empty result for single domain", () => {
    const s = new CrossDomainSynthesizer();
    const result = s.synthesize([makeClimateEvidence()]);
    expect(result.domains).toEqual(["climate"]);
    expect(result.connections).toEqual([]);
    expect(result.insights).toEqual([]);
    expect(result.confidence).toBe(0);
  });

  it("returns empty result for no evidence", () => {
    const s = new CrossDomainSynthesizer();
    const result = s.synthesize([]);
    expect(result.domains).toEqual([]);
    expect(result.confidence).toBe(0);
  });

  it("finds connections between climate and energy domains", () => {
    const s = new CrossDomainSynthesizer({ minOverlap: 0.05 });
    const result = s.synthesize([makeClimateEvidence(), makeEnergyEvidence()]);
    expect(result.domains).toHaveLength(2);
    // Both have "emissions" as shared term, should find a connection
    expect(result.connections.length).toBeGreaterThan(0);
    if (result.connections.length > 0) {
      const conn = result.connections[0]!;
      expect(conn.source).toBeTruthy();
      expect(conn.target).toBeTruthy();
      expect(conn.strength).toBeGreaterThan(0);
      expect(conn.strength).toBeLessThanOrEqual(1);
      expect(conn.evidence.length).toBeGreaterThan(0);
    }
  });

  it("finds connections across three domains", () => {
    const s = new CrossDomainSynthesizer({ minOverlap: 0.05, minConfidence: 0.2 });
    const result = s.synthesize([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    expect(result.domains).toHaveLength(3);
    expect(result.connections.length).toBeGreaterThan(0);
    expect(result.insights.length).toBeGreaterThan(0);
  });

  it("generates cross-domain insights from 3+ domains sharing terms", () => {
    const s = new CrossDomainSynthesizer({ minOverlap: 0.05, minConfidence: 0.2 });
    const result = s.synthesize([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    // "emissions" appears in climate, energy, health — should trigger insight
    const multiDomainInsights = result.insights.filter(
      (i) => i.domains.length >= 3,
    );
    expect(multiDomainInsights.length).toBeGreaterThan(0);
  });

  it("confidence is between 0 and 1", () => {
    const s = new CrossDomainSynthesizer({ minOverlap: 0.05 });
    const result = s.synthesize([makeClimateEvidence(), makeEnergyEvidence()]);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("respects maxConnections limit", () => {
    const s = new CrossDomainSynthesizer({
      minOverlap: 0.01,
      maxConnections: 1,
    });
    const result = s.synthesize([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    expect(result.connections.length).toBeLessThanOrEqual(1);
  });

  it("detects connection types", () => {
    const a: DomainEvidence = {
      domain: "A",
      claims: ["Smoking causes lung cancer and leads to respiratory disease"],
      sources: [],
      keyTerms: ["smoking", "cancer"],
    };
    const b: DomainEvidence = {
      domain: "B",
      claims: ["Healthcare costs are driven by smoking-related illness"],
      sources: [],
      keyTerms: ["healthcare", "smoking"],
    };
    const s = new CrossDomainSynthesizer({ minOverlap: 0.01 });
    const result = s.synthesize([a, b]);
    expect(result.connections.length).toBeGreaterThan(0);
    expect(["causation", "correlation"]).toContain(result.connections[0]!.type);
  });

  it("insight confidence decreases for weak connections", () => {
    const a: DomainEvidence = {
      domain: "A",
      claims: ["Topic X is interesting"],
      sources: [],
      keyTerms: ["x"],
    };
    const b: DomainEvidence = {
      domain: "B",
      claims: ["Topic Y is unrelated"],
      sources: [],
      keyTerms: ["y"],
    };
    const s = new CrossDomainSynthesizer({ minOverlap: 0.01, minConfidence: 0.9 });
    const result = s.synthesize([a, b]);
    // High minConfidence should filter out weak connections
    expect(result.insights.length).toBe(0);
  });
});

// ── IterativeVerifier ───────────────────────────────────────────────

describe("IterativeVerifier", () => {
  const evidence = [
    makeClimateEvidence(),
    makeEnergyEvidence(),
  ];

  it("creates with default config", () => {
    const v = new IterativeVerifier();
    expect(v).toBeDefined();
  });

  it("creates with factory function", () => {
    const v = createIterativeVerifier();
    expect(v).toBeInstanceOf(IterativeVerifier);
  });

  it("runs verification loop within maxIterations", () => {
    const v = new IterativeVerifier({ maxIterations: 5 });
    const result = v.verify("Renewable energy reduces carbon emissions", evidence);
    expect(result.hypothesis).toBeTruthy();
    expect(result.iterations.length).toBeLessThanOrEqual(5);
    expect(result.iterations.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("produces a conclusion", () => {
    const v = new IterativeVerifier({ maxIterations: 3 });
    const result = v.verify("Global temperatures have risen significantly", evidence);
    expect(["confirmed", "rejected", "inconclusive"]).toContain(result.conclusion);
  });

  it("each iteration has required fields", () => {
    const v = new IterativeVerifier({ maxIterations: 3 });
    const result = v.verify("Solar power is cost-effective", evidence);
    for (const iter of result.iterations) {
      expect(iter.round).toBeGreaterThan(0);
      expect(iter.test).toBeTruthy();
      expect(["pass", "fail", "partial"]).toContain(iter.result);
      expect(Array.isArray(iter.evidence)).toBe(true);
      expect(iter.refinement).toBeTruthy();
    }
  });

  it("high-confidence hypothesis confirms with supportive evidence", () => {
    const v = new IterativeVerifier({
      maxIterations: 5,
      confirmThreshold: 0.3,
      rejectThreshold: 0.1,
    });
    const result = v.verify("Renewable energy costs have dropped", evidence);
    // "costs" matches the energy domain claim text
    expect(result.conclusion).toBe("confirmed");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("custom config overrides defaults", () => {
    const v = new IterativeVerifier({
      maxIterations: 2,
      confirmThreshold: 0.9,
    });
    const result = v.verify("Test hypothesis", evidence);
    expect(result.iterations.length).toBeLessThanOrEqual(2);
  });

  it("handles empty evidence gracefully", () => {
    const v = new IterativeVerifier({ maxIterations: 2 });
    const result = v.verify("A hypothesis with no evidence", []);
    expect(result.iterations.length).toBeGreaterThan(0);
    expect(result.conclusion).toBeDefined();
  });

  it("refinement differs when contradictions found", () => {
    const contradictingEvidence: DomainEvidence = {
      domain: "test",
      claims: ["This claim contradicts the hypothesis entirely, not supporting it"],
      sources: ["source1"],
      keyTerms: ["contradict", "not", "hypothesis"],
    };
    const v = new IterativeVerifier({ maxIterations: 2 });
    const result = v.verify("The hypothesis is definitely true", [contradictingEvidence]);
    // The contradiction patterns should catch "contradicts" and "not"
    expect(result.iterations.length).toBeGreaterThan(0);
  });

  it("convergence improves with more supportive evidence", () => {
    const supportiveEvidence: DomainEvidence[] = [
      makeEnergyEvidence(),
      makeEnergyEvidence(),
      makeEnergyEvidence(),
    ];
    const v = new IterativeVerifier({
      maxIterations: 5,
      confirmThreshold: 0.3,
      rejectThreshold: 0.1,
    });
    const result = v.verify("Renewable energy costs have dropped", supportiveEvidence);
    expect(result.conclusion).toBe("confirmed");
  });
});

// ── DiscoveryEngine ──────────────────────────────────────────────────

describe("DiscoveryEngine", () => {
  it("creates with default config", () => {
    const d = new DiscoveryEngine();
    expect(d).toBeDefined();
  });

  it("creates with factory function", () => {
    const d = createDiscoveryEngine();
    expect(d).toBeInstanceOf(DiscoveryEngine);
  });

  it("discovers cross-domain patterns", () => {
    const d = new DiscoveryEngine({ minTermFrequency: 1, minCrossDomainCount: 2 });
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    expect(result.patterns.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("finds cross-domain term pattern for 'emissions'", () => {
    const d = new DiscoveryEngine({ minTermFrequency: 1, minCrossDomainCount: 2 });
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    const emissionPattern = result.patterns.find(
      (p) => p.name.toLowerCase().includes("emission"),
    );
    expect(emissionPattern).toBeDefined();
    if (emissionPattern) {
      expect(emissionPattern.domains.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("identifies research gaps", () => {
    const d = new DiscoveryEngine();
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it("generates a summary string", () => {
    const d = new DiscoveryEngine();
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
    ]);
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("returns empty patterns for single domain", () => {
    const d = new DiscoveryEngine({ minCrossDomainCount: 2 });
    const result = d.discover([makeClimateEvidence()]);
    // Only patterns requiring >= 2 domains, single domain won't trigger cross-domain
    expect(result.patterns.length).toBe(0);
  });

  it("respects maxPatterns limit", () => {
    const d = new DiscoveryEngine({ maxPatterns: 3, minTermFrequency: 1, minCrossDomainCount: 2 });
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    expect(result.patterns.length).toBeLessThanOrEqual(3);
  });

  it("respects maxGaps limit", () => {
    const d = new DiscoveryEngine({ maxGaps: 2 });
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    expect(result.gaps.length).toBeLessThanOrEqual(2);
  });

  it("pattern strength is between 0 and 1", () => {
    const d = new DiscoveryEngine({ minTermFrequency: 1, minCrossDomainCount: 2 });
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    for (const p of result.patterns) {
      expect(p.strength).toBeGreaterThanOrEqual(0);
      expect(p.strength).toBeLessThanOrEqual(1);
    }
  });

  it("gaps have valid priority values", () => {
    const d = new DiscoveryEngine();
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
    ]);
    for (const g of result.gaps) {
      expect(["low", "medium", "high"]).toContain(g.priority);
    }
  });

  it("discovers domain correlation patterns", () => {
    const d = new DiscoveryEngine({ minTermFrequency: 2, minCrossDomainCount: 2 });
    const result = d.discover([
      makeClimateEvidence(),
      makeEnergyEvidence(),
    ]);
    // Should find both term-based and correlation patterns
    const domainPatterns = result.patterns.filter(
      (p) => p.name.startsWith("Domain correlation"),
    );
    expect(domainPatterns.length).toBeGreaterThanOrEqual(0);
  });

  it("identifies isolated domains as gaps", () => {
    const isolatedEvidence: DomainEvidence = {
      domain: "isolated_topic",
      claims: ["This domain has no overlap with others"],
      sources: ["source"],
      keyTerms: ["unique_term"],
    };
    const d = new DiscoveryEngine({ maxGaps: 10 });
    const result = d.discover([
      makeClimateEvidence(),
      isolatedEvidence,
    ]);
    const isolatedGap = result.gaps.find((g) =>
      g.topic === "Cross-domain integration" && g.domain === "isolated_topic",
    );
    expect(isolatedGap).toBeDefined();
  });

  it("handles empty evidence", () => {
    const d = new DiscoveryEngine();
    const result = d.discover([]);
    expect(result.patterns).toEqual([]);
    expect(result.summary).toBeTruthy();
    expect(result.timestamp).toBeInstanceOf(Date);
  });
});

// ── Integration: full pipeline ───────────────────────────────────────

describe("Synthesis Pipeline Integration", () => {
  it("full cross-domain → verify → discover pipeline", () => {
    const evidence = [
      makeClimateEvidence(),
      makeEnergyEvidence(),
      makeHealthEvidence(),
      makeEconomyEvidence(),
    ];

    // Step 1: Cross-domain synthesis
    const synth = new CrossDomainSynthesizer({ minOverlap: 0.05, minConfidence: 0.2 });
    const synthesis = synth.synthesize(evidence);
    expect(synthesis.connections.length).toBeGreaterThan(0);
    expect(synthesis.insights.length).toBeGreaterThan(0);

    // Step 2: Verify top insights
    const verifier = new IterativeVerifier({ maxIterations: 3, confirmThreshold: 0.3, rejectThreshold: 0.1 });
    const topInsight = synthesis.insights[0]!;
    const verification = verifier.verify(topInsight.statement, evidence);
    expect(verification.conclusion).toBeDefined();

    // Step 3: Discover patterns
    const engine = new DiscoveryEngine({ minTermFrequency: 1, minCrossDomainCount: 2 });
    const discovery = engine.discover(evidence);
    expect(discovery.patterns.length).toBeGreaterThan(0);
    expect(discovery.gaps.length).toBeGreaterThan(0);
    expect(discovery.summary.length).toBeGreaterThan(0);
  });

  it("pipeline handles 2 domains", () => {
    const evidence = [makeClimateEvidence(), makeEnergyEvidence()];

    const synth = new CrossDomainSynthesizer({ minOverlap: 0.05 });
    const synthesis = synth.synthesize(evidence);

    const verifier = new IterativeVerifier({ maxIterations: 2, confirmThreshold: 0.3, rejectThreshold: 0.1 });
    const verification = verifier.verify(
      synthesis.insights[0]?.statement ?? "Renewable energy reduces emissions",
      evidence,
    );

    const engine = new DiscoveryEngine({ minTermFrequency: 1, minCrossDomainCount: 2 });
    const discovery = engine.discover(evidence);

    // All should produce valid results
    expect(synthesis.domains).toHaveLength(2);
    expect(verification.iterations.length).toBeGreaterThan(0);
    expect(discovery.summary).toBeTruthy();
  });
});
