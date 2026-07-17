# Task: DeepClaw v3.5.0 Phase 2 — Implementation

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Stage**: BUILD — Implementation
**Priority**: High
**PipelineId**: deepclaw-v3.5.0-phase2
**Project**: deepclaw
**Version**: v3.5.0

---

## Background

Phase 2 detailed design approved. Reference: `docs/design/v3.5.0-phase2-detailed.md`

Two modules to implement:
1. Monitoring Observer (5 files, ~480 lines)
2. HitL Approval (4 files, ~375 lines)

---

## Implementation Scope

### 1. Monitoring Observer

**New files**:
- `src/monitoring/types.ts` — ResearchMetrics, Alert, AlertRule, ObserverConfig
- `src/monitoring/Observer.ts` — DeepClawObserver (lifecycle hooks)
- `src/monitoring/MetricsCollector.ts` — Metrics tracking + persistence
- `src/monitoring/AlertManager.ts` — Alert rules engine
- `src/monitoring/index.ts` — Exports

**7 Metrics**: researchDurationMs, phaseDurationMs, agentResponseTimeMs, cacheHitRate, errorRate, sourceCount, tokenUsage

**5 Alert Rules**: high_error_rate, slow_response, low_cache_hit, token_budget_exceeded, zero_sources

**Key Requirements**:
- All hooks wrapped in try-catch (never throw)
- Persistence to `~/.deepclaw/metrics/`
- Integration hooks into `src/agents/orchestrator.ts`

### 2. Human-in-the-Loop Approval

**New files**:
- `src/approval/types.ts` — ApprovalRequest, ApprovalStatus, ApprovalFlowConfig
- `src/approval/ApprovalFlow.ts` — State machine + file-based approval
- `src/approval/ApprovalGate.ts` — Gate integration
- `src/approval/index.ts` — Exports

**3 Approval Points**: research_plan, budget_threshold, source_quality

**Key Requirements**:
- Timeout ≠ approval (configurable per point)
- Audit logging to `~/.deepclaw/approval/audit.json`
- Gate integration with existing GateRegistry

### 3. Orchestrator Integration

**Update**: `src/agents/orchestrator.ts` — add optional Observer and ApprovalGate

---

## Tests

| Module | Tests |
|--------|:-----:|
| `tests/monitoring/Observer.test.ts` | 10+ |
| `tests/monitoring/MetricsCollector.test.ts` | 4+ |
| `tests/monitoring/AlertManager.test.ts` | 4+ |
| `tests/approval/ApprovalFlow.test.ts` | 8+ |
| `tests/approval/ApprovalGate.test.ts` | 4+ |
| **Total** | **30+** |

---

## Important Rules

- ❌ Do NOT create GitHub Release
- ❌ Do NOT push to remote
- ✅ Commit to local branch only
- ✅ Run full test suite before completion
- ✅ Update CHANGELOG.md

---

## Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm test` — all 1068 + 30+ tests pass
- [ ] Observer hooks don't throw on errors
- [ ] Approval state machine works correctly
- [ ] Audit logging complete
- [ ] CHANGELOG.md updated
- [ ] `git status` clean

---

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`