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
import type { ResearchMetrics, MetricsSnapshot } from "./types.js";
/**
 * Metrics collector with filesystem persistence.
 */
export declare class MetricsCollector {
    private metrics;
    private history;
    private metricsDir;
    private maxHistorySize;
    private currentPipelineId;
    private cacheHits;
    private cacheTotal;
    private errorCount;
    private searchTotal;
    constructor(metricsDir?: string, maxHistorySize?: number);
    /**
     * Start a new collection session.
     */
    startSession(pipelineId: string): void;
    /**
     * Record phase duration.
     */
    recordPhaseDuration(phaseName: string, durationMs: number): void;
    /**
     * Record agent response time.
     */
    recordAgentResponse(role: string, durationMs: number): void;
    /**
     * Update cache hit rate.
     */
    updateCacheHitRate(hits: number, total: number): void;
    /**
     * Update error rate.
     */
    updateErrorRate(errors: number, total: number): void;
    /**
     * Record source count.
     */
    recordSourceCount(count: number): void;
    /**
     * Add tokens to usage.
     */
    addTokenUsage(tokens: number): void;
    /**
     * Set total research duration.
     */
    setResearchDuration(durationMs: number): void;
    /**
     * Get current metrics.
     */
    getMetrics(): ResearchMetrics;
    /**
     * Create snapshot.
     */
    createSnapshot(pipelineId: string): MetricsSnapshot;
    /**
     * Persist snapshot to disk.
     */
    persist(snapshot: MetricsSnapshot): void;
    /**
     * Load history from disk.
     */
    loadHistory(limit?: number): MetricsSnapshot[];
    /**
     * Reset metrics for new session.
     */
    reset(): void;
}
//# sourceMappingURL=MetricsCollector.d.ts.map