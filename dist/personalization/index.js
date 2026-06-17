import { createPreferenceLearner, } from "./preference_learner.js";
import { createStyleAdapter, } from "./style_adapter.js";
import { createTopicTracker, } from "./topic_tracker.js";
export * from "./types.js";
export * from "./preference_learner.js";
export * from "./style_adapter.js";
export * from "./topic_tracker.js";
// ── Personalization Engine ─────────────────────────────────────────────
export class PersonalizationEngine {
    preferenceLearner;
    styleAdapter;
    topicTracker;
    constructor(config) {
        this.preferenceLearner = createPreferenceLearner(config?.preference);
        this.styleAdapter = createStyleAdapter();
        this.topicTracker = createTopicTracker(config?.topic);
    }
    /** Get or create user profile */
    getProfile(userId) {
        return this.preferenceLearner.getProfile(userId);
    }
    /** Record a research session, updating preferences and topics */
    recordResearch(userId, topic) {
        const profile = this.preferenceLearner.recordResearch(userId, topic);
        this.topicTracker.recordResearch(topic);
        // Sync topic interests into profile
        profile.interests = this.topicTracker.getInterests();
        // Apply learned style
        this.styleAdapter.applyPreferences(profile.preferences);
        return profile;
    }
    /** Set an explicit user preference */
    setPreference(userId, key, value) {
        return this.preferenceLearner.setPreference(userId, key, value);
    }
    /** Get style-appropriate section order */
    getSectionOrder(userId) {
        if (userId) {
            const profile = this.preferenceLearner.getProfile(userId);
            this.styleAdapter.applyPreferences(profile.preferences);
        }
        return this.styleAdapter.getSectionOrder();
    }
    /** Get tone guidelines for the current style */
    getToneGuidelines(userId) {
        if (userId) {
            const profile = this.preferenceLearner.getProfile(userId);
            this.styleAdapter.applyPreferences(profile.preferences);
        }
        return this.styleAdapter.getToneGuidelines();
    }
    /** Suggest topics the user might be interested in */
    suggestTopics(n) {
        return this.topicTracker.suggestTopics(n);
    }
    /** Get top interests */
    getTopInterests(n) {
        return this.topicTracker.getTopInterests(n);
    }
    /** Get current style profile */
    getStyleProfile() {
        return this.styleAdapter.getProfile();
    }
    /** Get the preference learner */
    getPreferenceLearner() {
        return this.preferenceLearner;
    }
    /** Get the style adapter */
    getStyleAdapter() {
        return this.styleAdapter;
    }
    /** Get the topic tracker */
    getTopicTracker() {
        return this.topicTracker;
    }
}
/** Factory */
export function createPersonalizationEngine(config) {
    return new PersonalizationEngine(config);
}
//# sourceMappingURL=index.js.map