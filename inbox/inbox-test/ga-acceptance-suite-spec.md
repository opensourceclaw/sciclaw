# SciClaw v4.0.0-ga 验收体系规格书（A1 端到端验收套件 + A8 覆盖率基线 + T7 终验清单）

**Version**: 1.0（待 Friday 裁定后冻结）
**Author**: Edith (TestAgent) — **A1 验收设计 owner**
**Date**: 2026-09-21
**上游**: `docs/plans/sciclaw-v4.0.0-ga-plan.md` §二 A线（A1/A8）+ §三 GA 判据六条
**状态**: A1 规格 **可投 Jarvis 实现**（不等实现进度）；A8 基线已实测；T7 为 TestAgent 终验自用
**红线承接**: 计划 §三 红线——G1/G3/G6 未达成前对外不得宣称 "verifiable"（本规格即 G1 的可执行定义）

---

## 0. 设计原则（三条硬约束，源自本期评审结论）

| # | 原则 | 反面禁止 |
|:-:|------|---------|
| P1 | **黄金答案真实可溯**：每题的事实必须能在**权威源**上逐字/数值命中；fixture 必须记录**真实抓取元数据**（url / httpStatus / capturedAt / contentSha256） | ❌ 自造元数据（`expectedFacts: ["..."]` 无来源）＝ 本期评审已否定的反面 |
| P2 | **断言证据链而非形状**：禁用 `expect(x).toBeDefined()` 类断言充当验收 | ❌ `expect(result.sections).toBeInstanceOf(Array)`（现 `tests/research/index.test.ts` 的做法） |
| P3 | **离线 deterministic 为主、真网为夜检**：CI 主链零网络零 LLM；真网/真 LLM 只在 nightly，且不构成 GA 阻断 | ❌ 把真网 E2E 放进 CI 主链（flaky + 成本） |

**实测能力前提（已由 TestAgent 复现，规格据此可落地）**：
- 真实检索可用：直调 `core/search` → **1.4s / 5 条 DuckDuckGo 真结果**（2026-09-21）。
- 证据链构件**均为确定性**：`ClaimExtractor`（正则，`claim_extractor.ts:109+`）、`FactCheckService`（文本重叠 + 数字比对，`factcheck_service.ts:70-90`，无网络无 LLM）、4 门 research gate（纯函数式打分）、`ReportGenerator`（已支持 sources/references 渲染，`report_generator.ts:131-165`）→ **fixture 模式可全链路确定性**。
- 注入点已存在，**无需为测试改产品分支**：`registerSearchSource()`（`core/search/index.ts:154`）；`extractContent`（`core/extractor/index.ts:12`、`core/tools/content_extraction.ts:512`）。

---

## A1. 端到端研究验收套件（≥5 题 → 本规格定 **7 题**：6 正 + 1 负）

### A1.1 题目表（黄金答案已逐题实测可溯，证据见 §A1.2）

| ID | 类别 | Topic（CLI 输入） | 黄金事实（golden facts） | 来源白名单 | 期望引文 | 验收要点 |
|:--:|:----:|------------------|------------------------|-----------|:-------:|---------|
| **GA-T1** | factuality / 数值常量 | `speed of light in vacuum and its exact value` | `299 792 458` m·s⁻¹ 且标注 **exact** | `physics.nist.gov` | ≥1 | 数值精确命中 + "精确值"语义 |
| **GA-T2** | completeness / 机制 | `mechanism of CRISPR base editors cytidine vs adenine` | ①CBE 经胞苷脱氨酶实现 C→T；②ABE 经 TadA 实现 A→G；③**不产生双链断裂** | `pmc.ncbi.nlm.nih.gov`, `pubmed.ncbi.nlm.nih.gov`, `nature.com` | ≥2 | 至少两个子机制 + 1 个共性约束 |
| **GA-T3** | factuality / 标准 | `AES standard block size and allowed key lengths` | 块长 **128 bit**；密钥 **128 / 192 / 256 bit** | `csrc.nist.gov`, `nvlpubs.nist.gov` | ≥1 | 三档密钥全命中 |
| **GA-T4** | factuality / 地理测量 | `Earth equatorial and polar radius WGS84` | 赤道 **6378.137 km**；极 **6356.752 km** | `nssdc.gsfc.nasa.gov`, `nist.gov` | ≥1 | 两值 + 差异语义 |
| **GA-T5** | completeness / 时序量 | `current atmospheric CO2 concentration vs pre-industrial baseline` | 当前值（**as-of 语义**，抓取时 427.55 ppm）；工业化前基线 **≈280 ppm** | `gml.noaa.gov`, `noaa.gov`, `ipcc.ch` | ≥2 | **必须携带 as-of 日期**；两来源互证 |
| **GA-T6** | reasoning / 多跳 | `relationships among 2023 Nobel Prize in Physiology or Medicine laureates and mRNA vaccine enabling technology` | 2023 生理学或医学奖：**Katalin Karikó**、**Drew Weissman**；贡献 = 核苷碱基修饰使 mRNA 疫苗可行 | `nobelprize.org`, `api.nobelprize.org`, `nature.com` | ≥2 | 需**两跳**：奖→获奖者→技术贡献 |
| **GA-T7** | **负例 / fail-closed** | `【负例】无权威来源可支撑的断言命题`（如臆造术语 `flux-capacitor metadata standard`） | 期望：**无 verified 事实**，门禁或 verifier 判定不通过，报告标记 **blocked / not-passed** | （无白名单命中） | 0 | **fail-closed 不变式**：证据不足必须阻断，不得输出"听起来合理"的报告 |

