# Ack: deepclaw-core 并入 sciclaw `src/core/`（完成，全绿）

**Status**: completed —— **71/71 files / 900 passed / 0 failed**；typecheck **0**；build **0**；`@deepclaw/core`/`@sciclaw/core` 全仓 **0**（历史豁免区外）
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent)
**Date**: 2026-09-21 ｜ **任务文件**: `inbox/inbox-code/task-core-merge-src-core.md`（Peter 裁定 2）

---

## 交付物

1. **目录并入（裁定：相对路径 import）**：core 源 **60 个 .ts** 全量入 `src/core/`（结构原样：cache/extractor/llm/model/nlp/search/tools/types/validation + index/config）。import 形式 = 相对路径（如 `../core/index.js`）——理由：本仓 tsconfig **NodeNext** + 测试从 src 直跑 + **零配置**（`#/core` 需 package.json imports 映射且与 src 直跑有边界，`@/` paths 别名无 runtime 支持，均弃）。
2. **依赖摘除**：package.json 删 `@sciclaw/core`；双锁条目清除（含 npm 标记的 `extraneous` 残留 `../deepclaw-core` 条目手工清）；`node_modules/@sciclaw/core` 符号链接删除（git 已记 D）。
3. **类型面收敛**：`src/index.ts` `export * from "./core/index.js"`（原 `export * from '@sciclaw/core'`）——core 全量导出并入主仓面；`main`/`types` 字段未动，零破坏（typecheck 0 实证）。
4. **core 自有测试**：原 core 仓 `tests/` **为空集**（vitest.config 在位、零用例）——无测试可迁，特此声明。

## ★ 实现期发现（三项，超出「纯移动」字面的必要改动，请追认）

- **a. experimentalDecorators（tsconfig 面）**：core `llm/providers/*` 用**旧式类装饰器** `@registerLLMProvider(...)`（`base.ts:361` 返回类型 `ClassDecorator`——legacy 语义）；core/主仓 tsconfig 均无此 flag——**tsc（5.9 原生装饰器支持）能过，但 esbuild/vitest 解析即崩**（`SyntaxError: Invalid or unexpected token`，逐模块定位实证）。处置：deepclaw tsconfig 增 `"experimentalDecorators": true`（主仓既有代码零装饰器 → 零发射变化；与 core 的 ClassDecorator 意图一致）。
- **b. 可选 Redis 驱动**：`cache/distributed.ts` 动态 `import("ioredis")`/`import("redis")`（try/catch 链，缺装时 `connect()` 返回 false——运行时已兜底）→ 缺模块致 TS2307。处置：新增 ambient 声明 `src/core/cache/optional-redis.d.ts`（**core 源零改动**，仅声明面）。
- **c. 目录索引 import 重写**：22 处 extensionless import 加 `.js`（NodeNext 强制）；其中 `llm/index.ts` 的 `"./providers"` 属**目录导入**——NodeNext 无目录解析，须写 `"./providers/index.js"`（常规 `./providers.js` 不成立）。
- **d. 品牌随并清理**：core 源内 `DeepClaw`/`AutoClaw`/`@deepclaw` ~14 处 → 清零（含 **`DeepClawConfig` → `SciClawConfig`** 类型改名——本仓消费引用实测为零；UA 串 `DeepClaw/2.0、3.0` → `SciClaw`；index.ts 头改为 sciclaw core 沿革说明）。`CORE_VERSION = '1.0.0'` 保留原值。

## 未迁入项（声明）

core 仓 src/ 内混存的**陈旧产物 60 .js + 61 .d.ts + 60 .d.ts.map 未迁**（纯源树原则；产物由本仓 dist 重建承接）。deepclaw-core 仓本身**零改动**（git 保持 `af20ea0` 单 commit 干净）。

## 验证（亲跑）

- `npm test`：**71 files / 900 passed / 0 failed**，exit 0（与 T1 后基线逐数持平，零削弱）
- `npm run typecheck`：**0**；`npm run build`：**0**；dist 820 文件（含新 `dist/core/` 60 js）
- 品牌普查：`@deepclaw/core`/`@sciclaw/core` 在 src/tests/package.json/tsconfig/dist = **0**；`DeepClaw|AutoClaw` 在 `src/core/` = **0**
- 逐文件对照：`diff -r`（原 core/src vs src/core，排除产物）仅含拟改动（import 重写 + 品牌清理），**core 逻辑零改动**实证

## 时序交互（T1/T2）

claw-obs port（T1）与 core 并入（T2）import 面零交叠，无冲突；合并后全绿以 T1 后基线为准 ✓。

## 红线核对

core 源逻辑零改动（diff 实证）✓；测试断言语义零改动（900=900）✓；deepclaw-core 仓零改动 ✓；未 commit（收口归你）——建议 dist 清洁与并入可拆 commit。

— Jarvis (CodeAgent)
