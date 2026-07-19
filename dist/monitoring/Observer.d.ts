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
import type { ResearchMetrics, Alert, ObserverConfig, MetricsSnapshot, MonitoringStatus } from "./types.js";
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
export declare class DeepClawObserver {
    private config;
    private alertManager;
    private metricsCollector;
    private metricsHandlers;
    private alertHandlers;
    private startTime;
    private metricsCounter;
    private currentPipelineId;
    private currentTopic;
    private researchStartTime;
    constructor(config?: Partial<ObserverConfig>);
    /**
     * Called when research starts.
     */
    onResearchStart(pipelineId: string, topic: string): void;
    /**
     * Called when research ends.
     */
    onResearchEnd(pipelineId: string, success: boolean): ResearchMetrics;
    /**
     * Called when a phase starts.
     */
    onPhaseStart(phaseName: string): void;
    /**
     * Called when a phase ends.
     */
    onPhaseEnd(phaseName: string, durationMs: number): void;
    /**
     * Called when an agent starts processing.
     */
    onAgentStart(role: string): void;
    /**
     * Called when an agent finishes processing.
     */
    onAgentEnd(role: string, durationMs: number, status: "success" | "failed" | "partial"): void;
    /**
     * Called when search completes.
     */
    onSearchResult(query: string, resultCount: number, cacheHit: boolean): void;
    /**
     * Record token usage.
     */
    recordTokenUsage(tokens: number): void;
    /**
     * Get current metrics.
     */
    getMetrics(): ResearchMetrics;
    /**
     * Get metrics snapshot.
     */
    getSnapshot(): MetricsSnapshot;
    /**
     * Get metrics history.
     */
    getHistory(limit?: number): MetricsSnapshot[];
    /**
     * Get active alerts.
     */
    getAlerts(): Alert[];
    /**
     * Subscribe to metrics updates.
     */
    onMetrics(handler: MetricsHandler): void;
    /**
     * Subscribe to alerts.
     */
    onAlert(handler: AlertHandler): void;
    /**
     * Get monitoring status.
     */
    getStatus(): MonitoringStatus;
    /**
     * Reset observer state.
     */
    reset(): void;
    private emitMetrics;
    private emitAlert;
}
//# sourceMappingURL=Observer.d.ts.map