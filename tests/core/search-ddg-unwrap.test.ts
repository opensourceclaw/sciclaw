/**
 * GA R2 — DuckDuckGo redirect unwrapping: wrapped targets resolve to the real
 * URL so live-mode domain verdicts see the actual host.
 */
import { describe, it, expect } from "vitest";
import { unwrapDdgUrl } from "../../src/core/search/index.js";

describe("unwrapDdgUrl (GA R2)", () => {
  it("unwraps the uddg redirect target", () => {
    const wrapped = "//duckduckgo.com/l/?uddg=https%3A%2F%2Fphysics.nist.gov%2Fcuu%2FConstants%2FTable%2Fallascii.txt&rut=abc123";
    expect(unwrapDdgUrl(wrapped)).toBe("https://physics.nist.gov/cuu/Constants/Table/allascii.txt");
  });

  it("handles wrapped URLs with query strings and fragments", () => {
    const target = "https://gml.noaa.gov/ccgg/trends/weekly.html?x=1&y=2";
    const wrapped = `//duckduckgo.com/l/?uddg=${encodeURIComponent(target)}&rut=zzz`;
    expect(unwrapDdgUrl(wrapped)).toBe(target);
  });

  it("passes direct absolute URLs through unchanged", () => {
    expect(unwrapDdgUrl("https://nature.com/articles/x")).toBe("https://nature.com/articles/x");
  });

  it("upgrades bare protocol-relative URLs", () => {
    expect(unwrapDdgUrl("//example.org/page")).toBe("https://example.org/page");
  });

  it("returns the original on malformed encoding (no throw)", () => {
    expect(unwrapDdgUrl("//duckduckgo.com/l/?uddg=%E0%A4%A&rut=z")).toBe("//duckduckgo.com/l/?uddg=%E0%A4%A&rut=z");
  });
});
