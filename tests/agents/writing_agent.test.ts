import { describe, it, expect } from 'vitest';
import { WritingAgent, createWritingAgent } from '../../src/agents/writing_agent.js';

describe('WritingAgent', () => {
  it('should execute with full data', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: {
        topic: 'Test Research',
        sources: [{ url: 'https://example.com', title: 'Example' }],
      },
      priority: 5,
    });
    expect(result.status).toBe('success');
    const output = result.output as any;
    expect(output.report).toBeDefined();
    expect(output.wordCount).toBeGreaterThan(0);
  });

  it('should generate report with all required sections', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: { topic: 'Test' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.sections.length).toBeGreaterThanOrEqual(5);
    const sectionTitles = output.sections.map((s: any) => s.title);
    expect(sectionTitles).toContain('Abstract');
    expect(sectionTitles).toContain('Introduction');
    expect(sectionTitles).toContain('Conclusion');
  });

  it('should format citations', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: {
        topic: 'Test',
        sources: [{ url: 'https://example.com', title: 'Example' }],
      },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.citations.length).toBeGreaterThan(0);
    expect(output.citations[0].sourceId).toBeDefined();
  });

  it('should generate bibliography', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: { topic: 'Test' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.report).toContain('References');
  });

  it('should handle empty data gracefully', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: {},
      priority: 5,
    });
    expect(result.status).toBe('success');
  });

  it('should output markdown by default', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: { topic: 'Test' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.format).toBe('markdown');
  });

  it('should have word count > 0', async () => {
    const agent = createWritingAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'writing' as any,
      action: 'write',
      input: { topic: 'Test Research Topic' },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.wordCount).toBeGreaterThan(0);
  });

  it('should report status correctly', () => {
    const agent = createWritingAgent();
    const status = agent.getStatus();
    expect(status.role).toBe('writing');
    expect(status.name).toBe('WritingAgent');
  });
});
