# Task: DeepClaw v3.9.0 Phase 2 — Acceptance Test

**From**: Friday (A)
**To**: Edith (Tester)
**Date**: 2026-07-27
**Priority**: P1
**Version**: v3.9.0 Phase 2
**PipelineId**: deepclaw-v3.9.0-phase2

---

## 背景

Phase 2 实现研究专用质量门禁（Research Quality Gates）。

**Jarvis 已完成**:
- 4 个 Research Gates
- ResearchGateRegistry
- 39 个新测试

---

## 验收标准

### 1. 构建测试

- [ ] `npm run build` 通过
- [ ] `npm run typecheck` 通过

### 2. 单元测试

- [ ] 全部测试通过
- [ ] 新增测试 ≥ 39 个
- [ ] 无回归

### 3. 功能验收

#### 3.1 SourceCredibilityGate
- [ ] 文件存在: `src/gate/research/source-credibility-gate.ts`
- [ ] `check(context)` 方法存在
- [ ] 阈值: 0.7
- [ ] Stage: search

#### 3.2 CrossValidationGate
- [ ] 文件存在: `src/gate/research/cross-validation-gate.ts`
- [ ] `check(context)` 方法存在
- [ ] 阈值: 0.8
- [ ] Stage: synthesize

#### 3.3 BiasDetectionGate
- [ ] 文件存在: `src/gate/research/bias-detection-gate.ts`
- [ ] `check(context)` 方法存在
- [ ] 阈值: 0.3 (lower is better)
- [ ] Stage: validate

#### 3.4 CitationIntegrityGate
- [ ] 文件存在: `src/gate/research/citation-integrity-gate.ts`
- [ ] `check(context)` 方法存在
- [ ] 阈值: 0.95
- [ ] Stage: report

#### 3.5 ResearchGateRegistry
- [ ] 文件存在: `src/gate/research/research-gate-registry.ts`
- [ ] `register(gate)` 方法存在
- [ ] `get(name)` 方法存在
- [ ] `getByStage(stage)` 方法存在
- [ ] `runAll(context)` 方法存在
- [ ] `runForStage(stage, context)` 方法存在
- [ ] 默认注册 4 个 Gates

### 4. Gate 测试

| Gate | 测试文件 | 测试数 |
|------|----------|:------:|
| SourceCredibilityGate | tests/gate/research/SourceCredibilityGate.test.ts | 8 |
| CrossValidationGate | tests/gate/research/CrossValidationGate.test.ts | 8 |
| BiasDetectionGate | tests/gate/research/BiasDetectionGate.test.ts | 8 |
| CitationIntegrityGate | tests/gate/research/CitationIntegrityGate.test.ts | 8 |
| ResearchGateRegistry | tests/gate/research/ResearchGateRegistry.test.ts | 7 |

---

## 测试统计

| 指标 | 目标 | 实际 |
|------|:----:|:----:|
| Test Files | 67+ | ? |
| Tests Passed | 870+ | ? |
| New Tests | 39+ | ? |

---

## 验收结论

**评分**: ?/10

**状态**: PASS / FAIL

---

## 项目位置

`/Users/liantian/workspace/osprojects/deepclaw`

---

*Task created by Friday (A) — 2026-07-27*
