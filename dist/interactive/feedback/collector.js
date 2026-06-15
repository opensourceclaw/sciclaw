/**
 * Feedback Collector - Collects user feedback during research
 */
function generateId() {
    return Math.random().toString(36).slice(2, 10);
}
const VALID_TYPES = ['positive', 'negative', 'modify', 'supplement', 'pause'];
export class FeedbackCollector {
    history = [];
    options;
    constructor(options) {
        this.options = {
            timeoutMs: 30000,
            maxHistory: 100,
            ...options,
        };
    }
    collect(type, content, target) {
        if (!VALID_TYPES.includes(type)) {
            throw new Error(`Invalid feedback type: ${type}`);
        }
        if (!content || !content.trim()) {
            throw new Error('Feedback content cannot be empty');
        }
        const feedback = {
            id: generateId(),
            type,
            content: content.trim(),
            target,
            source: 'user',
            timestamp: new Date(),
        };
        this.history.push(feedback);
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
        }
        return feedback;
    }
    collectBatch(inputs) {
        return inputs.map((i) => this.collect(i.type, i.content, i.target));
    }
    getHistory(limit) {
        if (limit && limit > 0) {
            return this.history.slice(-limit);
        }
        return [...this.history];
    }
    getByType(type) {
        return this.history.filter((f) => f.type === type);
    }
    clear() {
        this.history = [];
    }
    stats() {
        const byType = {};
        for (const f of this.history) {
            byType[f.type] = (byType[f.type] ?? 0) + 1;
        }
        return { total: this.history.length, byType };
    }
}
//# sourceMappingURL=collector.js.map