# Report: v4.0.0-ga A1 验收设计 + A8 覆盖率基线 + T7 清单（交付）

**Status**: ✅ completed（A1 规格可投 Jarvis 实现；A8 基线已实测；T7 清单已草案化）
**From**: Edith (TestAgent)
**To**: Friday (ArchitectAgent)
**Date**: 2026-09-21
**任务**: `inbox/inbox-test/task-ga-acceptance-edith.md`（Peter 10:04 批准）｜ **上游**: `docs/plans/sciclaw-v4.0.0-ga-plan.md` §二 A线 / §三 判据六条

---

## 一、交付物

| # | 交付 | 位置 |
|:-:|------|------|
| A1 | **验收套件规格书 v1.0**（7 题：6 正 + 1 负；E0–E5 六条可执行断言；fixture/live 判定矩阵；pass/fail 单一裁决规则；附录 Z 实现边界） | `inbox/inbox-test/ga-acceptance-suite-spec.md` |
| A8 | **覆盖率基线 + GA 下限 + 最小用例集**（规格书 A8 节） | 同上 §A8 |
| T7 | **GA 终验清单**（六判据 → 可执行 checklist，含 T7-0 N7 红线否决项） | 同上 §T7 |

**派发说明（需你确认）**：按三权分立，TestAgent 不向 CodeAgent 派发实现任务——**规格书已就绪，请你（ArchitectAgent）转为 inbox-code 任务书投 Jarvis**。若你希望我另行落一份任务书草稿供你签转，请指示。

---

## 二、A1 关键设计决策（三条硬约束 → 落法）

1. **黄金答案真实可溯（P1）**：7 题全部**逐题实跑权威源**（HTTP 状态 + 逐字/数值命中），证据以表格写进规格书 §A1.2：

| 题 | 源 | HTTP | 命中 |
|:--:|---|:--:|---|
| T1 光速 | `physics.nist.gov/cuu/Constants/Table/allascii.txt` | 200 | `299 792 458 (exact) m s^-1` |
| T2 CRISPR 碱基编辑 | `pmc.ncbi.nlm.nih.gov/articles/PMC13109818/` | 200 | `Base Editing`×64 / `Adenine`×52 / `Cytidine`×10 |
| T3 AES | `csrc.nist.gov/pubs/fips/197/final` | 200 | `128`×12 / `192`×5 / `256`×5 |
| T4 地球半径 | `nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html` | 200 | `6378.137` / `6356.752` |
| T5 CO₂ | `gml.noaa.gov/ccgg/trends/` | 200 | `427.55`（**故强制 as-of**） |
| T6 Nobel 2023 | `api.nobelprize.org/2.1/nobelPrize/med/2023` | 200 | `Karikó` / `Weissman` |

　→ 明令：**抓取失败或缺 `capture.json`（url/httpStatus/capturedAt/contentSha256）的题不得进套件**——直接封堵"自造元数据"复发。

2. **断言证据链而非形状（P2）**：E1 来源真实性 / E2 引文覆盖 / **E3 门禁在场且 fail-closed** / E4 verifier 结论（**负例假阳性 = 严重 FAIL**）/ E5 引文可回溯（fixture 下哈希互等）/ E0 确定性（两次跑逐字节相同）。全部给了可执行表达式，非"toBeDefined"式断言。

3. **离线 deterministic 为主（P3）**：已核实证据链构件**全为确定性**——`ClaimExtractor` 正则、`FactCheckService` 文本重叠+数字比对（无网络无 LLM）、4 门 gate 纯打分、`ReportGenerator` 已有 sources 渲染。故 **fixture 模式可全链路确定性，CI 零网络**；真网/真 LLM 仅 nightly 且不阻断 GA。注入点用**既有** `registerSearchSource()`（`core/search/index.ts:154`），**无需为测试改产品分支**。

**能力前提已被我复现**：真实检索 1.4s / 5 条真结果（直调 `core/search`）——所以 A1 是"接上已有能力 + 补证据断言"，不是从零研发（M 档判断成立）。

---

## 三、A8 覆盖率基线（实测，`coverage-final.json` 197 文件实算）

| 树 | 语句 | 分支 | 函数 | 0% 文件 |
|---|:--:|:--:|:--:|:--:|
| `core/search` | **32.3%** | 22.1% | 22.3% | 1/8 |
| `core/validation` | **8.0%** | **0.0%** | 3.7% | 4/9 |
| `core/tools` | **30.6%** | 18.1% | 22.5% | 4/12 |

**建议 GA 下限**（待你裁定）：A8-a 三树语句 ≥60%；A8-b **证据路径零 0% 文件**（factcheck_service / citation_tracker / citation_formatter / claim_extractor / source_scorer / authority_scorer / parallel_extraction / report_formatter）；A8-c 真实断言规则（禁 import-only 充数）；A8-d 纯声明文件排除。规格书 §A8.3 给出**逐模块最小用例集**（含 `factcheck_service` 的 overlap 0.3 边界与 NUMERIC 支持/反证分支、`search` 全源失败 ⇒ `[]` 等）。

> 注：`core/tools/web_search.ts`（0%）与 A2「二收一」相冲——**若 A2 决定移除该 mock，其 0% 自动消失**；A8-a 的分母需在 A2 收敛后再冻结一次，否则下限会被一个待删文件稀释。

---

## 四、需你裁定的三点 + 一条合并建议

1. **A8 下限与分母冻结时机**：建议 A2 收敛后再冻结（见上）。
2. **A1 依赖关系**：fixture 模式**不依赖** A2（可立即落地并进 CI 阻断）；live 模式依赖 A2 完成。建议 **fixture 先落地**，live 后接——请确认此序。
3. **T7 否决项**：T7-0（N7 红线）与 T7-1 设为 VETO；其余未过退回 owner。请确认终验裁决权重。
4. **【合并建议，省一个 M】**：计划 **D2（benchmark 真实语料 3–5 题，黄金答案/来源白名单）与 A1 语料高度同构**。建议**只做一份语料**：A1 的 7 题 fixture 同时作为 A3/D2 benchmark 的真实任务集（benchmark 读同一 `tests/fixtures/ga/`），避免两套黄金答案漂移。**可省 D2 的独立工作量（M 档）并消除"A3 报告与 A1 套件互不一致"的风险**。

---

## 五、附带发现（建议并入 A1 实现范围，低成本高收益）

1. **`tests/research/index.test.ts` 是失效测试**：`vi.mock` 目标 `src/search` / `src/extractor` / `src/llm` 三个目录**在 core 合并后已不存在**（均 MISSING），mock 不生效；断言仅 `topic/id/summary instanceof Array`（零证据断言）。建议 A1 落地时**删除并以其为 `test:ga` 的替代注记**，或改为 fixture 模式真断言——否则它会给"研究模块已测"的假信心。
2. **`coverage` 中 `core/llm/engine.ts` 0%**、`core/model/router.ts` 0%：LLM 路由面（真实综合路径必经）无覆盖，建议纳入 A2 的接线验收（不扩大 A8 分母，但 live 模式会踩到）。

---

## 六、红线遵守

只读评审 + 允许跑测试/flow：本次仅**读取源码与覆盖率产物**、**实跑 curl 验证权威源**、**跑 vitest（900 绿）复算覆盖**；**零产品代码改动**（`git status` 除本交付物外干净；跑测试产生的 tracked `node_modules` 副作用已回滚）。

— Edith (TestAgent) ｜ 2026-09-21
