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
// SciClaw v3.5.0 — Monitoring Types

// ── Metric Types ─────────────────────────────────────────────────────

/** Research-domain metrics */
export interface ResearchMetrics {
  // Timing
  researchDurationMs: number;
  phaseDurationMs: Record<string, number>;
  agentResponseTimeMs: Record<string, number>;

  // Quality
  cacheHitRate: number;        // 0-1 ratio
  errorRate: number;           // 0-1 ratio
  sourceCount: number;

  // Resources
  tokenUsage: number;
}

/** Default metric values */
export const DEFAULT_RESEARCH_METRICS: ResearchMetrics = {
  researchDurationMs: 0,
  phaseDurationMs: {},
  agentResponseTimeMs: {},
  cacheHitRate: 0,
  errorRate: 0,
  sourceCount: 0,
  tokenUsage: 0,
};

// ── Alert Types ──────────────────────────────────────────────────────

/** Alert severity levels */
export type AlertSeverity = "info" | "warning" | "critical";

/** Alert state */
export type AlertState = "firing" | "resolved";

/** Alert definition */
export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  state: AlertState;
  source: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  resolvedAt?: string;
}

/** Alert rule condition */
export interface AlertCondition {
  metric: keyof ResearchMetrics;
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
  threshold: number;
}

/** Alert rule definition */
export interface AlertRule {
  name: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  enabled: boolean;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

// ── Observer Types ───────────────────────────────────────────────────

/** Observer configuration */
export interface ObserverConfig {
  enabled?: boolean;
  maxHistorySize?: number;
  metricsDir?: string;
  alertRules?: AlertRule[];
}

/** Metrics snapshot with timestamp */
export interface MetricsSnapshot {
  timestamp: string;
  pipelineId: string;
  metrics: ResearchMetrics;
}

/** Monitoring status */
export interface MonitoringStatus {
  enabled: boolean;
  uptime: number;
  metricsCollected: number;
  alertsActive: number;
  lastUpdate: string;
}
