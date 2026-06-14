import { describe, it, expect } from 'vitest';
import { truncate, slugify } from '../src/utils/index.js';

describe('Utils Module', () => {
  it('should truncate long strings', () => {
    const result = truncate('This is a very long string', 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should not truncate short strings', () => {
    const result = truncate('Short', 10);
    expect(result).toBe('Short');
  });

  it('should slugify strings', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test String!')).toBe('test-string');
  });
});
