import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index.js';

describe('Main Module', () => {
  it('should export VERSION constant', () => {
    expect(VERSION).toBeDefined();
    expect(VERSION).toBe('2.0.0-beta.2');
  });
});
