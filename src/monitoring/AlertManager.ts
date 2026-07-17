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
// DeepClaw v3.5.0 — Alert Manager

import type { Alert, AlertRule, AlertCondition, AlertSeverity, ResearchMetrics } from "./types.js";

/**
 * Default alert rules for research pipeline.
 */
export const DEFAULT_ALERT_RULES: AlertRule[] = [
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
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertCounter: number = 0;

  constructor(rules?: AlertRule[]) {
    if (rules) {
      for (const rule of rules) {
        this.addRule(rule);
      }
    }
  }

  /**
   * Add alert rule.
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
  }

  /**
   * Remove alert rule.
   */
  removeRule(name: string): void {
    this.rules.delete(name);
  }

  /**
   * Get all rules.
   */
  getRules(): AlertRule[] {
    return [...this.rules.values()];
  }

  /**
   * Evaluate rules against metrics.
   */
  evaluate(metrics: ResearchMetrics): Alert[] {
    const newAlerts: Alert[] = [];

    for (const [name, rule] of this.rules) {
      if (!rule.enabled) continue;

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
  getActiveAlerts(): Alert[] {
    return [...this.alerts.values()].filter((a) => a.state === "firing");
  }

  /**
   * Get all alerts.
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts.values()];
  }

  /**
   * Get alert by ID.
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Resolve alert.
   */
  resolve(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.state = "resolved";
      alert.resolvedAt = new Date().toISOString();
    }
  }

  /**
   * Clear all alerts.
   */
  clearAll(): void {
    this.alerts.clear();
  }

  // Private methods

  private evaluateCondition(condition: AlertCondition, metrics: ResearchMetrics): boolean {
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

  private createAlert(rule: AlertRule, metrics: ResearchMetrics): Alert {
    const value = metrics[rule.condition.metric] ?? 0;

    return {
      id: `alert-${++this.alertCounter}-${Date.now()}`,
      name: rule.name,
      severity: rule.severity,
      message: `${rule.name}: ${rule.condition.metric} is ${value} (threshold: ${rule.condition.threshold})`,
      timestamp: new Date().toISOString(),
      state: "firing",
      source: "DeepClawObserver",
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
