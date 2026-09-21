import { describe, it, expect } from "vitest";
import { BiasDetectionGate } from "../../../src/gate/research/bias-detection-gate.js";
import type { ResearchContext } from "../../../src/context/ResearchContext.js";

function makeCtx(overrides?: Partial<ResearchContext>): ResearchContext {
  return {
    topic: "test", questions: [], stage: "validate",
    searchResults: [
      { url: "https://source-a.com/1", title: "A", snippet: "", source: "web", timestamp: "2020-01-01", relevanceScore: 0.9 },
      { url: "https://source-b.org/2", title: "B", snippet: "", source: "web", timestamp: "2022-06-15", relevanceScore: 0.8 },
      { url: "https://source-c.edu/3", title: "C", snippet: "", source: "web", timestamp: "2024-12-01", relevanceScore: 0.85 },
      { url: "https://source-d.com/4", title: "D", snippet: "", source: "web", timestamp: "2026-01-15", relevanceScore: 0.9 },
    ],
    extractions: [],
    ...overrides,
  };
}

describe("BiasDetectionGate", () => {
  const gate = new BiasDetectionGate();

  it("should have correct name and stage", () => {
    expect(gate.name).toBe("bias-detection");
    expect(gate.stage).toBe("validate");
  });

  it("should pass for diverse sources with counter-arguments", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "Test", evidence: [], counterArguments: ["Counter point"] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result.details.length).toBe(3);
  });

  it("should detect selection bias", async () => {
    const ctx = makeCtx({
      searchResults: [
        { url: "https://same-source.com/1", title: "A", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.9 },
        { url: "https://same-source.com/2", title: "B", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.8 },
      ],
    });
    const result = await gate.check(ctx);
    const selDetail = result.details.find(d => d.item === "selection");
    expect(selDetail).toBeDefined();
  });

  it("should detect confirmation bias", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "One-sided claim", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    const confDetail = result.details.find(d => d.item === "confirmation");
    expect(confDetail).toBeDefined();
  });

  it("should detect temporal bias", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    const tempDetail = result.details.find(d => d.item === "temporal");
    expect(tempDetail).toBeDefined();
  });

  it("should suggest mitigations for biases", async () => {
    const ctx = makeCtx({
      searchResults: [
        { url: "https://same-source.com/1", title: "A", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.9 },
      ],
      synthesis: {
        summary: "test", arguments: [
          { claim: "Claim without counter", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result.recommendations).toBeDefined();
  });

  it("should pass when bias is low", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "Test", evidence: ["s1"], counterArguments: ["counter"] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result).toHaveProperty("passed");
  });

  it("should output all three bias dimensions", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    const items = result.details.map(d => d.item);
    expect(items).toContain("selection");
    expect(items).toContain("confirmation");
    expect(items).toContain("temporal");
  });
});

// ── GA R1 anti-cheat regression locks (Edith ga-r1-calibration.md §6.2) ──────
// These cases prevent future "tune the threshold until the suite is green"
// changes: the P-a lock pins the corrected selection formula at 0.500, the
// teeth case proves high concentration still fails, and the structural floor
// proves the negative case is blocked without threshold tuning.

describe("BiasDetectionGate — GA R1 regression locks", () => {
  const r1Gate = new BiasDetectionGate();
  const FIXED_TS = "2026-09-21T00:00:00.000Z";

  function r1Ctx(opts: { urls: string[]; counterArguments?: "present" | "absent" }): ResearchContext {
    return {
      topic: "r1-test",
      questions: [],
      stage: "validate",
      searchResults: opts.urls.map((url, i) => ({
        url,
        title: `result ${i}`,
        snippet: "snippet",
        source: "web",
        timestamp: FIXED_TS,
        relevanceScore: 0.5,
      })),
      extractions: [],
      synthesis:
        opts.counterArguments === undefined
          ? undefined
          : {
              summary: "s",
              arguments: [
                opts.counterArguments === "present"
                  ? { claim: "c", evidence: ["e"], counterArguments: ["counter point"] }
                  : { claim: "c", evidence: ["e"] },
              ],
              conclusions: [],
              citations: [],
            },
    };
  }

  const selectionOf = (result: { details: Array<{ item: string; score: number; assessed?: boolean }> }) =>
    result.details.find((d) => d.item === "selection")!;

  it("P-a lock — 6 results / 2 unique urls / 1 domain ⇒ selection = 0.500 (not 0.833)", async () => {
    const ctx = r1Ctx({
      urls: ["https://nist.gov/a", "https://nist.gov/b", "https://nist.gov/a", "https://nist.gov/b", "https://nist.gov/a", "https://nist.gov/b"],
    });
    const result = await r1Gate.check(ctx);
    expect(selectionOf(result).score).toBe(0.5);
    expect(result.passed).toBe(true);
  });

  it("multi-domain runs pass (4 sources / 4 domains ⇒ selection 0.000)", async () => {
    const ctx = r1Ctx({ urls: ["https://a.org/1", "https://b.org/1", "https://c.org/1", "https://d.org/1"] });
    const result = await r1Gate.check(ctx);
    expect(selectionOf(result).score).toBe(0);
    expect(result.passed).toBe(true);
  });

  it("curated single-domain runs at the observed bound pass (2 sources / 1 domain ⇒ 0.500)", async () => {
    const ctx = r1Ctx({ urls: ["https://nist.gov/a", "https://nist.gov/b"] });
    const result = await r1Gate.check(ctx);
    expect(selectionOf(result).score).toBe(0.5);
    expect(result.passed).toBe(true);
  });

  it("teeth — high concentration still fails (10 sources / 1 domain ⇒ 0.900)", async () => {
    const ctx = r1Ctx({ urls: Array.from({ length: 10 }, (_, i) => `https://echo.example.org/${i}`) });
    const result = await r1Gate.check(ctx);
    expect(selectionOf(result).score).toBe(0.9);
    expect(result.passed).toBe(false);
  });

  it("structural floor — a single source fails with insufficient_corroboration", async () => {
    const ctx = r1Ctx({ urls: ["https://only.org/a"] });
    const result = await r1Gate.check(ctx);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("insufficient_corroboration");
  });

  it("structural floor — zero sources fail", async () => {
    const ctx = r1Ctx({ urls: [] });
    const result = await r1Gate.check(ctx);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("insufficient_corroboration");
  });

  it("N/A factors do not change the verdict — same selection with/without counter-argument data", async () => {
    const urls = ["https://nist.gov/a", "https://nist.gov/b"];
    const withData = await r1Gate.check(r1Ctx({ urls, counterArguments: "present" }));
    const withoutData = await r1Gate.check(r1Ctx({ urls, counterArguments: "absent" }));

    expect(withData.passed).toBe(true);
    expect(withoutData.passed).toBe(true);
    expect(withData.details.find((d) => d.item === "confirmation")!.assessed).toBe(true);
    expect(withoutData.details.find((d) => d.item === "confirmation")!.assessed).toBe(false);
  });

  it("keeps three detail items with correct assessed flags; score aggregates assessed factors only", async () => {
    const result = await r1Gate.check(r1Ctx({ urls: ["https://nist.gov/a", "https://nist.gov/b"] }));
    expect(result.details.map((d) => d.item)).toEqual(["selection", "confirmation", "temporal"]);
    expect(selectionOf(result).assessed).toBe(true);
    expect(result.details.find((d) => d.item === "confirmation")!.assessed).toBe(false);
    expect(result.details.find((d) => d.item === "temporal")!.assessed).toBe(false);
    expect(result.score).toBe(0.5);
    expect(result.threshold).toBe(0.5);
  });
});
