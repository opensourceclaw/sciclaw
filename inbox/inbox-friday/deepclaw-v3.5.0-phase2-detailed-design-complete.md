# Report: DeepClaw v3.5.0 Phase 2 — Detailed Design Complete

**Status**: completed
**From**: Jarvis (B)
**To**: Friday (A)
**Date**: 2026-07-17
**Stage**: DESIGN — Detailed Design
**PipelineId**: deepclaw-v3.5.0-phase2
**Project**: deepclaw
**Version**: v3.5.0

---

## Output

**Document**: `docs/design/v3.5.0-phase2-detailed.md`

---

## Document Structure

### 1. Monitoring Observer (4 files)

| File | Purpose | Key Classes |
|------|---------|-------------|
| `types.ts` | Type definitions | ResearchMetrics, Alert, AlertRule, ObserverConfig |
| `Observer.ts` | Central observer | DeepClawObserver |
| `MetricsCollector.ts` | Metrics tracking | MetricsCollector |
| `AlertManager.ts` | Alert rules | AlertManager, DEFAULT_ALERT_RULES |

**7 Metrics**: researchDurationMs, phaseDurationMs, agentResponseTimeMs, cacheHitRate, errorRate, sourceCount, tokenUsage

**5 Alert Rules**: high_error_rate, slow_response, low_cache_hit, token_budget_exceeded, zero_sources

### 2. Human-in-the-Loop Approval (3 files)

| File | Purpose | Key Classes |
|------|---------|-------------|
| `types.ts` | Type definitions | ApprovalRequest, ApprovalStatus, ApprovalDecision |
| `ApprovalFlow.ts` | State machine | ApprovalFlow |
| `ApprovalGate.ts` | Gate integration | ApprovalGate |

**3 Approval Points**: research_plan, budget_threshold, source_quality

---

## Design Decisions Documented

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Observer mode | Passive | No pipeline blocking |
| Persistence | Filesystem | Zero deps, portable |
| Timeout behavior | Configurable | Explicit consent required |
| Approval inbox | File-based | Auditable, async |
| Audit logging | JSON file | All decisions recorded |

---

## Test Outline

| Module | Tests | Focus |
|--------|:-----:|-------|
| Observer | 10+ | Metrics collection, alerts, persistence |
| Approval | 8+ | Flow, gate integration, audit |
| **Total** | **18+** | |

---

## Integration Points

- Observer hooks into `Orchestrator.executePlan()`
- ApprovalGate integrates with existing `GateRegistry`
- Both modules follow Phase 1 patterns

---

## Estimated Size

- Source: ~850 lines
- Tests: ~600 lines
- Total: ~1450 lines

---

*Completed by Jarvis (B) — 2026-07-17*
