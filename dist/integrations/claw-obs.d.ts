/**
 * claw-obs integration - Observability and monitoring
 */
import type { ObsEvent, ObsMetrics } from './types.js';
export declare class ObservabilityIntegration {
    private events;
    private maxEvents;
    private startTime;
    constructor(maxEvents?: number);
    /**
     * Track an event
     */
    track(name: string, data?: Record<string, unknown>): void;
    /**
     * Track a timing event
     */
    trackTiming(name: string, duration: number, data?: Record<string, unknown>): void;
    /**
     * Track an error
     */
    trackError(error: string | Error, data?: Record<string, unknown>): void;
    /**
     * Get metrics summary
     */
    getMetrics(): ObsMetrics;
    /**
     * Get events by name
     */
    getEventsByName(name: string): ObsEvent[];
    /**
     * Get recent events
     */
    getRecentEvents(count?: number): ObsEvent[];
    /**
     * Clear all events
     */
    clear(): void;
    /**
     * Get uptime
     */
    getUptime(): number;
}
export declare function getObservability(maxEvents?: number): ObservabilityIntegration;
//# sourceMappingURL=claw-obs.d.ts.map