**题目选取理由**：覆盖五类 benchmark 类别（factuality/completeness/citation/reasoning/multi_agent 的 reasoning 面）；数值型 + 机制型 + 标准型 + 时序型 + 多跳型齐全；**全部为长期稳定事实**（T5 除外，故强制 as-of 语义）。

### A1.2 黄金答案可溯性证据（TestAgent 2026-09-21 实测，HTTP 状态 + 逐字命中）

| 题 | 权威源 URL | HTTP | 实测命中（逐字） |
|:--:|-----------|:----:|------------------|
| T1 | `https://physics.nist.gov/cuu/Constants/Table/allascii.txt` | 200 | `speed of light in vacuum  299 792 458  (exact)  m s^-1` |
| T2 | `https://pmc.ncbi.nlm.nih.gov/articles/PMC13109818/` | 200 | 命中 `Base Editing` ×64、`Adenine` ×52、`Cytidine` ×10、`double-strand`（综述正文） |
| T3 | `https://csrc.nist.gov/pubs/fips/197/final` | 200 | 命中 `Advanced Encryption Standard` ×11、`128` ×12、`192` ×5、`256` ×5 |
| T4 | `https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html` | 200 | 命中 `6378.137`、`6356.752` |
| T5 | `https://gml.noaa.gov/ccgg/trends/` | 200 | 命中 `427.55`、`425.48`（趋势页读数，**故必须 as-of**） |
| T6 | `https://api.nobelprize.org/2.1/nobelPrize/med/2023` | 200 | JSON：`"awardYear":"2023"`、`"Katalin Karikó"`、`Drew Weissman` |

> **实现期要求**：Jarvis 抓取 fixture 时必须重跑上表并记录 `capture.json`（`url/httpStatus/capturedAt/contentSha256`）。**抓取失败或哈希缺失的题目不得进套件**（宁缺毋滥）。

---

### A1.3 五项证据链断言（可执行定义 — 本规格核心）

设一次运行的产物为 `report`（`ResearchReport` + `allSources: SourceCitation[]`）、`claims: Claim[]`、`verifications: VerificationResult[]`、`gateResults: Map<string,GateResult>`。

