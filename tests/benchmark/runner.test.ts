import { describe, it, expect, beforeEach } from 'vitest';
import { BenchmarkRunner } from '../../src/benchmark/runner.js';
import type { BenchmarkTask } from '../../src/benchmark/types.js';
import { registerFixtureSearch } from '../helpers/fixture-search.js';

const mockTask: BenchmarkTask = {
  id: 'test_task',
  name: 'Test Task',
  category: 'factuality',
  description: 'A test task',
  input: { topic: 'Test', expectedFacts: ['fact1'], expectedSources: ['example.com'], minSections: 2, minCitations: 1 },
  scoring: { factualityWeight: 0.4, completenessWeight: 0.3, citationWeight: 0.2, reasoningWeight: 0.1, threshold: 0.5 },
};

describe('BenchmarkRunner', () => {
  beforeEach(() => {
    registerFixtureSearch();
  });

  it('should register a single task', () => {
    const runner = new BenchmarkRunner();
    runner.registerTask(mockTask);
    expect(runner.getRegisteredTasks().length).toBe(1);
  });

  it('should register multiple tasks', () => {
    const runner = new BenchmarkRunner();
    runner.registerTasks([mockTask, { ...mockTask, id: 'task2' }]);
    expect(runner.getRegisteredTasks().length).toBe(2);
  });

  it('should unregister a task', () => {
    const runner = new BenchmarkRunner();
    runner.registerTask(mockTask);
    expect(runner.unregisterTask('test_task')).toBe(true);
    expect(runner.getRegisteredTasks().length).toBe(0);
  });

  it('should run a registered task', async () => {
    const runner = new BenchmarkRunner();
    runner.registerTask(mockTask);
    const result = await runner.runTask('test_task');
    expect(result.taskId).toBe('test_task');
    expect(result.scores).toBeDefined();
    expect(typeof result.passed).toBe('boolean');
  });

  it('should throw for nonexistent task', async () => {
    const runner = new BenchmarkRunner();
    await expect(runner.runTask('nonexistent')).rejects.toThrow('Task not found');
  });

  it('should run all registered tasks', async () => {
    const runner = new BenchmarkRunner();
    runner.registerTasks([mockTask, { ...mockTask, id: 'task2', category: 'completeness' }]);
    const report = await runner.runAll();
    expect(report.totalTasks).toBe(2);
    expect(report.passedTasks).toBeGreaterThanOrEqual(0);
  });

  it('should filter by category', async () => {
    const runner = new BenchmarkRunner();
    runner.registerTasks([mockTask, { ...mockTask, id: 'task2', category: 'citation' }]);
    const report = await runner.runCategory('citation');
    expect(report.totalTasks).toBe(1);
    expect(report.results[0]!.category).toBe('citation');
  });

  it('should return empty report for no tasks', async () => {
    const runner = new BenchmarkRunner();
    const report = await runner.runAll();
    expect(report.totalTasks).toBe(0);
    expect(report.passRate).toBe(0);
  });

  it('scores real pipeline outputs — no structural zeros (GA-A3)', async () => {
    const runner = new BenchmarkRunner();
    runner.registerTask({
      ...mockTask,
      id: 'real_task',
      input: {
        topic: 'fixture topic',
        expectedFacts: ['fixture'],
        expectedSources: [],
        minSections: 2,
        minCitations: 1,
      },
      scoring: { factualityWeight: 0.4, completenessWeight: 0.3, citationWeight: 0.2, reasoningWeight: 0.1, threshold: 0.1 },
    });

    const result = await runner.runTask('real_task');

    expect(result.errors).toEqual([]);
    expect(result.scores.factuality).toBeGreaterThan(0);
    expect(result.metrics.claimCount).toBeGreaterThan(0);
    expect(result.metrics.sourceCount).toBeGreaterThan(0);
  });

  it('reports the package version in the benchmark report (GA-A3)', async () => {
    const { readFileSync } = await import('node:fs');
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
    ) as { version: string };
    const runner = new BenchmarkRunner();
    const report = await runner.runAll();
    expect(report.version).toBe(pkg.version);
  });
});
