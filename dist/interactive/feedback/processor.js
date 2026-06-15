/**
 * Feedback Processor - Converts user feedback into actionable adjustments
 */
const TYPE_ACTION_MAP = {
    positive: { action: 'continue', priority: 0.3, baseConfidence: 0.8 },
    negative: { action: 'redirect', priority: 0.8, baseConfidence: 0.7 },
    modify: { action: 'refine', priority: 0.7, baseConfidence: 0.75 },
    supplement: { action: 'expand', priority: 0.6, baseConfidence: 0.7 },
    pause: { action: 'halt', priority: 1.0, baseConfidence: 0.9 },
};
export class FeedbackProcessor {
    process(feedback) {
        const mapping = TYPE_ACTION_MAP[feedback.type] ?? TYPE_ACTION_MAP.positive;
        if (!feedback.content || !feedback.content.trim()) {
            return {
                original: feedback,
                action: 'continue',
                priority: 0,
                adjustments: [],
                confidence: 0,
            };
        }
        const adjustments = this.generateAdjustments(feedback, mapping.action);
        const confidence = feedback.content.length > 10
            ? Math.min(mapping.baseConfidence + 0.1, 1)
            : mapping.baseConfidence;
        return {
            original: feedback,
            action: mapping.action,
            priority: mapping.priority,
            adjustments,
            confidence,
        };
    }
    processBatch(feedbacks) {
        return feedbacks.map((f) => this.process(f));
    }
    merge(processed) {
        if (processed.length === 0) {
            return { action: 'continue', adjustments: [], priority: 0 };
        }
        // Priority: halt > redirect > refine > expand > continue
        const actionOrder = ['halt', 'redirect', 'refine', 'expand', 'continue'];
        const mergedAction = processed.reduce((highest, p) => {
            const idx = actionOrder.indexOf(p.action);
            const highestIdx = actionOrder.indexOf(highest);
            return idx < highestIdx ? p.action : highest;
        }, 'continue');
        const adjustments = Array.from(new Set(processed.flatMap((p) => p.adjustments)));
        const priority = Math.max(...processed.map((p) => p.priority), 0);
        return { action: mergedAction, adjustments, priority };
    }
    generateAdjustments(feedback, action) {
        const adjustments = [];
        switch (action) {
            case 'redirect':
                adjustments.push(`Redirect: ${feedback.content}`);
                break;
            case 'refine':
                adjustments.push(`Refine: ${feedback.content}`);
                break;
            case 'expand':
                adjustments.push(`Expand: ${feedback.content}`);
                break;
            case 'continue':
                adjustments.push('Continue current direction');
                break;
            case 'halt':
                adjustments.push('Halt current operation');
                break;
        }
        return adjustments;
    }
}
//# sourceMappingURL=processor.js.map