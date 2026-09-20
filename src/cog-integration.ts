/**
 * SciClaw v3.6.0 — Cog Integration
 * Integration with claw-cog v5.11.0 for cognitive enhancement
 */

// Types for claw-cog (lazy-loaded) - adapted from claw-cog interfaces
type Subscriber = (content: unknown) => void;

interface GlobalWorkspace {
  broadcast(content: unknown, source?: string): void;
  subscribe(id: string, callback: Subscriber): void;
  unsubscribe(id: string): void;
}

interface PolicyEnforcer {
  evaluate(action: string, context: Record<string, unknown>): {
    allowed: boolean;
    decision: string;
    explanation: string;
  };
}

interface ActionExecutor {
  execute(action: string, params: Record<string, unknown>): {
    success: boolean;
    output?: unknown;
    error?: string;
  };
  register(name: string, handler: (ctx: unknown) => unknown): void;
}

/**
 * Cognitive context for SciClaw research
 */
export interface CognitiveContext {
  researchTopic?: string;
  currentPhase?: "plan" | "search" | "analyze" | "synthesize" | "report";
  confidence?: number;
  sources?: string[];
  findings?: string[];
}

/**
 * Cognitive decision result
 */
export interface CognitiveDecision {
  action: string;
  confidence: number;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

/**
 * SciClaw Cog Integration - claw-cog v5.11.0 integration
 */
export class SciClawCogIntegration {
  private workspace: GlobalWorkspace | null = null;
  private policyEnforcer: PolicyEnforcer | null = null;
  private executor: ActionExecutor | null = null;
  private enabled: boolean = false;

  /**
   * Initialize cognitive system with claw-cog
   */
  async initialize(): Promise<void> {
    try {
      const clawCog = await import("claw-cog");

      // Initialize GlobalWorkspace (GWT)
      if (clawCog.GlobalWorkspace) {
        this.workspace = new clawCog.GlobalWorkspace();
      }

      // Initialize PolicyEnforcer
      if (clawCog.PolicyEnforcer) {
        this.policyEnforcer = new clawCog.PolicyEnforcer();
      }

      // Initialize ActionExecutor
      if (clawCog.CogExecutor) {
        this.executor = new clawCog.CogExecutor();
        this.registerDefaultHandlers();
      }

      this.enabled = true;
      console.log("[SciClaw] Cog integration initialized");
      console.log(`[SciClaw] Workspace: ${this.workspace ? "enabled" : "unavailable"}`);
      console.log(`[SciClaw] PolicyEnforcer: ${this.policyEnforcer ? "enabled" : "unavailable"}`);
      console.log(`[SciClaw] ActionExecutor: ${this.executor ? "enabled" : "unavailable"}`);
    } catch (error) {
      console.warn("[SciClaw] Cog integration initialization failed:", error);
      this.enabled = false;
    }
  }

  /**
   * Register default action handlers for research workflow
   */
  private registerDefaultHandlers(): void {
    if (!this.executor) return;

    // Research action handlers
    this.executor.register("search", (ctx: unknown) => {
      const context = ctx as { params?: { query?: string } };
      return {
        success: true,
        output: { query: context.params?.query, status: "executed" },
      };
    });

    this.executor.register("analyze", (ctx: unknown) => {
      const context = ctx as { params?: { data?: unknown } };
      return {
        success: true,
        output: { analyzed: true, data: context.params?.data },
      };
    });

    this.executor.register("synthesize", (ctx: unknown) => {
      const context = ctx as { params?: { findings?: string[] } };
      return {
        success: true,
        output: { synthesized: true, count: context.params?.findings?.length ?? 0 },
      };
    });
  }

  /**
   * Broadcast cognitive content to workspace
   */
  broadcast(content: CognitiveContext): void {
    if (!this.workspace) {
      console.warn("[SciClaw] Workspace not available");
      return;
    }
    this.workspace.broadcast(content, "deepclaw");
  }

  /**
   * Subscribe to workspace broadcasts
   * Returns unsubscribe function or null if workspace not available
   */
  subscribe(id: string, handler: Subscriber): (() => void) | null {
    if (!this.workspace) {
      return null;
    }
    this.workspace.subscribe(id, handler);
    return () => this.workspace?.unsubscribe(id);
  }

  /**
   * Evaluate action against policy
   */
  evaluateAction(action: string, context: Record<string, unknown>): {
    allowed: boolean;
    reason: string;
  } {
    if (!this.policyEnforcer) {
      return { allowed: true, reason: "Policy enforcer not available" };
    }

    const result = this.policyEnforcer.evaluate(action, context);
    return {
      allowed: result.allowed,
      reason: result.explanation,
    };
  }

  /**
   * Execute cognitive action
   */
  executeAction(action: string, params: Record<string, unknown>): {
    success: boolean;
    output?: unknown;
    error?: string;
  } {
    if (!this.executor) {
      return { success: false, error: "Executor not available" };
    }

    return this.executor.execute(action, params);
  }

  /**
   * Make cognitive decision based on context
   */
  decide(context: CognitiveContext): CognitiveDecision {
    const confidence = context.confidence ?? 0.5;

    // Determine next action based on phase
    let action = "unknown";
    let reasoning = "No phase specified";

    if (context.currentPhase) {
      switch (context.currentPhase) {
        case "plan":
          action = "search";
          reasoning = "Planning phase: begin search";
          break;
        case "search":
          action = "analyze";
          reasoning = "Search phase: analyze results";
          break;
        case "analyze":
          action = "synthesize";
          reasoning = "Analysis phase: synthesize findings";
          break;
        case "synthesize":
          action = "report";
          reasoning = "Synthesis phase: generate report";
          break;
        case "report":
          action = "complete";
          reasoning = "Report phase: research complete";
          break;
      }
    }

    return {
      action,
      confidence,
      reasoning,
      metadata: {
        sources: context.sources?.length ?? 0,
        findings: context.findings?.length ?? 0,
      },
    };
  }

  /**
   * Get cognitive system status
   */
  getStatus(): {
    enabled: boolean;
    workspaceReady: boolean;
    policyEnforcerReady: boolean;
    executorReady: boolean;
  } {
    return {
      enabled: this.enabled,
      workspaceReady: this.workspace !== null,
      policyEnforcerReady: this.policyEnforcer !== null,
      executorReady: this.executor !== null,
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const cogIntegration = new SciClawCogIntegration();
