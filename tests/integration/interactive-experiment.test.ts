import { describe, it, expect } from "vitest";
import { createInteractiveResearchEngine, FeedbackAction } from "../../src/interactive/index.js";
import { createExperimentEngine } from "../../src/experiment/index.js";

describe("Interactive → Experiment Integration", () => {
  it("should flow from interactive session to experiment design", () => {
    const interactive = createInteractiveResearchEngine();
    const experiment = createExperimentEngine();

    // Start interactive research session
    const { session, initialQueries } = interactive.startResearch(
      "Does caffeine improve code review accuracy?",
      "user-1",
    );

    expect(session.status).toBe("active");
    expect(initialQueries.length).toBeGreaterThan(0);

    // Simulate user interactions refining the hypothesis
    interactive.processInput(session.id, {
      id: "input-1",
      action: FeedbackAction.REFINE,
      content: "Focus on senior vs junior developers",
    });

    interactive.processInput(session.id, {
      id: "input-2",
      action: FeedbackAction.ACCEPT,
      content: "Let's test with 200mg caffeine dose",
    });

    // Design experiment from the refined hypothesis
    const hypothesis = {
      id: session.id,
      statement: "200mg caffeine improves code review accuracy in senior developers",
      category: "causal",
      confidence: 0.7,
    };

    const exp = experiment.design(hypothesis);
    expect(exp).toBeDefined();
    expect(exp.variables.length).toBeGreaterThanOrEqual(2);
    expect(exp.steps.length).toBeGreaterThanOrEqual(3);
    expect(exp.type).toBe("controlled");

    // Validate experiment
    const validation = experiment.getDesigner().validateExperiment(exp);
    expect(validation.valid).toBe(true);
  });

  it("should handle full pipeline: interactive → experiment → run", async () => {
    const interactive = createInteractiveResearchEngine();
    const experiment = createExperimentEngine();

    const session = interactive.start("Test hypothesis validation", "user-2");

    interactive.processInput(session.id, {
      id: "input-1",
      action: FeedbackAction.ACCEPT,
      content: "Test the hypothesis",
    });

    const hypothesis = {
      id: "h-full-1",
      statement: "Increased code coverage leads to fewer production bugs",
      category: "correlational",
      confidence: 0.8,
    };

    const { experiment: exp, result, report } = await experiment.runFullPipeline(hypothesis);

    expect(exp.type).toBe("observational");
    expect(result.status).toBe("success");
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.metricSummary.passRate).toBeGreaterThan(0);
  });

  it("should generate recommendations from experiment evaluation", async () => {
    const experiment = createExperimentEngine();

    const hypothesis = {
      id: "h-rec",
      statement: "A/B testing UI changes improves conversion rate",
      category: "comparative",
      confidence: 0.65,
    };

    const { report } = await experiment.runFullPipeline(hypothesis);

    expect(report.hypothesisSupported).toBeDefined();
    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("should handle edge case: invalid experiment", () => {
    const experiment = createExperimentEngine();

    const invalidHypothesis = { id: "h-invalid", statement: "X", category: "causal", confidence: 0.5 };

    const exp = experiment.design(invalidHypothesis);
    const validation = experiment.getDesigner().validateExperiment(exp);

    // Should still be valid with default steps/variables
    expect(exp.variables.length).toBeGreaterThanOrEqual(2);
  });

  it("should accumulate interactive context across multiple turns", () => {
    const interactive = createInteractiveResearchEngine();

    const session = interactive.start("Multi-turn research", "user-3");

    const turns = [
      { action: FeedbackAction.REFINE, content: "Explore quantum computing" },
      { action: FeedbackAction.REDIRECT, content: "Focus on error correction" },
      { action: FeedbackAction.ACCEPT, content: "Analyze surface codes" },
    ];

    for (const turn of turns) {
      interactive.processInput(session.id, {
        id: `turn-${turn.action}`,
        action: turn.action,
        content: turn.content,
      });
    }

    const context = interactive.getAdapter().getContext(session.id);
    expect(context).toBeDefined();
    expect(context!.depth).toBeGreaterThanOrEqual(1);
    expect(context!.exploredTopics.length).toBeGreaterThan(0);
  });
});
