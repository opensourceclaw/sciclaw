/**
 * claw-obs integration - Observability and monitoring
 */
export class ObservabilityIntegration {
    events = [];
    maxEvents;
    startTime;
    constructor(maxEvents = 1000) {
        this.maxEvents = maxEvents;
        this.startTime = Date.now();
    }
    /**
     * Track an event
     */
    track(name, data = {}) {
        // Evict oldest if at capacity
        if (this.events.length >= this.maxEvents) {
            this.events.shift();
        }
        this.events.push({
            name,
            timestamp: Date.now(),
            data,
        });
    }
    /**
     * Track a timing event
     */
    trackTiming(name, duration, data = {}) {
        this.track(name, { ...data, duration });
    }
    /**
     * Track an error
     */
    trackError(error, data = {}) {
        const message = typeof error === 'string' ? error : error.message;
        this.track('error', { ...data, error: message });
    }
    /**
     * Get metrics summary
     */
    getMetrics() {
        const errors = this.events.filter((e) => e.name === 'error').length;
        // Calculate total duration from timing events
        let duration = 0;
        for (const event of this.events) {
            if (typeof event.data.duration === 'number') {
                duration += event.data.duration;
            }
        }
        // Custom metrics
        const custom = {};
        for (const event of this.events) {
            const key = event.name;
            custom[key] = (custom[key] ?? 0) + 1;
        }
        return {
            events: this.events.length,
            errors,
            duration,
            custom,
        };
    }
    /**
     * Get events by name
     */
    getEventsByName(name) {
        return this.events.filter((e) => e.name === name);
    }
    /**
     * Get recent events
     */
    getRecentEvents(count = 10) {
        return this.events.slice(-count);
    }
    /**
     * Clear all events
     */
    clear() {
        this.events = [];
    }
    /**
     * Get uptime
     */
    getUptime() {
        return Date.now() - this.startTime;
    }
}
// Global instance
let globalObs = null;
export function getObservability(maxEvents) {
    if (!globalObs) {
        globalObs = new ObservabilityIntegration(maxEvents);
    }
    return globalObs;
}
//# sourceMappingURL=claw-obs.js.map