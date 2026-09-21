/**
 * GA-A2 — ResearchSearchEngine failure visibility.
 *
 * The silent mock fallback is gone: without explicit `allowMock`, a failed
 * search throws with the cause; with `allowMock`, results are clearly labeled
 * synthetic (`source: "mock"`, reserved `.invalid` URLs — never example.com).
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/core/index.js", async (importOriginal) => {
  const orig = await importOriginal<typeof import("../../src/core/index.js")>();
  return {
    ...orig,
    search: vi.fn(async () => {
      throw new Error("simulated search outage");
    }),
  };
});

const { ResearchSearchEngine } = await import("../../src/research/search.js");

describe("ResearchSearchEngine (GA-A2)", () => {
  it("throws an observable error by default (no silent mock fallback)", async () => {
    const engine = new ResearchSearchEngine();
    await expect(engine.search("outage topic")).rejects.toThrow(
      'Search failed for "outage topic": simulated search outage'
    );
  });

  it("returns labeled mock results only when allowMock is explicit", async () => {
    const engine = new ResearchSearchEngine({ allowMock: true });
    const results = await engine.search("outage topic", 3);

    expect(results.length).toBe(3);
    expect(results.every((r) => r.source === "mock")).toBe(true);
    expect(results.every((r) => r.url.startsWith("https://mock.invalid/"))).toBe(true);
    expect(results.some((r) => r.url.includes("example.com"))).toBe(false);
  });
});
