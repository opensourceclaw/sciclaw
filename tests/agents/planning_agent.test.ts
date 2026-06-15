import { describe, it, expect } from 'vitest';
import { PlanningAgent, createPlanningAgent } from '../../src/agents/planning_agent.js';

describe('PlanningAgent', () => {
  it('should execute with valid topic', async () => {
    const agent = createPlanningAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: 'Quantum Computing' },
      priority: 5,
    });
    expect(result.status).toBe('success');
    const output = result.output as any;
    expect(output.topic).toBe('Quantum Computing');
    expect(output.subtopics.length).toBeGreaterThan(0);
    expect(output.queries.length).toBeGreaterThan(0);
  });

  it('should return failed for empty topic', async () => {
    const agent = createPlanningAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: '' },
      priority: 5,
    });
    expect(result.status).toBe('failed');
  });

  it('should use balanced strategy by default', async () => {
    const agent = createPlanningAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: 'Test Topic' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.strategy).toBe('balanced');
  });

  it('should generate fewer queries for deep strategy', async () => {
    const agent = createPlanningAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: 'Test Topic', depth: 'deep' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.queries.length).toBeLessThanOrEqual(2);
  });

  it('should generate more queries for broad strategy', async () => {
    const agent = createPlanningAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: 'Test Topic', depth: 'broad' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.queries.length).toBeGreaterThanOrEqual(3);
  });

  it('should truncate very long topics', async () => {
    const agent = createPlanningAgent();
    const longTopic = 'x'.repeat(1000);
    const result = await agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: longTopic },
      priority: 5,
    });
    expect(result.status).toBe('success');
  });

  it('should report isBusy during execution', async () => {
    const agent = createPlanningAgent();
    const execPromise = agent.execute({
      id: 'task1',
      role: 'planning' as any,
      action: 'plan',
      input: { topic: 'Test' },
      priority: 5,
    });
    await execPromise;
    expect(agent.isBusy()).toBe(false);
  });

  it('should return proper status info', async () => {
    const agent = createPlanningAgent();
    const status = agent.getStatus();
    expect(status.role).toBe('planning');
    expect(status.busy).toBe(false);
  });
});
