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
/**
 * Default alert rules for research pipeline.
 */
export const DEFAULT_ALERT_RULES = [
    {
        name: "high_error_rate",
        condition: { metric: "errorRate", operator: ">", threshold: 0.3 },
        severity: "warning",
        enabled: true,
        labels: { category: "quality" },
    },
    {
        name: "slow_response",
        condition: { metric: "researchDurationMs", operator: ">", threshold: 120000 },
        severity: "warning",
        enabled: true,
        labels: { category: "performance" },
    },
    {
        name: "low_cache_hit",
        condition: { metric: "cacheHitRate", operator: "<", threshold: 0.2 },
        severity: "info",
        enabled: true,
        labels: { category: "performance" },
    },
    {
        name: "token_budget_exceeded",
        condition: { metric: "tokenUsage", operator: ">", threshold: 100000 },
        severity: "critical",
        enabled: true,
        labels: { category: "budget" },
    },
    {
        name: "zero_sources",
        condition: { metric: "sourceCount", operator: "==", threshold: 0 },
        severity: "critical",
        enabled: true,
        labels: { category: "quality" },
    },
];
/**
 * Alert manager for evaluating rules and managing alerts.
 */
export class AlertManager {
    rules = new Map();
    alerts = new Map();
    alertCounter = 0;
    constructor(rules) {
        if (rules) {
            for (const rule of rules) {
                this.addRule(rule);
            }
        }
    }
    /**
     * Add alert rule.
     */
    addRule(rule) {
        this.rules.set(rule.name, rule);
    }
    /**
     * Remove alert rule.
     */
    removeRule(name) {
        this.rules.delete(name);
    }
    /**
     * Get all rules.
     */
    getRules() {
        return [...this.rules.values()];
    }
    /**
     * Evaluate rules against metrics.
     */
    evaluate(metrics) {
        const newAlerts = [];
        for (const [name, rule] of this.rules) {
            if (!rule.enabled)
                continue;
            const triggered = this.evaluateCondition(rule.condition, metrics);
            if (triggered) {
                const alert = this.createAlert(rule, metrics);
                this.alerts.set(alert.id, alert);
                newAlerts.push(alert);
            }
        }
        return newAlerts;
    }
    /**
     * Get active (firing) alerts.
     */
    getActiveAlerts() {
        return [...this.alerts.values()].filter((a) => a.state === "firing");
    }
    /**
     * Get all alerts.
     */
    getAllAlerts() {
        return [...this.alerts.values()];
    }
    /**
     * Get alert by ID.
     */
    getAlert(alertId) {
        return this.alerts.get(alertId);
    }
    /**
     * Resolve alert.
     */
    resolve(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.state = "resolved";
            alert.resolvedAt = new Date().toISOString();
        }
    }
    /**
     * Clear all alerts.
     */
    clearAll() {
        this.alerts.clear();
    }
    // Private methods
    evaluateCondition(condition, metrics) {
        const rawValue = metrics[condition.metric];
        // Only numeric metrics can be compared (not Record<string, number>)
        const value = typeof rawValue === "number" ? rawValue : 0;
        switch (condition.operator) {
            case ">":
                return value > condition.threshold;
            case "<":
                return value < condition.threshold;
            case ">=":
                return value >= condition.threshold;
            case "<=":
                return value <= condition.threshold;
            case "==":
                return value === condition.threshold;
            case "!=":
                return value !== condition.threshold;
            default:
                return false;
        }
    }
    createAlert(rule, metrics) {
        const value = metrics[rule.condition.metric] ?? 0;
        return {
            id: `alert-${++this.alertCounter}-${Date.now()}`,
            name: rule.name,
            severity: rule.severity,
            message: `${rule.name}: ${rule.condition.metric} is ${value} (threshold: ${rule.condition.threshold})`,
            timestamp: new Date().toISOString(),
            state: "firing",
            source: "SciClawObserver",
            labels: rule.labels ?? {},
            annotations: {
                ...rule.annotations,
                metric: rule.condition.metric,
                currentValue: String(value),
                threshold: String(rule.condition.threshold),
            },
        };
    }
}
//# sourceMappingURL=AlertManager.js.map