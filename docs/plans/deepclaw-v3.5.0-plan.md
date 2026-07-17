# DeepClaw v3.5.0 — Development Plan

**Planning Date**: 2026-07-17
**Planner**: Friday (A) · Jarvis (B)
**Based On**: v3.4.0 Assessment Results
**Target Score**: 8.5/10

---

## Executive Summary

This plan addresses the gaps identified in DeepClaw v3.4.0 assessment, targeting v3.5.0 release with improved AI-Native maturity and platform compliance.

### Current State (v3.4.0)

| Dimension | Score | v3.5.0 Target |
|-----------|:-----:|:-------------:|
| Architecture | 8.5/10 | 9.0/10 |
| Code Quality | 8.0/10 | 8.5/10 |
| AI-Native Maturity | 7.5/10 | 8.5/10 |
| Platform Standards | 7.0/10 | 8.5/10 |
| Documentation | 7.0/10 | 8.0/10 |

---

## Priority Actions

### P0 — Critical (Week 1-2)

#### 1. Gate Enforcement System

**Goal**: Prevent skipping critical verification stages

**Implementation**:
- Create `InternalVerifyGate` class
- 9 validation rules (6 failed + 3 warning)
- Gate registry for status tracking
- Integration with orchestrator

**Files to Create**:
```
src/gate/
├── GateRegistry.ts
├── gates/
│   ├── InternalVerifyGate.ts
│   └── index.ts
└── index.ts
```

**Acceptance Criteria**:
- [ ] Gate blocks on type check failure
- [ ] Gate blocks on test failure
- [ ] Gate blocks on regression
- [ ] 12+ unit tests

#### 2. Pipeline CLI

**Goal**: Enable command-line pipeline control

**Implementation**:
```bash
deepclaw pipeline start <topic>
deepclaw pipeline status
deepclaw pipeline approve <stage>
deepclaw pipeline verify
```

**Files to Create**:
```
src/cli/
├── pipeline.ts
├── commands/
│   ├── start.ts
│   ├── status.ts
│   ├── approve.ts
│   └── verify.ts
└── index.ts
```

**Acceptance Criteria**:
- [ ] CLI commands functional
- [ ] Pipeline state persisted
- [ ] Help documentation
- [ ] 8+ unit tests

---

### P1 — High Priority (Week 3-4)

#### 3. Chinese Character Removal

**Goal**: 100% English-only source code

**Affected Files**: 31 source files

**Approach**:
1. Scan all `.ts` files for Chinese characters
2. Translate comments to English
3. Use i18n for user-facing strings
4. Add CI check for Chinese detection

**Acceptance Criteria**:
- [ ] 0 Chinese characters in source
- [ ] CI check added
- [ ] All functionality preserved

#### 4. Monitoring Observer

**Goal**: Real-time metrics and alerting

**Implementation**:
```
src/monitoring/
├── Observer.ts
├── MetricsCollector.ts
├── AlertManager.ts
└── index.ts
```

**Metrics to Track**:
- Research duration
- Agent response time
- Cache hit rate
- Error rate
- Token usage

**Acceptance Criteria**:
- [ ] Metrics collected
- [ ] Alert thresholds configurable
- [ ] 10+ unit tests

---

### P2 — Medium Priority (Week 5-6)

#### 5. Human-in-the-Loop

**Goal**: Approval flow for critical decisions

**Implementation**:
```
src/approval/
├── ApprovalFlow.ts
├── ApprovalGate.ts
└── index.ts
```

**Features**:
- Research plan approval
- Budget threshold approval
- Manual override capability

**Acceptance Criteria**:
- [ ] Approval flow functional
- [ ] Audit logging
- [ ] 8+ unit tests

#### 6. Documentation Enhancement

**Goal**: Improve documentation score to 8.0/10

**Deliverables**:
- API documentation
- Architecture diagrams
- Contribution guidelines
- Migration guide from v3.4.0

---

## Timeline

| Phase | Duration | Deliverables |
|:-----:|:--------:|--------------|
| Phase 1 | Week 1-2 | Gate + Pipeline CLI + Chinese removal |
| Phase 2 | Week 3-4 | Monitoring + HitL |
| Phase 3 | Week 5-6 | DevClaw integration + Documentation |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes | Comprehensive test suite |
| Chinese translation errors | Native speaker review |
| Performance regression | Benchmark suite |
| Integration complexity | Phased rollout |

---

## Success Metrics

| Metric | Current | Target |
|--------|:-------:|:------:|
| Test count | 1039 | 1100+ |
| Chinese files | 31 | 0 |
| Gate coverage | 0% | 100% |
| CLI commands | 0 | 4+ |
| Monitoring | ❌ | ✅ |

---

## DevClaw Pattern Adoption

Patterns to adopt from DevClaw v7.0.0-rc.7:

1. **Gate System**: `InternalVerifyGate` with 9 rules
2. **Pipeline Coordinator**: Stage-based state machine
3. **Trigger Manager**: Event/threshold/schedule triggers
4. **Provider Abstraction**: Multi-provider support
5. **Monitoring Observer**: Metrics + alerts

---

*Plan created by Friday (A) · Jarvis (B) — 2026-07-17*
