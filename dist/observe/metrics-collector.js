/**
 * SciClaw v3.6.0 — Metrics Collector (OBSERVE Stage)
 * Collects and tracks operational metrics for research workflow
 */
/**
 * MetricsCollector - Collects operational metrics
 */
export class MetricsCollector {
    metrics = new Map();
    counters = new Map();
    gauges = new Map();
    maxRecords;
    constructor(maxRecords = 1000) {
        this.maxRecords = maxRecords;
    }
    /**
     * Increment a counter
     */
    incrementCounter(name, delta = 1, tags) {
        const current = this.counters.get(name) ?? 0;
        this.counters.set(name, current + delta);
        this.recordMetric(name, "counter", current + delta, tags);
    }
    /**
     * Set a gauge value
     */
    setGauge(name, value, tags) {
        this.gauges.set(name, value);
        this.recordMetric(name, "gauge", value, tags);
    }
    /**
     * Record a timing measurement
     */
    recordTiming(name, durationMs, tags) {
        this.recordMetric(name, "timing", durationMs, tags);
    }
    /**
     * Time an async operation
     */
    async timeOperation(name, operation) {
        const start = Date.now();
        try {
            const result = await operation();
            this.recordTiming(name, Date.now() - start, { status: "success" });
            return result;
        }
        catch (error) {
            this.recordTiming(name, Date.now() - start, { status: "error" });
            throw error;
        }
    }
    /**
     * Record a raw metric
     */
    recordMetric(name, type, value, tags) {
        const record = {
            name,
            type,
            value,
            timestamp: Date.now(),
            tags,
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const records = this.metrics.get(name);
        records.push(record);
        // Trim to max records
        if (records.length > this.maxRecords) {
            records.shift();
        }
    }
    /**
     * Get counter value
     */
    getCounter(name) {
        return this.counters.get(name) ?? 0;
    }
    /**
     * Get gauge value
     */
    getGauge(name) {
        return this.gauges.get(name);
    }
    /**
     * Get metric summary
     */
    getSummary(name) {
        const records = this.metrics.get(name);
        if (!records || records.length === 0) {
            return null;
        }
        const values = records.map((r) => r.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const lastRecord = records[records.length - 1];
        return {
            name,
            count: records.length,
            sum,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: sum / records.length,
            lastValue: values[values.length - 1] ?? 0,
            lastTimestamp: lastRecord?.timestamp ?? Date.now(),
        };
    }
    /**
     * Get all metric names
     */
    getMetricNames() {
        return [...this.metrics.keys()];
    }
    /**
     * Get all counters
     */
    getAllCounters() {
        return Object.fromEntries(this.counters);
    }
    /**
     * Get all gauges
     */
    getAllGauges() {
        return Object.fromEntries(this.gauges);
    }
    /**
     * Export metrics for reporting
     */
    export() {
        const summaries = {};
        for (const name of this.metrics.keys()) {
            summaries[name] = this.getSummary(name);
        }
        return {
            counters: this.getAllCounters(),
            gauges: this.getAllGauges(),
            summaries,
        };
    }
    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
        this.counters.clear();
        this.gauges.clear();
    }
}
// Singleton instance
export const metricsCollector = new MetricsCollector();
/**
 * Pre-defined research metrics
 */
export const ResearchMetrics = {
    SEARCH_REQUESTS: "research.search.requests",
    SEARCH_LATENCY: "research.search.latency_ms",
    SOURCES_FOUND: "research.sources.found",
    ANALYSIS_TIME: "research.analysis.time_ms",
    FINDINGS_COUNT: "research.findings.count",
    REPORT_SIZE: "research.report.size_bytes",
};
//# sourceMappingURL=metrics-collector.js.map