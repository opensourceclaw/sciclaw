import type { BenchmarkResult, BenchmarkReport, ComparisonReport } from "./types.js";
export declare function generateReport(results: BenchmarkResult[], version: string): BenchmarkReport;
export declare function formatMarkdown(report: BenchmarkReport): string;
export declare function formatJSON(report: BenchmarkReport): string;
export declare function compareReports(baseline: BenchmarkReport, current: BenchmarkReport): ComparisonReport;
export declare function printSummary(report: BenchmarkReport): void;
//# sourceMappingURL=reporter.d.ts.map