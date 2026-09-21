/**
 * GA-A1 — live (nightly) variant: real network, real core/search, NO fixtures.
 *
 * Run via `npm run test:ga:live`. Never part of the CI main line (fixture suite
 * `test:ga` is). Per Edith's spec A1.4, live runs are non-blocking: assertions
 * check the structural invariants (fail-closed consistency, no placeholder
 * sources) while the whitelist-hit rate and fact coverage are reported as
 * observations — real search results are not guaranteed to include the
 * whitelisted authorities on any given night.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { DeepResearchFlow } from "../../src/flows/deep_research_flow.js";

const GA_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/ga");
const POSITIVES = ["GA-T1", "GA-T2", "GA-T5", "GA-T6"];

function loadTask(id: string): { topic: string; whitelist: string[] } {
  return JSON.parse(fs.readFileSync(path.join(GA_ROOT, id, "task.json"), "utf-8")) as {
    topic: string;
    whitelist: string[];
  };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

describe.skipIf(!process.env.GA_LIVE)("GA live (nightly, non-blocking)", () => {
  for (const id of POSITIVES) {
    it(`${id} — live run keeps the fail-closed invariants (observations logged)`, async () => {
      const task = loadTask(id);
      const flow = new DeepResearchFlow(undefined, { approvalRequired: false });
      await flow.start(task.topic);
      await flow.plan();
      await flow.search();
      await flow.analyze();
      await flow.synthesize();
      const report = await flow.report();
      const evidence = report.evidence!;

      // Structural invariants (must hold regardless of what the web returned).
      expect(evidence.gates.length).toBe(4);
      expect(evidence.blocked).toBe(evidence.gates.some((g) => !g.passed));
      expect(/example\.com|placeholder|localhost|TODO/i.test(JSON.stringify(evidence))).toBe(false);

      // Observations — reported, not asserted (nightly noise tolerance).
      const whitelisted = evidence.sources.filter((s) =>
        task.whitelist.some((d) => hostOf(s.url).endsWith(d))
      ).length;
      console.log(
        `[GA-live ${id}] sources=${evidence.sources.length} whitelisted=${whitelisted} ` +
          `claims=${evidence.claims.length} verifications=${evidence.verifications.length} ` +
          `gates=${evidence.gates.map((g) => `${g.name}:${g.passed ? "pass" : "fail"}`).join(",")} blocked=${evidence.blocked}`
      );
    }, 300000);
  }
});
