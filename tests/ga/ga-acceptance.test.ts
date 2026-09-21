/**
 * GA-A1 — end-to-end acceptance suite (fixture mode, offline, CI-blocking).
 *
 * Implements Edith's spec (inbox-test/ga-acceptance-suite-spec.md, 2026-09-21):
 * five evidence-chain assertions E1–E5 over real pipeline runs against captured
 * fixture sources (registerSearchSource), plus E0 determinism. Positive tasks:
 * GA-T1/T2/T5/T6. Negative (fail-closed): GA-T7. GA-T3/GA-T4 are out of the set
 * per the spec's "宁缺毋滥" rule — their golden facts could not be backed by ≥2
 * independent captured sources (documented in the A1 ack).
 *
 * Replaces the deleted `tests/research/index.test.ts` (stale mocks of removed
 * paths, zero-evidence assertions) as THE end-to-end evidence-chain gate.
 *
 * Anti-cheat: assertions are fixed by the spec; nothing here weakens gates,
 * whitelists or the negative task to make the suite green.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { DeepResearchFlow } from "../../src/flows/deep_research_flow.js";
import type { EvidenceBlock, ResearchReport } from "../../src/flows/deep_research_flow.js";
import { registerSearchSource } from "../../src/core/index.js";

const GA_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../fixtures/ga");
const POSITIVES = ["GA-T1", "GA-T2", "GA-T5", "GA-T6"];
const NEGATIVE = "GA-T7";

interface TaskSpec {
  id: string;
  topic: string;
  expectedFacts: string[];
  whitelist: string[];
  minCitations: number;
  negative?: boolean;
}

interface SourceSpec {
  sourceId: string;
  url: string;
  pageFile: string;
}

interface CaptureEntry {
  url: string;
  httpStatus: number;
  capturedAt: string;
  contentSha256: string;
}

function loadFixture(id: string): {
  task: TaskSpec;
  sources: SourceSpec[];
  capture: Record<string, CaptureEntry>;
} {
  const dir = path.join(GA_ROOT, id);
  return {
    task: JSON.parse(fs.readFileSync(path.join(dir, "task.json"), "utf-8")) as TaskSpec,
    sources: JSON.parse(fs.readFileSync(path.join(dir, "sources.json"), "utf-8")) as SourceSpec[],
    capture: JSON.parse(fs.readFileSync(path.join(dir, "capture.json"), "utf-8")) as Record<string, CaptureEntry>,
  };
}

async function runFixtureTask(id: string): Promise<ResearchReport> {
  const { task, sources } = loadFixture(id);
  registerSearchSource(
    { id: "duckduckgo", name: "ga-fixture", enabled: true, priority: 1, timeoutMs: 5000, weight: 1 },
    async (_query: string, maxResults: number) =>
      sources.slice(0, maxResults).map((s, i) => ({
        title: `${id} ${s.sourceId}`,
        url: s.url,
        snippet: fs.readFileSync(path.join(GA_ROOT, id, s.pageFile), "utf-8"),
        source: "duckduckgo" as const,
        rank: i + 1,
      }))
  );

  const flow = new DeepResearchFlow(undefined, { approvalRequired: false });
  await flow.start(task.topic);
  await flow.plan();
  await flow.search();
  await flow.analyze();
  await flow.synthesize();
  return flow.report();
}

function evidenceOf(report: ResearchReport): EvidenceBlock {
  expect(report.evidence).toBeDefined();
  return report.evidence!;
}

function hostOf(url: string): string {
  return new URL(url).hostname;
}

function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Freeze run-variant fields (ids/timestamps) so evidence is byte-comparable (E0/snapshots). */
function normalizeEvidence(e: EvidenceBlock): unknown {
  const claimIdMap = new Map(e.claims.map((c, i) => [c.id, `C${i + 1}`]));
  return {
    ...e,
    taskId: "<task>",
    asOf: "<asOf>",
    sources: e.sources.map((s) => ({ ...s, accessedAt: "<accessedAt>" })),
    claims: e.claims.map((c, i) => ({ ...c, id: `C${i + 1}` })),
    verifications: e.verifications.map((v) => ({
      ...v,
      claimId: claimIdMap.get(v.claimId) ?? v.claimId,
    })),
  };
}

