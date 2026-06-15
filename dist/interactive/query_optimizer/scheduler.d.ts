/**
 * Query Scheduler - Schedules query execution order
 */
import type { Query, ScheduleResult } from './types.js';
export declare class QueryScheduler {
    private queries;
    schedule(queries: Query[]): ScheduleResult;
    updatePriority(queryId: string, newPriority: number): void;
    next(): Query | null;
    complete(queryId: string, score: number): void;
    get pendingCount(): number;
}
//# sourceMappingURL=scheduler.d.ts.map