/**
 * DeepClaw v3.6.0 — Metrics Collector (OBSERVE Stage)
 * Collects and tracks operational metrics for research workflow
 */

/**
 * Metric types
 */
export type MetricType = "counter" | "gauge" | "histogram" | "timing";

/**
 * Single metric record
 */
export interface MetricRecord {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Metric aggregation result
 */
export interface MetricSummary {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  lastValue: number;
  lastTimestamp: number;
}

/**
 * MetricsCollector - Collects operational metrics
 */
export class MetricsCollector {
  private metrics: Map<string, MetricRecord[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private maxRecords: number;

  constructor(maxRecords: number = 1000) {
    this.maxRecords = maxRecords;
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, delta: number = 1, tags?: Record<string, string>): void {
    const current = this.counters.get(name) ?? 0;
    this.counters.set(name, current + delta);
    this.recordMetric(name, "counter", current + delta, tags);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.gauges.set(name, value);
    this.recordMetric(name, "gauge", value, tags);
  }

  /**
   * Record a timing measurement
   */
  recordTiming(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.recordMetric(name, "timing", durationMs, tags);
  }

  /**
   * Time an async operation
   */
  async timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.recordTiming(name, Date.now() - start, { status: "success" });
      return result;
    } catch (error) {
      this.recordTiming(name, Date.now() - start, { status: "error" });
      throw error;
    }
  }

  /**
   * Record a raw metric
   */
  private recordMetric(name: string, type: MetricType, value: number, tags?: Record<string, string>): void {
    const record: MetricRecord = {
      name,
      type,
      value,
      timestamp: Date.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const records = this.metrics.get(name)!;
    records.push(record);

    // Trim to max records
    if (records.length > this.maxRecords) {
      records.shift();
    }
  }

  /**
   * Get counter value
   */
  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string): number | undefined {
    return this.gauges.get(name);
  }

  /**
   * Get metric summary
   */
  getSummary(name: string): MetricSummary | null {
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
  getMetricNames(): string[] {
    return [...this.metrics.keys()];
  }

  /**
   * Get all counters
   */
  getAllCounters(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }

  /**
   * Get all gauges
   */
  getAllGauges(): Record<string, number> {
    return Object.fromEntries(this.gauges);
  }

  /**
   * Export metrics for reporting
   */
  export(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    summaries: Record<string, MetricSummary | null>;
  } {
    const summaries: Record<string, MetricSummary | null> = {};
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
  reset(): void {
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
} as const;