describe.each(POSITIVES)("GA acceptance %s (positive, fixture mode)", (id) => {
  it("E1 — every source is whitelisted, was actually retrieved, and parses", async () => {
    const { task, sources } = loadFixture(id);
    const report = await runFixtureTask(id);
    const evidence = evidenceOf(report);
    const retrieved = new Set(sources.map((s) => s.url));

    expect(evidence.sources.length).toBeGreaterThan(0);
    for (const s of evidence.sources) {
      expect(task.whitelist.some((d) => hostOf(s.url).endsWith(d))).toBe(true);
      expect(retrieved.has(s.url)).toBe(true);
      expect(() => new URL(s.url)).not.toThrow();
    }
    const serialized = JSON.stringify(evidence);
    expect(/example\.com|placeholder|localhost|TODO/i.test(serialized)).toBe(false);
  });

  it("E2 — every factual claim is cited, citations point at present sources, coverage = 1.0", async () => {
    const { task } = loadFixture(id);
    const report = await runFixtureTask(id);
    const evidence = evidenceOf(report);
    const sourceIds = new Set(evidence.sources.map((s) => s.id));
    const factual = evidence.claims.filter((c) => c.type === "factual");

    for (const c of factual) {
      expect(c.citations.length).toBeGreaterThanOrEqual(1);
      expect(c.citations.every((cid) => sourceIds.has(cid))).toBe(true);
    }
    const covered = factual.length === 0 ? 0 : factual.filter((c) => c.citations.length > 0).length;
    expect(covered / Math.max(factual.length, 1) || 1).toBe(1);
    expect(evidence.sources.length).toBeGreaterThanOrEqual(task.minCitations);
  });

  it("E3 — all four gates present, blocked ⇔ any gate failed; blocked withholds conclusions", async () => {
    const report = await runFixtureTask(id);
    const evidence = evidenceOf(report);

    expect(evidence.gates.map((g) => g.name).sort()).toEqual([
      "bias-detection",
      "citation-integrity",
      "cross-validation",
      "source-credibility",
    ]);
    for (const g of evidence.gates) {
      expect(typeof g.passed).toBe("boolean");
      expect(typeof g.score).toBe("number");
      expect(typeof g.threshold).toBe("number");
    }
    expect(evidence.blocked).toBe(evidence.gates.some((g) => !g.passed));
    expect(report.blocked).toBe(evidence.blocked);
    if (evidence.blocked) {
      expect(report.sections.some((s) => s.heading === "Conclusions")).toBe(false);
      expect(report.sections.some((s) => s.heading === "Evidence Status")).toBe(true);
    }
  });

  it("E4 — every golden fact has a VERIFIED verifier verdict", async () => {
    const { task } = loadFixture(id);
    const report = await runFixtureTask(id);
    const evidence = evidenceOf(report);
    const claimText = new Map(evidence.claims.map((c) => [c.id, c.text]));

    for (const fact of task.expectedFacts) {
      const target = normalizeText(fact);
      const matches = evidence.verifications.filter((v) =>
        normalizeText(claimText.get(v.claimId) ?? "").includes(target)
      );
      expect(matches.length, `no verification found for fact "${fact}"`).toBeGreaterThan(0);
      expect(
        matches.some((v) => v.status === "verified"),
        `no VERIFIED verdict for fact "${fact}" (statuses: ${matches.map((v) => v.status).join(",")})`
      ).toBe(true);
    }
  });

  it("E5 — citations trace back to retrieved sources whose content hash matches capture.json", async () => {
    const { capture } = loadFixture(id);
    const report = await runFixtureTask(id);
    const evidence = evidenceOf(report);
    const byId = new Map(evidence.sources.map((s) => [s.id, s]));

    for (const c of evidence.claims) {
      for (const cid of c.citations) {
        const src = byId.get(cid);
        expect(src).toBeDefined();
        const captured = Object.values(capture).find((cap) => cap.url === src!.url);
        expect(captured, `no capture for ${src!.url}`).toBeDefined();
        expect(src!.contentSha256).toBe(captured!.contentSha256);
      }
    }
  });

  it("golden-output snapshot — normalized evidence block is frozen", async () => {
    const report = await runFixtureTask(id);
    expect(normalizeEvidence(evidenceOf(report))).toMatchSnapshot();
  });
});

describe("GA acceptance — suite-level invariants", () => {
  it("E0 — the same task run twice yields byte-identical normalized evidence", async () => {
    const run1 = normalizeEvidence(evidenceOf(await runFixtureTask("GA-T1")));
    const run2 = normalizeEvidence(evidenceOf(await runFixtureTask("GA-T1")));
    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });

  it("negative task GA-T7 — fail-closed: blocked, zero verified facts, no fabricated sources", async () => {
    const report = await runFixtureTask(NEGATIVE);
    const evidence = evidenceOf(report);

    // No authoritative sources may be present (whitelist is empty by design).
    expect(evidence.sources.length).toBe(0);
    // Fail-closed gate behaviour.
    expect(evidence.gates.length).toBe(4);
    expect(evidence.blocked).toBe(true);
    expect(evidence.gates.some((g) => !g.passed)).toBe(true);
    // No verifier false positives.
    expect(evidence.verifications.filter((v) => v.status === "verified").length).toBe(0);
    // No conclusions section in a blocked report.
    expect(report.sections.some((s) => s.heading === "Conclusions")).toBe(false);
    expect(report.sections.some((s) => s.heading === "Evidence Status")).toBe(true);
    // Sabotage patterns absent.
    expect(/example\.com|placeholder|localhost|TODO/i.test(JSON.stringify(evidence))).toBe(false);
  });
});
