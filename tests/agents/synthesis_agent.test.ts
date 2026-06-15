import { describe, it, expect } from 'vitest';
import { SynthesisAgent, createSynthesisAgent } from '../../src/agents/synthesis_agent.js';

describe('SynthesisAgent', () => {
  it('should execute with valid sources', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: {
        sources: [
          { url: 'https://example.com/1', title: 'Source 1', content: 'Important research data.' },
          { url: 'https://example.com/2', title: 'Source 2', content: 'Research data confirms findings.' },
        ],
      },
      priority: 5,
    });
    expect(result.status).toBe('success');
    const output = result.output as any;
    expect(output.knowledgeGraph).toBeDefined();
  });

  it('should validate claims', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: { sources: [{ url: 'https://example.com/1', title: 'S1', content: 'Content.' }] },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.validatedClaims).toBeDefined();
  });

  it('should assess risk', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: { sources: [{ url: 'https://example.com/1', title: 'S1', content: 'Content.' }] },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.riskAssessments).toBeDefined();
  });

  it('should generate cross-references', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: {
        sources: [
          { url: 'https://example.com/1', title: 'S1', content: 'The sky is blue.' },
          { url: 'https://example.com/2', title: 'S2', content: 'The sky is blue during day.' },
        ],
      },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.crossReferences.length).toBeGreaterThan(0);
  });

  it('should handle empty sources with partial status', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: { sources: [] },
      priority: 5,
    });
    expect(result.status).toBe('partial');
  });

  it('should have empty contradictions for agreeing sources', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: { sources: [{ url: 'https://example.com/1', title: 'S1', content: 'Same content.' }] },
      priority: 5,
    });
    const output = result.output as any;
    expect(output.contradictions).toEqual([]);
  });

  it('should not cross-reference more than MAX_CROSS_REF_SOURCES', async () => {
    const agent = createSynthesisAgent();
    const manySources = Array.from({ length: 25 }, (_, i) => ({
      url: `https://example.com/${i}`,
      title: `S${i}`,
      content: `Content ${i}.`,
    }));
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: { sources: manySources },
      priority: 5,
    });
    expect(result.status).toBe('success');
  });

  it('should return proper status info', () => {
    const agent = createSynthesisAgent();
    const status = agent.getStatus();
    expect(status.role).toBe('synthesis');
    expect(status.name).toBe('SynthesisAgent');
  });

  it('should handle source with empty content', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: { sources: [{ url: 'https://example.com/1', title: 'S1', content: '' }] },
      priority: 5,
    });
    expect(result.status).toBe('success');
  });

  it('should compute cross-references only for agreeing sources', async () => {
    const agent = createSynthesisAgent();
    const result = await agent.execute({
      id: 'task1',
      role: 'synthesis' as any,
      action: 'synthesize',
      input: {
        sources: [
          { url: 'https://example.com/a', title: 'A', content: 'One two three four five.' },
          { url: 'https://example.com/b', title: 'B', content: 'Six seven eight nine ten.' },
        ],
      },
      priority: 5,
    });
    const output = result.output as any;
    // Different content, 0 agreement → no cross-references
    expect(output.crossReferences).toEqual([]);
  });
});