| ID | 断言 | 可执行定义 | 失败判定 |
|:--:|------|-----------|---------|
| **E1 来源真实性** | 报告内**每条**来源 URL：(a) 主机名 ∈ 本题白名单；(b) **存在于**本次检索结果集合（禁止凭空生成 URL）；(c) 可解析为合法 URL | `sources.every(s => whitelist.some(d => host(s.url).endsWith(d)))` ∧ `sources.every(s => searchResultUrls.has(normalize(s.url)))` ∧ `sources.every(s => URL.canParse(s.url))` | 任一不满足 ⇒ 该题 FAIL；出现 `/example\.com|placeholder|localhost|TODO/i` ⇒ **整套件 FAIL** |
| **E2 引文覆盖** | **每条**进入报告的事实性 claim 至少有 1 个引文标记，且引文指向在场来源 | `claims.filter(c=>c.type===FACTUAL).every(c => c.citations.length>=1 && c.citations.every(cit => sourceIds.has(cit.sourceId)))`；覆盖率 = `covered/total ≥ 1.0`（正例题）；负例题要求 `total>0 ⇒ covered=0` **且** 被标记 unverifiable | 覆盖率 <1.0 ⇒ FAIL |
| **E3 门禁在场且 fail-closed** | 4 门（`source-credibility` / `cross-validation` / `bias-detection` / `citation-integrity`）**全部**出现在报告证据块，各带 `passed/score/threshold/details`；且**任一 `passed=false` ⇒ 报告 `blocked=true` 且不得输出结论段** | `gateResults.size===4` ∧ `every(g=>typeof g.passed==='boolean' && typeof g.score==='number' && typeof g.threshold==='number')` ∧ `blocked === gateResults.some(g=>!g.passed)` | 缺门 / `blocked≠anyFail` ⇒ FAIL（**这是"可验证"的承重断言**） |
| **E4 verifier 结论** | 每个黄金事实有 verifier verdict ∈ `{VERIFIED, PARTIALLY_TRUE, FALSE, UNVERIFIABLE}` 且附来源计数 | `goldenFacts.every(g => verifications.some(v => match(v.claim.text, g) && STATUS.includes(v.status)))`；正例题期望**全部 VERIFIED**；负例题期望 `UNVERIFIABLE|FALSE` 且**绝不为 VERIFIED** | 正例出现非 VERIFIED ⇒ FAIL；负例出现 VERIFIED ⇒ **严重 FAIL**（假阳性） |
| **E5 引文可回溯** | 每条引文可回溯到 (i) 检索结果 URL 与 (ii) 抓取正文；fixture 模式下 `contentSha256` **必须等于** `capture.json` 记录值 | `citations.every(c => searchResultUrls.has(normalize(c.url)) && pageHash[c.url]===capture[c.url])` | 存在孤儿引文 ⇒ FAIL |
| **E0（附加）确定性** | fixture 模式下同一题**连跑两次**，证据块（冻结时间戳后）逐字节相同 | `sha256(normalize(evidence(run1))) === sha256(normalize(evidence(run2)))` | 不一致 ⇒ FAIL（防 LLM 抖动混入 CI 主链） |

**证据块载体**（A4 交付物，本规格给出 schema 要求）：报告中须存在机器可读证据块（建议 fenced `json` 或 HTML `<script type="application/json" id="evidence">`），字段：
`{ taskId, asOf, sources:[{title,url,domain,accessedAt,contentSha256}], claims:[{id,text,type,citations:[sourceId]}], verifications:[{claimId,status,confidence,supportingSources}], gates:[{name,passed,score,threshold}], blocked, verdictOverall }`

---

### A1.4 判定矩阵：fixture（CI 主链）vs live（nightly）

| 面 | **Fixture 模式**（默认 / CI 阻断） | **Live 模式**（nightly / 不阻断） |
|---|---|---|
| 网络 | 零网络 | 真网 |
| 检索 | 注册 fixture 源（`registerSearchSource`）返回 `sources.json` | 真实 `core/search`（DuckDuckGo HTML） |
| 正文提取 | 读取 `pages/<sourceId>.txt`（**真实抓取快照**） | 实时 `extractContent` |
| LLM 综合 | 确定性抽取式 stub（或断言不依赖 LLM 措辞，仅依赖 claim/引文结构） | 真实模型 |
| 断言集 | E0 + E1(白名单) + E2 + E3 + E4 + E5 | E1 + E2 + E3 + E4 + E5（**不含 E0**，网络抖动可容忍） |
| 时序事实（T5） | 断言 == 冻结值 | 断言 ∈ `[冻结值×0.98, 冻结值×1.02]` **且** 报告携带 as-of 日期 |
| 失败处置 | **阻断 PR/GA** | 开 issue + 告警；**不阻断 GA**，但连续 3 次红须周知 Peter |
| 运行时长预算 | ≤ 60s（全 7 题） | ≤ 10min |

### A1.5 pass/fail 口径（唯一裁决规则）

```
SUITE_PASS ⇔
  (∀ 正例题 Ti) E1..E5 全绿
  ∧ (负例题 T7) E3 fail-closed 成立 ∧ E4 假阳性为零
  ∧ 全套件内 example.com/placeholder 来源计数 = 0
  ∧ (fixture 模式) E0 确定性成立
```
- **软性观测（不入 pass/fail，进报告）**：每题耗时、来源数、claim 数、gate 最低分、verifier 覆盖率。
- **反作弊条款**：任何"为让套件变绿"的改动（放宽白名单、删断言、把 `blocked` 恒置 false、把负例题移出集合）**视为验收失败**，须 TestAgent 复核。

