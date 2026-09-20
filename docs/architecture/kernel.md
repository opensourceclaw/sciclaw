# SciClaw Research Kernel

## Overview

The Research Kernel is a set of shared components used by both `DeepResearchFlow` and `AutoResearchFlow`. This separation enables different flow strategies while sharing core research infrastructure.

## Architecture

```
Research Kernel (Shared)
├── Agents
│   ├── PlanningAgent    — Decomposes topics into sub-queries
│   ├── SearchAgent      — Executes web searches
│   ├── SynthesisAgent   — Synthesizes findings
│   └── WritingAgent     — Generates reports
├── Core
│   ├── Extractor        — Extracts structured data from sources
│   ├── Knowledge        — Knowledge graph construction
│   └── Reasoner         — Logical reasoning engine
├── Memory
│   ├── SciClawMemoryAdapter — Interface to claw-mem
│   └── Governance            — Memory governance (via MemoryGovernance)
└── Gate
    ├── GateRegistry     — Gate state management
    ├── DeepResearchGateStrategy — Interactive approval
    └── AutoResearchGateStrategy — Autonomous approval
```

## Flow Comparison

| Aspect | DeepResearchFlow | AutoResearchFlow |
|--------|------------------|------------------|
| **Mode** | Interactive | Autonomous |
| **Strategy** | Depth-first | Breadth-first |
| **Approval** | Human approval at each stage | Auto-approved |
| **Gate Strategy** | DeepResearchGateStrategy | AutoResearchGateStrategy |
| **Speed** | Slower (thoughtful) | Faster (automated) |
| **Use Case** | Complex, nuanced research | Quick, broad research |

## Orchestrator Components

The `src/orchestrator/` module provides the state machine that drives research:

- **ResearchStateMachine** — FSM with PLAN → SEARCH → ANALYZE → REFINE → DONE/ABORTED transitions
- **DynamicPlanner** — Auto-selects strategy (breadth-first, depth-first, tree-search, pivot)
- **CrossValidator** — Claim extraction, cross-validation, confidence scoring
- **BlindSpotDetector** — 7 heuristic rules for information gap detection
- **IterativeRefiner** — Query refinement based on blind spots
- **ConfidenceCalibrator** — Feedback-driven confidence threshold optimization

## Usage

```bash
# Deep research (interactive, depth-first, default)
deepclaw research "AI safety implications"

# Auto research (autonomous, breadth-first)
deepclaw research "Latest TypeScript features" --mode auto
```
