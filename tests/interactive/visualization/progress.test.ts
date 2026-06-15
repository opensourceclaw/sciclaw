import { describe, it, expect, vi } from 'vitest';
import { ProgressTracker } from '../../../src/interactive/visualization/progress.js';

describe('ProgressTracker', () => {
  it('should initialize with total tasks', () => {
    const tracker = new ProgressTracker(10);
    const progress = tracker.getProgress();
    expect(progress.totalTasks).toBe(10);
    expect(progress.completedTasks).toBe(0);
  });

  it('should update progress', () => {
    const tracker = new ProgressTracker(5);
    tracker.update(1, 'Task 1');
    const progress = tracker.getProgress();
    expect(progress.completedTasks).toBe(1);
    expect(progress.currentTask).toBe('Task 1');
  });

  it('should set status', () => {
    const tracker = new ProgressTracker(3);
    tracker.setStatus('searching', 'Searching for results');
    const progress = tracker.getProgress();
    expect(progress.status).toBe('searching');
  });

  it('should notify listeners on status change', () => {
    const tracker = new ProgressTracker(3);
    const listener = vi.fn();
    tracker.onStatusChange(listener);
    tracker.setStatus('completed', 'Done');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should generate progress bar', () => {
    const tracker = new ProgressTracker(4);
    tracker.update(2, 'Halfway');
    const bar = tracker.toProgressBar();
    expect(bar.percentage).toBe(50);
    expect(bar.label).toContain('2/4');
  });

  it('should handle zero tasks in progress bar', () => {
    const tracker = new ProgressTracker(0);
    const bar = tracker.toProgressBar();
    expect(bar.percentage).toBe(0);
  });

  it('should reset', () => {
    const tracker = new ProgressTracker(10);
    tracker.update(5, 'Halfway');
    tracker.reset(3);
    const progress = tracker.getProgress();
    expect(progress.totalTasks).toBe(3);
    expect(progress.completedTasks).toBe(0);
  });

  it('should track phase times', () => {
    const tracker = new ProgressTracker(3);
    tracker.setStatus('searching', 'Search');
    tracker.setStatus('analyzing', 'Analyze');
    const progress = tracker.getProgress();
    expect(progress.timeStats.phaseTimes.searching).toBeGreaterThanOrEqual(0);
  });
});