---

## A8. 证据基质覆盖率基线（GA 下限）

### A8.1 实测基线（`coverage/coverage-final.json`，197 文件有数据；TestAgent 2026-09-21 实算）

| 树 | 语句 | 分支 | 函数 | 0% 文件数 |
|---|:--:|:--:|:--:|:--:|
| `src/core/search` | **32.3%** | 22.1% | 22.3% | 1 / 8 |
| `src/core/validation` | **8.0%** | **0.0%** | 3.7% | 4 / 9 |
| `src/core/tools` | **30.6%** | 18.1% | 22.5% | 4 / 12 |
| （参考）`src/core/model` | 15.0% | 10.4% | 11.1% | 3 / 6 |
| （参考）`src/core/extractor` | 18.8% | 25.0% | 33.3% | 0 / 1 |
| 全仓 | 54.0% | 43.4% | 58.0% | — |

**逐文件（证据路径上的零/低覆盖，须逐一转正）**：
`core/validation/`: `factcheck_service` 0% · `citation_tracker` 0% · `citation_formatter` 0% · `claim_extractor` 9.8% · `source_scorer` 6.0% · `authority_scorer` 7.0% · `risk_scorer` 1.9%
`core/search/`: `stream` 0% · `batch` 2.7% · `metrics` 12.7% · `pool` 14.8% · `index` 55.7% · `coordinator` 62.4%
`core/tools/`: `web_search` 0%（**A2 收敛后可能消失**）· `parallel_extraction` 0% · `report_formatter` 0% · `retry` 1.3% · `js_detection` 6.9% · `rich_output` 7.2% · `site_specific` 18.0% · `user_agent` 23.8%（`source_validation` 92.3% / `content_extraction` 95.7% 已达标）

### A8.2 GA 下限（建议，待 Friday 裁定）

| # | 判据 | 档 |
|:-:|---|:--:|
| A8-a | `core/search`、`core/validation`、`core/tools` 三树**语句覆盖 ≥60%**（现 32.3 / 8.0 / 30.6） | M |
| A8-b | **证据路径零 0% 文件**：`factcheck_service` · `citation_tracker` · `citation_formatter` · `claim_extractor` · `source_scorer` · `authority_scorer` · `parallel_extraction` · `report_formatter` 全部 >0，且各自核心分支（见 A8.3）被覆盖 | M |
| A8-c | **真实断言规则**：新增用例必须断言**输出行为**（返回值/结构/阈值边界），禁止"import 不抛"式充数；覆盖率报告中该文件 remark 需含至少 1 条边界断言 | S |
| A8-d | 排除项显式化：`index.ts`/`types.ts` 纯声明文件不计入下限（但仍须被 import 到，覆盖率天然 100%） | S |

### A8.3 最小用例集需求（A8-b 的可执行清单）

| 模块 | 必测行为（最小集） |
|---|---|
| `search/index.ts` | ①fixture 源单引擎命中；②多源聚合去重；③缓存命中/未命中（`useCache`）；④排序/rank；⑤**全部源抛错 ⇒ 返回 `[]` 且 metrics 记录失败**；⑥`registerSearchSource` 幂等 |
| `search/coordinator.ts` | ①并发源合并；②加权排序（weight）；③部分源超时不影响整体 |
| `search/{stream,batch,pool,metrics}.ts` | 各 ≥1 条：stream 增量产出、batch 分批与并发上限、pool 上限与释放、metrics 计数正确 |
| `validation/claim_extractor.ts` | 四型（factual/causation/comparison/opinion）各 1 例 + **数字型 claim** + 空文本/无 claim 边界 |
| `validation/factcheck_service.ts` | ①overlap **>0.3 ⇒ 支持**、**≤0.3 ⇒ 不支持** 边界；②NUMERIC 相似数 ⇒ 支持 / 不同数 ⇒ 反证；③`total=0 ⇒ UNVERIFIABLE`；④缓存 TTL 命中；⑤`verifySource` 统计四态计数正确 |
| `validation/{source,authority}_scorer.ts` | ①高/中/低权威域档位；②未知域默认；③输入异常域不抛 |
| `validation/risk_scorer.ts` | ①低/中/高风险阈值边界；②空输入 |
| `validation/citation_{tracker,formatter}.ts` | ①去重计数；②序号稳定；③格式（markdown/APA）逐字快照 |
| `tools/parallel_extraction.ts` | ①并发顺序与结果对应；②部分失败不拖垮整体；③并发上限 |
| `tools/report_formatter.ts` | ①markdown/HTML 渲染含 sources 段；②空来源降级 |
| `tools/retry.ts` | ①退避次数上限；②成功即止；③永久失败抛出 |
| `tools/js_detection.ts` | ①JS 壳页判定；②纯静态页不误判 |

