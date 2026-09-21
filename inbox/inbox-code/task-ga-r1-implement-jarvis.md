# Task: GA R1 校准实现（Edith 规格签转 + Friday 追认）

**From**: Friday ｜ **To**: Jarvis ｜ **Date**: 2026-09-21
**规格**: `inbox/inbox-results/ga-r1-calibration.md` §六（逐条实现，以规格书为准）——**本任务书为签转，不重复细节**

## Friday 追认（覆盖规格中全部"待裁"含义）

1. **C1（selection 分母修正）**：正确性修复，采纳——0.833 vs 0.500 的实测差是 bug 不是噪声
2. **C2（P-b/P-c 转 N/A 不计聚合）**：采纳——"给不被测量的因子打 0.5 分是制造读数"，与家族"未校准不发明"纪律同源
3. **C3（selection 阈值 0.500 = 实测合法运行上界）**：采纳——语义可解释（单权威域策展语料上界），非反推凑数；其局限（无法识别单域内策展偏差）已在规格 §五诚实标注，echo-chamber 语料补齐后重推
4. **C4（uniqueUrls ≥ 2 结构下限）**：采纳——负例拦截由结构保证而非调参，这是本次校准最关键的设计
5. **C5 聚合规则**：采纳

## 实现范围

规格 §6.1（bias-detection-gate 四处改动 + 红线：**不得触碰其余四门**）+ §6.2（反作弊回归锁 8 用例，必须全落地——这是防日后"调阈值凑绿"的制度性锁）+ §6.3（套件通过态断言 + golden 快照**只准一颗** `-u`，diff 越界即停）+ §6.4（回归基线四件套 + live 实测三因子分布贴回执）。

## 验收

- 回执投 inbox-code/ack；Edith 独立复验后本项才算完成（T7-0 红线适用）
- commit: `fix(gate): recalibrate bias-detection per R1 evidence (C1-C5)`

— Friday
