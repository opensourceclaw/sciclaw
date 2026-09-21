function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}
export class PerformanceMetrics {
    records = [];
    windowMs;
    constructor(windowMs = 60_000) {
        this.windowMs = windowMs;
    }
    record(sourceId, query, latencyMs, success) {
        this.records.push({
            sourceId,
            query,
            latencyMs,
            timestamp: Date.now(),
            success,
        });
        this.prune();
    }
    getSnapshot() {
        const windowRecords = this.getWindowRecords();
        const latencies = windowRecords.filter((r) => r.success).map((r) => r.latencyMs).sort((a, b) => a - b);
        const allLatencies = windowRecords.map((r) => r.latencyMs);
        const total = windowRecords.length;
        const successCount = windowRecords.filter((r) => r.success).length;
        const perSource = {};
        const sourceMap = new Map();
        for (const r of windowRecords) {
            const arr = sourceMap.get(r.sourceId) ?? [];
            arr.push(r);
            sourceMap.set(r.sourceId, arr);
        }
        for (const [sid, recs] of sourceMap) {
            const sLats = recs.filter((r) => r.success).map((r) => r.latencyMs).sort((a, b) => a - b);
            const sTotal = recs.length;
            const sSuccess = recs.filter((r) => r.success).length;
            perSource[sid] = {
                p95: percentile(sLats, 95),
                avg: sLats.length > 0 ? sLats.reduce((s, l) => s + l, 0) / sLats.length : 0,
                successRate: sTotal > 0 ? sSuccess / sTotal : 0,
            };
        }
        return {
            p50: percentile(latencies, 50),
            p95: percentile(latencies, 95),
            p99: percentile(latencies, 99),
            avg: latencies.length > 0 ? latencies.reduce((s, l) => s + l, 0) / latencies.length : 0,
            min: latencies.length > 0 ? latencies[0] : 0,
            max: latencies.length > 0 ? latencies[latencies.length - 1] : 0,
            throughput: windowRecords.length / (this.windowMs / 1000),
            totalRequests: total,
            successRate: total > 0 ? successCount / total : 0,
            perSource,
        };
    }
    getSourceStats(sourceId) {
        const recs = this.getWindowRecords().filter((r) => r.sourceId === sourceId);
        if (recs.length === 0)
            return null;
        const sLats = recs.filter((r) => r.success).map((r) => r.latencyMs).sort((a, b) => a - b);
        const successCount = recs.filter((r) => r.success).length;
        return {
            p95: percentile(sLats, 95),
            avg: sLats.length > 0 ? sLats.reduce((s, l) => s + l, 0) / sLats.length : 0,
            successRate: recs.length > 0 ? successCount / recs.length : 0,
        };
    }
    prune() {
        const cutoff = Date.now() - this.windowMs;
        this.records = this.records.filter((r) => r.timestamp >= cutoff);
    }
    reset() {
        this.records = [];
    }
    getRecords() {
        return this.records;
    }
    getWindowRecords() {
        this.prune();
        return this.records;
    }
}
//# sourceMappingURL=metrics.js.map