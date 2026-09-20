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
// SciClaw v3.5.0 — Metrics Collector

import type { ResearchMetrics, MetricsSnapshot } from "./types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DEFAULT_RESEARCH_METRICS } from "./types.js";

const DEFAULT_METRICS_DIR = path.join(os.homedir(), ".deepclaw", "metrics");

/**
 * Metrics collector with filesystem persistence.
 */
export class MetricsCollector {
  private metrics: ResearchMetrics;
  private history: MetricsSnapshot[] = [];
  private metricsDir: string;
  private maxHistorySize: number;
  private currentPipelineId: string | null = null;
  private cacheHits: number = 0;
  private cacheTotal: number = 0;
  private errorCount: number = 0;
  private searchTotal: number = 0;

  constructor(metricsDir?: string, maxHistorySize?: number) {
    this.metrics = { ...DEFAULT_RESEARCH_METRICS };
    this.metricsDir = metricsDir ?? DEFAULT_METRICS_DIR;
    this.maxHistorySize = maxHistorySize ?? 1000;
  }

  /**
   * Start a new collection session.
   */
  startSession(pipelineId: string): void {
    this.currentPipelineId = pipelineId;
    this.metrics = { ...DEFAULT_RESEARCH_METRICS };
    this.cacheHits = 0;
    this.cacheTotal = 0;
    this.errorCount = 0;
    this.searchTotal = 0;
  }

  /**
   * Record phase duration.
   */
  recordPhaseDuration(phaseName: string, durationMs: number): void {
    this.metrics.phaseDurationMs[phaseName] = durationMs;
  }

  /**
   * Record agent response time.
   */
  recordAgentResponse(role: string, durationMs: number): void {
    this.metrics.agentResponseTimeMs[role] = durationMs;
  }

  /**
   * Update cache hit rate.
   */
  updateCacheHitRate(hits: number, total: number): void {
    this.cacheHits += hits;
    this.cacheTotal += total;
    if (this.cacheTotal > 0) {
      this.metrics.cacheHitRate = this.cacheHits / this.cacheTotal;
    }
  }

  /**
   * Update error rate.
   */
  updateErrorRate(errors: number, total: number): void {
    this.errorCount += errors;
    this.searchTotal += total;
    if (this.searchTotal > 0) {
      this.metrics.errorRate = this.errorCount / this.searchTotal;
    }
  }

  /**
   * Record source count.
   */
  recordSourceCount(count: number): void {
    this.metrics.sourceCount = count;
  }

  /**
   * Add tokens to usage.
   */
  addTokenUsage(tokens: number): void {
    this.metrics.tokenUsage += tokens;
  }

  /**
   * Set total research duration.
   */
  setResearchDuration(durationMs: number): void {
    this.metrics.researchDurationMs = durationMs;
  }

  /**
   * Get current metrics.
   */
  getMetrics(): ResearchMetrics {
    return { ...this.metrics };
  }

  /**
   * Create snapshot.
   */
  createSnapshot(pipelineId: string): MetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      pipelineId,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Persist snapshot to disk.
   */
  persist(snapshot: MetricsSnapshot): void {
    try {
      if (!fs.existsSync(this.metricsDir)) {
        fs.mkdirSync(this.metricsDir, { recursive: true });
      }

      // Write per-pipeline file
      const pipelineFile = path.join(this.metricsDir, `pipeline-${snapshot.pipelineId}.json`);
      fs.writeFileSync(pipelineFile, JSON.stringify(snapshot, null, 2), "utf-8");

      // Update history
      this.history.push(snapshot);
      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(-this.maxHistorySize);
      }

      // Write history file
      const historyFile = path.join(this.metricsDir, "history.json");
      fs.writeFileSync(historyFile, JSON.stringify(this.history, null, 2), "utf-8");
    } catch {
      // Persistence failure is non-blocking
    }
  }

  /**
   * Load history from disk.
   */
  loadHistory(limit?: number): MetricsSnapshot[] {
    try {
      const historyFile = path.join(this.metricsDir, "history.json");
      if (!fs.existsSync(historyFile)) return [];

      const data = fs.readFileSync(historyFile, "utf-8");
      const history = JSON.parse(data) as MetricsSnapshot[];
      this.history = history;

      const n = limit ?? this.maxHistorySize;
      return history.slice(-n);
    } catch {
      return [];
    }
  }

  /**
   * Reset metrics for new session.
   */
  reset(): void {
    this.metrics = { ...DEFAULT_RESEARCH_METRICS };
    this.cacheHits = 0;
    this.cacheTotal = 0;
    this.errorCount = 0;
    this.searchTotal = 0;
    this.currentPipelineId = null;
  }
}
