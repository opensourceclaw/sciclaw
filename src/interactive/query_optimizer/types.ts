/**
 * Query Optimizer types
 */

export interface Query {
  id: string;
  text: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'skipped';
  source: 'original' | 'rewritten' | 'expanded';
  parentId?: string;
  score?: number;
  createdAt: Date;
}

export interface RewriteRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

export interface ExpansionResult {
  original: string;
  expansions: string[];
  scores: number[];
}

export interface ScheduleResult {
  ordered: Query[];
  skipped: Query[];
  reason: string;
}
