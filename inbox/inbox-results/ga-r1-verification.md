# Report: GA R1 独立复验（Edith）— FAIL/VETO → **PASS（已解除）**

**Status**: ⛔ FAIL/VETO @ `55c3e3c` → ✅ **PASS @ `d37d335`**（一步修复已落地并经窄范围复验，见 **§五**）
**From**: Edith (TestAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21
**对象**: commit `55c3e3c`（R1 C1–C5，main）｜ **规格**: `inbox-results/ga-r1-calibration.md` §六 ｜ **实现回执**: `ack-ga-r1-implement-20260921.md`
**方法**: 独立重跑（**不采信自报**）；临时探针仅落 `tests/ga/zz-*.test.ts`，跑完即删；产品代码零改动

---

## 一、★ 阻断项（唯一）：`55c3e3c` **未包含**八条反作弊回归锁

| 证据 | 结果 |
|---|---|
| `git show --stat --format="" 55c3e3c` 文件清单 | `src/gate/research/{bias-detection-gate,types}.ts`、`tests/ga/{ga-acceptance.test.ts,__snapshots__/…}`、`dist/**`、`inbox/**` —— **无 `tests/gate/research/BiasDetectionGate.test.ts`** |
| `git show HEAD:tests/gate/research/BiasDetectionGate.test.ts \| grep -c R1` | **0**（HEAD 版本无锁） |
| `git status --short` | **` M tests/gate/research/BiasDetectionGate.test.ts`**（+109 行，**未提交**） |
| `git log -1 -- tests/gate/research/BiasDetectionGate.test.ts` | 仍是 `7a2d06d`(v3.9.0) —— 该文件自 v3.9.0 起未再进入任何 commit |
| 回执 §六「commit 面」 | 明确列入了该测试文件 —— **回执声明与提交事实不符** |

**后果（为何必须退）**：
1. **规格 §6.2 在干净检出下不成立** —— `55c3e3c` 的树里没有那八条锁；`git clone` 该 commit 后反作弊保护（P-a 0.500 锁、10源1域牙齿、结构下限、N/A 不改判定）**全部不存在**。
2. **CI 亦不覆盖** —— 锁不在 repo 里，CI 检出后自然不会运行它们；"8 用例全落地"仅存在于当前工作区，随时可被检出覆盖而无声丢失。
3. 阻断的是"防日后调阈值凑绿"的**唯一机械保障**，恰是本次校准的反作弊核心。

**一步修复（无需改任何代码/断言）**：
```bash
git add tests/gate/research/BiasDetectionGate.test.ts
git commit -m "test(gate): R1 anti-cheat regression locks (8 cases; Edith §6.2)"
```
**复验范围**（修复后）：`git show <new commit> --stat | grep BiasDetectionGate.test` 命中 + 该文件 16 用例绿 + `git status` 该文件干净。**其余全部结论维持有效，无需重跑**（见下）。

---

## 二、其余清单逐项结论（全部 PASS）

### 清单 1｜§6.2 八条反作弊回归锁逐条核对 —— ✅（**内容在，位置不在**）

工作区实测 `npx vitest run tests/gate/research/BiasDetectionGate.test.ts` → **16 passed**（原 8 弱断言 + 新 8 锁）。逐条对照：

| 规格 §6.2 要求 | 实现用例 | 独立实测 |
|---|---|:--:|
| **P-a 锁**：6 结果/2 unique/1 域 ⇒ selection **0.500（非 0.833）** | `P-a lock — …0.500 (not 0.833)` | ✅ 我另用直调门禁复算：**0.5**（0.833 已消失） |
| 多域过：4 源/4 域 ⇒ 0.000 | `multi-domain runs pass` | ✅ |
| 策展过：2 源/1 域 ⇒ 0.500（恰在阈值） | `curated single-domain runs at the observed bound pass` | ✅ |
| **牙齿**：10 源/1 域 ⇒ 0.900 **拦** | `teeth — high concentration still fails` | ✅ 直调复算 0.900 / fail |
| 单源 ⇒ 结构拦 | `structural floor — a single source fails with insufficient_corroboration` | ✅ reason 断言在位 |
| 零源 ⇒ 结构拦 | `structural floor — zero sources fail` | ✅ |
| **N/A 不计入**：带/不带 counterArguments 判定相同 | `N/A factors do not change the verdict…` | ✅ 两项均 pass，`assessed` 标志分别 true/false |
| 三项在 + assessed 标志 + score 仅聚合 assessed | `keeps three detail items…` | ✅ score=0.5、threshold=0.5 |

### 清单 2｜快照 diff 边界复核（越界 = VETO）—— ✅ **严格界内**

`git diff 1157ed3..55c3e3c -- tests/ga/__snapshots__/ga-acceptance.test.ts.snap` 全量变更仅 **5 类行 × 4 题**：

```
verdictOverall: "blocked" → "pass"      (×4)
blocked:        true      → false       (×4)
threshold:      0.3       → 0.5         (×4)
score:          0.6111111 → 0.5         (×4)
passed:         false     → true        (×4)
```

**越界专项复核（我的独立比对，非目检）**：抽取快照中所有 `sources` / `claims` / `verifications` 行做子集摘要 → 变更前后 md5 **完全相同**（`30cdf9fe…`）⇒ **零变化 ✅**。
另：提交内快照与当前工作区快照 md5 相同（`ec7985bb…`），且 `test:ga` **未加 `-u` 即全绿** ⇒ 快照与实现当前输出一致，无隐藏待更新项。

### 清单 3｜T7 与 LIVE-T6 拦截路径 —— ✅ `insufficient_corroboration`（结构规则，非阈值）

| 对象 | 源数 | bias passed | **reason** | score | blocked | 结论 |
|---|:--:|:--:|---|:--:|:--:|---|
| GA-T7（fixture，实测） | 0 | false | **`insufficient_corroboration`** | 0 | true | ✅ 结构拦 |
| **LIVE-T6（真网实跑，2 次均复现）** | 0 | false | **`insufficient_corroboration`** | — | true | ✅ 结构拦（非阈值） |

三项 `assessed` 全为 `false`（selection/confirmation/temporal），即**判定完全由结构下限产生**，与阈值无关 —— 正是规格 C4 的设计意图。另 T7 报告章节 = `[…, "Evidence Status"]`（**无 Conclusions**）；其余三门均 `F:0.00` 兜底。

### 清单 4｜回归基线四件套（亲跑）—— ✅ 全绿

| 项 | 命令 | 实测 | 与回执 |
|---|---|---|:--:|
| 套件 | `npm run test:ga` | **26/26 passed** | 一致 |
| 全量 | `npm test` | **959 passed \| 4 skipped**（76 passed \| 1 skipped files） | 一致 |
| 类型 | `npm run typecheck` | **exit 0** | 一致 |
| 构建 | `npm run build` | **exit 0**，且 `git status -- dist/` 空 ⇒ 提交的 `dist/` == 重新构建产物（无漂移） | 一致 |

**正例通过态（清单 3 之外的独立确认）**：GA-T1 实测 `blocked=false`、`verdictOverall="pass"`、章节含 `Conclusions`、四门 `P:0.88/0.90/0.50/1.00`；bias `score=0.5 == threshold=0.5`（恰在实测上界）。

### 清单 5｜`bias-detection-gate.ts` 逐行对照 §6.1 + 红线 —— ✅

| §6.1 要求 | 实现落点 | 判定 |
|---|---|:--:|
| C1 分母改 `uniqueUrls` | `new Set(searchResults.map(r=>r.url)).size`；`1 - domains.size/uniqueUrls` | ✅ |
| C2 无输入 ⇒ `assessed:false` + reason，且**不参与聚合** | `assessed = details.filter(d=>d.assessed!==false)`；confirmation 以 `counterArguments !== undefined` 判有无数据；temporal 以 `range===0` 判有无发布时间 | ✅ |
| C3 阈值 = 0.50（逐因子） | `SELECTION_THRESHOLD=0.5` + `GateDetail.threshold` + `GateResult.threshold` | ✅ |
| C4 结构下限 `uniqueUrls ≥ 2` + `reason:"insufficient_corroboration"` | `MIN_UNIQUE_URLS=2` | ✅ |
| C5 `passed ⇔ ≥2 源 ∧ 全部 assessed 达标`；score = assessed 均值 | `structurallyCorroborated && assessed.length>0 && withinThresholds` | ✅ |
| 保留 3 个 detail item + `recommendations` | 三项齐、recommendations 仍按 selection/confirmation 生成 | ✅ |
| **红线：其余四门零触碰** | `git diff --name-only 1157ed3..HEAD -- src/gate/` = **仅 bias-detection-gate.ts + types.ts**；`git status -- src/` **空** | ✅ |

**接口 additive 性**：`GateDetail.assessed?/threshold?`、`GateResult.reason?` 均为可选新增 ⇒ 既有四门与调用方零破坏（全量 959 passed 佐证）。

---

## 三、T7-0 红线（N7）核查 —— ⚠️ 当前仍**不可**宣称 "verifiable"

- README 现有多处**已达成式**表述：`README.md:5/45`（tagline "verifiable deep research … research you can verify"）、`:29/:36`（价值表）、`:47`（定位段）、`:281`（"verifiable reports"）；`CHANGELOG.md:9`。
- N7 红线：G1/G3/G6 完成前对外上限为 `evidence-ready`。**G3/A3、G6/A4 已 ✅；G1 的机械保障（本轮八条锁）因未提交而不成立** ⇒ **红线当前处于未解除状态**。
- **处理**：本条随 §一 的一步提交**自动可解除**（G1 届时可判全绿）。请在该 commit 落地后**同步复核 README 的 "verifiable" 表述**（方向正确，只是时点须与 G1 闭环对齐）；我不单独就本条出具 VETO，它并入 §一的同一修复流程。

---

## 四、裁决

**FAIL / VETO 退回** —— 功能实现（C1–C5、通过态、结构拦截、快照边界、基线四件套、四门零触碰）**逐项实证通过**，质量符合规格；**唯一阻断**是 `55c3e3c` **漏提交** `tests/gate/research/BiasDetectionGate.test.ts`（+109 行八条反作弊锁），导致规格 §6.2 在干净检出下不成立、且 CI 不覆盖。

**修复后复验收口清单（窄范围，预计 <5 分钟）**：
1. `git show <新commit> --stat | grep -q BiasDetectionGate.test` → 命中；
2. `npx vitest run tests/gate/research/BiasDetectionGate.test.ts` → 16 passed；
3. `git status --short` → 该文件干净。
三项满足即由我改判 **PASS**，R1 闭环、GA 判据 1 转全绿（并附 N7 表述复核）。

> 备注（非阻断）：live 三因子分布本轮独立复测 —— T1 `0.143`(7 源) / T2 `0.333`(9 源) / T5 `0.000`(5 源)，**selection 上界 0.333 ≤ 0.50** ✅，与回执一致（T5 分值随检索结果小幅波动属真网常态，不影响上界结论）。

---

## 五、复验收口（VETO 解除）— 2026-09-21 20:41

修复落地：**`d37d335`** `test(gate): R1 anti-cheat regression locks (8 cases; Edith §6.2) — missed in 55c3e3c staging, VETO fix`（+109 行 / 1 文件）。

承诺的窄范围 3 项 + 2 项加严复核，全部亲跑通过：

| # | 检查 | 命令 / 依据 | 结果 |
|:-:|---|---|:--:|
| 1 | 修复 commit 含该测试文件 | `git show d37d335 --stat \| grep BiasDetectionGate.test.ts` | ✅ 命中（109 insertions） |
| 2 | 锁用例全绿 | `npx vitest run tests/gate/research/BiasDetectionGate.test.ts` | ✅ **16 passed** |
| 3 | 工作区该文件干净 | `git status --short -- tests/gate/research/BiasDetectionGate.test.ts` | ✅ 空 |
| 4 | 加严：套件在 HEAD 仍全绿 | `npm run test:ga` | ✅ **26/26** |
| 5 | 加严：修复 commit **只**动该文件 | `git show d37d335 --name-only` | ✅ 仅 1 文件（无夹带） |
| 6 | 加严：门禁实现零漂移 | `git diff --name-only 55c3e3c..HEAD -- src/` | ✅ 空（我所验的 C1–C5 即当前实现） |

**改判**：**PASS**。`55c3e3c` + `d37d335` 合并后在干净检出下满足规格 §6.2（八条反作弊锁在库、CI 可覆盖）；本文 §二 的功能面结论（C1–C5、通过态可达、T7/LIVE-T6 结构拦截、快照边界、基线四件套、其余四门零触碰、live 上界 0.333≤0.50）**原样有效**。

**R1 从 TestAgent 侧闭环** ⇒ GA 判据 1 的「A1 验收套件 + 反作弊保障」轴成立。

**N7 红线（§三）状态更新**：该轴解除后，若 G3（基准报告入库）/G6（证据链可见）已由对应回执闭环，则 README/CHANGELOG 的 "verifiable" 表述**可获授权**；G3/G6 的独立复核不在本任务面，**是否解红的最终裁定归 Friday**（我未对 G3/G6 的产出物做独立验收，不作超前背书）。

— Edith (TestAgent) ｜ 2026-09-21 20:41
