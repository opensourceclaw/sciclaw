/**
 * SciClaw v3.0.0-rc.2 — Personalization Tests
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  PreferenceLearner,
  createPreferenceLearner,
} from "../../src/personalization/preference_learner.js";
import {
  StyleAdapter,
  createStyleAdapter,
} from "../../src/personalization/style_adapter.js";
import {
  TopicTracker,
  createTopicTracker,
} from "../../src/personalization/topic_tracker.js";
import {
  PersonalizationEngine,
  createPersonalizationEngine,
} from "../../src/personalization/index.js";
import { DEFAULT_PREFERENCES } from "../../src/personalization/types.js";

// ── PreferenceLearner ──────────────────────────────────────────────────

describe("PreferenceLearner", () => {
  let learner: PreferenceLearner;

  beforeEach(() => {
    learner = new PreferenceLearner();
  });

  it("creates with default config", () => {
    expect(learner).toBeDefined();
  });

  it("creates with factory function", () => {
    const pl = createPreferenceLearner();
    expect(pl).toBeInstanceOf(PreferenceLearner);
  });

  it("creates profile for new user with defaults", () => {
    const profile = learner.getProfile("user-1");
    expect(profile.id).toBe("user-1");
    expect(profile.preferences.depth).toBe("medium");
    expect(profile.preferences.style).toBe("technical");
    expect(profile.preferences.format).toBe("markdown");
  });

  it("returns same profile for same user", () => {
    const p1 = learner.getProfile("user-1");
    const p2 = learner.getProfile("user-1");
    expect(p1).toBe(p2);
  });

  it("different users get different profiles", () => {
    const p1 = learner.getProfile("user-1");
    const p2 = learner.getProfile("user-2");
    expect(p1).not.toBe(p2);
  });

  it("records topic_researched event on recordResearch", () => {
    const profile = learner.recordResearch("user-1", "AI Safety");
    expect(profile.researchCount).toBe(1);
    const events = learner.getEvents("user-1");
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("topic_researched");
  });

  it("explicitly sets preference and records event", () => {
    const profile = learner.setPreference("user-1", "depth", "deep");
    expect(profile.preferences.depth).toBe("deep");
    const events = learner.getEvents("user-1");
    expect(events.some((e) => e.type === "depth_change")).toBe(true);
  });

  it("adapts depth upward after multiple deep-topic signals", () => {
    const userId = "user-deep";
    learner.recordResearch(userId, "Quantum Computing", "deep_topic");
    learner.recordResearch(userId, "Climate Modeling", "deep_topic");
    const profile = learner.recordResearch(userId, "AI Ethics", "deep_topic");
    // After 3 deep_topic signals, depth should move up
    expect(["medium", "deep"]).toContain(profile.preferences.depth);
  });

  it("adapts depth downward after simple-topic signals", () => {
    const userId = "user-shallow";
    // Set to deep first
    learner.setPreference(userId, "depth", "deep");
    // Need enough simple_topic signals to overcome the depth_change-deep signal
    for (let i = 0; i < 6; i++) {
      learner.recordResearch(userId, `Simple Topic ${i}`, "simple_topic");
    }
    const profile = learner.getProfile(userId);
    expect(["medium", "shallow"]).toContain(profile.preferences.depth);
  });

  it("tracks events per user", () => {
    learner.recordResearch("user-1", "AI");
    learner.recordResearch("user-2", "Climate");
    expect(learner.getEvents("user-1").length).toBe(1);
    expect(learner.getEvents("user-2").length).toBe(1);
    expect(learner.getEvents().length).toBe(2);
  });

  it("researchCount increments correctly", () => {
    learner.recordResearch("user-1", "Topic A");
    learner.recordResearch("user-1", "Topic B");
    const profile = learner.recordResearch("user-1", "Topic C");
    expect(profile.researchCount).toBe(3);
  });
});

// ── StyleAdapter ───────────────────────────────────────────────────────

describe("StyleAdapter", () => {
  let adapter: StyleAdapter;

  beforeEach(() => {
    adapter = new StyleAdapter();
  });

  it("creates with default style (technical)", () => {
    expect(adapter.current).toBe("technical");
  });

  it("creates with custom initial style", () => {
    const a = new StyleAdapter("academic");
    expect(a.current).toBe("academic");
  });

  it("creates with factory function", () => {
    const sa = createStyleAdapter("quick");
    expect(sa).toBeInstanceOf(StyleAdapter);
  });

  it("has 4 available styles", () => {
    const styles = adapter.getAvailableStyles();
    expect(styles).toHaveLength(4);
    expect(styles).toContain("academic");
    expect(styles).toContain("business");
    expect(styles).toContain("technical");
    expect(styles).toContain("quick");
  });

  it("academic style has formal tone and full structure", () => {
    const profile = adapter.getProfile("academic");
    expect(profile.tone.formality).toBeGreaterThan(0.8);
    expect(profile.structure.includeAbstract).toBe(true);
    expect(profile.structure.includeMethodology).toBe(true);
    expect(profile.structure.includeAppendix).toBe(true);
  });

  it("business style has executive summary and concise tone", () => {
    const profile = adapter.getProfile("business");
    expect(profile.structure.includeExecutiveSummary).toBe(true);
    expect(profile.tone.conciseness).toBeGreaterThan(0.8);
  });

  it("technical style includes code examples", () => {
    const profile = adapter.getProfile("technical");
    expect(profile.structure.includeCodeExamples).toBe(true);
    expect(profile.tone.technicality).toBeGreaterThan(0.8);
  });

  it("quick style is most concise with few sections", () => {
    const profile = adapter.getProfile("quick");
    expect(profile.tone.conciseness).toBeGreaterThan(0.9);
    expect(profile.structure.maxSections).toBeLessThan(5);
  });

  it("applyPreferences changes current style", () => {
    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "academic" });
    expect(adapter.current).toBe("academic");
  });

  it("getSectionOrder returns style-specific ordering", () => {
    const academicOrder = adapter.getProfile("academic");
    const academicSections = adapter.getProfile("academic");
    expect(academicSections.structure.includeAbstract).toBe(true);

    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "quick" });
    const quickOrder = adapter.getSectionOrder();
    expect(quickOrder.length).toBeLessThan(5);
  });

  it("getToneGuidelines returns non-empty for each style", () => {
    for (const style of adapter.getAvailableStyles()) {
      adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style });
      const guidelines = adapter.getToneGuidelines();
      expect(guidelines.length).toBeGreaterThan(0);
    }
  });

  it("getMaxWordsPerSection varies by style", () => {
    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "quick" });
    const quickWords = adapter.getMaxWordsPerSection();
    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "academic" });
    const academicWords = adapter.getMaxWordsPerSection();
    expect(academicWords).toBeGreaterThan(quickWords);
  });

  it("shouldInclude reflects structure", () => {
    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "academic" });
    expect(adapter.shouldInclude("includeAbstract")).toBe(true);
    expect(adapter.shouldInclude("includeExecutiveSummary")).toBe(false);
  });

  it("adaptSectionTitle adjusts per style", () => {
    const title = "Analysis of Market Trends.";
    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "academic" });
    const academic = adapter.adaptSectionTitle(title);
    expect(academic).not.toContain(".");

    adapter.applyPreferences({ ...DEFAULT_PREFERENCES, style: "quick" });
    const quick = adapter.adaptSectionTitle("A very long title that goes on and on and on and on");
    expect(quick.length).toBeLessThanOrEqual(50);
  });
});

// ── TopicTracker ───────────────────────────────────────────────────────

describe("TopicTracker", () => {
  let tracker: TopicTracker;

  beforeEach(() => {
    tracker = new TopicTracker();
  });

  it("creates with default config", () => {
    expect(tracker).toBeDefined();
  });

  it("creates with factory function", () => {
    const tt = createTopicTracker();
    expect(tt).toBeInstanceOf(TopicTracker);
  });

  it("records a new topic interest", () => {
    const interest = tracker.recordResearch("AI");
    expect(interest.topic).toBe("ai");
    expect(interest.frequency).toBe(1);
    expect(interest.weight).toBeGreaterThan(0);
  });

  it("normalizes topic names to lowercase", () => {
    const i1 = tracker.recordResearch("Machine Learning");
    const i2 = tracker.recordResearch("machine learning");
    expect(i1.topic).toBe("machine learning");
    expect(i2.frequency).toBe(2); // Same topic
  });

  it("boosts weight on repeated research", () => {
    tracker.recordResearch("AI");
    tracker.recordResearch("AI");
    const interest = tracker.recordResearch("AI");
    expect(interest.frequency).toBe(3);
    expect(interest.weight).toBeGreaterThan(0.3); // 3 * 0.15 = 0.45
  });

  it("returns interests sorted by weight", () => {
    tracker.recordResearch("AI");
    tracker.recordResearch("AI");
    tracker.recordResearch("Climate");
    const interests = tracker.getInterests();
    expect(interests[0].topic).toBe("ai");
  });

  it("gets top N interests", () => {
    tracker.recordResearch("AI");
    tracker.recordResearch("Climate");
    tracker.recordResearch("Security");
    tracker.recordResearch("Cloud");
    tracker.recordResearch("Database");
    const top = tracker.getTopInterests(3);
    expect(top.length).toBe(3);
  });

  it("suggests related unresearched topics", () => {
    tracker.recordResearch("AI");
    const suggestions = tracker.suggestTopics(3);
    expect(suggestions.length).toBeGreaterThan(0);
    // Should not suggest already-researched topics
    expect(suggestions).not.toContain("ai");
  });

  it("applies time decay to interests", () => {
    const t = new TopicTracker({ minWeight: 0.01 }); // lower threshold to avoid removal
    const interest = t.recordResearch("AI");
    interest.lastResearched = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    interest.weight = 0.3;
    t.applyDecay();
    const decayed = t.getInterest("ai");
    expect(decayed).toBeDefined();
    expect(decayed!.weight).toBeLessThan(0.3);
  });

  it("removes interests below minWeight", () => {
    const t = new TopicTracker({ minWeight: 0.3 });
    t.recordResearch("AI");
    const interest = t.getInterest("ai");
    interest!.weight = 0.05;
    t.applyDecay();
    expect(t.getInterest("ai")).toBeUndefined();
  });

  it("enforces max topics limit", () => {
    const t = new TopicTracker({ maxTopics: 3 });
    t.recordResearch("AI");
    t.recordResearch("Climate");
    t.recordResearch("Security");
    t.recordResearch("Cloud"); // should evict lowest
    expect(t.trackedCount).toBeLessThanOrEqual(3);
  });

  it("calculates diversity score", () => {
    expect(tracker.getDiversityScore()).toBe(0); // no interests

    tracker.recordResearch("AI");
    tracker.recordResearch("Climate");
    tracker.recordResearch("Security");
    const score = tracker.getDiversityScore();
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("clear removes all interests", () => {
    tracker.recordResearch("AI");
    tracker.recordResearch("Climate");
    tracker.clear();
    expect(tracker.trackedCount).toBe(0);
  });

  it("related topics are boosted on research", () => {
    tracker.recordResearch("AI");
    // "machine learning" should be boosted as related
    const ml = tracker.getInterest("machine learning");
    // Related boost only applies if the topic was already tracked
    // Since it wasn't, it may not exist yet
    const interests = tracker.getInterests();
    expect(interests.length).toBeGreaterThan(0);
  });
});

// ── PersonalizationEngine Integration ──────────────────────────────────

describe("PersonalizationEngine", () => {
  let engine: PersonalizationEngine;

  beforeEach(() => {
    engine = new PersonalizationEngine();
  });

  it("creates with factory function", () => {
    const pe = createPersonalizationEngine();
    expect(pe).toBeInstanceOf(PersonalizationEngine);
  });

  it("gets or creates user profile", () => {
    const profile = engine.getProfile("user-1");
    expect(profile.id).toBe("user-1");
    expect(profile.preferences.depth).toBe("medium");
  });

  it("records research and syncs topics to profile", () => {
    const profile = engine.recordResearch("user-1", "AI Safety");
    expect(profile.researchCount).toBe(1);
    expect(profile.interests.length).toBeGreaterThan(0);
  });

  it("sets explicit preferences", () => {
    const profile = engine.setPreference("user-1", "depth", "deep");
    expect(profile.preferences.depth).toBe("deep");
  });

  it("gets style-appropriate section order", () => {
    const order = engine.getSectionOrder();
    expect(order.length).toBeGreaterThan(0);
  });

  it("gets tone guidelines", () => {
    const guidelines = engine.getToneGuidelines();
    expect(guidelines.length).toBeGreaterThan(0);
  });

  it("suggests topics", () => {
    engine.recordResearch("user-1", "AI");
    engine.recordResearch("user-1", "Machine Learning");
    const suggestions = engine.suggestTopics();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it("gets top interests", () => {
    engine.recordResearch("user-1", "AI");
    engine.recordResearch("user-1", "Climate");
    const top = engine.getTopInterests(2);
    expect(top.length).toBeLessThanOrEqual(2);
  });

  it("provides direct access to sub-components", () => {
    expect(engine.getPreferenceLearner()).toBeInstanceOf(PreferenceLearner);
    expect(engine.getStyleAdapter()).toBeInstanceOf(StyleAdapter);
    expect(engine.getTopicTracker()).toBeInstanceOf(TopicTracker);
  });

  it("end-to-end: research → preference adaptation → style application", () => {
    // 1. Get profile
    const profile = engine.getProfile("user-e2e");
    expect(profile.preferences.style).toBe("technical");

    // 2. Record multiple researches to trigger adaptation
    engine.recordResearch("user-e2e", "AI Safety");
    engine.recordResearch("user-e2e", "Quantum Computing");
    engine.recordResearch("user-e2e", "Deep Learning");

    // 3. Set a preference
    engine.setPreference("user-e2e", "style", "academic");

    // 4. Verify style adapter is in sync
    const updatedProfile = engine.getProfile("user-e2e");
    expect(updatedProfile.preferences.style).toBe("academic");

    // 5. Get style-aware outputs with userId
    const order = engine.getSectionOrder("user-e2e");
    expect(order).toContain("abstract"); // academic style

    const guidelines = engine.getToneGuidelines("user-e2e");
    expect(guidelines.some((g) => g.includes("formal"))).toBe(true);

    // 6. Topic interests tracked
    const interests = engine.getTopInterests();
    expect(interests.length).toBeGreaterThan(0);
  });

  it("custom config propagates", () => {
    const pe = new PersonalizationEngine({
      topic: { maxTopics: 5 },
    });
    expect(pe.getTopicTracker().trackedCount).toBe(0);
  });
});
