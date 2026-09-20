/**
 * SciClaw v3.6.0 — Governance Policy (GOVERN Stage)
 * Policy enforcement and compliance for research workflow
 */
/**
 * Policy rule definition
 */
export interface PolicyRule {
    id: string;
    name: string;
    description: string;
    category: "security" | "quality" | "compliance" | "operational";
    severity: "low" | "medium" | "high" | "critical";
    check: (context: PolicyContext) => PolicyResult;
}
/**
 * Context for policy evaluation
 */
export interface PolicyContext {
    action: string;
    resource?: string;
    user?: string;
    phase?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Result of policy evaluation
 */
export interface PolicyResult {
    passed: boolean;
    ruleId: string;
    message: string;
    remediation?: string;
}
/**
 * Governance decision
 */
export interface GovernanceDecision {
    allowed: boolean;
    results: PolicyResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        criticalFailures: number;
    };
}
/**
 * GovernancePolicy - Enforces policies for research operations
 */
export declare class GovernancePolicy {
    private rules;
    private auditLog;
    constructor();
    /**
     * Initialize default governance rules
     */
    private initDefaultRules;
    /**
     * Add a custom policy rule
     */
    addRule(rule: PolicyRule): void;
    /**
     * Remove a rule by ID
     */
    removeRule(ruleId: string): boolean;
    /**
     * Get all registered rules
     */
    getRules(): PolicyRule[];
    /**
     * Evaluate all policies against context
     */
    evaluate(context: PolicyContext): GovernanceDecision;
    /**
     * Evaluate a single rule
     */
    evaluateRule(ruleId: string, context: PolicyContext): PolicyResult | null;
    /**
     * Get audit log
     */
    getAuditLog(limit?: number): Array<{
        timestamp: number;
        decision: GovernanceDecision;
        context: PolicyContext;
    }>;
    /**
     * Get governance statistics
     */
    getStats(): {
        totalEvaluations: number;
        allowedCount: number;
        deniedCount: number;
        topFailures: Array<{
            ruleId: string;
            count: number;
        }>;
    };
    /**
     * Clear audit log
     */
    clearAuditLog(): void;
}
export declare const governancePolicy: GovernancePolicy;
//# sourceMappingURL=policy.d.ts.map