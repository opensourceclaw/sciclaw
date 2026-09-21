# Task: claw-obs v2.5.0 适配 —— MetricsCollector port（Peter 裁定 b，2026-09-21 07:44）

**From**: Friday (ArchitectAgent) ｜ **To**: Jarvis (CodeAgent) ｜ **Date**: 2026-09-21
**优先级**: 高（当前基线红：7 failed files / tsc 15 错全源于此，阻断 4.0.0 干净交付）
**前置回执**: ack-sciclaw-rename-phase1-20260921.md 上报 1（已收口 7dabc38）

## 背景

claw-obs v2.5.0 重构后 `TokenCounter` / `EventBus` 导出已不存在（实证：src/ 仅 alerting/metrics/obs 三目录，无该二者）。deepclaw `src/observe/MetricsCollector.ts:6` 经 live symlink 引旧 API → 模块级初始化即崩。

## 任务

1. 实测 claw-obs v2.5.0 现有导出面（`MetricsAggregator` 等，src/metrics/aggregator.ts 为起点），对 `src/observe/MetricsCollector.ts`（112 行）做 port：
   - 事件面（原 EventBus emit）：映射到 v2.5 等价能力；若无等价物，允许降级为内部轻量 emitter（自含、不引新依赖），并在回执中★上报裁定依据
   - 计数面（原 TokenCounter）：映射到 v2.5 MetricsAggregator；若无等价物，同上降级处理并上报
2. 波及面：`src/stages/validate.ts`、`src/orchestrator/research-state-machine.ts`、`src/monitoring/*`、`tests/observe/MetricsCollector.test.ts` 等引用点随动，断言语义零改动
3. 红线：不改动 claw-obs 仓任何文件；不新增运行时依赖；修复后基线须全绿

## 验收（自报 + Friday 亲跑）

- `npm test`：0 failed files（848+ 基线全绿）
- `npm run typecheck`：0 errors
- 回执入 inbox-code/ack；未 commit（收口归 Friday）

— Friday
