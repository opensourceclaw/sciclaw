# Ack: claw-obs v2.5.0 适配 — MetricsCollector port（完成，基线全绿）

**Status**: completed —— **71/71 files / 900 passed / 0 failed**（848 + 恢复 52）；typecheck **0**；build **0**
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent)
**Date**: 2026-09-21 ｜ **任务文件**: `inbox/inbox-code/task-clawobs-port-metricscollector.md`（Peter 裁定 b）

---

## 交付物

**单文件 port**：`src/observe/MetricsCollector.ts`（112 → 164 行）——删除 `import { EventBus, TokenCounter } from "claw-obs"`，替换为两个**模块私有**轻量实现（不导出、不扩公共面）：

1. `MetricsEventBus`（~15 行，on/emit）——`emit` 调用点 5 处逐字保留（search_complete / extraction_complete / gate_check ×2 / metrics_flush）；`enableEvents` 门控语义不变。
2. `TokenUsageCounter`（~25 行，record/totals/reset）——`totals` 形状 `{prompt, completion, total, calls}` 与 reset 语义与旧 TokenCounter 逐项对齐（测试：16000/3/清零全过）。

## ★ 裁定依据（两面均无 v2.5 等价物，逐条实测）

claw-obs v2.5.0 实测导出面（`openclaw_plugin/index.ts`）：`AlertEngine` / `MetricsAggregator` / `registerTools` / `__resetForTests` + 类型；src/ = `alerting/` + `metrics/`（aggregator, behavior, constants）+ `obs/anomaly/`。

- **EventBus（事件面）**：v2.5 无通用 pub/sub 面——`AlertEngine.evaluate(metric, value)` / `evaluateBehavior()` 是**规则评估**（规则由宿主 add、产出 AlertEvent），与 deepclaw 的内部消费信号管道语义不同；且原 `eventBus` 字段为 **private、外部不可订阅**（写入即终端的 plumbing），映射到告警引擎反而会新增语义。→ 按任务书降级为内部轻量 emitter。
- **TokenCounter（计数面）**：`MetricsAggregator.collect/aggregate` 是**窗口 min/max/avg 聚合**（无 sum 与 calls 计数语义），token 总量映射进 min/max/avg 字面错误。→ 按任务书降级为内部逐语义重实现。
- 附带观察（未处理，供裁）：port 后本仓 src 已零 `claw-obs` 导入，package.json 该依赖项现为孤立条目——摘除与否不在本任务红线内，请裁。

## 波及面（实测结论：零随动）

public API 零变化 → `src/stages/validate.ts`、`src/orchestrator/research-state-machine.ts`、`src/monitoring/*`、`tests/observe/MetricsCollector.test.ts` **均零改动**；断言语义零改动（原测试逐条通过）。

## 验证（亲跑）

- `npm test`：**71 files passed / 900 passed / 0 failed**，exit 0——原 7 个红文件全部转绿（52 条测试恢复），其余零削弱
- `npm run typecheck`：**0**（原 15 错消失 13——claw-obs 内部源经 symlink 传导的类型错随断链一并根除）
- `npm run build`：**0**；dist/observe/MetricsCollector.js 已反映新实现

## 红线核对

未动 claw-obs 仓任何文件 ✓；零新增运行时依赖 ✓；修复后基线全绿 ✓；未 commit（收口归你）。

— Jarvis (CodeAgent)
