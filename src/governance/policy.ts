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
export class GovernancePolicy {
  private rules: Map<string, PolicyRule> = new Map();
  private auditLog: Array<{ timestamp: number; decision: GovernanceDecision; context: PolicyContext }> = [];

  constructor() {
    this.initDefaultRules();
  }

  /**
   * Initialize default governance rules
   */
  private initDefaultRules(): void {
    // Rule: Max search sources
    this.addRule({
      id: "gov-max-sources",
      name: "Maximum Sources",
      description: "Limit number of sources per search",
      category: "operational",
      severity: "medium",
      check: (ctx) => {
        const maxSources = 100;
        const sourceCount = (ctx.metadata?.sourceCount as number) ?? 0;
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
        const content = (ctx.metadata?.content as string) ?? "";
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
        const score = (ctx.metadata?.qualityScore as number) ?? 1.0;
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
        const hasAttribution = (ctx.metadata?.hasAttribution as boolean) ?? true;
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
  addRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get all registered rules
   */
  getRules(): PolicyRule[] {
    return [...this.rules.values()];
  }

  /**
   * Evaluate all policies against context
   */
  evaluate(context: PolicyContext): GovernanceDecision {
    const results: PolicyResult[] = [];

    for (const rule of this.rules.values()) {
      try {
        const result = rule.check(context);
        results.push(result);
      } catch (error) {
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

    const decision: GovernanceDecision = {
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
  evaluateRule(ruleId: string, context: PolicyContext): PolicyResult | null {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return null;
    }
    return rule.check(context);
  }

  /**
   * Get audit log
   */
  getAuditLog(limit?: number): Array<{ timestamp: number; decision: GovernanceDecision; context: PolicyContext }> {
    const log = [...this.auditLog].reverse();
    return limit ? log.slice(0, limit) : log;
  }

  /**
   * Get governance statistics
   */
  getStats(): {
    totalEvaluations: number;
    allowedCount: number;
    deniedCount: number;
    topFailures: Array<{ ruleId: string; count: number }>;
  } {
    const deniedCount = this.auditLog.filter((l) => !l.decision.allowed).length;

    const failureCounts = new Map<string, number>();
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
  clearAuditLog(): void {
    this.auditLog = [];
  }
}

// Singleton instance
export const governancePolicy = new GovernancePolicy();
