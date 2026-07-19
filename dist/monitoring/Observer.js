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
import { DEFAULT_RESEARCH_METRICS } from "./types.js";
import { AlertManager, DEFAULT_ALERT_RULES } from "./AlertManager.js";
import { MetricsCollector } from "./MetricsCollector.js";
/**
 * DeepClaw Observer for research pipeline monitoring.
 *
 * Design Principle: Passive observer — collects metrics without blocking pipeline.
 * All hooks are wrapped in try-catch to ensure observer never throws.
 */
export class DeepClawObserver {
    config;
    alertManager;
    metricsCollector;
    metricsHandlers = new Set();
    alertHandlers = new Set();
    startTime;
    metricsCounter = 0;
    currentPipelineId = null;
    currentTopic = null;
    researchStartTime = 0;
    constructor(config) {
        this.config = {
            enabled: config?.enabled ?? true,
            maxHistorySize: config?.maxHistorySize ?? 1000,
            metricsDir: config?.metricsDir,
            alertRules: config?.alertRules,
        };
        this.alertManager = new AlertManager(this.config.alertRules ?? DEFAULT_ALERT_RULES);
        this.metricsCollector = new MetricsCollector(this.config.metricsDir, this.config.maxHistorySize);
        this.startTime = Date.now();
    }
    // ── Lifecycle Hooks (called by Orchestrator) ──────────────────────
    /**
     * Called when research starts.
     */
    onResearchStart(pipelineId, topic) {
        try {
            this.currentPipelineId = pipelineId;
            this.currentTopic = topic;
            this.researchStartTime = Date.now();
            this.metricsCollector.startSession(pipelineId);
        }
        catch {
            // Observer errors are non-blocking
        }
    }
    /**
     * Called when research ends.
     */
    onResearchEnd(pipelineId, success) {
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
        }
        catch {
            return { ...DEFAULT_RESEARCH_METRICS };
        }
    }
    // ── Per-Phase Hooks ───────────────────────────────────────────────
    /**
     * Called when a phase starts.
     */
    onPhaseStart(phaseName) {
        try {
            // Track phase start time internally (not exposed yet)
            void phaseName; // Placeholder for future expansion
        }
        catch {
            // Non-blocking
        }
    }
    /**
     * Called when a phase ends.
     */
    onPhaseEnd(phaseName, durationMs) {
        try {
            this.metricsCollector.recordPhaseDuration(phaseName, durationMs);
        }
        catch {
            // Non-blocking
        }
    }
    // ── Per-Agent Hooks ───────────────────────────────────────────────
    /**
     * Called when an agent starts processing.
     */
    onAgentStart(role) {
        try {
            void role; // Placeholder for timing tracking
        }
        catch {
            // Non-blocking
        }
    }
    /**
     * Called when an agent finishes processing.
     */
    onAgentEnd(role, durationMs, status) {
        try {
            this.metricsCollector.recordAgentResponse(role, durationMs);
            // Update error rate if agent failed
            if (status === "failed") {
                this.metricsCollector.updateErrorRate(1, 1);
            }
            else {
                this.metricsCollector.updateErrorRate(0, 1);
            }
        }
        catch {
            // Non-blocking
        }
    }
    // ── Search Hooks ───────────────────────────────────────────────────
    /**
     * Called when search completes.
     */
    onSearchResult(query, resultCount, cacheHit) {
        try {
            void query; // Placeholder for query tracking
            // Update cache hit rate
            this.metricsCollector.updateCacheHitRate(cacheHit ? 1 : 0, 1);
            // Update source count
            this.metricsCollector.recordSourceCount(resultCount);
        }
        catch {
            // Non-blocking
        }
    }
    // ── Token Tracking ─────────────────────────────────────────────────
    /**
     * Record token usage.
     */
    recordTokenUsage(tokens) {
        try {
            this.metricsCollector.addTokenUsage(tokens);
        }
        catch {
            // Non-blocking
        }
    }
    // ── Metrics Access ──────────────────────────────────────────────────
    /**
     * Get current metrics.
     */
    getMetrics() {
        return this.metricsCollector.getMetrics();
    }
    /**
     * Get metrics snapshot.
     */
    getSnapshot() {
        return this.metricsCollector.createSnapshot(this.currentPipelineId ?? "unknown");
    }
    /**
     * Get metrics history.
     */
    getHistory(limit) {
        return this.metricsCollector.loadHistory(limit);
    }
    // ── Alert Management ────────────────────────────────────────────────
    /**
     * Get active alerts.
     */
    getAlerts() {
        return this.alertManager.getActiveAlerts();
    }
    /**
     * Subscribe to metrics updates.
     */
    onMetrics(handler) {
        this.metricsHandlers.add(handler);
    }
    /**
     * Subscribe to alerts.
     */
    onAlert(handler) {
        this.alertHandlers.add(handler);
    }
    // ── Status ──────────────────────────────────────────────────────────
    /**
     * Get monitoring status.
     */
    getStatus() {
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
    reset() {
        this.metricsCollector.reset();
        this.alertManager.clearAll();
        this.currentPipelineId = null;
        this.currentTopic = null;
        this.researchStartTime = 0;
    }
    // ── Private Helpers ────────────────────────────────────────────────
    emitMetrics(snapshot) {
        for (const handler of this.metricsHandlers) {
            try {
                handler(snapshot);
            }
            catch {
                // Handler failure is non-blocking
            }
        }
    }
    emitAlert(alert) {
        for (const handler of this.alertHandlers) {
            try {
                handler(alert);
            }
            catch {
                // Handler failure is non-blocking
            }
        }
    }
}
//# sourceMappingURL=Observer.js.map