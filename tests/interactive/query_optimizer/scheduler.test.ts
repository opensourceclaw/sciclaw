import { describe, it, expect } from 'vitest';
import { QueryScheduler } from '../../../src/interactive/query_optimizer/scheduler.js';
import type { Query } from '../../../src/interactive/query_optimizer/types.js';

function makeQuery(text: string, priority: number, source: Query['source'] = 'original'): Query {
  return {
    id: Math.random().toString(36).slice(2, 10),
    text, priority, status: 'pending', source, createdAt: new Date(),
  };
}

describe('QueryScheduler', () => {
  const scheduler = new QueryScheduler();

  it('should sort by priority descending', () => {
    const result = scheduler.schedule([
      makeQuery('low', 0.3),
      makeQuery('high', 0.9),
      makeQuery('medium', 0.6),
    ]);
    expect(result.ordered[0]!.text).toBe('high');
    expect(result.ordered[2]!.text).toBe('low');
  });

  it('should deduplicate queries', () => {
    const result = scheduler.schedule([
      makeQuery('same', 0.5),
      makeQuery('same', 0.7),
    ]);
    expect(result.ordered).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
  });

  it('should handle empty list', () => {
    const result = scheduler.schedule([]);
    expect(result.ordered).toHaveLength(0);
    expect(result.reason).toBe('Empty query list');
  });

  it('should reduce expanded query priority', () => {
    const result = scheduler.schedule([
      makeQuery('original', 0.5, 'original'),
      makeQuery('expanded', 0.5, 'expanded'),
    ]);
    expect(result.ordered[0]!.text).toBe('original');
  });

  it('should update priority', () => {
    const q = makeQuery('test', 0.5);
    scheduler.schedule([q]);
    scheduler.updatePriority(q.id, 0.9);
    const next = scheduler.next();
    expect(next).not.toBeNull();
    expect(next!.priority).toBe(0.9);
  });

  it('should track pending count', () => {
    const scheduler = new QueryScheduler();
    const queries = [makeQuery('a', 0.5), makeQuery('b', 0.5)];
    const result = scheduler.schedule(queries);
    expect(result.ordered).toHaveLength(2);
    const next = scheduler.next();
    expect(next).not.toBeNull();
  });

  it('should complete queries', () => {
    const scheduler = new QueryScheduler();
    const q = makeQuery('test', 0.5);
    scheduler.schedule([q]);
    const next = scheduler.next();
    expect(next).not.toBeNull();
    scheduler.complete(next!.id, 0.95);
    const pending = Array.from((scheduler as unknown as { queries: Map<string, unknown> }).queries.values())
      .filter((q: unknown) => (q as { status: string }).status === 'pending');
    expect(pending).toHaveLength(0);
  });
});
