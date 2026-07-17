# Task: DeepClaw v3.5.0 Phase 1 — Detailed Design (Retroactive)

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Stage**: DESIGN — Detailed Design
**Priority**: High
**PipelineId**: deepclaw-v3.5.0-phase1
**Project**: deepclaw
**Version**: v3.5.0

---

## Background

The DESIGN Stage detailed-design SubStage was skipped — Jarvis jumped directly to BUILD implementation. The implementation is already done and approved (Code Review + Internal Verify passed), but the detailed design document is missing.

This is a retroactive task: document the design decisions behind the already-implemented Phase 1 code.

## What to Produce

Write detailed design document to `docs/design/v3.5.0-phase1-detailed.md`

### Section 1: Gate System Design

For each file in `src/gate/`:
- `types.ts` — type hierarchy decisions
- `GateRegistry.ts` — persistence strategy (why filesystem, why JSON)
- `gates/InternalVerifyGate.ts` — why 9 rules (6 failed + 3 warning), rule selection rationale

### Section 2: Pipeline CLI Design

For each file in `src/cli/`:
- `pipeline-coordinator.ts` — state machine decisions (why 5 stages, why JSON persistence)
- `pipeline.ts` — why commander framework
- Each command: functional design, error handling strategy

### Section 3: Chinese Removal Strategy

- Which files were affected and why
- Translation approach (comments only, not user-facing strings)
- CI check script design

### Section 4: Design Decisions

Key trade-offs made:
- Why Gate is standalone (not integrated into Orchestrator yet)
- Why `process.exit(1)` for CLI errors (vs thrown exceptions)
- Why `commander` over `yargs` or plain argv

## Format

Standard detailed design format with:
- File-by-file breakdown
- Key interface/class decisions
- Alternative approaches considered
- Trade-offs documented

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`