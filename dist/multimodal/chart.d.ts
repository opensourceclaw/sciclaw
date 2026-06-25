/**
 * DeepClaw v3.0.0 — Chart Parser
 *
 * Detects chart types from descriptions and parses chart data
 * from structured inputs (labels, datasets, axes).
 */
import { ChartType } from "./types.js";
import type { ChartData, ChartDataset, MultiModalConfig } from "./types.js";
export declare class ChartParser {
    private config;
    private totalParsed;
    private typeDistribution;
    constructor(config?: Partial<MultiModalConfig["chart"]>);
    parseChart(input: string | Buffer): Promise<ChartData>;
    parseChartBatch(inputs: Array<string | Buffer>): Promise<ChartData[]>;
    detectChartType(input: string | Buffer): Promise<ChartType>;
    extractLabels(input: string | Buffer): Promise<string[]>;
    extractDatasets(input: string | Buffer): Promise<ChartDataset[]>;
    extractAxes(input: string | Buffer): Promise<{
        xLabel?: string;
        yLabel?: string;
    }>;
    describeChart(chartData: ChartData): string;
    validateChartData(data: ChartData): {
        valid: boolean;
        errors: string[];
    };
    getParserStats(): {
        totalParsed: number;
        typeDistribution: Record<string, number>;
    };
}
export declare function createChartParser(config?: Partial<MultiModalConfig["chart"]>): ChartParser;
//# sourceMappingURL=chart.d.ts.map