/**
 * Progress Tracker - Tracks and displays research progress
 */
import type { ResearchProgress, ResearchStatus, StatusUpdate, ProgressBar } from './types.js';
export declare class ProgressTracker {
    private progress;
    private listeners;
    private phaseStartTimes;
    constructor(totalTasks: number);
    update(taskDelta: number, currentTask: string): ResearchProgress;
    setStatus(status: ResearchStatus, message: string): void;
    getProgress(): ResearchProgress;
    onStatusChange(listener: (event: StatusUpdate) => void): void;
    toProgressBar(): ProgressBar;
    reset(totalTasks: number): void;
    private notifyListeners;
}
//# sourceMappingURL=progress.d.ts.map