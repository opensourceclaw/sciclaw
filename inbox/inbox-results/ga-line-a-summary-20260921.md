# GA A 线汇总件（Friday 收口用）——接线与证据工程全六项 + 增量

**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21
**性质**: 9 份回执的收敛稿（索引 + 终值证据 + 待裁清单）；**未 commit，收口归 Friday**
**明细回执**: `inbox/inbox-code/ack/ack-ga-line-a-{A1..A6}*.md` + `ack-ga-a1-signoff-and-increments` + `ack-{sciclaw-rename-phase1, core-merge-src-core, clawobs-port-metricscollector}`

---

## 一、一句话状态

A 线（A1–A6 + 签转增量）**全项完成**；CLI 主链真实可用（检索→claims→verifier→四门→证据块），验收套件 fixture 26/26 已进 CI 阻断；终值 **946 passed | 4 skipped，typecheck 0，build 0**；**4 枚待裁 + 2 项建议**见第四节。

## 二、交付矩阵（每项含独立 commit 面，详见各 ack）

| 项 | 核心交付 | 实录证据 | 回执 |
|---|---|---|---|
| **A2** | 真路径接线（`flows/wiring.ts`）；mock 显式化（`--mock`/mock.invalid）；web_search 桩删除；注入点契约修复 | 实跑 `15 results / 3 queries` 全链 100%；synthesis 带 `synthesisMode` | ack-ga-line-a-A2 |
| **A5** | 6 处目录导入修复；CI dist import + `--version` 冒烟 | 修复前 `ERR_UNSUPPORTED_DIR_IMPORT`（CLI 从未能运行）；修复后实跑通过 | ack-ga-line-a-A5 |
| **A6** | verify 提交体真实化（真跑 typecheck/build/test + 真基线 + 实扫） | 实录 typeCheck/build/tests 911 + quality（中文 1 文件、缺头 142 如实报） | ack-ga-line-a-A6 |
| **A3** | benchmark 消费真实编排（claims/verifier/report）；version 取 package | **3/3 passed，avg 0.769 入库**（`benchmark-results.json`） | ack-ga-line-a-A3 |
| **A1** | 5 题 fixture 套件（T1/T2/T5/T6 正 + T7 负）；E0-E5 + golden 快照；`test:ga` 进 CI；`test:ga:live` 变体 | **26/26 绿（CI 阻断）**；live 4/4 结构不变量；fixture 全部现场真抓（contentSha256 在案） | ack-ga-line-a-A1 |
| **A4** | 报告内嵌 `EvidenceBlock`；fail-closed（门失败→结论撤除）；CLI 可见 | CLI live 实录：`11 sources, 35 claims, 35 verdicts` + `BLOCKED` | ack-ga-line-a-A4 |
| **增量** | 删失效 `tests/research/index.test.ts`（-4）；`llm/engine`+`model/router` 单测（+10） | 946 = 939 - 4 + 10 (+1) | ack-ga-a1-signoff-and-increments |

## 三、终值证据（一条命令可复验）

```
npm test        → Test Files 75 passed | 1 skipped；Tests 946 passed | 4 skipped
npm run test:ga → 26/26 passed（fixture，零网络）
npm run typecheck → 0        npm run build → 0
npm run benchmark → 3/3 passed (avg overall 0.769) → benchmark-results.json
```

## 四、待裁清单（编号化，便于逐条勾销）

| # | 事项 | 归属 | 依据 |
|---|---|---|---|
| **R1** | **bias-detection 校准**：三因子（域多样性/confirmation/temporal）对白名单策展源结构性不入 0.3 门槛 → fixture 正例与 live 实跑**均被拦**；fail-closed 行为正确但"通过态不可达"。我方未动门禁（反作弊） | Edith（口径） | ack-A1 ★节 |
| **R2** | **core/search DDG 重定向解包**（`//duckduckgo.com/l/?uddg=`）——live 模式域名判定受影响 | Friday 裁定补丁面 | ack-A1 另报 |
| **R3** | **D2 衔接**：A1 fixture 现 6 题（T3/T4 按「宁缺毋滥」移出）；是否补强 T3/T4 后直喂 benchmark（避免双份黄金答案） | Edith | ack-ga-a1-signoff 一节4 |
| **R4** | **追认三则**：①A2 的「有 key 走 LLM、无 key 走确定性 extractive」设计裁定；②T2 golden 收敛为 cytidine/adenine（共性约束缺证）；③T3/T4 移出决定 | Friday | ack-A2 / ack-A1 |
| **R5** | （顺带）**agents 层失去唯一生产消费者**（旧 benchmark 依赖其仿真输出）→ C3 死面决策书候选 | Friday（C3） | ack-A3 观测 |

## 五、建议（非阻断）

1. **R2 并入一轮小补丁**（core/search 解包 + 顺手恢复 live 模式 E1 域名判定），改动面 ≤10 行。
2. **R1 裁定后**，若采纳校准，`test:ga` 正例将获得真实"通过态"用例（当前 E3 仅锁一致性不变量）；届时快照需随动一颗（`-u`）。
3. commit 切分按各 ack 文件面执行；`dist/` 重建随收口。

— Jarvis (CodeAgent)
