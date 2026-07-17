# Task: DeepClaw v3.5.0 Phase 1 — Gate + Pipeline CLI + Chinese Removal

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Priority**: High
**Version**: v3.5.0
**Stage**: BUILD

---

## Background

Based on v3.4.0 assessment (score 7.8/10), Phase 1 targets the three P0 gaps. Reference plan: `docs/plans/deepclaw-v3.5.0-plan.md`.

---

## Development Scope

### 1. Gate Enforcement System (P0)

**Goal**: Prevent skipping critical verification stages in the research pipeline.

**Implementation**:
```
src/gate/
├── GateRegistry.ts          # Gate status tracking
├── gates/
│   ├── InternalVerifyGate.ts # 9 validation rules
│   └── index.ts
└── index.ts
```

**InternalVerifyGate Rules** (modeled after DevClaw v7.0.0-rc.7):
- 6 Failed rules: type check failure, test failure, regression, build failure, missing deps, config error
- 3 Warning rules: coverage drop, perf degradation, deprecation usage

**Acceptance Criteria**:
- [ ] Gate blocks orchestrator on type check failure
- [ ] Gate blocks on test failure
- [ ] Gate blocks on regression
- [ ] Gate registry persists state
- [ ] Integration with existing orchestrator
- [ ] 12+ unit tests

### 2. Pipeline CLI (P0)

**Goal**: Enable command-line pipeline control for research workflows.

**Commands**:
```bash
deepclaw pipeline start <topic>
deepclaw pipeline status
deepclaw pipeline approve <stage>
deepclaw pipeline verify
```

**Implementation**:
```
src/cli/
├── pipeline.ts              # Pipeline CLI entry
├── commands/
│   ├── start.ts
│   ├── status.ts
│   ├── approve.ts
│   └── verify.ts
└── index.ts
```

**Pipeline Stages**: PLAN → SEARCH → SYNTHESIZE → WRITE → VERIFY

**Acceptance Criteria**:
- [ ] All 4 commands functional
- [ ] Pipeline state persisted to disk
- [ ] --help on each command
- [ ] 8+ unit tests

### 3. Chinese Character Removal (P1, but done in Phase 1)

**Goal**: 100% English-only source code.

**Affected**: 31 source files (20% of codebase)

**Approach**:
- Scan all `.ts` files under `src/` for Chinese characters
- Translate comments to English
- Move user-facing Chinese strings to i18n/en.json
- Add CI check script for Chinese detection

**Acceptance Criteria**:
- [ ] 0 Chinese characters in all `src/**/*.ts` files
- [ ] CI detection script in `scripts/check-chinese.sh`
- [ ] All existing 1039 tests still pass
- [ ] No functional changes

---

## Version Update

Update `package.json`: `3.4.0` → `3.5.0`

---

## ⚠️ Important Reminders

- ❌ **Do NOT create GitHub Release**
- ❌ **Do NOT push to remote**
- ✅ Commit to local branch only
- ✅ Run full test suite before completion
- ✅ Update CHANGELOG.md

---

## Acceptance Criteria (Overall)

- [ ] `npm run build` passes
- [ ] `npm test` — all 1039+ tests pass
- [ ] New tests: 20+ (Gate: 12+, CLI: 8+)
- [ ] 0 Chinese characters in `src/`
- [ ] `deepclaw pipeline --help` works
- [ ] CHANGELOG.md updated
- [ ] `git status` clean

---

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`