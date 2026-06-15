/**
 * Visualization types
 */

export type ResearchStatus =
  | 'idle'
  | 'collecting_feedback'
  | 'optimizing_query'
  | 'searching'
  | 'analyzing'
  | 'building_section'
  | 'writing'
  | 'completed'
  | 'error';

export interface ResearchProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  currentTask: string;
  currentSection?: string;
  status: ResearchStatus;
  startTime: Date;
  estimatedEndTime?: Date;
  timeStats: TimeStats;
}

export interface StatusUpdate {
  status: ResearchStatus;
  message: string;
  timestamp: Date;
  detail?: string;
}

export interface TimeStats {
  elapsedMs: number;
  estimatedRemainingMs: number;
  phaseTimes: Record<string, number>;
}

export interface ProgressBar {
  percentage: number;
  label: string;
  sections: Array<{
    label: string;
    percentage: number;
    status: string;
  }>;
}
