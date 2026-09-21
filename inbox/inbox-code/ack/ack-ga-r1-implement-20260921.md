# Ack: GA R1 校准实现（C1-C5 落地，完成）

**Status**: completed —— 正例通过态可达 + T7 结构性拦截双实证；快照单一 `-u` 且 **diff 严格界内**；全量 **959 passed | 4 skipped**；typecheck 0；build 0；live 实测附三因子分布
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21（Edith 复验后本项方闭环）
**任务文件**: `inbox/inbox-code/task-ga-r1-implement-jarvis.md`（规格：`inbox-results/ga-r1-calibration.md` §六）

---

## 一、§6.1 产品面（`bias-detection-gate.ts`，唯一被改门禁）

1. **C1**：`selection = 1 − uniqueDomains / uniqueUrls`（分母改为去重 URL）。
2. **C2**：`confirmation`/`temporal` 无输入数据时 `assessed:false` + reason `not assessable: …`；score 保留原值但**不参与聚合**。
3. **C3+C5**：判定改为 `passed ⇔ uniqueUrls ≥ 2 ∧ 全部 assessed 因子 ≤ 各自阈值`；`score = assessed 均值`（无 assessed 项 ⇒ fail）；`threshold` = 0.50（实测合法上界）。
4. **C4**：结构下限 `uniqueUrls ≥ 2`，不满足 ⇒ `fail + reason:"insufficient_corroboration"`（负例拦截不依赖调参）。
5. 保留三 detail item 与 `recommendations`；`GateDetail` 增 `assessed?/threshold?`、`GateResult` 增 `reason?`（均 additive，其余四门零触碰 ✓）。

## 二、§6.2 反作弊回归锁（8 用例，全落地）

`tests/gate/research/BiasDetectionGate.test.ts` 追加 R1 locks：**P-a 锁 0.500（非 0.833）** / 多域过 0.000 / 策展过 0.500 恰好上界 / **牙齿：10源1域 0.900 拦** / 单源结构拦（reason 断言）/ 零源结构拦 / N/A 不改判定（assessed 标志断言）/ 三项在 + score 仅聚合 assessed。既有 8 条弱断言用例零改动且全兼容。

## 三、§6.3 套件面

- 正例 E3 增通过态断言（`blocked=false` ×2 / `verdictOverall="pass"` / Conclusions 在场 / Evidence Status 不在场），保留 `blocked ⇔ anyGateFailed` 不变量；**T7 保持现状零放宽** ✓。
- **快照单一 `-u`（一颗）**，diff 严格界内实证：
  ```
  diff 仅 5 类行 × 4 题：verdictOverall blocked→pass ｜ blocked true→false ｜
  bias {passed false→true, score 0.611→0.500, threshold 0.3→0.5}
  sources/claims/verifications 零变化（越界检查通过）
  ```

## 四、§6.4 回归基线（亲跑）

- `npm run test:ga` → **26/26**（正例全过 + T7 拦）
- `npm test` → **76 files passed + 1 skipped；959 passed + 4 skipped**
- `npm run typecheck` → 0；`npm run build` → 0
- **live 实测三因子分布**（dist 直调，真网，含 `getEvidenceGateResults` 富门禁结果）：

| run | 源数 | selection | confirmation | temporal | bias | blocked |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| LIVE-T1 | 7 | **0.143** | 0.5(N/A) | 0.5(N/A) | PASS | false |
| LIVE-T2 | 9 | **0.333** | 0.5(N/A) | 0.5(N/A) | PASS | false |
| LIVE-T5 | 5 | **0.200** | 0.5(N/A) | 0.5(N/A) | PASS | false |
| LIVE-T6 | 0 | 1.0(N/A) | 0.5(N/A) | 0.5(N/A) | FAIL(`insufficient_corroboration`) | true |

—— **selection 上界实测 0.333 ≤ 0.50** ✓；live 正例**首次全门通过**（校准前全被 bias 拦）；live-T6 由 C4 结构规则拦（不依赖阈值）。

## 五、诚实注记（与规格 §5 一致）

`confirmation`/`temporal` 仍为 N/A（语料缺输入方差）；§5 的三题扩展语料（BIAS-P1/N1/N2）与因子的数据驱动阈值属 v4.0.x 面，**不在本次范围**（本次未发明替代阈值）。

## 六、commit 面

`src/gate/research/bias-detection-gate.ts` + `src/gate/research/types.ts` + `tests/gate/research/BiasDetectionGate.test.ts` + `tests/ga/ga-acceptance.test.ts` + `tests/ga/__snapshots__/`（建议消息照任务书：`fix(gate): recalibrate bias-detection per R1 evidence (C1-C5)`）。**未 commit**（协议 A/B/C）。待 Edith 独立复验（T7-0 红线适用）。

— Jarvis (CodeAgent)
