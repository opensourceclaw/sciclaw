/**
 * DeepClaw v3.3.0 — Research State Machine
 *
 * Lightweight hand-written FSM managing the PLAN → SEARCH → ANALYZE → REFINE cycle.
 * Zero external dependencies.
 */
import type {
  ResearchContext,
  OrchestratorResult,
  ResearchConfig,
  SubQuery,
  ResearchSearchResult,
  ValidatedClaim,
  BlindSpot,
  RefinementResult,
} from "./types.js";
import { ResearchState as State, DEFAULT_RESEARCH_CONFIG } from "./types.js";

// ── Injected dependencies (interfaces) ─────────────────────────────────

export interface Planner {
  decompose(query: string, context: ResearchContext): SubQuery[];
  selectStrategy(context: ResearchContext): string;
  shouldPivot(context: ResearchContext): boolean;
  onPivot(context: ResearchContext): { newQuery: string }[];
}

export interface Searcher {
  search(subQueries: SubQuery[], context: ResearchContext): Promise<ResearchSearchResult[]>;
}

import type { RawClaim } from "./types.js";

export interface Validator {
  extractClaims(results: ResearchSearchResult[]): RawClaim[];
  validate(claims: RawClaim[], results: ResearchSearchResult[]): ValidatedClaim[];
}

export interface BlindSpotDetector {
  detect(context: ResearchContext): BlindSpot[];
}

export interface Refiner {
  refine(context: ResearchContext): RefinementResult;
}

// ── Transition ───────────────────────────────────────────────────────

interface Transition {
  from: State;
  to: State;
  condition: (ctx: ResearchContext) => boolean;
}

// ── FSM ──────────────────────────────────────────────────────────────

export class ResearchStateMachine {
  private current: State = State.PLAN;
  private context: ResearchContext;
  private history: { state: State; timestamp: number }[] = [];
  private transitions: Transition[];
  private startedAt: number = 0;

  constructor(
    context: ResearchContext,
    private planner: Planner,
    private searcher: Searcher,
    private validator: Validator,
    private blindSpotDetector: BlindSpotDetector,
    private refiner: Refiner,
  ) {
    this.context = context;
    this.transitions = [
      { from: State.PLAN, to: State.SEARCH, condition: () => true },
      { from: State.SEARCH, to: State.ANALYZE, condition: () => true },
      {
        from: State.ANALYZE,
        to: State.REFINE,
        condition: (ctx) =>
          ctx.iteration < ctx.maxIterations &&
          (ctx.blindSpots.length > 0 ||
            ctx.claims.some((c) => c.confidence < ctx.minConfidence)),
      },
      {
        from: State.ANALYZE,
        to: State.DONE,
        condition: (ctx) =>
          ctx.blindSpots.length === 0 &&
          ctx.claims.every((c) => c.confidence >= ctx.minConfidence),
      },
      {
        from: State.ANALYZE,
        to: State.DONE,
        condition: (ctx) => ctx.iteration >= ctx.maxIterations,
      },
      {
        from: State.REFINE,
        to: State.PLAN,
        condition: (ctx) => ctx.iteration < ctx.maxIterations,
      },
      {
        from: State.REFINE,
        to: State.DONE,
        condition: (ctx) => ctx.iteration >= ctx.maxIterations,
      },
    ];
  }

  getState(): State {
    return this.current;
  }

  getContext(): ResearchContext {
    return this.context;
  }

  getHistory(): ReadonlyArray<{ state: State; timestamp: number }> {
    return this.history;
  }

  abort(): void {
    this.current = State.ABORTED;
  }

  // ── Core loop ──────────────────────────────────────────────────────

  async run(): Promise<OrchestratorResult> {
    this.startedAt = Date.now();

    while (
      this.current !== State.DONE &&
      this.current !== State.ABORTED
    ) {
      try {
        await this.executeCurrentState();
      } catch {
        if (this.context.iteration < this.context.maxIterations) {
          this.context.iteration++;
          this.current = State.PLAN;
          continue;
        }
        this.current = State.DONE;
        break;
      }
      this.step();
    }

    return this.buildResult();
  }

  // ── State execution ────────────────────────────────────────────────

