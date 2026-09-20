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
// SciClaw v3.5.0 — Monitoring Module Exports

export { SciClawObserver } from "./Observer.js";
export type { MetricsHandler, AlertHandler } from "./Observer.js";

export { MetricsCollector } from "./MetricsCollector.js";

export { AlertManager, DEFAULT_ALERT_RULES } from "./AlertManager.js";

export type {
  ResearchMetrics,
  Alert,
  AlertSeverity,
  AlertState,
  AlertCondition,
  AlertRule,
  ObserverConfig,
  MetricsSnapshot,
  MonitoringStatus,
} from "./types.js";

export { DEFAULT_RESEARCH_METRICS } from "./types.js";
