# Task: DeepClaw v3.9.0 Phase 3 — Acceptance Test

**From**: Friday (A)
**To**: Edith (Tester)
**Date**: 2026-07-27
**Priority**: P1
**Version**: v3.9.0 Phase 3
**PipelineId**: deepclaw-v3.9.0-phase3

---

## 背景

Phase 3 增强 Research Pipeline，实现 7 阶段流程和 Gate 集成。

**Jarvis 已完成**:
- ResearchStateMachine (7 阶段)
- OBSERVE 阶段
- VALIDATE 阶段
- DeepResearchFlow 集成
- 30 个新测试

---

## 验收标准

### 1. 构建测试

- [ ] `npm run build` 通过
- [ ] `npm run typecheck` 通过

### 2. 单元测试

- [ ] 全部测试通过
- [ ] 新增测试 ≥ 30 个
- [ ] 无回归

### 3. 功能验收

#### 3.1 ResearchStateMachine
- [ ] 文件存在: `src/orchestrator/research-state-machine.ts`
- [ ] 支持 7 阶段: observe, plan, search, extract, synthesize, validate, report
- [ ] `transition()` 方法存在
- [ ] `updateContext()` 方法存在
- [ ] `getStage()` 方法存在
- [ ] `getGateResults()` 方法存在
- [ ] Gate 集成

#### 3.2 OBSERVE Stage
- [ ] 文件存在: `src/stages/observe.ts`
- [ ] `observeStage(input)` 函数存在
- [ ] 返回 topic, questions, scope

#### 3.3 VALIDATE Stage
- [ ] 文件存在: `src/stages/validate.ts`
- [ ] `validateStage(context)` 函数存在
- [ ] 返回 isValid, biasReport, crossValidation, recommendations

#### 3.4 DeepResearchFlow Integration
- [ ] `initStateMachine()` 方法存在
- [ ] `runObserve(input)` 方法存在
- [ ] `runValidate()` 方法存在
- [ ] `getGateResults()` 方法存在

---

## 测试统计

| 指标 | 目标 | 实际 |
|------|:----:|:----:|
| Test Files | 71+ | ? |
| Tests Passed | 900+ | ? |
| New Tests | 30+ | ? |

---

## 验收结论

**评分**: ?/10

**状态**: PASS / FAIL

---

## 项目位置

`/Users/liantian/workspace/osprojects/deepclaw`

---

*Task created by Friday (A) — 2026-07-27*
