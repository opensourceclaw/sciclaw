/**
 * Progress Tracker - Tracks and displays research progress
 */

import type { ResearchProgress, ResearchStatus, StatusUpdate, ProgressBar, TimeStats } from './types.js';

export class ProgressTracker {
  private progress: ResearchProgress;
  private listeners: Array<(event: StatusUpdate) => void> = [];
  private phaseStartTimes: Map<string, number> = new Map();

  constructor(totalTasks: number) {
    this.progress = {
      totalTasks,
      completedTasks: 0,
      failedTasks: 0,
      currentTask: 'Initializing',
      status: 'idle',
      startTime: new Date(),
      timeStats: {
        elapsedMs: 0,
        estimatedRemainingMs: 0,
        phaseTimes: {},
      },
    };
  }

  update(taskDelta: number, currentTask: string): ResearchProgress {
    this.progress.completedTasks = Math.min(
      this.progress.completedTasks + taskDelta,
      this.progress.totalTasks,
    );
    this.progress.currentTask = currentTask;
    this.progress.timeStats.elapsedMs = Date.now() - this.progress.startTime.getTime();

    if (this.progress.totalTasks > 0) {
      const avgTime = this.progress.timeStats.elapsedMs / Math.max(this.progress.completedTasks, 1);
      this.progress.timeStats.estimatedRemainingMs = avgTime * (this.progress.totalTasks - this.progress.completedTasks);
    }

    return { ...this.progress };
  }

  setStatus(status: ResearchStatus, message: string): void {
    const prevStatus = this.progress.status;
    this.progress.status = status;
    this.progress.currentTask = message;

    // Track phase timing
    if (prevStatus !== status) {
      if (this.phaseStartTimes.has(prevStatus)) {
        const elapsed = Date.now() - (this.phaseStartTimes.get(prevStatus) ?? Date.now());
        this.progress.timeStats.phaseTimes[prevStatus] = (this.progress.timeStats.phaseTimes[prevStatus] ?? 0) + elapsed;
      }
      this.phaseStartTimes.set(status, Date.now());
    }

    this.progress.timeStats.elapsedMs = Date.now() - this.progress.startTime.getTime();

    const update: StatusUpdate = {
      status,
      message,
      timestamp: new Date(),
    };

    this.notifyListeners(update);
  }

  getProgress(): ResearchProgress {
    return { ...this.progress, timeStats: { ...this.progress.timeStats } };
  }

  onStatusChange(listener: (event: StatusUpdate) => void): void {
    this.listeners.push(listener);
  }

  toProgressBar(): ProgressBar {
    const percentage = this.progress.totalTasks > 0
      ? Math.round((this.progress.completedTasks / this.progress.totalTasks) * 100)
      : 0;

    return {
      percentage,
      label: `${this.progress.completedTasks}/${this.progress.totalTasks} tasks`,
      sections: [
        { label: 'Completed', percentage, status: 'completed' },
        { label: 'Remaining', percentage: 100 - percentage, status: 'pending' },
      ],
    };
  }

  reset(totalTasks: number): void {
    this.progress = {
      totalTasks,
      completedTasks: 0,
      failedTasks: 0,
      currentTask: 'Initializing',
      status: 'idle',
      startTime: new Date(),
      timeStats: {
        elapsedMs: 0,
        estimatedRemainingMs: 0,
        phaseTimes: {},
      },
    };
    this.phaseStartTimes.clear();
  }

  private notifyListeners(update: StatusUpdate): void {
    for (const listener of this.listeners) {
      listener(update);
    }
  }
}
