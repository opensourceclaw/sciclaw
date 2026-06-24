# Experiment Module API

## Overview

Automatic experiment design from hypotheses, execution with dependency ordering, and evaluation with findings and recommendations.

## Classes

### ExperimentDesigner

- **Constructor**: `new ExperimentDesigner(config?: Partial<ExperimentConfig>)`
  - Config: maxSteps (3-100), maxVariables (2-50), defaultTimeoutMs
- `design(hypothesis: { id; statement; category; confidence }): Experiment`
  - Maps category to experiment type (causal→controlled, correlational→observational, predictive→simulation, comparative→A/B), extracts variables from statement, generates 7 standard steps, generates metrics
- `designBatch(hypotheses: Hypothesis[]): Experiment[]`
- `generateSteps(): ExperimentStep[]`
  - Returns 7 canonical steps: setup → measure_baseline → manipulation×3 → analyze → validate
- `extractVariables(statement: string): ExperimentVariable[]`
  - Parses causal/correlational patterns; falls back to noun phrase extraction
- `classifyVariable(name: string, statement: string): VariableType`
- `validateExperiment(experiment: Experiment): { valid: boolean; errors: string[] }`
  - Checks min 3 steps, min 2 variables, has independent+ dependent, no cycles, has metrics
- `getExperimentType(hypothesis: { category: string }): ExperimentType`
- `getDesignStats(): { totalDesigned }`

### ExperimentRunner

- **Constructor**: `new ExperimentRunner(config?: Partial<ExperimentConfig>)`
  - Config: defaultTimeoutMs (1s-5min)
- `run(experiment: Experiment): Promise<ExperimentResult>`
  - Executes steps in dependency order; skips steps with failed dependencies; measures metrics; prevents re-entrant runs
- `runBatch(experiments: Experiment[]): Promise<ExperimentResult[]>`
  - Sequential execution
- `cancel(experimentId: string): boolean`
- `isRunning(experimentId: string): boolean`
- `getRunnerStats(): { totalRun; activeCount; avgDurationMs }`

### ExperimentEvaluator

- **Constructor**: `new ExperimentEvaluator(config?: Partial<ExperimentConfig>)`
  - Config: minConfidenceForSupport (default 0.6)
- `evaluate(result: ExperimentResult, hypothesis?): EvaluationReport`
  - Computes overallScore from metric pass rate (0.4) + step completion (0.3) + deviation (0.2) + observations (0.1); extracts findings; generates recommendations
- `evaluateBatch(results, hypotheses?): EvaluationReport[]`
- `computeOverallScore(result: ExperimentResult): number`
- `isHypothesisSupported(result, hypothesisConfidence): boolean`
- `extractFindings(result: ExperimentResult): Finding[]`
- `generateRecommendations(report: EvaluationReport): string[]`
- `getEvaluationStats(): { totalEvaluated; supportedCount; refutedCount }`

### ExperimentEngine

- **Constructor**: `new ExperimentEngine(config?: ExperimentEngineConfig)`
- `design(hypothesis): Experiment`
- `run(experiment: Experiment): Promise<ExperimentResult>`
- `evaluate(result, hypothesis?): EvaluationReport`
- `runFullPipeline(hypothesis): Promise<{ experiment; result; report }>`
  - Design → validate → run → evaluate; throws if validation fails
- `getStats(): { designed; run; evaluated }`

### Factory Functions

- `createExperimentDesigner(config?): ExperimentDesigner`
- `createExperimentRunner(config?): ExperimentRunner`
- `createExperimentEvaluator(config?): ExperimentEvaluator`
- `createExperimentEngine(config?): ExperimentEngine`

## Usage Example

```typescript
import { createExperimentEngine } from "deepclaw";

const engine = createExperimentEngine();

const hypothesis = {
  id: "h1",
  statement: "Increased temperature causes higher reaction rate",
  category: "causal",
  confidence: 0.75,
};

const { experiment, result, report } = await engine.runFullPipeline(hypothesis);
// experiment.type === "controlled"
// result.status: "success" | "partial" | "failed"
// report.overallScore, report.hypothesisSupported, report.findings
```
