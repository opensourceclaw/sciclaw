import { describe, it, expect } from 'vitest';
import { ProgressiveBuilder } from '../../../src/interactive/progressive/builder.js';
import type { Section } from '../../../src/interactive/progressive/types.js';

function makeSection(id: string, title: string, deps: string[] = []): Section {
  return { id, title, description: `Section ${title}`, dependencies: deps, status: 'pending', priority: 0.5 };
}

describe('ProgressiveBuilder', () => {
  it('should build a section', async () => {
    const builder = new ProgressiveBuilder();
    const section = makeSection('s1', 'Introduction');
    const result = await builder.build(section);
    expect(result.section.status).toBe('completed');
    expect(result.content).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('should throw on unmet dependency', async () => {
    const builder = new ProgressiveBuilder();
    const section = makeSection('s2', 'Body', ['s1']);
    await expect(builder.build(section)).rejects.toThrow(/Dependency/);
  });

  it('should rebuild and mark downstream as pending', async () => {
    const builder = new ProgressiveBuilder();
    const s1 = makeSection('s1', 'Intro');
    const s2 = makeSection('s2', 'Body', ['s1']);
    await builder.build(s1);
    await builder.build(s2);
    await builder.rebuild('s1');
    const s2Result = builder.getResult('s2');
    expect(s2Result!.section.status).toBe('pending');
  });

  it('should build batch', async () => {
    const builder = new ProgressiveBuilder();
    const sections = [
      makeSection('s1', 'Intro'),
    ];
    const results = await builder.buildBatch(sections);
    expect(results).toHaveLength(1);
    expect(results[0]!.section.status).toBe('completed');
  });

  it('should get all results', async () => {
    const builder = new ProgressiveBuilder();
    await builder.build(makeSection('s1', 'Intro'));
    expect(builder.getAllResults()).toHaveLength(1);
  });

  it('should throw on rebuilding unknown section', async () => {
    const builder = new ProgressiveBuilder();
    await expect(builder.rebuild('unknown')).rejects.toThrow(/not found/);
  });
});
