import { describe, it, expect } from 'vitest';
import { ReasoningLogger } from '../../../src/reasoning/explainer/logger.js';

describe('ReasoningLogger', () => {
  it('should log an entry', () => {
    const logger = new ReasoningLogger();
    const entry = logger.info(0, 'Test question', 'input', 'output', 'reasoning', 100, 0.9);
    expect(entry.stepNumber).toBe(0);
    expect(entry.subQuestion).toBe('Test question');
    expect(entry.level).toBe('info');
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it('should log at different levels', () => {
    const logger = new ReasoningLogger();
    logger.info(0, 'info', 'in', 'out', 'reasoning', 10, 0.9);
    logger.warn(1, 'warn', 'in', 'out', 'reasoning', 10, 0.5);
    logger.error(2, 'error', 'in', 'out', 'reasoning', 10, 0.1);
    expect(logger.size).toBe(3);
    expect(logger.getByLevel('info')).toHaveLength(1);
    expect(logger.getByLevel('warn')).toHaveLength(1);
    expect(logger.getByLevel('error')).toHaveLength(1);
  });

  it('should enforce ring buffer limit', () => {
    const logger = new ReasoningLogger(3);
    logger.info(0, 'a', '', '', '', 0, 0);
    logger.info(1, 'b', '', '', '', 0, 0);
    logger.info(2, 'c', '', '', '', 0, 0);
    logger.info(3, 'd', '', '', '', 0, 0);
    expect(logger.size).toBe(3);
    expect(logger.getAll()[0]!.subQuestion).toBe('b');
  });

  it('should retrieve recent entries', () => {
    const logger = new ReasoningLogger();
    logger.info(0, 'first', '', '', '', 0, 0);
    logger.info(1, 'second', '', '', '', 0, 0);
    logger.info(2, 'third', '', '', '', 0, 0);
    const recent = logger.getRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.subQuestion).toBe('second');
  });

  it('should clear all entries', () => {
    const logger = new ReasoningLogger();
    logger.info(0, 'test', '', '', '', 0, 0);
    logger.clear();
    expect(logger.size).toBe(0);
  });

  it('should export to JSON', () => {
    const logger = new ReasoningLogger();
    logger.info(0, 'test', '', '', '', 0, 0);
    const json = logger.toJSON();
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
