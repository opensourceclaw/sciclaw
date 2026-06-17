import { describe, it, expect } from "vitest";
import {
  AdaptiveQueryEngine,
  createAdaptiveQueryEngine,
} from "../../src/interactive/queries.js";
import { QueryType } from "../../src/interactive/types.js";
import type { SessionContext, InteractionTurn } from "../../src/interactive/types.js";

function makeContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    topic: overrides.topic ?? "AI Safety",
    depth: overrides.depth ?? 0,
    focus: overrides.focus ?? ["AI Safety"],
    exploredTopics: overrides.exploredTopics ?? [],
    excludedTopics: overrides.excludedTopics ?? [],
    preferences: overrides.preferences ?? [],
    confidence: overrides.confidence ?? 0.5,
  };
}

describe("AdaptiveQueryEngine", () => {
  let engine: AdaptiveQueryEngine;

  beforeEach(() => {
    engine = createAdaptiveQueryEngine();
  });

  describe("generateQueries", () => {
    it("generates clarification queries for low confidence", () => {
      const ctx = makeContext({ confidence: 0.2 });
      const queries = engine.generateQueries(ctx, []);
      const clarifications = queries.filter(
        (q) => q.type === QueryType.CLARIFICATION,
      );
      expect(clarifications.length).toBeGreaterThan(0);
    });

    it("generates direction queries for empty focus", () => {
      const ctx = makeContext({ focus: [], confidence: 0.4 });
      const queries = engine.generateQueries(ctx, []);
      expect(queries.length).toBeGreaterThan(0);
    });

    it("generates depth queries for shallow context", () => {
      const ctx = makeContext({ depth: 1, confidence: 0.6 });
      const queries = engine.generateQueries(ctx, []);
      const depthQueries = queries.filter(
        (q) => q.type === QueryType.DEPTH,
      );
      expect(depthQueries.length).toBeGreaterThan(0);
    });

    it("generates validation queries for high confidence", () => {
      const ctx = makeContext({ depth: 3, confidence: 0.8 });
      const queries = engine.generateQueries(ctx, []);
      const validations = queries.filter(
        (q) => q.type === QueryType.VALIDATION,
      );
      expect(validations.length).toBeGreaterThan(0);
    });

    it("respects maxQueriesPerTurn limit", () => {
      const g = createAdaptiveQueryEngine({ adaptiveQueryMaxPerTurn: 2 });
      const ctx = makeContext({ confidence: 0.2, depth: 1 });
      const queries = g.generateQueries(ctx, []);
      expect(queries.length).toBeLessThanOrEqual(2);
    });

    it("prioritizes queries by score", () => {
      const ctx = makeContext({ confidence: 0.2, depth: 1 });
      const queries = engine.generateQueries(ctx, []);
      for (let i = 0; i < queries.length - 1; i++) {
        expect(queries[i]!.priority).toBeGreaterThanOrEqual(
          queries[i + 1]!.priority,
        );
      }
    });

    it("query generation latency < 500ms", () => {
      const ctx = makeContext({ confidence: 0.2, depth: 2 });
      const start = Date.now();
      engine.generateQueries(ctx, []);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe("adaptFromFeedback", () => {
    it("reduces priority for rejected queries", () => {
      const ctx = makeContext();
      const queries = engine.getClarificationQueries(ctx);
      const adapted = engine.adaptFromFeedback(queries, [
        {
          queryId: queries[0]!.id,
          answer: "no",
          action: "reject",
          timestamp: new Date(),
        },
      ]);
      expect(adapted.length).toBeLessThanOrEqual(queries.length);
    });

    it("removes queries with priority dropped to 0", () => {
      const ctx = makeContext();
      const queries = engine.getClarificationQueries(ctx).map((q) => ({
        ...q,
        priority: 2,
      }));
      const adapted = engine.adaptFromFeedback(queries, [
        {
          queryId: queries[0]!.id,
          answer: "no",
          action: "reject",
          timestamp: new Date(),
        },
      ]);
      // Priority 2 - 3 = -1, clamped to 0, then filtered out
      const remaining = adapted.filter((q) => q.id === queries[0]!.id);
      expect(remaining).toHaveLength(0);
    });
  });

  describe("query type methods", () => {
    it("getClarificationQueries returns clarification type", () => {
      const queries = engine.getClarificationQueries(makeContext());
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]!.type).toBe(QueryType.CLARIFICATION);
    });

    it("getDirectionQueries returns direction type", () => {
      const queries = engine.getDirectionQueries(makeContext());
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]!.type).toBe(QueryType.DIRECTION);
    });

    it("getDepthQueries returns depth type", () => {
      const queries = engine.getDepthQueries(makeContext());
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]!.type).toBe(QueryType.DEPTH);
    });

    it("getValidationQueries returns validation type", () => {
      const queries = engine.getValidationQueries(makeContext());
      expect(queries.length).toBeGreaterThan(0);
      expect(queries[0]!.type).toBe(QueryType.VALIDATION);
    });
  });

  describe("getQueryStats", () => {
    it("tracks generated count", () => {
      engine.generateQueries(makeContext(), []);
      const stats = engine.getQueryStats();
      expect(stats.totalGenerated).toBeGreaterThan(0);
    });
  });

  describe("prioritizeQueries", () => {
    it("sorts by priority descending", () => {
      const ctx = makeContext();
      const queries = [
        ...engine.getClarificationQueries(ctx),
        ...engine.getDepthQueries(ctx),
      ];
      // Assign different priorities
      queries[0]!.priority = 2;
      if (queries[1]) queries[1].priority = 8;
      const sorted = engine.prioritizeQueries(queries);
      expect(sorted[0]!.priority).toBeGreaterThanOrEqual(sorted[1]!.priority);
    });
  });
});
