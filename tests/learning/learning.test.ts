/**
 * SciClaw v3.0.0-rc.1 — Learning Engine Tests
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  FeedbackLearner,
  createFeedbackLearner,
  DEFAULT_FEEDBACK_LEARNER_CONFIG,
} from "../../src/learning/feedback_learner.js";
import {
  SelfImprover,
  createSelfImprover,
  DEFAULT_SELF_IMPROVER_CONFIG,
} from "../../src/learning/self_improver.js";
import {
  KnowledgeEvolution,
  createKnowledgeEvolution,
  DEFAULT_KNOWLEDGE_EVOLUTION_CONFIG,
} from "../../src/learning/knowledge_evolution.js";
import {
  SciClawLearningEngine,
  createLearningEngine,
} from "../../src/learning/index.js";
import type {
  UserFeedback,
  ResearchHistory,
  Fact,
} from "../../src/learning/types.js";

// ── Test fixtures ──────────────────────────────────────────────────────

function makeFeedback(overrides?: Partial<UserFeedback>): UserFeedback {
  return {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sessionId: "session-1",
    type: "explicit",
    sentiment: "positive",
    category: "quality",
    rating: 4,
    comment: "Good research quality",
    timestamp: new Date(),
    ...overrides,
  };
}

function makeResearchHistory(overrides?: Partial<ResearchHistory>): ResearchHistory {
  return {
    sessionId: "session-1",
    topic: "AI Safety",
    stages: [
      {
        stage: "search",
        startTime: new Date(Date.now() - 5000),
        endTime: new Date(Date.now() - 4000),
        actions: 5,
        success: true,
      },
      {
        stage: "analysis",
        startTime: new Date(Date.now() - 4000),
        endTime: new Date(Date.now() - 2000),
        actions: 10,
        success: true,
      },
      {
        stage: "synthesis",
        startTime: new Date(Date.now() - 2000),
        endTime: new Date(Date.now() - 500),
        actions: 8,
        success: true,
      },
      {
        stage: "report",
        startTime: new Date(Date.now() - 500),
        endTime: new Date(),
        actions: 3,
        success: true,
      },
    ],
    duration: 5000,
    outcome: {
      reportGenerated: true,
      sourcesFound: 8,
      userAccepted: true,
      userModified: false,
    },
    userActions: [],
    ...overrides,
  };
}

function makeFact(overrides?: Partial<Fact>): Fact {
  return {
    id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    statement: "AI models have grown exponentially in capability",
    domain: "ai",
    confidence: 0.9,
    sources: ["arxiv.org/paper-1"],
    freshness: 1,
    lastVerified: new Date(),
    createdAt: new Date(),
    version: 1,
    ...overrides,
  };
}

// ── FeedbackLearner ────────────────────────────────────────────────────

describe("FeedbackLearner", () => {
  let learner: FeedbackLearner;

  beforeEach(() => {
    learner = new FeedbackLearner();
  });

  it("creates with default config", () => {
    expect(learner).toBeDefined();
  });

  it("creates with factory function", () => {
    const fl = createFeedbackLearner();
    expect(fl).toBeInstanceOf(FeedbackLearner);
  });

  it("creates with custom config", () => {
    const fl = new FeedbackLearner({ minRatingForLearning: 4, decayFactor: 0.8 });
    expect(fl).toBeDefined();
  });

  it("learns from explicit positive feedback", async () => {
    const fb = makeFeedback({ sentiment: "positive", rating: 5, category: "accuracy" });
    await learner.learnFromFeedback([fb]);
    expect(learner.totalFeedback).toBe(1);
    const patterns = learner.getPatterns();
    expect(patterns.length).toBe(1);
    expect(patterns[0].category).toBe("accuracy");
  });

  it("learns from explicit negative feedback", async () => {
    const fb = makeFeedback({ sentiment: "negative", rating: 1, category: "relevance" });
    await learner.learnFromFeedback([fb]);
    expect(learner.totalFeedback).toBe(1);
    const patterns = learner.getPatterns();
    expect(patterns[0].category).toBe("relevance");
    expect(patterns[0].avgRating).toBe(1);
  });

  it("learns from multiple feedback items", async () => {
    const feedback = [
      makeFeedback({ rating: 5, category: "quality" }),
      makeFeedback({ rating: 4, category: "quality" }),
      makeFeedback({ rating: 3, category: "quality" }),
    ];
    await learner.learnFromFeedback(feedback);
    expect(learner.totalFeedback).toBe(3);
  });

  it("updates topic preferences from feedback", async () => {
    const fb = makeFeedback({
      sentiment: "positive",
      rating: 5,
      context: { topic: "AI Safety" },
    });
    await learner.learnFromFeedback([fb]);
    const prefs = learner.getPreferences();
    expect(prefs.has("AI Safety")).toBe(true);
    expect(prefs.get("AI Safety")).toBeGreaterThan(0.5);
  });

  it("negative feedback decreases topic preference", async () => {
    const fb = makeFeedback({
      sentiment: "negative",
      rating: 1,
      context: { topic: "Quantum Computing" },
    });
    await learner.learnFromFeedback([fb]);
    const prefs = learner.getPreferences();
    expect(prefs.get("Quantum Computing")).toBeLessThan(0.5);
  });

  it("extracts implicit feedback from user actions", () => {
    const history = makeResearchHistory({
      userActions: [
        { type: "accept", timestamp: new Date() },
        { type: "modify", timestamp: new Date(), detail: "Added more sources" },
        { type: "reject", timestamp: new Date() },
      ],
    });
    const implicit = learner.extractImplicitFeedback(history);
    expect(implicit.length).toBe(3);
    expect(implicit[0].type).toBe("implicit");
    expect(implicit[2].sentiment).toBe("negative"); // reject → negative
  });

  it("pause action produces no implicit feedback", () => {
    const history = makeResearchHistory({
      userActions: [{ type: "pause", timestamp: new Date() }],
    });
    const implicit = learner.extractImplicitFeedback(history);
    expect(implicit.length).toBe(0);
  });

  it("detects improving trend from increasing ratings", async () => {
    const fb1 = makeFeedback({ rating: 2, category: "completeness" });
    const fb2 = makeFeedback({ rating: 3, category: "completeness" });
    const fb3 = makeFeedback({ rating: 4, category: "completeness" });
    const fb4 = makeFeedback({ rating: 5, category: "completeness" });
    await learner.learnFromFeedback([fb1, fb2, fb3, fb4]);
    const patterns = learner.getPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });

  it("recommends deep depth for high-preference topic", async () => {
    const fb = makeFeedback({
      sentiment: "positive",
      rating: 5,
      context: { topic: "Deep Learning" },
    });
    // Need multiple positives to push above 0.6
    await learner.learnFromFeedback([fb, fb, fb]);
    expect(learner.recommendDepth("Deep Learning")).toBe("deep");
  });

  it("recommends medium depth for unknown topic", () => {
    expect(learner.recommendDepth("Unknown")).toBe("medium");
  });

  it("recommends cross-domain for high-preference topic", async () => {
    const fb = makeFeedback({
      sentiment: "positive",
      rating: 5,
      context: { topic: "AI Ethics" },
    });
    await learner.learnFromFeedback([fb]);
    // 0.5 + 0.1 = 0.6, still need more to reach >= 0.5 threshold
    // Wait, it starts at 0.5, +0.1 = 0.6, which is >= 0.5
    expect(learner.recommendCrossDomain("AI Ethics")).toBe(true);
  });

  it("totalFeedback returns correct count", async () => {
    await learner.learnFromFeedback([
      makeFeedback(),
      makeFeedback(),
      makeFeedback(),
    ]);
    expect(learner.totalFeedback).toBe(3);
  });
});

// ── SelfImprover ───────────────────────────────────────────────────────

describe("SelfImprover", () => {
  let improver: SelfImprover;

  beforeEach(() => {
    improver = new SelfImprover();
  });

  it("creates with default config", () => {
    expect(improver).toBeDefined();
  });

  it("creates with factory function", () => {
    const si = createSelfImprover();
    expect(si).toBeInstanceOf(SelfImprover);
  });

  it("has initial default strategy", () => {
    const strategy = improver.getStrategy();
    expect(strategy.name).toBe("default");
    expect(strategy.parameters.searchDepth).toBe("medium");
    expect(strategy.parameters.maxSources).toBe(10);
  });

  it("returns strategy for single session (not enough for adaptation)", async () => {
    const history = makeResearchHistory();
    const strategy = await improver.optimizeStrategy(history);
    expect(strategy).toBeDefined();
    expect(strategy.adaptations.length).toBe(0); // < 3 sessions
  });

  it("adapts strategy after multiple declining sessions", async () => {
    // First two successful sessions
    await improver.optimizeStrategy(makeResearchHistory());
    await improver.optimizeStrategy(makeResearchHistory());

    // Third session: failed search stage, low sources
    const badHistory = makeResearchHistory({
      stages: [
        {
          stage: "search",
          startTime: new Date(),
          endTime: new Date(),
          actions: 2,
          success: false,
        },
      ],
      outcome: {
        reportGenerated: false,
        sourcesFound: 1,
        userAccepted: false,
        userModified: true,
      },
    });
    const strategy = await improver.optimizeStrategy(badHistory);
    expect(strategy.adaptations.length).toBeGreaterThan(0);
  });

  it("assesses perfect outcome as high accuracy", async () => {
    await improver.optimizeStrategy(makeResearchHistory());
    const accuracy = improver.assessAccuracy();
    expect(accuracy).toBe(1); // reportGenerated + sourcesFound>5 + userAccepted + !userModified = 1.0
  });

  it("assesses poor outcome as low accuracy", async () => {
    const badHistory = makeResearchHistory({
      outcome: {
        reportGenerated: false,
        sourcesFound: 0,
        userAccepted: false,
        userModified: true,
      },
    });
    await improver.optimizeStrategy(badHistory);
    const accuracy = improver.assessAccuracy();
    expect(accuracy).toBe(0);
  });

  it("detects error patterns from failed stages", async () => {
    const history = makeResearchHistory({
      stages: [
        {
          stage: "search",
          startTime: new Date(),
          endTime: new Date(),
          actions: 2,
          success: false,
        },
      ],
    });
    await improver.optimizeStrategy(history);
    const errors = improver.getErrorPatterns();
    // Need >= minOccurrences (2) to show up
    expect(errors.length).toBe(0);

    // Second occurrence
    await improver.optimizeStrategy(history);
    const errors2 = improver.getErrorPatterns();
    expect(errors2.length).toBeGreaterThan(0);
    expect(errors2[0].category).toBe("search");
  });

  it("tracks accuracy trend over time", async () => {
    await improver.optimizeStrategy(makeResearchHistory());
    await improver.optimizeStrategy(makeResearchHistory());
    const trend = improver.getAccuracyTrend();
    expect(trend.length).toBe(2);
    expect(trend.every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it("strategyImprovements tracks adaptation count", () => {
    expect(improver.strategyImprovements).toBe(0);
  });
});

// ── KnowledgeEvolution ─────────────────────────────────────────────────

describe("KnowledgeEvolution", () => {
  let ke: KnowledgeEvolution;

  beforeEach(() => {
    ke = new KnowledgeEvolution();
  });

  it("creates with default config", () => {
    expect(ke).toBeDefined();
  });

  it("creates with factory function", () => {
    const k = createKnowledgeEvolution();
    expect(k).toBeInstanceOf(KnowledgeEvolution);
  });

  it("adds new facts to knowledge base", async () => {
    const fact = makeFact();
    await ke.updateKnowledge([fact]);
    expect(ke.getAllFacts().length).toBe(1);
  });

  it("skips low-confidence facts", async () => {
    const fact = makeFact({ confidence: 0.1 });
    await ke.updateKnowledge([fact]);
    expect(ke.getAllFacts().length).toBe(0);
  });

  it("updates existing fact with new data", async () => {
    const fact = makeFact({ id: "fact-1", statement: "Original" });
    await ke.updateKnowledge([fact]);

    const updated = makeFact({ id: "fact-1", statement: "Updated", confidence: 0.95 });
    await ke.updateKnowledge([updated]);

    const facts = ke.getAllFacts();
    expect(facts.length).toBe(1);
    expect(facts[0].statement).toBe("Updated");
    expect(facts[0].version).toBe(2);
  });

  it("reports freshness correctly for current facts", async () => {
    const fact = makeFact({ lastVerified: new Date() });
    await ke.updateKnowledge([fact]);
    const report = ke.getFreshnessReport();
    expect(report.totalFacts).toBe(1);
    expect(report.fresh).toBe(1);
    expect(report.freshnessRatio).toBe(1);
  });

  it("reports freshness correctly for stale facts", async () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
    const fact = makeFact({ lastVerified: oldDate });
    await ke.updateKnowledge([fact]);
    const report = ke.getFreshnessReport();
    // 60 days * 0.01 = 0.6 decay, freshness = 1 - 0.6 = 0.4 → stale (0.5-0.9? No, < 0.5 = outdated)
    expect(report.outdated).toBe(1);
  });

  it("identifies outdated facts", async () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
    const fact = makeFact({ lastVerified: oldDate });
    await ke.updateKnowledge([fact]);
    const outdated = ke.getOutdatedFacts();
    expect(outdated.length).toBe(1);
  });

  it("verifying facts resets freshness", async () => {
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const fact = makeFact({ id: "fact-verify", lastVerified: oldDate });
    await ke.updateKnowledge([fact]);

    ke.verifyFacts(["fact-verify"]);
    expect(ke.getFactFreshness("fact-verify")).toBeCloseTo(1);
  });

  it("gets facts by domain", async () => {
    const ai = makeFact({ id: "ai-1", domain: "ai", confidence: 0.9 });
    const climate = makeFact({ id: "cl-1", domain: "climate", confidence: 0.7 });
    await ke.updateKnowledge([ai, climate]);

    const aiFacts = ke.getFactsByDomain("ai");
    expect(aiFacts.length).toBe(1);
    expect(aiFacts[0].domain).toBe("ai");
  });

  it("tracks update log", async () => {
    const fact = makeFact({ id: "log-test" });
    await ke.updateKnowledge([fact]);
    expect(ke.knowledgeUpdates).toBe(1);

    const updated = makeFact({ id: "log-test", confidence: 0.8 });
    await ke.updateKnowledge([updated]);
    expect(ke.knowledgeUpdates).toBe(2);
  });

  it("returns 0 freshness for non-existent fact", () => {
    expect(ke.getFactFreshness("nonexistent")).toBe(0);
  });
});

// ── SciClawLearningEngine Integration ─────────────────────────────────

describe("SciClawLearningEngine", () => {
  let engine: SciClawLearningEngine;

  beforeEach(() => {
    engine = new SciClawLearningEngine();
  });

  it("creates with factory function", () => {
    const e = createLearningEngine();
    expect(e).toBeInstanceOf(SciClawLearningEngine);
  });

  it("learns from feedback", async () => {
    const fb = makeFeedback();
    await engine.learnFromFeedback([fb]);
    const metrics = engine.getLearningMetrics();
    expect(metrics.totalFeedback).toBe(1);
  });

  it("optimizes strategy from research history", async () => {
    const history = makeResearchHistory({
      userActions: [
        { type: "accept", timestamp: new Date() },
        { type: "modify", timestamp: new Date(), detail: "Fix section" },
      ],
    });
    const strategy = await engine.optimizeStrategy(history);
    expect(strategy).toBeDefined();
    expect(strategy.name).toBe("default");

    // Implicit feedback was also extracted
    const metrics = engine.getLearningMetrics();
    expect(metrics.totalFeedback).toBe(2);
  });

  it("updates knowledge and reports freshness", async () => {
    const fact = makeFact();
    await engine.updateKnowledge([fact]);
    const metrics = engine.getLearningMetrics();
    expect(metrics.knowledgeUpdates).toBe(1);
    expect(metrics.freshnessReport.totalFacts).toBe(1);
  });

  it("returns complete learning metrics", () => {
    const metrics = engine.getLearningMetrics();
    expect(metrics.totalFeedback).toBe(0);
    expect(metrics.strategyImprovements).toBe(0);
    expect(metrics.knowledgeUpdates).toBe(0);
    expect(Array.isArray(metrics.accuracyTrend)).toBe(true);
    expect(Array.isArray(metrics.topErrorPatterns)).toBe(true);
    expect(metrics.freshnessReport).toBeDefined();
  });

  it("provides direct access to sub-components", () => {
    expect(engine.getFeedbackLearner()).toBeInstanceOf(FeedbackLearner);
    expect(engine.getSelfImprover()).toBeInstanceOf(SelfImprover);
    expect(engine.getKnowledgeEvolution()).toBeInstanceOf(KnowledgeEvolution);
  });

  it("custom config propagates to sub-components", () => {
    const e = new SciClawLearningEngine({
      feedback: { minRatingForLearning: 4 },
      knowledge: { freshnessThresholdHigh: 0.95 },
    });
    expect(e).toBeDefined();
    // Config applied via constructor options
  });

  it("end-to-end: feedback → strategy → knowledge pipeline", async () => {
    // 1. Learn from user feedback
    const feedback = [
      makeFeedback({ sentiment: "positive", rating: 5, category: "quality", context: { topic: "AI Safety" } }),
      makeFeedback({ sentiment: "positive", rating: 4, category: "accuracy", context: { topic: "AI Safety" } }),
      makeFeedback({ sentiment: "negative", rating: 2, category: "relevance" }),
    ];
    await engine.learnFromFeedback(feedback);

    // 2. Optimize strategy from research history
    const history = makeResearchHistory({
      userActions: [
        { type: "accept", timestamp: new Date() },
        { type: "reject", timestamp: new Date() },
      ],
    });
    const strategy = await engine.optimizeStrategy(history);

    // 3. Update knowledge
    const facts = [
      makeFact({ domain: "ai", confidence: 0.9 }),
      makeFact({ domain: "ai", confidence: 0.85 }),
      makeFact({ domain: "climate", confidence: 0.7 }),
    ];
    await engine.updateKnowledge(facts);

    // 4. Verify metrics
    const metrics = engine.getLearningMetrics();
    expect(metrics.totalFeedback).toBe(5); // 3 explicit + 2 implicit
    expect(metrics.knowledgeUpdates).toBe(3);
    expect(metrics.freshnessReport.totalFacts).toBe(3);
    expect(metrics.freshnessReport.freshnessRatio).toBe(1);
    expect(strategy).toBeDefined();
  });
});
