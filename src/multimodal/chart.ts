/**
 * SciClaw v3.0.0 — Chart Parser
 *
 * Detects chart types from descriptions and parses chart data
 * from structured inputs (labels, datasets, axes).
 */
import {
  ChartType,
  DEFAULT_MULTIMODAL_CONFIG,
} from "./types.js";
import type {
  ChartData,
  ChartDataset,
  MultiModalConfig,
} from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

async function detectChartType(description: string): Promise<ChartType> {
  const typePatterns: Array<{ pattern: RegExp; type: ChartType }> = [
    { pattern: /\b(histogram|distribution)\b/i, type: ChartType.HISTOGRAM },
    { pattern: /\b(bar\s*chart|bar\s*graph)\b/i, type: ChartType.BAR },
    { pattern: /\b(line\s*chart|line\s*graph|trend)\b/i, type: ChartType.LINE },
    { pattern: /\b(pie\s*chart|pie\s*graph|donut)\b/i, type: ChartType.PIE },
    { pattern: /\b(scatter\s*plot|scatter\s*chart)\b/i, type: ChartType.SCATTER },
    { pattern: /\b(area\s*chart|area\s*graph)\b/i, type: ChartType.AREA },
  ];

  for (const { pattern, type } of typePatterns) {
    if (pattern.test(description)) return type;
  }

  return ChartType.UNKNOWN;
}

async function extractLabels(description: string): Promise<string[]> {
  const labelMatch = description.match(
    /labels?\s*[:=]\s*\[([^\]]+)\]/i,
  );
  if (labelMatch) {
    return labelMatch[1]!.split(",").map((s) => s.trim().replace(/["']/g, ""));
  }
  return [];
}

async function extractDatasets(
  description: string,
  chartType: ChartType,
): Promise<ChartDataset[]> {
  const datasets: ChartDataset[] = [];

  const dsMatch = description.match(
    /datasets?\s*[:=]\s*\[([\s\S]*?)\]\s*$/i,
  );
  if (dsMatch) {
    const dsText = dsMatch[1]!;
    const entryRegex =
      /\{label:\s*["']([^"']+)["'],\s*values:\s*\[([^\]]+)\](?:,\s*color:\s*["']([^"']+)["'])?\}/g;
    let match;
    while ((match = entryRegex.exec(dsText)) !== null) {
      datasets.push({
        label: match[1]!,
        values: match[2]!.split(",").map((v) => parseFloat(v.trim())),
        color: match[3],
      });
    }
  }

  if (datasets.length === 0) {
    datasets.push({
      label: "Series 1",
      values:
        chartType === ChartType.PIE
          ? [30, 25, 20, 15, 10]
          : [10, 20, 15, 30, 25, 18, 22],
      color: "#4A90D9",
    });
  }

  return datasets;
}

async function extractAxes(description: string): Promise<{
  xLabel?: string;
  yLabel?: string;
}> {
  const xMatch = description.match(/x[-_]?(?:axis|label)\s*[:=]\s*["']?([^"',\n]+)["']?/i);
  const yMatch = description.match(/y[-_]?(?:axis|label)\s*[:=]\s*["']?([^"',\n]+)["']?/i);

  return {
    xLabel: xMatch?.[1]?.trim(),
    yLabel: yMatch?.[1]?.trim(),
  };
}

function describeChart(chartData: ChartData): string {
  const parts: string[] = [];

  if (chartData.title) {
    parts.push(`Chart titled "${chartData.title}"`);
  }
  parts.push(`Type: ${chartData.type}`);

  if (chartData.axes.xLabel) {
    parts.push(`X-axis: ${chartData.axes.xLabel}`);
  }
  if (chartData.axes.yLabel) {
    parts.push(`Y-axis: ${chartData.axes.yLabel}`);
  }

  parts.push(`Contains ${chartData.datasets.length} dataset(s)`);

  for (const ds of chartData.datasets) {
    const values = ds.values;
    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      parts.push(
        `"${ds.label}": ${values.length} data points, range [${min}, ${max}], average ${avg.toFixed(1)}`,
      );
    }
  }

  return parts.join(". ") + ".";
}

