# Plan: DeepClaw v3.7.0 — Flow Separation (Deep Research)

**From**: Friday (A)
**Date**: 2026-07-22
**Project**: deepclaw
**Version**: 3.7.0

---

## Background

Based on the architecture decision ( Jarvis + Edith recommendation):

- **Decision**: Option B+ (Separate Flow + Shared Kernel)
- **Scope**: DeepClaw continues as Deep Research platform
- **Goal**: Separate DeepResearchFlow from AutoResearchFlow

---

## Goals for v3.7.0

### Primary Goals

1. **Separate Flow Architecture**: Extract DeepResearchFlow from existing Orchestrator
2. **Shared Kernel**: Identify and document shared components
3. **CLI Mode Flag**: Add `--mode deep|auto` flag

### Secondary Goals

4. **Gate Strategy Separation**: Prepare for different Gate strategies
5. **Documentation Update**: Document the new architecture

---

## Scope

| Priority | Item | Description |
|:--------:|------|-------------|
| P0 | Flow Separation | Extract DeepResearchFlow class |
| P0 | CLI Mode Flag | Add --mode flag to CLI |
| P1 | Kernel Documentation | Document shared components |
| P2 | Gate Preparation | Prepare GateRegistry for different strategies |

---

## Architecture

```
┌─────────────────────────────────────────┐
│           CLI / API 统一入口              │
├─────────────────────────────────────────┤
│  DeepResearchFlow ← NEW                 │
│  - interactive mode                     │
│  - human approval                      │
│  - depth-first                        │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Research Kernel (共享)                  │
│  - PlanningAgent / SearchAgent          │
│  - SynthesisAgent / WritingAgent        │
│  - Extractor / Knowledge                │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Gate: Human Approval                   │
└─────────────────────────────────────────┘
```

---

## Deliverables

- [ ] `src/flows/deep_research_flow.ts` - New Flow class
- [ ] CLI `--mode deep` flag (default)
- [ ] Architecture documentation update
- [ ] Kernel component documentation

---

## Approval

**Status**: ⏳ Waiting for Peter Approval
