# Task: DeepClaw v3.9.0 Phase 1 — Acceptance Test

**From**: Friday (A)
**To**: Edith (Tester)
**Date**: 2026-07-27
**Priority**: P0
**Version**: v3.9.0 Phase 1
**PipelineId**: deepclaw-v3.9.0-phase1

---

## 背景

Phase 1 集成共享基础设施：claw-ctx 和 claw-obs。

**Jarvis 已完成**:
- ContextManager (claw-ctx 集成)
- MetricsCollector (claw-obs 集成)
- 23 个新测试

---

## 验收标准

### 1. 构建测试

- [ ] `npm run build` 通过
- [ ] `npm run typecheck` 通过

### 2. 单元测试

- [ ] 全部测试通过
- [ ] 新增测试 ≥ 23 个
- [ ] 无回归

### 3. 功能验收

#### 3.1 ContextManager

- [ ] 文件存在: `src/context/ContextManager.ts`
- [ ] 文件存在: `src/context/ResearchContext.ts`
- [ ] 正确导入 claw-ctx
- [ ] `optimize()` 方法存在
- [ ] `setModelProfile()` 方法存在
- [ ] `getContextWindow()` 方法存在
- [ ] `getCompressionThreshold()` 方法存在

#### 3.2 MetricsCollector

- [ ] 文件存在: `src/observe/MetricsCollector.ts`
- [ ] 文件存在: `src/observe/ResearchMetrics.ts`
- [ ] 正确导入 claw-obs
- [ ] `recordSearchLatency()` 方法存在
- [ ] `recordExtractionQuality()` 方法存在
- [ ] `recordGateResult()` 方法存在
- [ ] `recordTokenUsage()` 方法存在
- [ ] `getSnapshot()` 方法存在
- [ ] `flush()` 方法存在

#### 3.3 依赖

- [ ] `package.json` 包含 `claw-ctx`
- [ ] `package.json` 包含 `claw-obs`

### 4. 代码质量

- [ ] Apache License 头部存在
- [ ] 类型定义完整
- [ ] 无 TypeScript any 滥用

---

## 测试统计

| 指标 | 目标 | 实际 |
|------|:----:|:----:|
| Test Files | 62+ | ? |
| Tests Passed | 831+ | ? |
| New Tests | 23+ | ? |
| Duration | - | ? |

---

## 验收结论

**评分**: ?/10

**状态**: PASS / FAIL

**建议**: ?

---

## 项目位置

`/Users/liantian/workspace/osprojects/deepclaw`

---

## ⚠️ 重要提醒

- ✅ 独立验收，不接受 Friday/Jarvis 的结果
- ✅ 有最终否决权
- ✅ 完成后回复到 `inbox/inbox-friday/`

---

*Task created by Friday (A) — 2026-07-27*
