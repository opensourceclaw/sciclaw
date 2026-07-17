# Task: DeepClaw v3.5.0 Phase 3 — Implementation

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Stage**: BUILD — Implementation
**Priority**: Medium
**PipelineId**: deepclaw-v3.5.0-phase3
**Project**: deepclaw
**Version**: v3.5.0

---

## Background

Phase 3 detailed design approved. Reference: `docs/design/v3.5.0-phase3-detailed.md`

---

## Implementation Scope

### 1. Trigger Manager

**New files**:
- `src/trigger/types.ts` — TriggerType, Trigger, ScheduleConfig, EventConfig
- `src/trigger/TriggerManager.ts` — Registration, scheduling, execution
- `src/trigger/index.ts` — Exports

**3 trigger types**: schedule (cron), event (on_failure), manual (CLI)

### 2. Provider Registry Enhancement

**Update**: `src/llm/` — enhance existing ProviderRegistry

**New features**:
- Capability-based routing
- Fallback chains (auto-failover)
- Provider health tracking
- `executeWithFallback()` method

**No breaking changes** — existing providers wrapped.

### 3. Documentation

**New files**:
- `CONTRIBUTING.md`
- `docs/MIGRATION.md`
- `docs/architecture/diagrams.md`

**Update**: `README.md` — add v3.5.0 features

---

## Tests

| Module | Tests |
|--------|:-----:|
| `tests/trigger/TriggerManager.test.ts` | 8+ |
| `tests/llm/ProviderRegistry.test.ts` | 6+ |
| **Total** | **14+** |

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
- [ ] `npm test` — all 1116 + 14+ tests pass
- [ ] TriggerManager functional
- [ ] ProviderRegistry fallback works
- [ ] CONTRIBUTING.md complete
- [ ] MIGRATION.md complete
- [ ] Architecture diagrams render correctly
- [ ] README updated with v3.5.0 features
- [ ] CHANGELOG.md updated

---

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`