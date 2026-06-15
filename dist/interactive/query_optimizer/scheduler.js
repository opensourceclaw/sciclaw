/**
 * Query Scheduler - Schedules query execution order
 */
function generateId() {
    return Math.random().toString(36).slice(2, 10);
}
export class QueryScheduler {
    queries = new Map();
    schedule(queries) {
        if (queries.length === 0) {
            return { ordered: [], skipped: [], reason: 'Empty query list' };
        }
        const seen = new Map();
        const skipped = [];
        for (const q of queries) {
            const key = q.text.toLowerCase();
            const existing = seen.get(key);
            if (existing) {
                if (q.priority > existing.priority) {
                    skipped.push(existing);
                    seen.set(key, q);
                }
                else {
                    skipped.push(q);
                }
            }
            else {
                seen.set(key, q);
            }
        }
        const ordered = Array.from(seen.values())
            .map((q) => ({
            ...q,
            priority: q.source === 'expanded' ? q.priority - 0.1 : q.priority,
        }))
            .sort((a, b) => {
            const pDiff = b.priority - a.priority;
            if (Math.abs(pDiff) > 0.01)
                return pDiff;
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
        for (const q of ordered) {
            this.queries.set(q.id, q);
        }
        return {
            ordered,
            skipped,
            reason: skipped.length > 0 ? `${skipped.length} duplicate(s) removed` : 'OK',
        };
    }
    updatePriority(queryId, newPriority) {
        const q = this.queries.get(queryId);
        if (q) {
            q.priority = Math.max(0, Math.min(1, newPriority));
        }
    }
    next() {
        const pending = Array.from(this.queries.values())
            .filter((q) => q.status === 'pending')
            .sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
        if (pending.length === 0)
            return null;
        const next = pending[0];
        next.status = 'running';
        return next;
    }
    complete(queryId, score) {
        const q = this.queries.get(queryId);
        if (q) {
            q.status = 'completed';
            q.score = score;
        }
    }
    get pendingCount() {
        return Array.from(this.queries.values()).filter((q) => q.status === 'pending').length;
    }
}
//# sourceMappingURL=scheduler.js.map