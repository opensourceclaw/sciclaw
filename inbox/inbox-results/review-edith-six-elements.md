# Review: SciClaw 六要素（Edith / TestAgent 视角）— 主评②「核心价值」

**From**: Edith (TestAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21
**总纲**: `inbox/inbox-govern/review-six-elements-brief-20260921.md` ｜ **对象**: `docs/plans/sciclaw-v4.0.0-plan.md` + main `7e4e33b`
**红线遵守**: 只读评审；仅跑测试与 flow 实测；**零代码改动**（探针脚本全部落在 `/tmp`，仓库未改一行——`git status` 干净）
**一句话结论**: 六要素的**叙事**基本成立，但要素②的**证据**今天不成立——`research you can verify` 在 v4.0.0 上**无法被证明**：用户可见主链是占位实现、benchmark 不测真实产出（实测 0/12 pass、citation 恒 0）、900 用例覆盖的是周边 API 的代码正确而非价值正确。

---

## 一、六要素逐项（同意 / 修正 + 理由）

| # | 要素 | 判定 | 理由（证据） |
|:-:|------|:----:|------|
| ① | 定位与目标用户 | **同意**（措辞需限定） | 定位"verifiable deep research for AI4S / 家族独立成员"清晰且与 DevClaw 无依赖，方向我认同。**但**面向"科研人员/博士生"的用户价值承诺今天无法兑现（见②）：一个不检索、不出引文、不跑门禁的 CLI，对科研用户是负资产。建议 v4.0.0 定位句暂留**愿景态**，能力态由 GA 验收套件背书后再对外强化 |
| ② | 核心价值 | **修正** | 计划称"可验证研究：Source Validation / RevisitingVerifier / gate 门禁 / 证据链输出"。**实测：四个构件在用户路径上全部缺席或空转**（详见第二节）。`RevisitingVerifier` 在 `src/` 中**不存在**（grep 零命中）；`core/tools/web_search.ts` 自述 "For now, return mock results"；CLI `research` 的 gate 结果为 `[]`。**叙事要保留，但必须标注为 not-yet-proven，并给出证明计划** |
| ③ | 功能范围 | **修正** | 计划称"research → synthesis → report **主链完整**"——**不成立**。主链的**接口**完整、**实现**是占位：`DeepResearchFlow.search/analyze/synthesize/report` 与 `AutoResearchFlow` 全部返回硬编码文本；`SearchAgent` 自述返回 "simulated search content"。真实检索**已实现且可用**（`core/search/index.ts` 实拉 DuckDuckGo，实测 1.4s / 5 条真结果），但**未被主链接线**。准确表述应为："主链骨架完整，真实检索/综合尚未接线" |
| ④ | 差异化 | **修正** | "过程可信"作为**叙事**有辨识度；作为**产品特性**今天不可演示、不可量化（无 benchmark 报告、无 gate 溯源输出、无引文可见面）。在 AutoResearchFlow 未完成的前提下，"过程可信"是本仓**唯一**可防守的抓手——所以它必须优先被做成**可演示的硬特性**，而不是等 v5.0.0。否则与成熟 Deep Research 产品相比，差异化停留在 slogan |
| ⑤ | 商业模式 | **同意** | 开源框架（Apache-2.0）+ 方法论/案例/服务反哺，无独立收费面——与 USER.md 事业定位一致，TestAgent 侧无需修正。**一处提醒**：反哺事业的三类资产（方法论、案例、服务背书）全部需要**可出示的产出物**（基准报告、案例库、gate 溯源样例）——恰是本期最缺的 |
| ⑥ | 节奏与里程碑 | **修正** | v4.0.0 = 整合里程碑（改名 / core 并入 / 900 全绿）判定**公允**，我不反对发布。但**"v4.0.0-ga"的定义不能隐含"能力交付"**：GA 判据必须落在可验收的证据上（第二节 3 给出 G1–G8 建议 + S/M/L）。另注：`README.md:12` badge 写 `Tests-1140+`，实测 **900**；`src/index.ts:6` `VERSION='3.7.0'`（包为 4.0.0）——里程碑文案的证据面需先自洽 |

---

## 二、主评②「research you can verify」今天能不能被证明？——**不能**

### 2.1 端到端 research flow 实测（小型题目：CRISPR base editing efficiency）

**用户路径**（CLI 默认 `--mode deep`，`node dist/cli/index.js research …`）——**跑通，但零真实研究**：

```
Plan: depth-first strategy, 3 sub-queries
Found 3 result sets
Analysis: 0 claims, confidence 0.75
Synthesis: 3 insights
Report: 4 sections, 2 references
```

程序化探针取回的实际载荷（同一 flow 对象）：

| 环节 | 实测值 | 溯源 |
|---|---|---|
| 检索来源 | `https://example.com/1` `"Relevant content found..."`；`/2` | `deep_research_flow.ts:189-190` |
| 分析 | `claimsCount: 0`，`confidence: 0.75`（常量） | `deep_research_flow.ts:220` |
| 综合 | `["Key insight 1","Key insight 2","Key insight 3"]` | `deep_research_flow.ts:237` |
| 报告 | refs `["https://example.com/ref1","https://example.com/ref2"]`；正文 `"..."` | `deep_research_flow.ts:262` |
| **门禁** | **`GATE RESULTS: []`（一条都没跑）** | 主链只 `start/plan/search/analyze/synthesize/report`，从不调 `initStateMachine/transition`；`runValidate()` 仅测试调用 |
| auto 模式 | 同样占位（`example.com/1`、空 blindSpots） | `auto_research_flow.ts:103,118,125` |

**关键对照（独立实测）**：真实检索**是存在且可用的** —— 我把 dist 拷到 `/tmp` 后直接调 `core/search`，**1.4s 返回 5 条 DuckDuckGo 真结果**（如 `pmc.ncbi.nlm.nih.gov/articles/PMC13109818/` 的 CRISPR base editing 综述）。So 结论不是"做不到"，而是**"做到了但没接上"**：真实能力与用户可见主链之间**断线**。

另外三层 mock 叠加，说明这不是孤例而是系统性占位：
- `src/core/tools/web_search.ts:37-39` — "For now, return mock results"（与真实 `core/search` 重复且冲突）
- `src/agents/search_agent.ts:34-37` — `example.com/result-N` + `"simulated search content"`
- `src/research/search.ts:44-47,73` — 真实检索 catch 后**静默回退** mock（失败不可观测）
- `sciclaw pipeline verify`（唯一跑 InternalVerifyGate 的门禁入口）——提交体**全部硬编码**：`typeCheck:{passed:true}` / `build:{passed:true}` / `tests:{total:0,...}` (`src/cli/commands/verify.ts:47-53`)。规则真、**输入假** → 该门禁今天是橡皮图章。

**门禁能力本身存在**（`src/gate/research/*` 四门 + `stages/validate.ts` + `ResearchStateMachine`），且有 5 个单测文件覆盖——**但没有一条挂在用户可见路径上**。

### 2.2 benchmark 面（`src/benchmark`）现状：**测什么？——测的是任务元数据，不是研究产出**

实现级证据（`src/benchmark/runner.ts:97-101`）：`computeScores(task, _orchestrationResult)` **丢弃编排结果**，把常量喂给所有指标：

```ts
const factuality  = computeFactuality([], task.input.expectedFacts);      // verified 恒空
const completeness= computeCompleteness([], 4, task.input.expectedSources, task.input.minSections); // sources 恒空、sections 恒 4
const citation    = computeCitationQuality([]);                          // 恒 0
const reasoning   = computeReasoningDepth(0, 0);                         // 恒 0
```

**实测（把 dist 拷到 /tmp、仅修 ESM 扩展名、不改逻辑）**：12 个任务全部执行 → **passed 0 / passRate 0**；`citation ≡ 0`、`reasoning ≡ 0` 全线成立；overall 平均 0.123：

| 任务 | overall | citation | reasoning |
|---|:--:|:--:|:--:|
| citation_apa / _mla / _chicago | 0.20 | **0** | **0** |
| factuality_* (3) | 0.04–0.08 | **0** | **0** |
| completeness_* (2) | 0.16 | **0** | **0** |
| reasoning_* (2) | 0.08 | **0** | **0** |
| multi_agent_* (2) | 0.10 | **0** | **0** |

**所以 benchmark 现状：**
1. **不支撑"可验证"叙事**——`citation`（最贴近"verifiable"的指标）**结构性恒 0**：即使实现变成真研究，也不会升高，因为入参是字面量 `[]`。任何引用 benchmark 的对外说法都会是**未测背书**。
2. **无入口**：`package.json` scripts 无 benchmark，`src/cli` 无 benchmark 命令 → benchmark 只有库面，**没有任何用户/CI 能跑到它**；仓库内也**无基准报告产物**（无 `benchmark-results.json`）。
3. **报告版本陈旧**：`runner.ts:139` 硬编码 `version: "2.0.0-rc.3"`——与 4.0.0 脱节。
4. **构建产物根本跑不起来**：`node -e "import('./dist/index.js')"` → `ERR_UNSUPPORTED_DIR_IMPORT`（`dist/core/llm/index.js:24` 由 `src/core/llm/index.ts:54` 的 `import "./providers"` 无扩展名而来；`main` 就是 `dist/index.js`）。**tsc 绿、`npm run build` 绿、CI 绿，而包入口运行时加载失败**——构建面"绿"不含任何 smoke test。
5. **缺口定位**：缺 (a) 编排结果接线、(b) 真实任务集（当前 12 条全为自造元数据、无黄金答案/无来源清单）、(c) 入口与产物、(d) 构建冒烟。

### 2.3 900 用例覆盖的是"代码正确"还是"价值正确"？——**代码正确（且只覆盖了周边）**

- 实测 `NODE_OPTIONS=… vitest run` → **71 files / 900 passed**，与计划一致 ✅（README badge 的 1140+ 为**超额声明**）。
- 覆盖率（`coverage/coverage-final.json` 实算 197 文件）：**语句 54.0% / 分支 43.4% / 函数 58.0%**。
- **证据链基质几乎零覆盖**：`core/tools/web_search.ts` **0%**、`core/validation/factcheck_service.ts` **0%**、`citation_tracker.ts` **0%**、`citation_formatter.ts` **0%**、`core/model/router.ts` **0%**、`parallel_extraction.ts` **0%**、`report_formatter.ts` **0%**；`source_scorer.ts` 6%、`authority_scorer.ts` 7%。**即：真正会产出"可验证证据"的模块，测试一条不碰。**
- **唯一触及真实 research 入口的测试是失效的**：`tests/research/index.test.ts:5-15` `vi.mock` 的目标 `src/search` / `src/extractor` / `src/llm` **在 core 合并后已不存在**（三个目录均 MISSING）→ mock 不生效/无意义；且断言只看 `topic/id/summary/sections instanceof Array`——**零证据断言**（不断言来源真实、引文可溯、门禁通过）。
- **无构建产物测试**：`grep -rln "dist/" tests` = 空 → `main` 入口坏掉无人发现。
- 结论：**900 绿 = 周边 API 的代码正确性；"价值正确"（研究结论可信、来源可溯、门禁有效）今日零覆盖**。这不是测试数量问题，是**测试对象问题**。

### 2.4 GA 需要的"验收级"用例（当前完全没有的一类）

今天 900 用例里**没有一条**是"研究任务验收"。GA 需要新增**端到端研究验收套件**（建议 G1，见下）：以固定题目 + 黄金答案/来源白名单为输入，断言**证据链**而非形状——(i) 每条来源 URL 可解析且非 `example.com`；(ii) 每条 claim 至少 1 条引文且引文指向在场来源；(iii) 4 门 gate 结果随报告输出且失败即阻断；(iv) verifier 结论（支持/反驳/证据不足）随报告输出；(v) 报告引用来源可回溯到原始检索结果。

---

## 三、v4.0.0-ga 门槛建议（可验收判据 + 工作量档位）

> 档位：**S** ≤ 0.5 人日 ｜ **M** 1–3 人日 ｜ **L** > 3 人日

| # | 可验收判据（Pass/Fail 可判定） | 档 | 备注 |
|:-:|---|:--:|---|
| **G1** | **端到端研究验收套件 ≥5 题全绿**：离线 deterministic fixture 模式（默认，CI 稳）+ 可选 nightly 真网模式。断言 2.4 的五项证据链 | **M** | GA 的**核心判据**；无此项不建议宣称 GA |
| **G2** | **真实路径成为默认**：CLI `research` 走 `core/search` + LLM 综合；mock 收进 `--mock`/test 专用；`WebSearchTool` 与 `core/search` 二者收敛为一 | **M** | 能力已存在（实测 1.4s），纯接线 + 清理 |
| **G3** | **benchmark 真接线并出报告**：`computeScores` 消费编排结果、删除字面量；`version` 取 `package.json`；新增 `npm run benchmark`；**基准报告入库**（`benchmark-results.json`）+ CI 非回归门（passRate 不得低于基线） | **M** | 现在 0/12 pass + citation 恒 0；做完才算"有量化背书" |
| **G4** | **构建产物冒烟进 CI**：`node -e "import('./dist/index.js')"` + `dist/cli/index.js --version` 必须成功；修复 NodeNext 无扩展名导入 | **S** | 已实测 `main` 入口加载失败而 CI 全绿 |
| **G5** | **验证门禁输入真实化**：`pipeline verify` 的 `InternalVerifyGate` 提交体由真实 `typecheck/test/build` 产物生成（或明确标注 dev-only 并退出 GA 叙事） | **S** | 现为硬编码 `passed:true`，橡皮图章 |
| **G6** | **证据链用户可见**：报告内嵌「来源清单（解析后的规范 URL + 访问时间）+ 每条 claim 引文 + gate/verifier 结论块」；配 golden-output 快照测试 | **S–M** | 这是"research you can verify"的**对外兑现面** |
| **G7** | **一致性清账**：README badge 改真实值（900）；`src/index.ts:6` VERSION→4.0.0；ROADMAP.md（C1）重写；plugin/manifest 版本位互等；SKILL.md python-era 块（C5）清除 | **S** | 可达性事实，非能力项 |
| **G8** | **证据基质覆盖率下限**：`core/search/*`、`core/validation/*`、`core/tools/{web_search,content_extraction}` 语句覆盖 ≥60% 且含**真实断言**（非仅 import 不抛） | **M** | 当前这些模块 0–7% |

**GA 一句话判据建议**：*G1 全绿 + G3 基准报告入库 + G4/G5 门禁真实化 + G6 证据链用户可见*——四者同时成立，才可对外称 "verifiable"。

---

## 四、明确**不进** GA（建议）

| # | 项 | 理由 / 去向 |
|:-:|---|---|
| N1 | **AutoResearchFlow 转正**（含 hypothesis/experiment/learning/personalization 次级面） | 计划已定 v5.0.0；GA 前保持 "🔄 Evolving" **且不作为卖点**。GA 只保证 DeepResearchFlow 单链证据面成立 |
| N2 | **运行期契约迁移** `~/.deepclaw` → `~/.sciclaw`（C3） | 与"可验证"无关，走 v4.1 专项 + 兼容读取一版 |
| N3 | **observe/monitoring 双 MetricsCollector 收敛**（C4） | 内部整洁度，v4.1 |
| N4 | **docs 历史区归档策略**（C8）/ 99 个 docs 文件品牌串核对（C6） | 可 post-GA；G7 只收"用户第一屏可见"的最小集（README/SKILL/ROADMAP/版本位） |
| N5 | **`api/server.ts` REST 面**（0% 覆盖） | 除非进入 G1 验收路径，否则不进 GA；否则会把未测面纳入承诺 |
| N6 | **CI 中的真网/真 LLM 端到端** | 昂贵且 flaky → 只做 nightly 可选（G1 的 live 模式），CI 主链走 fixture |
| N7 | **对外宣称 "verifiable"** | 在 G1/G3/G6 未完成前，**不进**任何 release notes / README 卖点区——这是本次评审我最坚持的一条 |

---

## 五、角色专属发现（TestAgent 侧，≤5 条）

1. **【HIGHEST】benchmark 是空转的量化面**：`runner.ts:97-101` 丢弃编排结果、喂字面量；实测 12 题 **0 pass / citation ≡ 0 / reasoning ≡ 0**、`version` 仍是 `2.0.0-rc.3`、无入口无产物。**它现在不能为"可验证"提供任何背书**，任何引用它的说法都是未测声明。
2. **【HIGH】用户可见主链是占位，且门禁不挂载**：CLI `research` 三个 sub-query、`example.com` 来源、常量 confidence、`"..."` 正文、`GATE RESULTS: []`。而**真实检索实测可用**（1.4s / 5 真结果）——修复是**接线**而非研发。
3. **【HIGH】门禁语义被架空**：`pipeline verify` 的九个校验规则面对**硬编码 `passed:true`/`total:0`** 输入，永远通过；同时 `GATE RESULTS: []` 说明研究门禁根本不在主链上。"gate 门禁"作为核心价值构件目前是**装饰**。
4. **【HIGH】构建产物坏而 CI 绿**：`main = dist/index.js` 运行时 `ERR_UNSUPPORTED_DIR_IMPORT`（NodeNext 无扩展名导入）；`npm run build` 绿、CI 只跑 build、无任何 dist smoke test → **假绿**。`VERSION='3.7.0'`、README badge `1140+`（实测 900）同属"证据面自相矛盾"。
5. **【MEDIUM】测试的价值错配可量化**：900 绿但证据基质 0–7%；唯一 research 入口测试 mock 了**三个已不存在的模块**（core 合并遗留）且只断言形状。**测试规模在涨，印证力没涨**——建议 GA 前把"验收级用例"与"单元用例"分账统计。

---

## 六、给 Friday 汇总稿的落地建议（一段话）

六要素里，①⑤ 可原样进计划；③④⑥ 需按本回执**降级措辞**（"骨架完整"而非"主链完整"、"叙事待证"而非"已差异化"）；②必须从"价值陈述"改写为"**待证命题 + 证明计划**"，并把本回执第三节的 G1/G3/G4/G6 定为 GA 的硬门槛、N7（未证不宣称）写成红线。**v4.0.0 作为整合里程碑照发无碍**；"v4.0.0-ga"若要撑起 "verifiable"，则 benchmark 接线（G3）与端到端验收套件（G1）不可省略——这两项的工程量是 **M 级、能力已具备**，投入产出比在本期清单里最高。

---

### 附带观察（不计入上述 5 条，供 C 清单参考）

`.gitignore` **未排除 `node_modules/` 与 `dist/`**，实测 `git ls-files node_modules` 有大量被跟踪条目，其中 `node_modules/@sciclaw/core` 是**指向已删除仓库 `deepclaw-core` 的悬空符号链接**（`120000` 模式 → `../../../deepclaw-core`）。本次评审跑测试即触发该条目与 `.vite` 缓存进出工作区——**依赖目录入库会让"仓库干净"永远不可判定**，并使 build/test 的副作用污染 diff。建议并入 C 清单（与 C2 `docs/archive/test-foo` 同类），P1。

— Edith (TestAgent) ｜ 2026-09-21
