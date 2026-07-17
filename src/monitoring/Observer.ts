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
// DeepClaw v3.5.0 — DeepClaw Observer

import type {
  ResearchMetrics,
  Alert,
  ObserverConfig,
  MetricsSnapshot,
  MonitoringStatus,
} from "./types.js";
import { DEFAULT_RESEARCH_METRICS } from "./types.js";
import { AlertManager, DEFAULT_ALERT_RULES } from "./AlertManager.js";
import { MetricsCollector } from "./MetricsCollector.js";

/**
 * Metrics handler function type.
 */
export type MetricsHandler = (snapshot: MetricsSnapshot) => void;

/**
 * Alert handler function type.
 */
export type AlertHandler = (alert: Alert) => void;

/**
 * DeepClaw Observer for research pipeline monitoring.
 *
 * Design Principle: Passive observer — collects metrics without blocking pipeline.
 * All hooks are wrapped in try-catch to ensure observer never throws.
 */
export class DeepClawObserver {
  private config: ObserverConfig;
  private alertManager: AlertManager;
  private metricsCollector: MetricsCollector;
  private metricsHandlers: Set<MetricsHandler> = new Set();
  private alertHandlers: Set<AlertHandler> = new Set();
  private startTime: number;
  private metricsCounter: number = 0;
  private currentPipelineId: string | null = null;
  private currentTopic: string | null = null;
  private researchStartTime: number = 0;

  constructor(config?: Partial<ObserverConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      maxHistorySize: config?.maxHistorySize ?? 1000,
      metricsDir: config?.metricsDir,
      alertRules: config?.alertRules,
    };

    this.alertManager = new AlertManager(
      this.config.alertRules ?? DEFAULT_ALERT_RULES
    );
    this.metricsCollector = new MetricsCollector(
      this.config.metricsDir,
      this.config.maxHistorySize
    );
    this.startTime = Date.now();
  }

  // ── Lifecycle Hooks (called by Orchestrator) ──────────────────────

  /**
   * Called when research starts.
   */
  onResearchStart(pipelineId: string, topic: string): void {
    try {
      this.currentPipelineId = pipelineId;
      this.currentTopic = topic;
      this.researchStartTime = Date.now();
      this.metricsCollector.startSession(pipelineId);
    } catch {
      // Observer errors are non-blocking
    }
  }

  /**
   * Called when research ends.
   */
  onResearchEnd(pipelineId: string, success: boolean): ResearchMetrics {
    try {
      const durationMs = Date.now() - this.researchStartTime;
      this.metricsCollector.setResearchDuration(durationMs);

      const metrics = this.metricsCollector.getMetrics();
      const snapshot = this.metricsCollector.createSnapshot(pipelineId);
      this.metricsCollector.persist(snapshot);

      // Evaluate alert rules
      const alerts = this.alertManager.evaluate(metrics);
      for (const alert of alerts) {
        this.emitAlert(alert);
      }

      // Emit metrics snapshot
      this.emitMetrics(snapshot);

      this.metricsCounter++;
      return metrics;
    } catch {
      return { ...DEFAULT_RESEARCH_METRICS };
    }
  }

  // ── Per-Phase Hooks ───────────────────────────────────────────────

  /**
   * Called when a phase starts.
   */
  onPhaseStart(phaseName: string): void {
    try {
      // Track phase start time internally (not exposed yet)
      void phaseName; // Placeholder for future expansion
    } catch {
      // Non-blocking
    }
  }

  /**
   * Called when a phase ends.
   */
  onPhaseEnd(phaseName: string, durationMs: number): void {
    try {
      this.metricsCollector.recordPhaseDuration(phaseName, durationMs);
    } catch {
      // Non-blocking
    }
  }

  // ── Per-Agent Hooks ───────────────────────────────────────────────

  /**
   * Called when an agent starts processing.
   */
  onAgentStart(role: string): void {
    try {
      void role; // Placeholder for timing tracking
    } catch {
      // Non-blocking
    }
  }

  /**
   * Called when an agent finishes processing.
   */
  onAgentEnd(role: string, durationMs: number, status: "success" | "failed" | "partial"): void {
    try {
      this.metricsCollector.recordAgentResponse(role, durationMs);

      // Update error rate if agent failed
      if (status === "failed") {
        this.metricsCollector.updateErrorRate(1, 1);
      } else {
        this.metricsCollector.updateErrorRate(0, 1);
      }
    } catch {
      // Non-blocking
    }
  }

  // ── Search Hooks ───────────────────────────────────────────────────

  /**
   * Called when search completes.
   */
  onSearchResult(query: string, resultCount: number, cacheHit: boolean): void {
    try {
      void query; // Placeholder for query tracking

      // Update cache hit rate
      this.metricsCollector.updateCacheHitRate(cacheHit ? 1 : 0, 1);

      // Update source count
      this.metricsCollector.recordSourceCount(resultCount);
    } catch {
      // Non-blocking
    }
  }

  // ── Token Tracking ─────────────────────────────────────────────────

  /**
   * Record token usage.
   */
  recordTokenUsage(tokens: number): void {
    try {
      this.metricsCollector.addTokenUsage(tokens);
    } catch {
      // Non-blocking
    }
  }

  // ── Metrics Access ──────────────────────────────────────────────────

  /**
   * Get current metrics.
   */
  getMetrics(): ResearchMetrics {
    return this.metricsCollector.getMetrics();
  }

  /**
   * Get metrics snapshot.
   */
  getSnapshot(): MetricsSnapshot {
    return this.metricsCollector.createSnapshot(this.currentPipelineId ?? "unknown");
  }

  /**
   * Get metrics history.
   */
  getHistory(limit?: number): MetricsSnapshot[] {
    return this.metricsCollector.loadHistory(limit);
  }

  // ── Alert Management ────────────────────────────────────────────────

  /**
   * Get active alerts.
   */
  getAlerts(): Alert[] {
    return this.alertManager.getActiveAlerts();
  }

  /**
   * Subscribe to metrics updates.
   */
  onMetrics(handler: MetricsHandler): void {
    this.metricsHandlers.add(handler);
  }

  /**
   * Subscribe to alerts.
   */
  onAlert(handler: AlertHandler): void {
    this.alertHandlers.add(handler);
  }

  // ── Status ──────────────────────────────────────────────────────────

  /**
   * Get monitoring status.
   */
  getStatus(): MonitoringStatus {
    return {
      enabled: this.config.enabled ?? true,
      uptime: Date.now() - this.startTime,
      metricsCollected: this.metricsCounter,
      alertsActive: this.alertManager.getActiveAlerts().length,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Reset observer state.
   */
  reset(): void {
    this.metricsCollector.reset();
    this.alertManager.clearAll();
    this.currentPipelineId = null;
    this.currentTopic = null;
    this.researchStartTime = 0;
  }

  // ── Private Helpers ────────────────────────────────────────────────

  private emitMetrics(snapshot: MetricsSnapshot): void {
    for (const handler of this.metricsHandlers) {
      try {
        handler(snapshot);
      } catch {
        // Handler failure is non-blocking
      }
    }
  }

  private emitAlert(alert: Alert): void {
    for (const handler of this.alertHandlers) {
      try {
        handler(alert);
      } catch {
        // Handler failure is non-blocking
      }
    }
  }
}
