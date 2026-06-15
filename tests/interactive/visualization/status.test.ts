import { describe, it, expect } from 'vitest';
import { StatusDisplay } from '../../../src/interactive/visualization/status.js';

describe('StatusDisplay', () => {
  it('should record status updates', () => {
    const display = new StatusDisplay();
    const update = display.record('searching', 'Searching for data');
    expect(update.status).toBe('searching');
    expect(update.message).toBe('Searching for data');
    expect(update.timestamp).toBeInstanceOf(Date);
  });

  it('should get latest status', () => {
    const display = new StatusDisplay();
    display.record('idle', 'Start');
    display.record('searching', 'Searching');
    const latest = display.getLatest();
    expect(latest!.status).toBe('searching');
  });

  it('should return null for empty history', () => {
    const display = new StatusDisplay();
    expect(display.getLatest()).toBeNull();
  });

  it('should format status text', () => {
    const display = new StatusDisplay();
    display.record('completed', 'Done', 'All tasks finished');
    const formatted = display.format();
    expect(formatted).toContain('completed');
    expect(formatted).toContain('Done');
    expect(formatted).toContain('All tasks finished');
  });

  it('should summarize', () => {
    const display = new StatusDisplay();
    display.record('searching', 'Search');
    display.record('completed', 'Done');
    const summary = display.summarize();
    expect(summary).toContain('completed');
  });

  it('should handle empty history in summarize', () => {
    const display = new StatusDisplay();
    expect(display.summarize()).toBe('No status updates.');
  });

  it('should get history with limit', () => {
    const display = new StatusDisplay();
    display.record('idle', 'Start');
    display.record('searching', 'Search');
    display.record('completed', 'Done');
    expect(display.getHistory(2)).toHaveLength(2);
  });
});
