/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copyright 2026 Peter Cheng
// SciClaw v3.9.0 — Deep Research Flow (Interactive, Depth-First)

import {
  ResearchState,
  ResearchStrategy,
  type ResearchContext,
  type SubQuery,
  type ResearchSearchResult,
  type BlindSpot,
} from "../orchestrator/types.js";
import { createHash } from "node:crypto";
import { ResearchStateMachine } from "../orchestrator/research-state-machine.js";
import { observeStage } from "../stages/observe.js";
import { validateStage } from "../stages/validate.js";
import type { ValidationResult } from "../stages/validate.js";
import { searchSubQueries, synthesizeResults, type FlowLLMConfig } from "./wiring.js";
import { extractClaims, verifyClaim, VerificationStatus } from "../core/index.js";
import type { Claim, VerificationResult } from "../core/index.js";
import { researchGateRegistry } from "../gate/research/research-gate-registry.js";
import type { ResearchGate, GateResult } from "../gate/research/types.js";
import type { ResearchContext as GateResearchContext } from "../context/ResearchContext.js";

/**
 * Evidence chain (GA-A1/A4): the four research gates run over the run's real
 * data in report(), and the machine-readable block below is embedded in the
 * report so claims/citations/verdicts are user-visible and auditable.
 */
export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  accessedAt: string;
  contentSha256: string;
}

export interface EvidenceClaim {
  id: string;
  text: string;
  type: string;
  citations: string[];
}

export interface EvidenceVerification {
  claimId: string;
  status: string;
  confidence: number;
  supportingSources: number;
}

export interface EvidenceGate {
  name: string;
  passed: boolean;
  score: number;
  threshold: number;
}

export interface EvidenceBlock {
  taskId: string;
  asOf: string;
  sources: EvidenceSource[];
  claims: EvidenceClaim[];
  verifications: EvidenceVerification[];
  gates: EvidenceGate[];
  blocked: boolean;
  verdictOverall: "pass" | "blocked" | "partial";
}

const EVIDENCE_GATE_NAMES = [
  "source-credibility",
  "cross-validation",
  "bias-detection",
  "citation-integrity",
];

export type ResearchStage = "plan" | "search" | "analyze" | "synthesize" | "report";

export interface DeepResearchConfig {
  maxDepth?: number;
  timeout?: number;
  approvalRequired?: boolean;
  /** Mock mode: synthetic, explicitly labeled results — CLI `--mock` / tests only. */
  mock?: boolean;
  /** Optional LLM synthesis settings; unresolved settings fall back to extractive synthesis. */
  llm?: FlowLLMConfig;
}

export interface ResearchPlan {
  originalQuery: string;
  strategy: ResearchStrategy;
  subQueries: SubQuery[];
  estimatedDepth: number;
}

export interface SearchResultSet {
  query: string;
  results: ResearchSearchResult[];
  timestamp: number;
}

export interface AnalysisResult {
  claimsCount: number;
  confidence: number;
  blindSpots: BlindSpot[];
}

export interface SynthesisResult {
  summary: string;
  keyInsights: string[];
  openQuestions: string[];
  /** Provenance: how this synthesis was produced (GA-A2 honesty label). */
  synthesisMode?: "llm" | "extractive";
}

export interface ResearchReport {
  title: string;
  abstract: string;
  sections: Array<{ heading: string; content: string }>;
  references: string[];
  /** Machine-readable evidence chain (GA-A1/A4) — additive. */
  evidence?: EvidenceBlock;
  /** True when any research gate failed: conclusions must not be emitted (fail-closed). */
  blocked?: boolean;
}

export type ApprovalCallback = (step: string, details: string) => Promise<boolean>;

const STAGE_ORDER: ResearchStage[] = ["plan", "search", "analyze", "synthesize", "report"];

/**
 * Interactive deep research flow.
 * Depth-first strategy with human approval at each major step.
 */
