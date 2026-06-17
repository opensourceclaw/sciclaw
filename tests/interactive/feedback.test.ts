import { describe, it, expect } from "vitest";
import {
  RealTimeFeedback,
  createRealTimeFeedback,
} from "../../src/interactive/feedback.js";
import { FeedbackAction } from "../../src/interactive/types.js";
import type { SessionContext } from "../../src/interactive/types.js";

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

describe("RealTimeFeedback", () => {
  let handler: RealTimeFeedback;

  beforeEach(() => {
    handler = createRealTimeFeedback();
  });

  describe("detectIntent", () => {
    it("detects ACCEPT intent", () => {
      const result = handler.detectIntent({
        id: "i1",
        action: FeedbackAction.ACCEPT,
        content: "yes this is good",
      });
      expect(result).toBe(FeedbackAction.ACCEPT);
    });

    it("detects REJECT intent", () => {
      const result = handler.detectIntent({
        id: "i2",
        action: FeedbackAction.ACCEPT,
        content: "no this is wrong",
      });
      expect(result).toBe(FeedbackAction.REJECT);
    });

    it("detects MODIFY intent", () => {
      const result = handler.detectIntent({
        id: "i3",
        action: FeedbackAction.ACCEPT,
        content: "change the approach",
      });
      expect(result).toBe(FeedbackAction.MODIFY);
    });

    it("detects REFINE intent", () => {
      const result = handler.detectIntent({
        id: "i4",
        action: FeedbackAction.ACCEPT,
        content: "more details please",
      });
      expect(result).toBe(FeedbackAction.REFINE);
    });

    it("detects SKIP intent", () => {
      const result = handler.detectIntent({
        id: "i5",
        action: FeedbackAction.ACCEPT,
        content: "skip this and move on",
      });
      expect(result).toBe(FeedbackAction.SKIP);
    });

    it("detects REDIRECT intent", () => {
      const result = handler.detectIntent({
        id: "i6",
        action: FeedbackAction.ACCEPT,
        content: "redirect to a different topic",
      });
      expect(result).toBe(FeedbackAction.REDIRECT);
    });
  });

  describe("analyzeSentiment", () => {
    it("detects positive sentiment", () => {
      const result = handler.analyzeSentiment({
        id: "s1",
        action: FeedbackAction.ACCEPT,
        content: "this is great and helpful",
      });
      expect(result).toBe("positive");
    });

    it("detects negative sentiment", () => {
      const result = handler.analyzeSentiment({
        id: "s2",
        action: FeedbackAction.ACCEPT,
        content: "this is bad and useless",
      });
      expect(result).toBe("negative");
    });

    it("returns neutral for balanced content", () => {
      const result = handler.analyzeSentiment({
        id: "s3",
        action: FeedbackAction.ACCEPT,
        content: "the weather is fine",
      });
      expect(result).toBe("neutral");
    });
  });

  describe("extractPreferences", () => {
    it("extracts explicit preferences", () => {
      const prefs = handler.extractPreferences({
        id: "p1",
        action: FeedbackAction.ACCEPT,
        content: "I prefer detailed analysis",
      });
      expect(prefs.length).toBeGreaterThan(0);
      expect(prefs[0]!.key).toContain("detailed analysis");
      expect(prefs[0]!.source).toBe("explicit");
    });

    it("extracts dislike preferences", () => {
      const prefs = handler.extractPreferences({
        id: "p2",
        action: FeedbackAction.ACCEPT,
        content: "I don't like verbose reports",
      });
      expect(prefs.length).toBeGreaterThan(0);
      expect(prefs[0]!.value).toBe(false);
    });
  });

  describe("processFeedback", () => {
    it("returns FeedbackResult with all fields", () => {
      const result = handler.processFeedback("sess-1", {
        id: "in-1",
        action: FeedbackAction.ACCEPT,
        content: "yes this is good",
      });
      expect(result.sessionId).toBe("sess-1");
      expect(result.action).toBe(FeedbackAction.ACCEPT);
      expect(result.sentiment).toBe("positive");
      expect(result.processedAt).toBeInstanceOf(Date);
    });
  });

  describe("shouldAdapt", () => {
    it("triggers adaptation for low confidence", () => {
      const ctx = makeContext({ confidence: 0.3 });
      expect(handler.shouldAdapt(ctx)).toBe(true);
    });

    it("triggers adaptation for stale focus", () => {
      const ctx = makeContext({
        exploredTopics: ["a", "b", "c", "d", "e", "f"],
        focus: [],
      });
      expect(handler.shouldAdapt(ctx)).toBe(true);
    });

    it("does not trigger for healthy context", () => {
      const ctx = makeContext({ confidence: 0.7, focus: ["AI"] });
      expect(handler.shouldAdapt(ctx)).toBe(false);
    });
  });

  describe("computeAdaptation", () => {
    it("adjusts confidence from rejects", () => {
      const ctx = makeContext({ confidence: 0.5 });
      const feedback = [
        handler.processFeedback("s1", {
          id: "f1",
          action: FeedbackAction.ACCEPT,
          content: "no this is wrong",
        }),
      ];
      const changes = handler.computeAdaptation(ctx, feedback);
      expect(changes.confidence).toBeLessThan(0.5);
    });
  });

  describe("getFeedbackStats", () => {
    it("tracks statistics", () => {
      handler.processFeedback("s1", {
        id: "f1",
        action: FeedbackAction.ACCEPT,
        content: "yes good",
      });
      handler.processFeedback("s2", {
        id: "f2",
        action: FeedbackAction.ACCEPT,
        content: "no bad",
      });
      const stats = handler.getFeedbackStats();
      expect(stats.total).toBe(2);
      expect(stats.acceptRate).toBeGreaterThan(0);
    });
  });

  describe("batchProcess", () => {
    it("processes multiple inputs", () => {
      const results = handler.batchProcess([
        { id: "b1", action: FeedbackAction.ACCEPT, content: "yes" },
        { id: "b2", action: FeedbackAction.ACCEPT, content: "no" },
      ]);
      expect(results).toHaveLength(2);
    });
  });
});
