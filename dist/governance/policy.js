/**
 * DeepClaw v3.6.0 — Governance Policy (GOVERN Stage)
 * Policy enforcement and compliance for research workflow
 */
/**
 * GovernancePolicy - Enforces policies for research operations
 */
export class GovernancePolicy {
    rules = new Map();
    auditLog = [];
    constructor() {
        this.initDefaultRules();
    }
    /**
     * Initialize default governance rules
     */
    initDefaultRules() {
        // Rule: Max search sources
        this.addRule({
            id: "gov-max-sources",
            name: "Maximum Sources",
            description: "Limit number of sources per search",
            category: "operational",
            severity: "medium",
            check: (ctx) => {
                const maxSources = 100;
                const sourceCount = ctx.metadata?.sourceCount ?? 0;
                if (sourceCount > maxSources) {
                    return {
                        passed: false,
                        ruleId: "gov-max-sources",
                        message: `Source count ${sourceCount} exceeds limit ${maxSources}`,
                        remediation: "Reduce search scope or add filters",
                    };
                }
                return { passed: true, ruleId: "gov-max-sources", message: "Source count within limits" };
            },
        });
        // Rule: Sensitive data check
        this.addRule({
            id: "gov-sensitive-data",
            name: "Sensitive Data Protection",
            description: "Prevent processing of sensitive personal data",
            category: "security",
            severity: "critical",
            check: (ctx) => {
                const sensitivePatterns = ["password", "api_key", "secret", "token", "credential"];
                const content = ctx.metadata?.content ?? "";
                for (const pattern of sensitivePatterns) {
                    if (content.toLowerCase().includes(pattern)) {
                        return {
                            passed: false,
                            ruleId: "gov-sensitive-data",
                            message: `Potential sensitive data detected: ${pattern}`,
                            remediation: "Remove or mask sensitive data before processing",
                        };
                    }
                }
                return { passed: true, ruleId: "gov-sensitive-data", message: "No sensitive data detected" };
            },
        });
        // Rule: Quality threshold
        this.addRule({
            id: "gov-quality-threshold",
            name: "Quality Threshold",
            description: "Ensure minimum quality score for findings",
            category: "quality",
            severity: "medium",
            check: (ctx) => {
                const minScore = 0.5;
                const score = ctx.metadata?.qualityScore ?? 1.0;
                if (score < minScore) {
                    return {
                        passed: false,
                        ruleId: "gov-quality-threshold",
                        message: `Quality score ${score} below threshold ${minScore}`,
                        remediation: "Improve source quality or adjust analysis parameters",
                    };
                }
                return { passed: true, ruleId: "gov-quality-threshold", message: "Quality score acceptable" };
            },
        });
        // Rule: Attribution requirement
        this.addRule({
            id: "gov-attribution",
            name: "Source Attribution",
            description: "Require source attribution for reports",
            category: "compliance",
            severity: "high",
            check: (ctx) => {
                const hasAttribution = ctx.metadata?.hasAttribution ?? true;
                if (!hasAttribution) {
                    return {
                        passed: false,
                        ruleId: "gov-attribution",
                        message: "Report missing source attribution",
                        remediation: "Add proper citations for all sources",
                    };
                }
                return { passed: true, ruleId: "gov-attribution", message: "Attribution present" };
            },
        });
    }
    /**
     * Add a custom policy rule
     */
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    /**
     * Remove a rule by ID
     */
    removeRule(ruleId) {
        return this.rules.delete(ruleId);
    }
    /**
     * Get all registered rules
     */
    getRules() {
        return [...this.rules.values()];
    }
    /**
     * Evaluate all policies against context
     */
    evaluate(context) {
        const results = [];
        for (const rule of this.rules.values()) {
            try {
                const result = rule.check(context);
                results.push(result);
            }
            catch (error) {
                results.push({
                    passed: false,
                    ruleId: rule.id,
                    message: `Rule evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }
        const summary = {
            total: results.length,
            passed: results.filter((r) => r.passed).length,
            failed: results.filter((r) => !r.passed).length,
            criticalFailures: results.filter((r) => {
                const rule = this.rules.get(r.ruleId);
                return !r.passed && rule?.severity === "critical";
            }).length,
        };
        const decision = {
            allowed: summary.criticalFailures === 0 && summary.failed === 0,
            results,
            summary,
        };
        // Log decision
        this.auditLog.push({
            timestamp: Date.now(),
            decision,
            context,
        });
        return decision;
    }
    /**
     * Evaluate a single rule
     */
    evaluateRule(ruleId, context) {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            return null;
        }
        return rule.check(context);
    }
    /**
     * Get audit log
     */
    getAuditLog(limit) {
        const log = [...this.auditLog].reverse();
        return limit ? log.slice(0, limit) : log;
    }
    /**
     * Get governance statistics
     */
    getStats() {
        const deniedCount = this.auditLog.filter((l) => !l.decision.allowed).length;
        const failureCounts = new Map();
        for (const log of this.auditLog) {
            for (const result of log.decision.results) {
                if (!result.passed) {
                    failureCounts.set(result.ruleId, (failureCounts.get(result.ruleId) ?? 0) + 1);
                }
            }
        }
        const topFailures = [...failureCounts.entries()]
            .map(([ruleId, count]) => ({ ruleId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        return {
            totalEvaluations: this.auditLog.length,
            allowedCount: this.auditLog.length - deniedCount,
            deniedCount,
            topFailures,
        };
    }
    /**
     * Clear audit log
     */
    clearAuditLog() {
        this.auditLog = [];
    }
}
// Singleton instance
export const governancePolicy = new GovernancePolicy();
//# sourceMappingURL=policy.js.map