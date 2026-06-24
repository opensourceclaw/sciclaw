# Hypothesis Module API

## Overview

Evidence-based hypothesis generation, multi-factor ranking, and multi-dimensional validation.

## Classes

### HypothesisGenerator

- **Constructor**: `new HypothesisGenerator(config?: Partial<HypothesisConfig>)`
  - Configure minHypotheses, maxHypotheses, minEvidencePerHypothesis
- `generate(evidence: Evidence[], context?: { topic?: string; domain?: string }): Hypothesis[]`
  - Clusters evidence by Jaccard similarity, determines category, generates statements from templates; falls back to cross-cluster and single-evidence generation if needed; caps at maxHypotheses, sorted by confidence desc
- `refineHypothesis(hypothesis: Hypothesis, newEvidence: Evidence[]): Hypothesis`
  - Adjusts confidence (+0.05 for supporting, -0.1 for contradicting); updates status to SUPPORTED (≥0.7) or REFUTED (<0.3)
- `combineHypotheses(h1: Hypothesis, h2: Hypothesis): Hypothesis | null`
  - Merges two hypotheses of same category; returns null if categories differ
- `getStats(): { totalGenerated: number; totalRefined: number }`

### HypothesisRanker

- **Constructor**: `new HypothesisRanker(config?: Partial<HypothesisConfig>)`
  - Configurable ranking weights (evidenceSupport, evidenceReliability, novelty, testability, coherence)
- `rank(hypotheses: Hypothesis[]): RankedHypothesis[]`
  - Multi-factor weighted ranking with normalized scores
- `rankByConfidence(hypotheses: Hypothesis[]): RankedHypothesis[]`
- `rankByEvidenceStrength(hypotheses: Hypothesis[]): RankedHypothesis[]`
- `rankByNovelty(hypotheses: Hypothesis[]): RankedHypothesis[]`
- `getTopK(hypotheses: Hypothesis[], k: number): RankedHypothesis[]`
- `getRankingWeights(): RankingWeights`

### HypothesisValidator

- **Constructor**: `new HypothesisValidator(config?: Partial<HypothesisConfig>)`
  - Configure validationThresholds (minFeasibility, minClarity, minNovelty)
- `validate(hypothesis: Hypothesis): ValidationResult`
  - Checks feasibility (non-empty, valid confidence range), testability (measurable terms), falsifiability (no tautologies), novelty (vs common patterns), clarity (ambiguous pronoun penalty)
- `validateBatch(hypotheses: Hypothesis[]): ValidationResult[]`
- `isFeasible(hypothesis: Hypothesis): boolean`
- `isTestable(hypothesis: Hypothesis): boolean`
- `isFalsifiable(hypothesis: Hypothesis): boolean`
- `getValidationStats(): { totalValidated; feasibleCount; infeasibleCount }`

### HypothesisEngine

- **Constructor**: `new HypothesisEngine(config?: HypothesisEngineConfig)`
- `generate(evidence: Evidence[]): Hypothesis[]`
- `rank(hypotheses: Hypothesis[]): RankedHypothesis[]`
- `validate(hypothesis: Hypothesis): ValidationResult`
- `generateAndRank(evidence: Evidence[]): RankedHypothesis[]`
- `generateRankAndValidate(evidence): { ranked: RankedHypothesis[]; validations: Map<string, ValidationResult> }`
- `getStats(), getGenerator(), getRanker(), getValidator()`

### Factory Functions

- `createHypothesisGenerator(config?): HypothesisGenerator`
- `createHypothesisRanker(config?): HypothesisRanker`
- `createHypothesisValidator(config?): HypothesisValidator`
- `createHypothesisEngine(config?): HypothesisEngine`

## Usage Example

```typescript
import { createHypothesisEngine } from "deepclaw";

const engine = createHypothesisEngine();

const evidence = [
  { id: "e1", source: "study_a", content: "Smoking causes lung cancer in 85% of cases", relevance: 0.9, reliability: 0.95, type: "data_point", timestamp: new Date() },
  { id: "e2", source: "study_b", content: "Smoking leads to increased tumor growth rates", relevance: 0.8, reliability: 0.9, type: "observation", timestamp: new Date() },
];

const { ranked, validations } = engine.generateRankAndValidate(evidence);
// ranked[0]: { hypothesis, rank: 1, score, confidence, strengthLabel }
// validations.get(ranked[0].hypothesis.id): { feasible, testable, falsifiable, overallScore }
```
