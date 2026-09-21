# Ack: GA-A3 benchmark 真接线 + 基准报告入库（完成）

**Status**: completed —— computeScores 消费真实流水线产物；**3/3 passed / avg 0.769 实跑入库**；913/913、typecheck 0、build 0
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent)
**Date**: 2026-09-21 ｜ **任务文件**: `inbox/inbox-code/task-ga-line-a-wiring.md`（A 线第 4 项）

---

## 交付

1. **computeScores 真实消费（根因修复）**：旧实现 `computeScores(task, _result /* 未用 */)` 恒喂空数组/0 → 结构性零分（Edith G3 实证「0/12 pass、citation 恒 0」）。新实现：runner 以**真实 DeepResearchFlow**（A2 已接 core/search）跑任务，收集 **执行束**——`extractClaims` 逐条对真实 snippet 抽 claim（18-33 条/任务）→ `verifyClaim` 对证据语料（**注意：FactCheckService 以内容文本为参照，非 URL**——实测在案）核验 → 报告 references 入 citations。四维打分全部改吃真实数据。
2. **version 取 package.json**：`buildReport` 改用 `reporter.generateReport(results, packageVersion())`（URL 相对读 `../../package.json`，src/dist 双态正确）；报告 `version: "4.0.0"` 实测。
3. **`npm run benchmark`**：新入口 `src/benchmark/run.ts`（dist/benchmark/run.js），内置 3 任务（factuality/completeness/citation 三面）真实跑全链并写 `benchmark-results.json`（仓库根，入库件）。
4. **基准报告入库（实跑产物）**：
   ```
   PASS factuality-quantum: 0.822   PASS completeness-photosynthesis: 0.822   PASS citation-energy-storage: 0.662
   Benchmark: 3/3 passed (avg overall 0.769)
   ```
   明细真值：facts 1.0 / completeness 1.0 / **citation 0.2**（citation 形状仅 url 可核——qualityScore/sourceId 面属 A4 证据链增强）/ reasoning 0.82；durationMs 2-3s（检索缓存命中）、claims 18-33、sources 2（references 面待 A4）。

## 观测（供裁定）

- **agents 层失去唯一生产消费者**：旧 runner 走 `agents/orchestrator`（实测其 SearchAgent 输出恒 `example.com` 仿真内容），新 runner 直连真实 flows → agents 模块自此仅剩公共导出面（barrel）。归入死面决策书（C3）候选，本次未动。
- **CI 非回归门**（计划 A3 行提及）未做：需 fixture 版基准（与 A1 离线基建共用）；本项先交实跑基线，门禁待 A1 落地后接。
- `benchmark-results.json` 每次 `npm run benchmark` 覆盖重写（时间戳+真值）。

## 验证

- 新增 2 用例：真实产物打分（factuality>0、claimCount>0、sourceCount>0——防结构性零回归）+ 报告 version == package.json；既有 25 用例（含 fixture 注入）全过。
- 全量 **73 files / 913 passed / 0 failed**；typecheck 0；build 0；`npm run benchmark` 实跑 3/3。

## commit 面

`src/benchmark/runner.ts`（重写）+ `src/benchmark/run.ts`(新) + `src/core/index.ts`（barrel 补 extractClaims/ClaimExtractor 两导出）+ `package.json`（benchmark script）+ `tests/benchmark/runner.test.ts` + `benchmark-results.json`(新)。未 commit（收口归你）。

— Jarvis (CodeAgent)
