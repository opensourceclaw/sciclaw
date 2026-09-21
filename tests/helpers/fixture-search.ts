/**
 * GA-A2 test helper — offline search fixture.
 *
 * Injects a deterministic `duckduckgo` source into the core search coordinator
 * (`registerSearchSource`) so flows exercise the REAL wiring without network.
 */
import { registerSearchSource } from "../../src/core/index.js";

const FIXTURE_SOURCE = {
  id: "duckduckgo",
  name: "fixture",
  enabled: true,
  priority: 1,
  timeoutMs: 5000,
  weight: 1,
};

export function registerFixtureSearch(): void {
  registerSearchSource(FIXTURE_SOURCE, async (query: string, maxResults: number) => {
    const base = [
      {
        title: `${query} — fixture A`,
        url: "https://fixture.example/a",
        snippet: `The fixture study A reports a stable measured effect for "${query}" across multiple trials.`,
      },
      {
        title: `${query} — fixture B`,
        url: "https://fixture.example/b",
        snippet: `The fixture study B provides a second independent data point about "${query}".`,
      },
    ];
    return base.slice(0, maxResults).map((r, i) => ({ ...r, source: "duckduckgo" as const, rank: i + 1 }));
  });
}

export function registerFailingSearch(): void {
  registerSearchSource(FIXTURE_SOURCE, async () => {
    throw new Error("fixture search failure");
  });
}