  private async executeCurrentState(): Promise<void> {
    switch (this.current) {
      case State.PLAN: {
        if (this.planner.shouldPivot(this.context)) {
          const pivoted = this.planner.onPivot(this.context);
          this.context.subQueries = pivoted.map((p) => ({
            id: crypto.randomUUID(),
            query: p.newQuery,
            aspect: "pivoted",
            sources: this.context.sources,
            priority: 1,
          }));
        } else {
          this.context.subQueries = this.planner.decompose(
            this.context.originalQuery,
            this.context,
          );
        }
        break;
      }

      case State.SEARCH: {
        this.context.results = await this.searcher.search(
          this.context.subQueries,
          this.context,
        );
        break;
      }

      case State.ANALYZE: {
        const rawClaims = this.validator.extractClaims(this.context.results);
        this.context.claims = this.validator.validate(
          rawClaims,
          this.context.results,
        );
        this.context.blindSpots = this.blindSpotDetector.detect(
          this.context,
        );
        break;
      }

      case State.REFINE: {
        const refinement = this.refiner.refine(this.context);
        this.context.subQueries = refinement.newQueries.map((q) => ({
          id: crypto.randomUUID(),
          query: q,
          aspect: "refined",
          sources: this.context.sources,
          priority: 1,
        }));
        this.context.iteration++;
        break;
      }
    }
  }

  private step(): void {
    const applicable = this.transitions.filter(
      (t) => t.from === this.current,
    );
    for (const t of applicable) {
      if (t.condition(this.context)) {
        this.history.push({ state: this.current, timestamp: Date.now() });
        this.current = t.to;
        return;
      }
    }
    // no transition applicable → terminal
    if (this.current !== State.DONE && this.current !== State.ABORTED) {
      this.history.push({ state: this.current, timestamp: Date.now() });
      this.current = State.DONE;
    }
  }

  private buildResult(): OrchestratorResult {
    return {
      sessionId: this.context.sessionId,
      conclusion: this.buildConclusion(),
      confidence: this.averageConfidence(),
      claims: this.context.claims,
      iterations: this.context.iteration,
      blindSpotsRemaining: this.context.blindSpots,
      searchResults: this.context.results,
      durationMs: Date.now() - this.startedAt,
      stateHistory: this.history,
    };
  }

  private buildConclusion(): string {
    const verified = this.context.claims.filter(
      (c) => c.status === "verified",
    );
    const disputed = this.context.claims.filter(
      (c) => c.status === "disputed",
    );
    if (verified.length === 0 && disputed.length === 0) {
      return `Research on "${this.context.originalQuery}" did not produce any verified conclusions.`;
    }
    const parts: string[] = [];
    if (verified.length > 0) {
      parts.push(
        `Verified findings: ${verified.map((c) => c.claim).join("; ")}`,
      );
    }
    if (disputed.length > 0) {
      parts.push(
        `Disputed findings: ${disputed.map((c) => c.claim).join("; ")}`,
      );
    }
    return parts.join(". ");
  }

  private averageConfidence(): number {
    if (this.context.claims.length === 0) return 0;
    const sum = this.context.claims.reduce(
      (acc, c) => acc + c.confidence,
      0,
    );
    return sum / this.context.claims.length;
  }
}

// ── Factory ──────────────────────────────────────────────────────────

export function createResearchStateMachine(
  query: string,
  planner: Planner,
  searcher: Searcher,
  validator: Validator,
  blindSpotDetector: BlindSpotDetector,
  refiner: Refiner,
  config?: Partial<ResearchConfig>,
): ResearchStateMachine {
  const cfg = { ...DEFAULT_RESEARCH_CONFIG, ...config };
  const context: ResearchContext = {
    sessionId: crypto.randomUUID(),
    originalQuery: query,
    subQueries: [],
    results: [],
    claims: [],
    blindSpots: [],
    iteration: 0,
    maxIterations: cfg.maxIterations,
    minConfidence: cfg.minConfidence,
    sources: cfg.sources,
    config: cfg,
  };
  return new ResearchStateMachine(
    context,
    planner,
    searcher,
    validator,
    blindSpotDetector,
    refiner,
  );
}
