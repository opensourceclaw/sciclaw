/**
 * SciClaw v3.0.0-rc.3 — Summarization index smoke test
 */
import { describe, it, expect } from "vitest";
import * as summarization from "../../src/summarization/index.js";
import { SummarizationError } from "../../src/summarization/errors.js";
import { Summarizer } from "../../src/summarization/summarizer.js";
import { KeyPointExtractor } from "../../src/summarization/key_points.js";
import { FactExtractor } from "../../src/summarization/facts.js";
import { SummarizationEngine, PerformanceTracker, FallbackStrategy } from "../../src/summarization/engine.js";

describe("Summarization Index", () => {
  it("exports SummarizationError", () => {
    expect(summarization.SummarizationError).toBe(SummarizationError);
  });

  it("exports Summarizer", () => {
    expect(summarization.Summarizer).toBe(Summarizer);
  });

  it("exports KeyPointExtractor", () => {
    expect(summarization.KeyPointExtractor).toBe(KeyPointExtractor);
  });

  it("exports FactExtractor", () => {
    expect(summarization.FactExtractor).toBe(FactExtractor);
  });

  it("exports SummarizationEngine", () => {
    expect(summarization.SummarizationEngine).toBe(SummarizationEngine);
  });

  it("exports PerformanceTracker", () => {
    expect(summarization.PerformanceTracker).toBe(PerformanceTracker);
  });

  it("exports FallbackStrategy", () => {
    expect(summarization.FallbackStrategy).toBe(FallbackStrategy);
  });
});