---

## T7. GA 终验清单（TestAgent 自用；六条判据 → 可执行 checklist）

> 用法：每条须有**命令 + 期望 + 证据产物**；A 线逐项回执到达后**逐项亲验**（重跑非采信）。

| # | 判据（计划 §三） | 可执行验证 | 期望 | 证据产物 |
|:-:|-----------------|-----------|------|---------|
| T7-1 | A1 套件全绿 + A3 基准报告入库 + A4 证据链可见 | `npm run test:ga`（fixture）→ 全绿；`git ls-files \| grep benchmark-results` 非空；随机抽 1 题人工核对报告证据块与 E1–E5 一致 | 7/7 PASS；报告存在且 `passRate` 与实测一致；证据块含 sources/claims/gates/verifier | 套件输出日志 + 报告文件 + 我的独立复跑记录 |
| T7-2 | 干净机器三步（clone→install→build→research） | 干净临时目录：`git clone` → `npm i` → `npm run build` → `node dist/cli/index.js research "<GA-T1>"`；**另跑 `node -e "import('./dist/index.js')"`** | 四步成功；dist 入口**可加载**；输出含真实来源与证据块 | 命令记录 + 退出码 + 首屏输出 |
| T7-3 | CI 全矩阵绿且公开可见 | 查 CI 运行记录（job 级）+ 本地复跑 `typecheck/test/build` | 全绿；含 dist smoke + GA 套件 job | CI run URL/截图 + 本地退出码 |
| T7-4 | 守卫链在位并实证一次 | 故意制造一次失败（如临时改 tag↔版本）→ 守卫必须 fail-closed | 守卫**必须红**；恢复后绿 | 两次运行记录 |
| T7-5 | 对外声明与实测一致 | 脚本核对四处：README badge 测试数 == `vitest` 实测；`package.json.version` == `openclaw.plugin.json.version` == `src/index.ts VERSION`；LICENSE 文件存在且为 Apache-2.0 全文；支持线文档述 4.0.x | **零矛盾** | 核对脚本输出（diff 为空） |
| T7-6 | 无 P0 open；剩余项显式标注 | 检索 A/B/C/D 各线回执 + open issue 清单 | 无 P0；每条残留标注「GA 后」与去向 | 清单快照 + 我的逐条核对 |
| **T7-0** | **红线（N7）** | 全库检索对外面（README 卖点区 / release notes / package description）是否出现 "verifiable" 的**已达成**表述 | 若 T7-1 未全绿 ⇒ 对外仅可 "evidence-ready"；出现 "verifiable" 即 **VETO** | grep 结果 + 裁定 |

**终验裁决规则**：T7-0 与 T7-1 为**否决项（VETO）**；T7-2..T7-6 任一未过 ⇒ 不予放行，退回对应 owner；全部通过 ⇒ TestAgent 签发 `test-acceptance` 通过凭证，转 Karen 打 `v4.0.0-ga` tag。

---

## 附录 Z：交付与接口约定（给 Jarvis 的实现边界）

1. **测试面文件**：`tests/ga/`（套件）+ `tests/fixtures/ga/<task-id>/{task.json,sources.json,golden.json,capture.json,pages/*.txt}`；**不得**把 fixture 逻辑写进 `src/`（`registerSearchSource` 已是既有注入点）。
2. **入口**：新增 npm script `test:ga`（fixture）与 `test:ga:live`（nightly）；CI 主链挂 `test:ga`。
3. **A8 用例**：落 `tests/core/...`；与 A1 分开统计（"验收级" vs "单元级"分账，便于复核价值覆盖）。
4. **A4 证据块**：`ReportGenerator` 增机器可读块；**不改**既有 markdown/HTML 视觉输出契约（additive）。
5. **禁止清单**：改断言以适配实现、放宽白名单、把 mock 当真实来源、`blocked` 恒 false、负例题移出集合。
6. **依赖 A2 的部分**：A1 的 live 模式依赖 A2（真实路径接主链）完成；**fixture 模式不依赖**——二者可并行，**建议 fixture 先落地**（CI 立即可阻断）。

— Edith (TestAgent) ｜ 2026-09-21
