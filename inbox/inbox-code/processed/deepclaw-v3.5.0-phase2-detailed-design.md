# Task: DeepClaw v3.5.0 Phase 2 — Detailed Design

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Stage**: DESIGN — Detailed Design
**Priority**: High
**PipelineId**: deepclaw-v3.5.0-phase2
**Project**: deepclaw
**Version**: v3.5.0

---

## Background

Phase 2 summary design approved by Peter. Reference: `docs/design/v3.5.0-phase2-summary.md`

Two modules:
1. Monitoring Observer — metrics collection + alerting for research pipeline
2. Human-in-the-Loop Approval — file-based approval flow for critical decisions

---

## Detailed Design Scope

### 1. Monitoring Observer

**New files**:
```
src/monitoring/
├── types.ts              # Metric types, Alert, AlertRule, ObserverConfig
├── Observer.ts           # DeepClawObserver class
├── MetricsCollector.ts   # Per-run metrics tracking
├── AlertManager.ts       # Alert rules engine
└── index.ts              # Exports
```

**7 Metrics**:
- `research_duration_ms`, `agent_response_time_ms`, `cache_hit_rate`
- `error_rate`, `token_usage`, `source_count`, `phase_duration_ms`

**5 Alert Rules** (configurable thresholds):
- `high_error_rate` (>30%), `slow_response` (>30s), `low_cache_hit` (<20%)
- `token_budget_exceeded` (>100k), `zero_sources` (0)

**Integration**: Observer hooks into `src/agents/orchestrator.ts` at research start/end and agent dispatch points.

**Design Decisions to Document**:
- Why passive (collects metrics, emits alerts, does not block pipeline)
- Why filesystem persistence for metrics history
- How alert thresholds are configurable

### 2. Human-in-the-Loop Approval

**New files**:
```
src/approval/
├── types.ts              # ApprovalRequest, ApprovalStatus, ApprovalDecision
├── ApprovalFlow.ts       # ApprovalFlow state machine
├── ApprovalGate.ts       # Gate integration with GateRegistry
└── index.ts              # Exports
```

**State Machine**: pending → awaiting_approval → approved / rejected / auto_approved / auto_rejected

**3 Approval Points**:
- Research plan approval (before pipeline execution)
- Budget threshold (token estimate > budget)
- Source quality (low-quality sources before inclusion)

**Integration**: `ApprovalGate` implements the existing Gate interface from `src/gate/`.

**Design Decisions to Document**:
- Why timeout ≠ approval (silence is not consent)
- Why file-based (inbox/approval/) not CLI prompt
- How audit logging works (timestamped decisions)
- How ApprovalGate integrates with existing GateRegistry

---

## Deliverable

Write detailed design document to `docs/design/v3.5.0-phase2-detailed.md`

Include:
1. File-by-file class/interface definitions
2. Method signatures with parameter types
3. Error handling strategy
4. Alternative approaches considered + rejected
5. Test case outline

---

## Important

- **DO NOT implement** — design only
- Reference existing Gate system (`src/gate/`) for integration patterns
- Reference DevClaw Observer (`../devclaw/src/monitoring/`) for inspiration, not copy
- DeepClaw is a research framework — metrics should be research-domain specific

---

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`