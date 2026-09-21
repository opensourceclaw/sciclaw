# Ack: GA-A2 真实路径接主链（完成 —— 先行回执，不攒）

**Status**: completed —— **72 files / 905 passed / 0 failed**（900 + 5 新增）；typecheck **0**；build **0**；**真/ mock 双模式实跑冒烟通过**
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent)
**Date**: 2026-09-21 ｜ **任务文件**: `inbox/inbox-code/task-ga-line-a-wiring.md`（A 线第 1 项）

---

## 交付明细（任务书四项）

1. **CLI research 主链 → core/search（实测）**：两个 flow 的 search() 内联伪造（`example.com` 占位）**全删**，改经共享接线模块 `src/flows/wiring.ts` 走 core/search；synth 依配置走 core LLM。**实跑**：`node dist/cli/index.js research "quantum computing breakthroughs"` → `Found 15 results across 3 queries` → `Synthesis (extractive): 5 insights` → `Report: 4 sections` → `Progress: 100%`（真实检索，全链跑通）。
2. **mock 收进 `--mock`/test 专用**：CLI 新增 `--mock`（启动打印 `MOCK MODE — synthetic, labeled…`）；合成结果标注 `source: "mock"` + 保留域 `mock.invalid`（**弃 example.com**）；离线测试经 `registerSearchSource` 注入 fixture（`tests/helpers/fixture-search.ts`，零网络）。
3. **二收一**：`src/core/tools/web_search.ts`（纯 mock 桩，零真实消费者）**删除** + tools barrel 导出移除 → core/search 成为唯一检索引擎。
4. **research/search.ts 静默回退 → 可观测**：`ResearchSearchEngine` 增 `{ allowMock }`（默认 false）——失败**显式抛错**（含 cause）；仅显式 allowMock 时产 mock（标注同上）。

## ★ 实现期发现（两处，均属必修，请追认）

- **a. `registerSearchSource` 注入点被击穿（契约级 bug）**：`core/search/index.ts` 的 `ensureCoordinator()` **每次调用都重注册内置源**，把运行时注入的 fixture **覆盖回真函数**——公开注入 API（v3.0.3 引入，Edith A1 规格依赖它）此前实际不可用（实测：注册后调用即失效）。修复 = 内置源仅首次注册。**Edith 验收设计请以此修复后行为为准**。
- **b. A5 根因提前命中（重要）**：除 `from` 形式外，还有 **6 处副作用目录导入**（`import "./providers"`、`import "./deepseek"` 等，无 `from` 故此前扫描漏网）——dist 运行时 **`ERR_UNSUPPORTED_DIR_IMPORT`、CLI 从未能运行**（与 Edith G4 完全吻合）。已修 6 处 → 实跑通过。**该修复建议归入 A5 commit 面**（A5 剩余：CI 冒烟步骤，按序进行）。

## 设计裁定（请追认）

- **LLM 综合 = 有配置走 LLM、无配置走确定性 extractive**：`DEEPCLAW_LLM_PROVIDER/API_KEY` 或 flow config 显式给定时用 LLMEngine（**调用失败显式上抛，不静默降级**）；未配置（含干净机器）→ 来源派生的 extractive 综合（只转述实测 snippet，零发明），并标注 `synthesisMode: "extractive"`。依据：GA 判据 2「干净机器 clone→build→research 三步通过」要求无 key 可跑；「测量≠判定」要求综合出处透明。
- **失败语义**：core/search 对源失败返回空集（引擎契约，coordinator 层已记 metric）；flow 层**不造数**（空集 → 综合显式说 "No search results were collected…"）。

## 波及与交接

- `analyze()` / `report()` 仍为占位（confidence 0.75 / blindSpots 固定 / references 未接证据链）——**属 A4 范围**（gate+verifier 结论块、claim 引文、golden 快照），本回执标记交接，不在 A2 面内擅动。
- 新增测试：flows +3（实路径映射 / 失败不造数 / mock 标签）+ research/search +2（显式抛错 / 标注）；fixture helper 新增。
- **commit 面建议**：A2 = `src/flows/wiring.ts`(新) + `flows/deep_research_flow.ts` + `flows/auto_research_flow.ts` + `research/search.ts` + `core/search/index.ts`(注入修复) + `cli/index.ts` + `tests/**`(3 文件+helper) − `core/tools/web_search.ts`（删）；A5 面 = `core/llm/index.ts` + `core/llm/providers/index.ts`。dist 重建随收口。

## 红线核对

900+ 不削弱（**905/905**）✓；测试零网络（fixture 注入）✓；「测量≠判定」/不发明黄金答案 ✓；未 commit（收口归你）。

— Jarvis (CodeAgent)
