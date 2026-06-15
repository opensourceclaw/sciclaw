import { describe, it, expect } from 'vitest';
import { ResearchSkill, ResearchDepth, OutputFormat } from '../../src/skill/index.js';
import type { ResearchRequest } from '../../src/skill/index.js';

function makeRequest(overrides?: Partial<ResearchRequest>): ResearchRequest {
  return {
    topic: 'Test topic',
    depth: ResearchDepth.STANDARD,
    maxSources: 10,
    language: 'en',
    outputFormat: OutputFormat.MARKDOWN,
    ...overrides,
  };
}

describe('ResearchSkill', () => {
  it('should initialize', () => {
    const skill = new ResearchSkill();
    expect(skill.initialize()).toBe(true);
  });

  it('should execute a research request', () => {
    const skill = new ResearchSkill();
    skill.initialize();
    const request = makeRequest();
    const result = skill.execute(request);
    expect(result.status).toBe('completed');
    expect(result.request.topic).toBe('Test topic');
  });

  it('should get status', () => {
    const skill = new ResearchSkill();
    skill.initialize();
    const status = skill.getStatus();
    expect(status.name).toBe('DeepClaw');
    expect(status.initialized).toBe(true);
  });

  it('should shutdown', () => {
    const skill = new ResearchSkill();
    skill.initialize();
    expect(skill.shutdown()).toBe(true);
    const status = skill.getStatus();
    expect(status.initialized).toBe(false);
  });

  it('should list results', () => {
    const skill = new ResearchSkill();
    skill.initialize();
    skill.execute(makeRequest({ topic: 'AI' }));
    const results = skill.listResults();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].topic).toBe('AI');
  });

  it('should get specific result', () => {
    const skill = new ResearchSkill();
    skill.initialize();
    skill.execute(makeRequest());
    const results = skill.listResults();
    const result = skill.getResult(results[0].id);
    expect(result).toBeDefined();
  });

  it('should auto-initialize on execute', () => {
    const skill = new ResearchSkill();
    // Don't call initialize() - should auto-init
    const result = skill.execute(makeRequest());
    expect(result.status).toBe('completed');
  });
});
