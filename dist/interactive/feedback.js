/**
 * DeepClaw v3.0.0 — Real-Time Feedback Handler
 *
 * Intent detection, sentiment analysis, and preference extraction
 * from user input in real time.
 */
import { FeedbackAction, DEFAULT_INTERACTIVE_CONFIG } from "./types.js";
// ── Sentiment Lexicon ────────────────────────────────────────────────────
const POSITIVE_WORDS = new Set([
    "good", "great", "excellent", "yes", "like", "helpful",
    "useful", "interesting", "perfect", "thanks", "correct",
]);
const NEGATIVE_WORDS = new Set([
    "bad", "wrong", "no", "not", "incorrect", "dislike",
    "useless", "boring", "confusing", "irrelevant", "poor",
]);
// ── Helpers ──────────────────────────────────────────────────────────────
function detectIntent(input) {
    const content = input.content.toLowerCase().trim();
    const patterns = [
        {
            regex: /\b(skip|next|pass|ignore|move on)\b/i,
            action: FeedbackAction.SKIP,
        },
        {
            regex: /\b(instead|rather|redirect|switch|different|change topic)\b/i,
            action: FeedbackAction.REDIRECT,
        },
        {
            regex: /\b(more|deeper|detail|elaborate|expand|continue|further)\b/i,
            action: FeedbackAction.REFINE,
        },
        {
            regex: /\b(change|modify|update|adjust|tweak|but|however)\b/i,
            action: FeedbackAction.MODIFY,
        },
        {
            regex: /\b(no|wrong|incorrect|bad|disagree|not|nope)\b/i,
            action: FeedbackAction.REJECT,
        },
        {
            regex: /\b(yes|ok|good|correct|agree|right|great|perfect)\b/i,
            action: FeedbackAction.ACCEPT,
        },
    ];
    for (const { regex, action } of patterns) {
        if (regex.test(content))
            return action;
    }
    return FeedbackAction.ACCEPT;
}
function analyzeSentiment(input) {
    const words = input.content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter((w) => POSITIVE_WORDS.has(w)).length;
    const negativeCount = words.filter((w) => NEGATIVE_WORDS.has(w)).length;
    if (positiveCount > negativeCount)
        return "positive";
    if (negativeCount > positiveCount)
        return "negative";
    return "neutral";
}
function extractPreferences(input) {
    const prefs = [];
    const content = input.content;
    // Check dislikes first (before likes, since "don't like" contains "like")
    const dislikeMatch = content.match(/(?:I\s+)?(?:don't\s+like|dislike|hate|don't\s+want)\s+(.+?)(?:\.|$|,|and|or)/i);
    if (dislikeMatch) {
        prefs.push({
            key: dislikeMatch[1].trim().slice(0, 50),
            value: false,
            source: "explicit",
            confidence: 0.8,
        });
    }
    const likeMatch = content.match(/(?:I\s+)?(?:prefer|like|want|enjoy)\s+(.+?)(?:\.|$|,|and|or)/i);
    if (likeMatch && !content.match(/don't\s+like|don't\s+want/i)) {
        prefs.push({
            key: likeMatch[1].trim().slice(0, 50),
            value: true,
            source: "explicit",
            confidence: 0.8,
        });
    }
    const moreMatch = content.match(/more\s+(.+?)(?:\.|$|,|please)/i);
    if (moreMatch) {
        prefs.push({
            key: moreMatch[1].trim().slice(0, 50),
            value: "more",
            source: "explicit",
            confidence: 0.6,
        });
    }
    return prefs;
}
function computeContextChanges(action, content, context) {
    switch (action) {
        case FeedbackAction.ACCEPT:
            return { confidence: Math.min(context.confidence + 0.1, 1.0) };
        case FeedbackAction.REJECT:
            return {
                excludedTopics: [...context.excludedTopics, content],
                confidence: Math.max(context.confidence - 0.15, 0.1),
            };
        case FeedbackAction.REFINE:
            return {
                depth: context.depth + 1,
                focus: [...context.focus, content],
            };
        case FeedbackAction.REDIRECT:
            return {
                focus: [content],
                exploredTopics: [...context.exploredTopics, ...context.focus],
                confidence: 0.5,
            };
        default:
            return {};
    }
}
function generateSuggestions(action, sentiment) {
    const suggestions = [];
    if (action === FeedbackAction.REJECT) {
        suggestions.push("Try a different approach or topic");
    }
    if (action === FeedbackAction.REFINE) {
        suggestions.push("Diving deeper into the current topic");
    }
    if (sentiment === "negative") {
        suggestions.push("Adjusting to better match your preferences");
    }
    return suggestions;
}
// ── RealTimeFeedback ─────────────────────────────────────────────────────
export class RealTimeFeedback {
    config;
    total = 0;
    acceptCount = 0;
    totalResponseTime = 0;
    constructor(config) {
        this.config = { ...DEFAULT_INTERACTIVE_CONFIG, ...config };
    }
    processFeedback(sessionId, input) {
        const startTime = Date.now();
        const action = detectIntent(input);
        const sentiment = analyzeSentiment(input);
        const extractedPreferences = extractPreferences(input);
        const contextChanges = computeContextChanges(action, input.content, { topic: "", depth: 0, focus: [], exploredTopics: [], excludedTopics: [], preferences: [], confidence: 0.5 });
        const suggestions = generateSuggestions(action, sentiment);
        this.total++;
        if (action === FeedbackAction.ACCEPT)
            this.acceptCount++;
        this.totalResponseTime += Date.now() - startTime;
        return {
            inputId: input.id,
            sessionId,
            action,
            sentiment,
            extractedPreferences,
            contextChanges,
            suggestions,
            processedAt: new Date(),
        };
    }
    batchProcess(inputs) {
        return inputs.map((input) => this.processFeedback("batch", input));
    }
    analyzeSentiment(input) {
        return analyzeSentiment(input);
    }
    detectIntent(input) {
        return detectIntent(input);
    }
    extractPreferences(input) {
        return extractPreferences(input);
    }
    shouldAdapt(context) {
        if (context.confidence < 0.4)
            return true;
        if (context.exploredTopics.length > 5 &&
            context.focus.length === 0)
            return true;
        if (context.excludedTopics.length >
            context.exploredTopics.length)
            return true;
        return false;
    }
    computeAdaptation(context, feedback) {
        const changes = {};
        const rejectCount = feedback.filter((f) => f.action === FeedbackAction.REJECT).length;
        if (rejectCount > 0) {
            changes.confidence = Math.max(0.1, context.confidence - rejectCount * 0.1);
        }
        const allPrefs = feedback.flatMap((f) => f.extractedPreferences);
        if (allPrefs.length > 0) {
            changes.preferences = [
                ...context.preferences,
                ...allPrefs,
            ];
        }
        return changes;
    }
    getFeedbackStats() {
        return {
            total: this.total,
            acceptRate: this.total > 0
                ? Math.round((this.acceptCount / this.total) * 100) / 100
                : 0,
            avgResponseTimeMs: this.total > 0
                ? Math.round(this.totalResponseTime / this.total)
                : 0,
        };
    }
}
export function createRealTimeFeedback(config) {
    return new RealTimeFeedback(config);
}
//# sourceMappingURL=feedback.js.map