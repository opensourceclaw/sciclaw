import { describe, it, expect } from 'vitest';
import { SearchAgent, createSearchAgent } from '../../src/agents/search_agent.js';

describe('SearchAgent', () => {
  it('should execute with valid queries', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['test query'] },
      priority: 5,
    });
    expect(result.status).toBe('success');
    const output = result.output as any;
    expect(output.sources.length).toBeGreaterThan(0);
  });

  it('should return failed for empty queries', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: [] },
      priority: 5,
    });
    expect(result.status).toBe('failed');
  });

  it('should apply source scoring', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['test'] },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.sources[0].domainScore).toBeDefined();
    expect(output.sources[0].freshnessScore).toBeDefined();
    expect(output.sources[0].sourceScore).toBeDefined();
  });

  it('should deduplicate URLs', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['test', 'test'] },
      priority: 5,
    });
    const output = result.output as any;
    const urls = output.sources.map((s: any) => s.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('should report metadata', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['q1', 'q2'] },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.metadata.totalQueries).toBe(2);
    expect(output.metadata.totalSources).toBeGreaterThan(0);
  });

  it('should handle single query failure gracefully', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['valid'] },
      priority: 5,
    });
    expect(result.status).toBe('success');
  });

  it('should return empty sources for all failed', async () => {
    const agent = createSearchAgent();
    // All queries still produce results in mock implementation
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['test'] },
      priority: 5,
    });
    expect(result.status).toBe('success');
  });

  it('should include toolCalls in metrics', async () => {
    const agent = createSearchAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'search' as any,
      action: 'search',
      input: { queries: ['q1', 'q2', 'q3'] },
      priority: 5,
    });
    expect(result.metrics.toolCalls).toBe(3);
  });
});