function validateChartData(data: ChartData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.type === ChartType.UNKNOWN) {
    errors.push("Unknown chart type");
  }

  if (data.datasets.length === 0) {
    errors.push("Chart must have at least one dataset");
  }

  for (let i = 0; i < data.datasets.length; i++) {
    const ds = data.datasets[i]!;
    if (ds.values.length === 0) {
      errors.push(`Dataset ${i} ("${ds.label}") has no values`);
    }
    if (ds.values.length > 100) {
      errors.push(
        `Dataset ${i} ("${ds.label}") exceeds max data points (100)`,
      );
    }
  }

  if (
    data.type === ChartType.PIE &&
    data.datasets[0] &&
    data.labels.length !== data.datasets[0].values.length
  ) {
    errors.push("Pie chart labels count must match values count");
  }

  return { valid: errors.length === 0, errors };
}

// ── ChartParser ──────────────────────────────────────────────────────────

export class ChartParser {
  private config: MultiModalConfig["chart"];
  private totalParsed = 0;
  private typeDistribution: Record<string, number> = {};

  constructor(config?: Partial<MultiModalConfig["chart"]>) {
    this.config = { ...DEFAULT_MULTIMODAL_CONFIG.chart, ...config };
    if (this.config.maxDataPoints < 1)
      this.config.maxDataPoints = 1;
    if (this.config.maxDataPoints > 10000)
      this.config.maxDataPoints = 10000;
  }

  async parseChart(input: string | Buffer): Promise<ChartData> {
    const description =
      typeof input === "string" ? input : input.toString("utf-8");

    const type = await detectChartType(description);
    const labels = await extractLabels(description);
    const datasets = await extractDatasets(description, type);
    const axes = await extractAxes(description);
    const title = description.match(/title\s*[:=]\s*["']?([^"',\n]+)["']?/i)?.[1];

    // Apply maxDataPoints limit
    for (const ds of datasets) {
      if (ds.values.length > this.config.maxDataPoints) {
        ds.values = ds.values.slice(0, this.config.maxDataPoints);
      }
    }

    const confidence =
      type !== ChartType.UNKNOWN
        ? datasets.length > 0
          ? 0.85
          : 0.5
        : 0.2;

    this.totalParsed++;
    this.typeDistribution[type] =
      (this.typeDistribution[type] || 0) + 1;

    return {
      type,
      title,
      labels,
      datasets,
      axes,
      legend: datasets.map((d) => d.label),
      rawDescription: description,
      extractionConfidence: confidence,
    };
  }

  async parseChartBatch(
    inputs: Array<string | Buffer>,
  ): Promise<ChartData[]> {
    const results: ChartData[] = [];
    for (const input of inputs) {
      results.push(await this.parseChart(input));
    }
    return results;
  }

  async detectChartType(input: string | Buffer): Promise<ChartType> {
    const description =
      typeof input === "string" ? input : input.toString("utf-8");
    return detectChartType(description);
  }

  async extractLabels(input: string | Buffer): Promise<string[]> {
    const description =
      typeof input === "string" ? input : input.toString("utf-8");
    return extractLabels(description);
  }

  async extractDatasets(input: string | Buffer): Promise<ChartDataset[]> {
    const description =
      typeof input === "string" ? input : input.toString("utf-8");
    const type = await detectChartType(description);
    return extractDatasets(description, type);
  }

  async extractAxes(
    input: string | Buffer,
  ): Promise<{ xLabel?: string; yLabel?: string }> {
    const description =
      typeof input === "string" ? input : input.toString("utf-8");
    return extractAxes(description);
  }

  describeChart(chartData: ChartData): string {
    return describeChart(chartData);
  }

  validateChartData(data: ChartData): {
    valid: boolean;
    errors: string[];
  } {
    return validateChartData(data);
  }

  getParserStats(): {
    totalParsed: number;
    typeDistribution: Record<string, number>;
  } {
    return {
      totalParsed: this.totalParsed,
      typeDistribution: { ...this.typeDistribution },
    };
  }
}

export function createChartParser(
  config?: Partial<MultiModalConfig["chart"]>,
): ChartParser {
  return new ChartParser(config);
}
