# Reasoning Module API

## Overview

Multi-step reasoning chain with chain-of-thought support and causal analysis. Supports ≥5 step reasoning chains with topological ordering and validation.

## Classes

### ReasoningChainManager

- **Constructor**: `new ReasoningChainManager(config?: Partial<ReasoningConfig>)`
  - Configure maxSteps (3-20), minConfidence (0.1-0.9), maxAlternatives, direction
- `createChain(topic: string, goal: string): ReasoningChain`
  - Creates a new reasoning chain for a given topic and goal
- `addStep(chain: ReasoningChain, step: Omit<ReasoningStep, "id" | "timestamp">): ReasoningChain`
  - Adds a step to the chain; throws if maxSteps exceeded
- `validateChain(chain: ReasoningChain): { valid: boolean; errors: string[] }`
  - Validates: min 5 steps, has OBSERVATION, has CONCLUSION, last step is CONCLUSION, no cycles, no unknown deps
- `executeChain(chain: ReasoningChain, context: Record<string, unknown>): InferenceResult`
  - Topologically sorts steps, computes confidence, returns conclusion and alternatives
- `getStepCount(chain: ReasoningChain): number`
- `getAverageConfidence(chain: ReasoningChain): number`
- `getChainSummary(chain: ReasoningChain): string`
- `exportChain(chain: ReasoningChain): ReasoningStep[]`

### CausalAnalyzer

- **Constructor**: `new CausalAnalyzer(config?: Partial<ReasoningConfig>)`
- `analyzeCausal(entities): CausalGraph`
  - Builds causal graph from entity-relation input; classifies nodes as cause/effect/mediator/confounder
- `buildGraph(entities): CausalGraph`
  - Low-level graph construction with node classification
- `addNode(graph: CausalGraph, node: CausalNode): CausalGraph`
- `addEdge(graph: CausalGraph, edge: CausalEdge): CausalGraph`
  - Recomputes root causes and leaf effects
- `findRootCauses(graph: CausalGraph): CausalNode[]`
- `findPaths(graph: CausalGraph, fromId: string, toId: string): CausalPath[]`
  - BFS with max 1000 iterations; returns paths sorted by totalStrength desc
- `findStrongestPath(graph: CausalGraph, fromId: string, toId: string): CausalPath | null`
- `getDownstreamEffects(graph: CausalGraph, nodeId: string): CausalNode[]`
- `getUpstreamCauses(graph: CausalGraph, nodeId: string): CausalNode[]`
- `getMediators(graph: CausalGraph): CausalNode[]`
- `exportGraph(graph: CausalGraph): { nodes, edges }`

### ReasoningEngine

- **Constructor**: `new ReasoningEngine(config?: ReasoningEngineConfig)`
- `createChain(topic: string, goal: string): ReasoningChain`
- `infer(chain: ReasoningChain, context: Record<string, unknown>): InferenceResult`
- `analyzeCausal(entities): CausalGraph`
- `inferWithCausalSupport(chain, entities, context): { inference: InferenceResult; causalGraph: CausalGraph }`
  - Enhances chain steps with causal evidence before inference
- `getChainManager(): ReasoningChainManager`
- `getCausalAnalyzer(): CausalAnalyzer`

### Factory Functions

- `createReasoningChainManager(config?): ReasoningChainManager`
- `createCausalAnalyzer(config?): CausalAnalyzer`
- `createReasoningEngine(config?): ReasoningEngine`

## Usage Example

```typescript
import { createReasoningEngine, ReasoningStepType } from "deepclaw";

const engine = createReasoningEngine();

const chain = engine.createChain("Climate change", "Determine primary causes");
chain.steps = [
  { id: "1", type: ReasoningStepType.OBSERVATION, statement: "CO2 levels rising", evidence: ["NOAA data"], confidence: 0.9, dependsOn: [], alternatives: [], timestamp: new Date() },
  { id: "2", type: ReasoningStepType.HYPOTHESIS, statement: "Human activity is primary driver", evidence: ["IPCC report"], confidence: 0.7, dependsOn: ["1"], alternatives: ["Natural cycles"], timestamp: new Date() },
  { id: "3", type: ReasoningStepType.INFERENCE, statement: "Industrial emissions correlate with temperature rise", evidence: ["EPA data"], confidence: 0.85, dependsOn: ["2"], alternatives: [], timestamp: new Date() },
  { id: "4", type: ReasoningStepType.VALIDATION, statement: "Multiple independent datasets confirm trend", evidence: ["NASA", "NOAA", "HadCRUT"], confidence: 0.9, dependsOn: ["3"], alternatives: [], timestamp: new Date() },
  { id: "5", type: ReasoningStepType.CONCLUSION, statement: "Human activity is the primary driver of recent climate change", evidence: ["IPCC AR6"], confidence: 0.95, dependsOn: ["4"], alternatives: [], timestamp: new Date() },
];

const result = engine.infer(chain, { dataset: "global" });
// result.conclusion, result.confidence, result.alternativeConclusions
```
