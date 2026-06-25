/**
 * DeepClaw v3.0.0 — Hypothesis Validator
 *
 * Validates hypothesis feasibility, testability, falsifiability,
 * novelty, and clarity.
 */
import { DEFAULT_HYPOTHESIS_CONFIG } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function checkFeasibility(h) {
    const issues = [];
    if (!h.statement || h.statement.trim().length === 0) {
        issues.push({
            severity: "error",
            message: "Statement is empty",
            field: "statement",
        });
        return { feasible: false, issues };
    }
    if (h.statement.trim().length < 20) {
        issues.push({
            severity: "warning",
            message: "Statement is very short; may lack specificity",
            field: "statement",
        });
    }
    if (h.supportingEvidence.length === 0 &&
        h.contradictingEvidence.length === 0) {
        issues.push({
            severity: "warning",
            message: "No evidence associated with hypothesis",
            field: "supportingEvidence",
        });
    }
    if (h.confidence < 0 || h.confidence > 1) {
        issues.push({
            severity: "error",
            message: "Confidence must be between 0 and 1",
            field: "confidence",
        });
        return { feasible: false, issues };
    }
    return {
        feasible: issues.filter((i) => i.severity === "error").length === 0,
        issues,
    };
}
function checkTestability(statement) {
    const issues = [];
    let score = 0;
    if (/\d+%?/.test(statement))
        score++;
    if (/more than|less than|greater|higher|lower|increase|decrease/i.test(statement))
        score++;
    if (/causes?|affects?|influences?|leads? to|results? in/i.test(statement))
        score++;
    if (/predicts?|forecasts?/i.test(statement))
        score++;
    if (/measure|quantif|percent|rate|ratio/i.test(statement))
        score++;
    if (score === 0) {
        issues.push({
            severity: "info",
            message: "Statement lacks measurable terms; testability is low",
            field: "statement",
        });
    }
    return { testable: score >= 1, issues };
}
function checkFalsifiability(statement) {
    const issues = [];
    const tautologyPatterns = [
        /either.*or.*not/i,
        /what is.*is/i,
        /it is what it is/i,
    ];
    for (const pattern of tautologyPatterns) {
        if (pattern.test(statement)) {
            issues.push({
                severity: "warning",
                message: "Statement appears tautological and may be unfalsifiable",
                field: "statement",
            });
            return { falsifiable: false, issues };
        }
    }
    if (/\b(always|never|all|none|every|no one)\b/i.test(statement)) {
        issues.push({
            severity: "warning",
            message: "Absolute claims are difficult to verify; consider qualifying",
            field: "statement",
        });
    }
    return { falsifiable: issues.filter((i) => i.severity !== "info").length === 0, issues };
}
function computeNoveltyScore(statement) {
    const commonPatterns = [
        /water boils/i,
        /sun rises/i,
        /earth (is|revolves)/i,
        /gravity exists/i,
        /humans need (oxygen|air|water|food)/i,
        /exercise is (good|healthy)/i,
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(statement))
            return 0.1;
    }
    return 0.7;
}
function computeClarityScore(statement) {
    if (statement.length === 0)
        return 0;
    if (statement.length < 20)
        return 0.3;
    if (statement.length > 500)
        return 0.6;
    if (statement.includes("?"))
        return 0.5;
    // Penalize ambiguous pronouns without clear referents
    const ambiguousPronouns = /\b(it|this|that|these|those|they)\b/gi;
    const matches = statement.match(ambiguousPronouns);
    if (matches && matches.length > 3)
        return 0.6;
    return 0.85;
}
// ── HypothesisValidator ──────────────────────────────────────────────────
export class HypothesisValidator {
    config;
    totalValidated = 0;
    feasibleCount = 0;
    infeasibleCount = 0;
    constructor(config) {
        this.config = { ...DEFAULT_HYPOTHESIS_CONFIG, ...config };
    }
    validate(hypothesis) {
        this.totalValidated++;
        const feasibility = checkFeasibility(hypothesis);
        const testability = checkTestability(hypothesis.statement);
        const falsifiability = checkFalsifiability(hypothesis.statement);
        const novelty = computeNoveltyScore(hypothesis.statement);
        const clarity = computeClarityScore(hypothesis.statement);
        const allIssues = [
            ...feasibility.issues,
            ...testability.issues,
            ...falsifiability.issues,
        ];
        if (novelty < this.config.validationThresholds.minNovelty) {
            allIssues.push({
                severity: "info",
                message: `Novelty score (${novelty}) is below threshold (${this.config.validationThresholds.minNovelty})`,
                field: "statement",
            });
        }
        if (clarity < this.config.validationThresholds.minClarity) {
            allIssues.push({
                severity: "warning",
                message: `Clarity score (${clarity}) is below threshold (${this.config.validationThresholds.minClarity})`,
                field: "statement",
            });
        }
        const feasible = feasibility.feasible;
        if (feasible)
            this.feasibleCount++;
        else
            this.infeasibleCount++;
        const overallScore = (feasibility.feasible ? 0.25 : 0) +
            (testability.testable ? 0.2 : 0.05) +
            (falsifiability.falsifiable ? 0.2 : 0.05) +
            novelty * 0.15 +
            clarity * 0.2;
        return {
            hypothesisId: hypothesis.id,
            feasible,
            testable: testability.testable,
            falsifiable: falsifiability.falsifiable,
            novelty: Math.round(novelty * 100) / 100,
            clarity: Math.round(clarity * 100) / 100,
            issues: allIssues,
            overallScore: Math.round(Math.min(overallScore, 1.0) * 100) / 100,
        };
    }
    validateBatch(hypotheses) {
        return hypotheses.map((h) => this.validate(h));
    }
    isFeasible(hypothesis) {
        const result = this.validate(hypothesis);
        return result.feasible;
    }
    isTestable(hypothesis) {
        const result = this.validate(hypothesis);
        return result.testable;
    }
    isFalsifiable(hypothesis) {
        const result = this.validate(hypothesis);
        return result.falsifiable;
    }
    getValidationStats() {
        return {
            totalValidated: this.totalValidated,
            feasibleCount: this.feasibleCount,
            infeasibleCount: this.infeasibleCount,
        };
    }
}
export function createHypothesisValidator(config) {
    return new HypothesisValidator(config);
}
//# sourceMappingURL=validator.js.map