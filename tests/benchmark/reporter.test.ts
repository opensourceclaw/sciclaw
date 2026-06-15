import { describe, it, expect } from 'vitest';
import { generateReport, formatMarkdown, compareReports } from '../../src/benchmark/reporter.js';
import type { BenchmarkResult, BenchmarkReport } from '../../src/benchmark/types.js';

const mockResult: BenchmarkResult = {
  taskId: 'test_1',
  taskName: 'Test Task',
  category: 'factuality',
  scores: { factuality: 0.8, completeness: 0.7, citation: 0.9, reasoning: 0.6, overall: 0.75 },
  metrics: { durationMs: 1000, tokenCount: 500, sourceCount: 3, claimCount: 5 },
  passed: true,
  errors: [],
};

describe('Benchmark Reporter', () => {
  it('should generate report from results', () => {
    const report = generateReport([mockResult], '2.0.0-rc.3');
    expect(report.totalTasks).toBe(1);
    expect(report.passedTasks).toBe(1);
    expect(report.passRate).toBe(1);
  });

  it('should handle empty results', () => {
    const report = generateReport([], '2.0.0-rc.3');
    expect(report.totalTasks).toBe(0);
    expect(report.passRate).toBe(0);
  });

  it('should format report as markdown', () => {
    const report = generateReport([mockResult], '2.0.0-rc.3');
    const md = formatMarkdown(report);
    expect(md).toContain('Benchmark Report');
    expect(md).toContain('Test Task');
    expect(md).toContain('PASS');
  });

  it('should detect regression in comparison', () => {
    const baseline = generateReport([{ ...mockResult, scores: { ...mockResult.scores, overall: 0.9 } }], '1.0');
    const current = generateReport([mockResult], '2.0.0-rc.3');
    const comparison = compareReports(baseline, current);
    expect(comparison.delta.regressionTasks.length).toBeGreaterThan(0);
    expect(comparison.delta.avgScore).toBeLessThan(0);
  });

  it('should detect improvement in comparison', () => {
    const baseline = generateReport([{ ...mockResult, scores: { ...mockResult.scores, overall: 0.5 } }], '1.0');
    const current = generateReport([mockResult], '2.0.0-rc.3');
    const comparison = compareReports(baseline, current);
    expect(comparison.delta.improvedTasks.length).toBeGreaterThan(0);
    expect(comparison.delta.avgScore).toBeGreaterThan(0);
  });
});
