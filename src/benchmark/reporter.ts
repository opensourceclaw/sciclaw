import type { BenchmarkResult, BenchmarkReport, ComparisonReport, BenchmarkScore, BenchmarkCategory } from "./types.js";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 1000) / 1000;
}

export function generateReport(results: BenchmarkResult[], version: string): BenchmarkReport {
  const totalTasks = results.length;
  const passedTasks = results.filter((r) => r.passed).length;
  const passRate = totalTasks > 0 ? passedTasks / totalTasks : 0;

  const avgScores: BenchmarkScore = {
    factuality: average(results.map((r) => r.scores.factuality)),
    completeness: average(results.map((r) => r.scores.completeness)),
    citation: average(results.map((r) => r.scores.citation)),
    reasoning: average(results.map((r) => r.scores.reasoning)),
    overall: average(results.map((r) => r.scores.overall)),
  };

  const categories: BenchmarkCategory[] = ["factuality", "completeness", "citation", "reasoning", "multi_agent"];
  const categoryBreakdown = {} as BenchmarkReport["categoryBreakdown"];
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    categoryBreakdown[cat] = {
      count: catResults.length,
      passed: catResults.filter((r) => r.passed).length,
      avgScore: catResults.length > 0 ? average(catResults.map((r) => r.scores.overall)) : 0,
    };
  }

  return {
    timestamp: new Date(),
    version,
    totalTasks,
    passedTasks,
    passRate: Math.round(passRate * 1000) / 1000,
    averageScores: avgScores,
    categoryBreakdown,
    results,
  };
}

export function formatMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [
    `# DeepClaw Benchmark Report`,
    ``,
    `**Version**: ${report.version}`,
    `**Date**: ${report.timestamp.toISOString().split("T")[0]}`,
    `**Pass Rate**: ${report.passedTasks}/${report.totalTasks} (${(report.passRate * 100).toFixed(1)}%)`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Score |`,
    `|--------|-------|`,
    `| Overall | ${report.averageScores.overall.toFixed(3)} |`,
    `| Factuality | ${report.averageScores.factuality.toFixed(3)} |`,
    `| Completeness | ${report.averageScores.completeness.toFixed(3)} |`,
    `| Citation | ${report.averageScores.citation.toFixed(3)} |`,
    `| Reasoning | ${report.averageScores.reasoning.toFixed(3)} |`,
    ``,
    `## Category Breakdown`,
    ``,
    `| Category | Passed | Total | Avg Score |`,
    `|----------|--------|-------|-----------|`,
  ];

  for (const [cat, breakdown] of Object.entries(report.categoryBreakdown)) {
    lines.push(`| ${cat} | ${breakdown.passed} | ${breakdown.count} | ${breakdown.avgScore.toFixed(3)} |`);
  }

  lines.push(``, `## Results`, ``);
  for (const r of report.results) {
    const icon = r.passed ? "PASS" : "FAIL";
    lines.push(`### ${r.taskName} (${icon})`, ``);
    lines.push(`- **Overall**: ${r.scores.overall.toFixed(3)}`);
    lines.push(`- Factuality: ${r.scores.factuality.toFixed(3)} | Completeness: ${r.scores.completeness.toFixed(3)} | Citation: ${r.scores.citation.toFixed(3)} | Reasoning: ${r.scores.reasoning.toFixed(3)}`);
    lines.push(`- Duration: ${(r.metrics.durationMs / 1000).toFixed(1)}s | Sources: ${r.metrics.sourceCount} | Claims: ${r.metrics.claimCount}`);
    if (r.errors.length > 0) lines.push(`- Errors: ${r.errors.join("; ")}`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function formatJSON(report: BenchmarkReport): string {
  return JSON.stringify(report, null, 2);
}

export function compareReports(baseline: BenchmarkReport, current: BenchmarkReport): ComparisonReport {
  const regressionTasks = current.results
    .filter((cr) => {
      const br = baseline.results.find((r) => r.taskId === cr.taskId);
      return br && cr.scores.overall < br.scores.overall - 0.05;
    })
    .map((r) => r.taskName);

  const improvedTasks = current.results
    .filter((cr) => {
      const br = baseline.results.find((r) => r.taskId === cr.taskId);
      return br && cr.scores.overall > br.scores.overall + 0.05;
    })
    .map((r) => r.taskName);

  return {
    baseline,
    current,
    delta: {
      passRate: current.passRate - baseline.passRate,
      avgScore: current.averageScores.overall - baseline.averageScores.overall,
      regressionTasks,
      improvedTasks,
    },
  };
}

export function printSummary(report: BenchmarkReport): void {
  console.log(`\nBenchmark Report: ${report.passedTasks}/${report.totalTasks} passed (${(report.passRate * 100).toFixed(1)}%)`);
  console.log(`  Overall:    ${report.averageScores.overall.toFixed(3)}`);
  console.log(`  Factuality: ${report.averageScores.factuality.toFixed(3)}`);
  console.log(`  Completeness: ${report.averageScores.completeness.toFixed(3)}`);
  console.log(`  Citation:   ${report.averageScores.citation.toFixed(3)}`);
  console.log(`  Reasoning:  ${report.averageScores.reasoning.toFixed(3)}`);
}
