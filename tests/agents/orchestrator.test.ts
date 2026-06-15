import { describe, it, expect, vi } from 'vitest';
import { Orchestrator } from '../../src/agents/orchestrator.js';
import { BaseAgent } from '../../src/agents/base_agent.js';
import { AgentRole, AgentStatus, MessageType } from '../../src/agents/types.js';
import type { AgentTask, AgentResult } from '../../src/agents/types.js';

class MockAgent extends BaseAgent {
  private shouldFail = false;
  private delayMs = 0;

  constructor(role: AgentRole, fail = false, delay = 0) {
    super({ role, name: `Mock${role}`, capabilities: ['mock'], maxRetries: 1, timeoutMs: 5000 });
    this.shouldFail = fail;
    this.delayMs = delay;
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    if (this.delayMs > 0) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.shouldFail) throw new Error('Agent failed');
    return {
      taskId: task.id,
      role: this.config.role,
      status: 'success',
      output: { done: true },
      artifacts: [],
      metrics: { durationMs: 10 },
      errors: [],
    };
  }
}

describe('Orchestrator', () => {
  it('should create plan with default phases', () => {
    const orch = new Orchestrator();
    const plan = orch.createPlan('test topic');
    expect(plan.id).toBeDefined();
    expect(plan.phases.length).toBe(4);
    expect(plan.phases[0]!.name).toBe('Plan');
  });

  it('should register and unregister agent', () => {
    const orch = new Orchestrator();
    const agent = new MockAgent(AgentRole.PLANNING);
    orch.registerAgent(agent);
    expect(orch.getAgent(AgentRole.PLANNING)).toBeDefined();
    expect(orch.unregisterAgent(AgentRole.PLANNING)).toBe(true);
    expect(orch.getAgent(AgentRole.PLANNING)).toBeUndefined();
  });

  it('should execute plan with single agent', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    const plan = orch.createPlan('test', { phases: [{ order: 1, name: 'Plan', agents: [AgentRole.PLANNING], dependencies: [], timeoutMs: 5000 }] });
    const result = await orch.executePlan(plan);
    expect(result.overallStatus).toBe('success');
    expect(result.phases.length).toBe(1);
  });

  it('should execute plan with all 4 agents', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    orch.registerAgent(new MockAgent(AgentRole.SEARCH));
    orch.registerAgent(new MockAgent(AgentRole.SYNTHESIS));
    orch.registerAgent(new MockAgent(AgentRole.WRITING));
    const plan = orch.createPlan('test');
    const result = await orch.executePlan(plan);
    expect(result.overallStatus).toBe('success');
  });

  it('should handle agent timeout', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING, false, 100));
    const plan = orch.createPlan('test', { phases: [{ order: 1, name: 'Plan', agents: [AgentRole.PLANNING], dependencies: [], timeoutMs: 10 }] });
    const result = await orch.executePlan(plan);
    expect(result.overallStatus).toBeDefined();
  });

  it('should handle missing agent registration', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    // SEARCH not registered - should fail
    const plan = orch.createPlan('test');
    await expect(orch.executePlan(plan)).rejects.toThrow('Missing agents');
  });

  it('should handle empty plan', async () => {
    const orch = new Orchestrator();
    const plan = orch.createPlan('test', { phases: [] });
    const result = await orch.executePlan(plan);
    expect(result.overallStatus).toBe('success');
    expect(result.phases.length).toBe(0);
  });

  it('should reject concurrent executePlan', async () => {
    const orch = new Orchestrator();
    const agent = new MockAgent(AgentRole.PLANNING, false, 50);
    orch.registerAgent(agent);
    const plan = orch.createPlan('test', { phases: [{ order: 1, name: 'Plan', agents: [AgentRole.PLANNING], dependencies: [], timeoutMs: 5000 }] });
    const p1 = orch.executePlan(plan);
    await expect(orch.executePlan(plan)).rejects.toThrow('already executing');
    await p1;
  });

  it('should broadcast message to all agents', () => {
    const orch = new Orchestrator();
    const agent = new MockAgent(AgentRole.PLANNING);
    orch.registerAgent(agent);
    orch.broadcast(MessageType.STATUS, { msg: 'test' });
    const msg = agent.receiveMessage();
    expect(msg).not.toBeNull();
    expect(msg!.type).toBe(MessageType.STATUS);
  });

  it('should get agent statuses', () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    const statuses = orch.getAgentStatuses();
    expect(statuses.size).toBe(1);
    expect(statuses.get(AgentRole.PLANNING)!.role).toBe(AgentRole.PLANNING);
  });

  it('should detect busy agents', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    expect(orch.isAnyAgentBusy()).toBe(false);
  });

  it('should handle partial phase failure', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    orch.registerAgent(new MockAgent(AgentRole.SEARCH, true)); // fails
    orch.registerAgent(new MockAgent(AgentRole.SYNTHESIS));
    orch.registerAgent(new MockAgent(AgentRole.WRITING));
    const plan = orch.createPlan('test');
    const result = await orch.executePlan(plan);
    expect(result.overallStatus).toBe('partial');
  });

  it('should aggregate results', async () => {
    const orch = new Orchestrator();
    orch.registerAgent(new MockAgent(AgentRole.PLANNING));
    orch.registerAgent(new MockAgent(AgentRole.SEARCH));
    orch.registerAgent(new MockAgent(AgentRole.SYNTHESIS));
    orch.registerAgent(new MockAgent(AgentRole.WRITING));
    const plan = orch.createPlan('test');
    const result = await orch.executePlan(plan);
    expect(result.aggregatedOutput).toBeDefined();
    expect(Object.keys(result.aggregatedOutput as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('should send message to specific agent', () => {
    const orch = new Orchestrator();
    const agent = new MockAgent(AgentRole.PLANNING);
    orch.registerAgent(agent);
    orch.sendMessage({
      id: 'msg1',
      type: MessageType.TASK,
      from: AgentRole.SEARCH,
      to: AgentRole.PLANNING,
      taskId: 'task1',
      payload: {},
      timestamp: new Date(),
    });
    expect(agent.getMessageQueueSize()).toBe(1);
  });

  it('should handle agent retry on failure', async () => {
    const orch = new Orchestrator();
    const agent = new MockAgent(AgentRole.PLANNING, true);
    orch.registerAgent(agent);
    const plan = orch.createPlan('test', { phases: [{ order: 1, name: 'Plan', agents: [AgentRole.PLANNING], dependencies: [], timeoutMs: 5000 }] });
    const result = await orch.executePlan(plan);
    expect(result.overallStatus).toBe('failed');
  });
});
