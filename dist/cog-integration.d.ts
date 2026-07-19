/**
 * DeepClaw v3.6.0 — Cog Integration
 * Integration with claw-cog v5.11.0 for cognitive enhancement
 */
type Subscriber = (content: unknown) => void;
/**
 * Cognitive context for DeepClaw research
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
 * DeepClaw Cog Integration - claw-cog v5.11.0 integration
 */
export declare class DeepClawCogIntegration {
    private workspace;
    private policyEnforcer;
    private executor;
    private enabled;
    /**
     * Initialize cognitive system with claw-cog
     */
    initialize(): Promise<void>;
    /**
     * Register default action handlers for research workflow
     */
    private registerDefaultHandlers;
    /**
     * Broadcast cognitive content to workspace
     */
    broadcast(content: CognitiveContext): void;
    /**
     * Subscribe to workspace broadcasts
     * Returns unsubscribe function or null if workspace not available
     */
    subscribe(id: string, handler: Subscriber): (() => void) | null;
    /**
     * Evaluate action against policy
     */
    evaluateAction(action: string, context: Record<string, unknown>): {
        allowed: boolean;
        reason: string;
    };
    /**
     * Execute cognitive action
     */
    executeAction(action: string, params: Record<string, unknown>): {
        success: boolean;
        output?: unknown;
        error?: string;
    };
    /**
     * Make cognitive decision based on context
     */
    decide(context: CognitiveContext): CognitiveDecision;
    /**
     * Get cognitive system status
     */
    getStatus(): {
        enabled: boolean;
        workspaceReady: boolean;
        policyEnforcerReady: boolean;
        executorReady: boolean;
    };
    isEnabled(): boolean;
}
export declare const cogIntegration: DeepClawCogIntegration;
export {};
//# sourceMappingURL=cog-integration.d.ts.map