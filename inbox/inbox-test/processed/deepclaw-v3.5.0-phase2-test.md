# Task: DeepClaw v3.5.0 Phase 2 — Test Acceptance

**From**: Friday (A)
**To**: Edith (C)
**Date**: 2026-07-17
**Stage**: TEST
**Priority**: High
**PipelineId**: deepclaw-v3.5.0-phase2
**Project**: deepclaw
**Version**: v3.5.0

---

## Background

Phase 2 implementation complete. Full pipeline status:

| Stage | SubStage | Result |
|-------|----------|:------:|
| PLAN | plan-draft | ✅ |
| DESIGN | detailed-design | ✅ |
| DESIGN | design-review | ✅ APPROVED |
| BUILD | implementation | ✅ |
| BUILD | code-review | ✅ APPROVED |
| BUILD | internal-verify | ✅ PASSED (1116/1116) |
| TEST | edith-acceptance | ⏳ Pending |

## What to Verify

### 1. Monitoring Observer (5 files)
- DeepClawObserver with lifecycle hooks
- 7 metrics: researchDurationMs, phaseDurationMs, agentResponseTimeMs, cacheHitRate, errorRate, sourceCount, tokenUsage
- 5 alert rules: high_error_rate, slow_response, low_cache_hit, token_budget_exceeded, zero_sources
- MetricsCollector with filesystem persistence
- 29 tests total

### 2. HitL Approval (4 files)
- ApprovalFlow state machine: pending → awaiting → approved/rejected/auto_*
- 3 approval points: research_plan, budget_threshold, source_quality
- Timeout ≠ approval (configurable)
- Audit logging to `~/.deepclaw/approval/audit.json`
- ApprovalGate integration with GateRegistry
- 19 tests total

## Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm test` — 1116/1116 all pass
- [ ] Observer hooks non-blocking (try-catch)
- [ ] Approval state machine correct
- [ ] Audit logging complete
- [ ] Gate integration works
- [ ] No regression from v3.4.0 (1039 tests)
- [ ] All Phase 2 SubStage docs present

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`