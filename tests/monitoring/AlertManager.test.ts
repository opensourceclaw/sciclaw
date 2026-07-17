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
// DeepClaw v3.5.0 - AlertManager Tests

import { describe, it, expect, beforeEach } from "vitest";
import { AlertManager, DEFAULT_ALERT_RULES } from "../../src/monitoring/AlertManager.js";
import type { ResearchMetrics, AlertRule } from "../../src/monitoring/types.js";

describe("AlertManager", () => {
  let manager: AlertManager;

  beforeEach(() => {
    manager = new AlertManager(DEFAULT_ALERT_RULES);
  });

  it("initializes with default rules", () => {
    const rules = manager.getRules();
    expect(rules.length).toBe(5);
    expect(rules.map(r => r.name)).toContain("high_error_rate");
    expect(rules.map(r => r.name)).toContain("zero_sources");
  });

  it("evaluate() fires alert on high error rate", () => {
    const metrics: ResearchMetrics = {
      researchDurationMs: 10000,
      phaseDurationMs: {},
      agentResponseTimeMs: {},
      cacheHitRate: 0.5,
      errorRate: 0.5, // > 0.3 threshold
      sourceCount: 10,
      tokenUsage: 1000,
    };

    const alerts = manager.evaluate(metrics);
    expect(alerts.some(a => a.name === "high_error_rate")).toBe(true);
  });

  it("evaluate() fires alert on zero sources", () => {
    const metrics: ResearchMetrics = {
      researchDurationMs: 10000,
      phaseDurationMs: {},
      agentResponseTimeMs: {},
      cacheHitRate: 0.5,
      errorRate: 0,
      sourceCount: 0, // == 0 threshold
      tokenUsage: 1000,
    };

    const alerts = manager.evaluate(metrics);
    expect(alerts.some(a => a.name === "zero_sources")).toBe(true);
  });

  it("evaluate() does not fire on normal metrics", () => {
    const metrics: ResearchMetrics = {
      researchDurationMs: 30000,
      phaseDurationMs: {},
      agentResponseTimeMs: {},
      cacheHitRate: 0.5,
      errorRate: 0.1, // < 0.3 threshold
      sourceCount: 10, // > 0
      tokenUsage: 1000, // < 100000
    };

    const alerts = manager.evaluate(metrics);
    expect(alerts.length).toBe(0);
  });

  it("addRule() adds custom rule", () => {
    const customRule: AlertRule = {
      name: "custom_rule",
      condition: { metric: "tokenUsage", operator: "<", threshold: 100 },
      severity: "warning",
      enabled: true,
    };

    manager.addRule(customRule);
    const rules = manager.getRules();
    expect(rules.length).toBe(6);
    expect(rules.map(r => r.name)).toContain("custom_rule");
  });

  it("removeRule() removes rule", () => {
    manager.removeRule("zero_sources");
    const rules = manager.getRules();
    expect(rules.length).toBe(4);
    expect(rules.map(r => r.name)).not.toContain("zero_sources");
  });

  it("getActiveAlerts() returns firing alerts", () => {
    const metrics: ResearchMetrics = {
      researchDurationMs: 10000,
      phaseDurationMs: {},
      agentResponseTimeMs: {},
      cacheHitRate: 0.5,
      errorRate: 0.5,
      sourceCount: 10,
      tokenUsage: 1000,
    };

    manager.evaluate(metrics);
    const active = manager.getActiveAlerts();
    expect(active.length).toBeGreaterThan(0);
    expect(active[0].state).toBe("firing");
  });

  it("resolve() marks alert as resolved", () => {
    const metrics: ResearchMetrics = {
      researchDurationMs: 10000,
      phaseDurationMs: {},
      agentResponseTimeMs: {},
      cacheHitRate: 0.5,
      errorRate: 0.5,
      sourceCount: 10,
      tokenUsage: 1000,
    };

    const alerts = manager.evaluate(metrics);
    manager.resolve(alerts[0].id);

    const active = manager.getActiveAlerts();
    expect(active.some(a => a.id === alerts[0].id)).toBe(false);
  });

  it("clearAll() removes all alerts", () => {
    const metrics: ResearchMetrics = {
      researchDurationMs: 10000,
      phaseDurationMs: {},
      agentResponseTimeMs: {},
      cacheHitRate: 0.5,
      errorRate: 0.5,
      sourceCount: 0,
      tokenUsage: 200000,
    };

    manager.evaluate(metrics);
    manager.clearAll();

    const all = manager.getAllAlerts();
    expect(all.length).toBe(0);
  });
});
