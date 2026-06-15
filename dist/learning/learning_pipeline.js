/**
 * Learning Pipeline - Transforms user feedback into actionable learning rules
 *
 * Pipeline: Feedback → Analyze → Extract Patterns → Learn → Apply
 */
const DEFAULT_CONFIG = {
    minRatingForLearning: 3,
    autoLearn: true,
    learnFromPositive: true,
    learnFromNegative: true,
    maxRulesPerSession: 5,
};
const NEGATIVE_KEYWORDS = [
    'inaccurate', 'wrong', 'outdated', 'irrelevant', 'incomplete',
    'missing', 'poor', 'bad', 'useless', 'confusing', 'shallow',
];
const POSITIVE_KEYWORDS = [
    'accurate', 'helpful', 'useful', 'comprehensive', 'insightful',
    'clear', 'detailed', 'good', 'great', 'excellent', 'deep',
];
export class LearningPipeline {
    config;
    clawRlAvailable = false;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initClawRl();
    }
    initClawRl() {
        try {
            // Optional claw-rl integration - gracefully degrade if not available
            this.clawRlAvailable = true;
        }
        catch {
            this.clawRlAvailable = false;
        }
    }
    processFeedback(feedbacks, context = {}) {
        if (feedbacks.length === 0) {
            return {
                feedbackCount: 0,
                patternsFound: 0,
                rulesGenerated: 0,
                rules: [],
                insights: [],
                timestamp: new Date(),
                success: true,
                errorMessage: 'No feedback to process',
            };
        }
        // Stage 1: Filter feedback
        const filtered = this.filterFeedback(feedbacks);
        if (filtered.length === 0) {
            return {
                feedbackCount: feedbacks.length,
                patternsFound: 0,
                rulesGenerated: 0,
                rules: [],
                insights: [],
                timestamp: new Date(),
                success: true,
                errorMessage: 'No actionable feedback after filtering',
            };
        }
        // Stage 2: Analyze patterns
        const patterns = this.analyzePatterns(filtered, context);
        // Stage 3: Extract rules
        const rules = this.extractRules(patterns, filtered, context);
        // Stage 4: Bridge to claw-rl if available
        if (this.clawRlAvailable && this.config.autoLearn) {
            this.bridgeToClawRl(filtered, rules, context);
        }
        // Generate insights
        const insights = this.generateInsights(filtered, patterns, rules);
        return {
            feedbackCount: feedbacks.length,
            patternsFound: patterns.length,
            rulesGenerated: rules.length,
            rules,
            insights,
            timestamp: new Date(),
            success: true,
            errorMessage: '',
        };
    }
    processSingle(feedback, context = {}) {
        return this.processFeedback([feedback], context);
    }
    filterFeedback(feedbacks) {
        return feedbacks.filter((fb) => {
            if (fb.rating <= 2 && this.config.learnFromNegative)
                return true;
            if (fb.rating < this.config.minRatingForLearning)
                return false;
            if (!this.config.learnFromPositive && fb.rating >= 4)
                return false;
            return true;
        });
    }
    analyzePatterns(feedbacks, _context) {
        const patterns = [];
        const avgRating = feedbacks.reduce((s, fb) => s + fb.rating, 0) / feedbacks.length;
        if (avgRating >= 4) {
            patterns.push({
                pattern: 'high_satisfaction',
                description: 'User is satisfied with overall quality',
                confidence: Math.min(0.9, avgRating / 5),
            });
        }
        else if (avgRating <= 2) {
            patterns.push({
                pattern: 'low_satisfaction',
                description: 'User is dissatisfied with overall quality',
                confidence: Math.min(0.9, 1.0 - avgRating / 5),
            });
        }
        const byType = {};
        for (const fb of feedbacks) {
            const key = fb.feedbackType;
            if (!byType[key])
                byType[key] = [];
            byType[key].push(fb.rating);
        }
        for (const [fbType, ratings] of Object.entries(byType)) {
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            if (avg <= 2) {
                patterns.push({
                    pattern: `low_${fbType}`,
                    description: `Users consistently rate ${fbType} low`,
                    type: fbType,
                    averageRating: Math.round(avg * 100) / 100,
                    confidence: Math.min(0.9, 1.0 - avg / 5),
                });
            }
            else if (avg >= 4) {
                patterns.push({
                    pattern: `high_${fbType}`,
                    description: `Users consistently rate ${fbType} high`,
                    type: fbType,
                    averageRating: Math.round(avg * 100) / 100,
                    confidence: Math.min(0.9, avg / 5),
                });
            }
        }
        for (const fb of feedbacks) {
            if (fb.comment) {
                const lower = fb.comment.toLowerCase();
                const negHits = NEGATIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
                const posHits = POSITIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
                if (negHits > posHits) {
                    patterns.push({
                        pattern: 'negative_sentiment',
                        description: `Negative comment detected: ${fb.comment.slice(0, 100)}`,
                        type: fb.feedbackType,
                        confidence: 0.6,
                    });
                }
            }
        }
        return patterns;
    }
    extractRules(patterns, feedbacks, _context) {
        const rules = [];
        for (const pattern of patterns.slice(0, this.config.maxRulesPerSession)) {
            const rule = this.patternToRule(pattern);
            if (rule)
                rules.push(rule);
        }
        for (const fb of feedbacks.slice(0, 3)) {
            if (fb.comment && fb.rating <= 2) {
                rules.push({
                    action: `improve_${fb.feedbackType}`,
                    condition: `User rated ${fb.feedbackType} as ${fb.rating}/5`,
                    suggestion: fb.comment,
                    score: 1.0 - fb.rating / 5,
                    source: 'feedback',
                });
            }
        }
        return rules;
    }
    patternToRule(pattern) {
        const patternName = pattern.pattern;
        const ruleMap = {
            high_satisfaction: {
                action: 'maintain_quality',
                condition: 'Overall satisfaction is high',
                suggestion: 'Continue current research approach for similar topics',
                score: pattern.confidence ?? 0.5,
                source: 'feedback_pattern',
            },
            low_satisfaction: {
                action: 'improve_overall',
                condition: 'Overall satisfaction is low',
                suggestion: 'Review research depth and source quality',
                score: pattern.confidence ?? 0.5,
                source: 'feedback_pattern',
            },
            negative_sentiment: {
                action: 'address_criticism',
                condition: pattern.description ?? '',
                suggestion: 'Investigate and address specific concerns',
                score: 0.6,
                source: 'feedback_pattern',
            },
            low_accuracy: {
                action: 'improve_accuracy',
                condition: 'Accuracy ratings are consistently low',
                suggestion: 'Cross-reference facts with multiple trusted sources',
                score: pattern.confidence ?? 0.5,
                source: 'feedback_pattern',
            },
            low_relevance: {
                action: 'improve_relevance',
                condition: 'Relevance ratings are consistently low',
                suggestion: 'Refine search queries and topic focus',
                score: pattern.confidence ?? 0.5,
                source: 'feedback_pattern',
            },
            low_completeness: {
                action: 'deepen_coverage',
                condition: 'Completeness ratings are consistently low',
                suggestion: 'Expand research scope and section coverage',
                score: pattern.confidence ?? 0.5,
                source: 'feedback_pattern',
            },
            low_usefulness: {
                action: 'improve_usefulness',
                condition: 'Usefulness ratings are consistently low',
                suggestion: 'Add actionable takeaways and practical examples',
                score: pattern.confidence ?? 0.5,
                source: 'feedback_pattern',
            },
        };
        if (ruleMap[patternName]) {
            return { ...ruleMap[patternName] };
        }
        const desc = pattern.description ?? 'Unidentified pattern';
        return {
            action: 'investigate_pattern',
            condition: desc,
            suggestion: `Analyze pattern: ${desc}`,
            score: pattern.confidence ?? 0.3,
            source: 'feedback_pattern',
        };
    }
    bridgeToClawRl(feedbacks, _rules, _context) {
        if (!this.clawRlAvailable)
            return;
        try {
            for (const feedback of feedbacks) {
                const signal = {
                    action: `research_${feedback.feedbackType}`,
                    outcomePositive: feedback.rating >= 4,
                    confidence: Math.abs(feedback.rating - 3) / 2,
                };
                void signal; // Placeholder for actual claw-rl bridge
            }
        }
        catch {
            // Non-critical; continue
        }
    }
    generateInsights(feedbacks, patterns, rules) {
        const insights = [];
        if (feedbacks.length === 0) {
            insights.push('No feedback to analyze.');
            return insights;
        }
        const avg = feedbacks.reduce((s, fb) => s + fb.rating, 0) / feedbacks.length;
        insights.push(`Average rating: ${avg.toFixed(1)}/5 across ${feedbacks.length} feedback entries.`);
        for (const pattern of patterns.slice(0, 3)) {
            const desc = pattern.description ?? 'Unknown pattern';
            const conf = pattern.confidence ?? 0;
            insights.push(`Detected: ${desc} (confidence: ${(conf * 100).toFixed(0)}%)`);
        }
        for (const rule of rules.slice(0, 3)) {
            const suggestion = rule.suggestion ?? 'No suggestion';
            insights.push(`Suggestion: ${suggestion}`);
        }
        return insights;
    }
}
export function processFeedback(feedbacks, context = {}) {
    const pipeline = new LearningPipeline();
    return pipeline.processFeedback(feedbacks, context);
}
//# sourceMappingURL=learning_pipeline.js.map