export class DeepResearchFlow {
  private context: ResearchContext | null = null;
  private searchResults: ResearchSearchResult[] = [];
  private onApprove: ApprovalCallback;
  private config: DeepResearchConfig;
  private currentStage: ResearchStage = "plan";
  private stageDurations: Map<ResearchStage, number> = new Map();
  private stageStartTime: number = 0;
  private paused: boolean = false;
  private verifications: VerificationResult[] = [];
  private gateResultsRich: Map<string, GateResult> = new Map();
  private lastSynthesis: SynthesisResult | null = null;
  private evidenceClaims: Claim[] = [];

  constructor(approvalCallback?: ApprovalCallback, config?: DeepResearchConfig) {
    this.onApprove = approvalCallback ?? (async () => true);
    this.config = { maxDepth: 5, timeout: 300000, approvalRequired: true, ...config };
  }

  getCurrentStage(): ResearchStage {
    return this.currentStage;
  }

  getProgress(): number {
    const idx = STAGE_ORDER.indexOf(this.currentStage);
    return idx >= 0 ? (idx + 1) / STAGE_ORDER.length : 0;
  }

  getStageDurations(): Record<string, number> {
    return Object.fromEntries(this.stageDurations);
  }

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  private async assertNotPaused(): Promise<void> {
    while (this.paused) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private beginStage(stage: ResearchStage): void {
    this.currentStage = stage;
    this.stageStartTime = Date.now();
  }

  private endStage(): void {
    this.stageDurations.set(this.currentStage, Date.now() - this.stageStartTime);
  }

  async start(topic: string): Promise<ResearchContext> {
    this.currentStage = "plan";
    this.context = {
      sessionId: `deep-${Date.now()}`,
      originalQuery: topic,
      subQueries: [],
      results: [],
      claims: [],
      blindSpots: [],
      iteration: 0,
      maxIterations: this.config.maxDepth || 5,
      minConfidence: 0.6,
      sources: ["duckduckgo"],
    };
    this.searchResults = [];
    return this.context;
  }

  async plan(): Promise<ResearchPlan> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started. Call start() first.");

    this.beginStage("plan");
    if (this.config.approvalRequired) {
      await this.requestApproval("PLAN", `Topic: ${this.context.originalQuery}`);
    }

    const subQueries: SubQuery[] = [
      { id: "sq-1", query: `overview of ${this.context.originalQuery}`, aspect: "overview", sources: ["duckduckgo"], priority: 1 },
      { id: "sq-2", query: `details of ${this.context.originalQuery}`, aspect: "details", sources: ["duckduckgo"], priority: 2 },
      { id: "sq-3", query: `recent developments in ${this.context.originalQuery}`, aspect: "recent", sources: ["duckduckgo"], priority: 3 },
    ];
    this.context.subQueries = subQueries;
    this.endStage();

    return {
      originalQuery: this.context.originalQuery,
      strategy: ResearchStrategy.DEPTH_FIRST,
      subQueries,
      estimatedDepth: this.config.maxDepth || 3,
    };
  }

  async search(): Promise<SearchResultSet[]> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("search");
    if (this.config.approvalRequired) {
      await this.requestApproval("SEARCH", `Queries: ${this.context.subQueries.map(q => q.query).join(", ")}`);
    }

    const resultSets = await searchSubQueries(this.context.subQueries, {
      maxQueries: 3,
      maxResults: 5,
      mock: this.config.mock,
    });

    this.searchResults.push(...resultSets.flatMap((s) => s.results));
    this.context.results = this.searchResults;
    // Evidence chain: deterministic claim extraction over what was actually retrieved.
    this.evidenceClaims = this.searchResults
      .filter((r) => Boolean(r.snippet))
      .flatMap((r) => extractClaims(r.snippet, r.url, r.title));
    this.endStage();
    return resultSets;
  }

  async analyze(): Promise<AnalysisResult> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("analyze");
    if (this.config.approvalRequired) {
      await this.requestApproval("ANALYZE", "Validating claims and detecting blind spots...");
    }

    // Evidence chain: verify every extracted claim against the collected corpus
    // (the retrieved source texts — FactCheckService compares claims to source
    // TEXTS). Confidence = the real verifier coverage ratio — no invented
    // constants. No blind-spot engine yet, so the list is honestly empty.
    const corpus = [...new Set(this.searchResults.map((r) => r.snippet).filter((s): s is string => Boolean(s)))];
    this.verifications = await Promise.all(this.evidenceClaims.map((c) => verifyClaim(c, corpus)));
    const total = this.verifications.length;
    const verified = this.verifications.filter((v) => v.status === VerificationStatus.VERIFIED).length;
    const confidence = total > 0 ? verified / total : 0;

    const blindSpots: BlindSpot[] = [];
    this.context.blindSpots = blindSpots;
    this.context.iteration++;
    this.endStage();

    return {
      claimsCount: this.evidenceClaims.length,
      confidence,
      blindSpots,
    };
  }

  async synthesize(): Promise<SynthesisResult> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("synthesize");
    if (this.config.approvalRequired) {
      await this.requestApproval("SYNTHESIZE", "Generating synthesis...");
    }
    const synthesis = await synthesizeResults(
      this.context.originalQuery,
      this.searchResults,
      this.config.llm
    );
    this.lastSynthesis = synthesis;
    this.endStage();
    return synthesis;
  }

  async report(): Promise<ResearchReport> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("report");
    if (this.config.approvalRequired) {
      await this.requestApproval("REPORT", "Final report generation");
    }

    const asOf = new Date().toISOString();
    const evidence = await this.buildEvidence(asOf);
    this.endStage();
    this.currentStage = "report";

    const findings = this.evidenceClaims.length
      ? this.evidenceClaims.slice(0, 5).map((c) => c.text).join("\n")
      : "No factual claims were extracted from the collected sources.";
    const conclusions = this.lastSynthesis?.keyInsights.join("\n") ?? "";

    const sections: Array<{ heading: string; content: string }> = [
      { heading: "Introduction", content: `Research topic: ${this.context.originalQuery}` },
      { heading: "Methodology", content: "Depth-first research strategy; claims extracted deterministically and verified against the collected corpus." },
      { heading: "Findings", content: findings },
    ];
    if (evidence.blocked) {
      const failed = evidence.gates.filter((g) => !g.passed).map((g) => g.name).join(", ");
      sections.push({
        heading: "Evidence Status",
        content: `BLOCKED — gate check(s) failed: ${failed}. Conclusions are withheld (fail-closed): the evidence does not support emitting conclusions.`,
      });
    } else {
      sections.push({ heading: "Conclusions", content: conclusions });
    }

    return {
      title: `Deep Research: ${this.context.originalQuery}`,
      abstract: evidence.blocked
        ? `Research on ${this.context.originalQuery} was blocked by gate checks — see Evidence Status.`
        : `An in-depth research report on ${this.context.originalQuery}.`,
      sections,
      references: evidence.sources.map((s) => s.url),
      evidence,
      blocked: evidence.blocked,
    };
  }

  async requestApproval(step: string, details: string): Promise<boolean> {
    const approved = await this.onApprove(step, details);
    if (!approved) {
      throw new Error(`Approval denied for step: ${step}`);
    }
    return true;
  }

  // ── Phase 3: ResearchStateMachine + Stages ──────────────────────────

  private stateMachine: ResearchStateMachine | null = null;

  /**
   * Initialize state machine with context
   */
  /** Build the machine-readable evidence chain and run the four research gates. */
  private async buildEvidence(asOf: string): Promise<EvidenceBlock> {
    const sources: EvidenceSource[] = [];
    const urlToSourceId = new Map<string, string>();
    for (const r of this.searchResults) {
      if (!r.url || urlToSourceId.has(r.url)) continue;
      const id = `S${sources.length + 1}`;
      urlToSourceId.set(r.url, id);
      sources.push({
        id,
        title: r.title,
        url: r.url,
        domain: (() => {
          try {
            return new URL(r.url).hostname;
          } catch {
            return "";
          }
        })(),
        accessedAt: r.timestamp ?? asOf,
        contentSha256: createHash("sha256").update(r.snippet ?? "", "utf8").digest("hex"),
      });
    }

    const claimsList = this.evidenceClaims;
    const claims: EvidenceClaim[] = claimsList.map((c) => ({
      id: c.id,
      text: c.text,
      type: String(c.type),
      citations: c.sourceUrl && urlToSourceId.has(c.sourceUrl) ? [urlToSourceId.get(c.sourceUrl)!] : [],
    }));

    const verifications: EvidenceVerification[] = this.verifications.map((v) => ({
      claimId: v.claim.id,
      status: String(v.status),
      confidence: v.confidence,
      supportingSources: v.supportingSources,
    }));

    // Gate context per context/ResearchContext contract; relevanceScore is derived
    // from retrieval rank (core/search exposes no relevance score — same positional
    // convention as research/search.ts convertResult).
    const gateContext: GateResearchContext = {
      topic: this.context?.originalQuery ?? "",
      questions: this.context?.subQueries.map((q) => q.query) ?? [],
      searchResults: this.searchResults.map((r, i) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        source: r.source,
        timestamp: r.timestamp ?? asOf,
        relevanceScore: Math.max(0.1, 1 - i * 0.1),
      })),
      extractions: [],
      synthesis: this.lastSynthesis
        ? {
            summary: this.lastSynthesis.summary,
            arguments: claimsList.map((c) => ({
              claim: c.text,
              evidence: c.sourceUrl ? [c.sourceUrl] : [],
            })),
            conclusions: this.lastSynthesis.keyInsights,
            citations: sources.map((s) => ({
              id: s.id,
              source: s.title || s.domain,
              url: s.url,
              accessedAt: s.accessedAt,
            })),
          }
        : undefined,
      stage: "validate",
    };

    this.gateResultsRich = new Map();
    const gates: EvidenceGate[] = [];
    for (const name of EVIDENCE_GATE_NAMES) {
      const gate = researchGateRegistry.get(name) as ResearchGate | undefined;
      if (!gate) continue;
      const result = await gate.check(gateContext);
      this.gateResultsRich.set(name, result);
      gates.push({ name, passed: result.passed, score: result.score, threshold: result.threshold });
    }

    const blocked = gates.length > 0 && gates.some((g) => !g.passed);

    return {
      taskId: this.context?.sessionId ?? "unknown",
      asOf,
      sources,
      claims,
      verifications,
      gates,
      blocked,
      verdictOverall: blocked ? "blocked" : sources.length > 0 ? "pass" : "partial",
    };
  }

  /** Rich gate results of the last report() run (EvidenceBlock is the machine-readable mirror). */
  getEvidenceGateResults(): Map<string, GateResult> {
    return new Map(this.gateResultsRich);
  }

  initStateMachine(initialContext: Record<string, unknown> = {}): ResearchStateMachine {
    this.stateMachine = new ResearchStateMachine(initialContext as any);
    return this.stateMachine;
  }

  /**
   * Get current stage from state machine
   */
  getCurrentStageFromMachine(): string | null {
    return this.stateMachine?.getStage() ?? null;
  }

  /**
   * Get gate results
   */
  getGateResults(): Map<string, boolean> {
    return this.stateMachine?.getGateResults() ?? new Map();
  }

  /**
   * Run observe stage
   */
  async runObserve(input: string): Promise<void> {
    if (!this.stateMachine) {
      this.initStateMachine({ topic: input });
    }
    const result = await observeStage(input);
    this.stateMachine!.updateContext({ topic: result.topic, questions: result.questions } as any);
  }

  /**
   * Run validate stage
   */
  async runValidate(): Promise<ValidationResult> {
    if (!this.stateMachine) {
      throw new Error("State machine not initialized");
    }
    return validateStage(this.stateMachine.getContext());
  }
}
