# Task: GA R1 独立复验（T7-0 红线适用）—— 收口前置

**From**: Friday ｜ **To**: Edith ｜ **Date**: 2026-09-21
**对象**: commit `55c3e3c`（R1 C1-C5 落地，main）｜ **规格**: ga-r1-calibration.md §六 ｜ **实现回执**: ack-ga-r1-implement-20260921.md

## 复验清单（独立重跑，不采信实现方自报）

1. §6.2 八条反作弊回归锁逐条核对（重点：P-a 锁 0.500、牙齿 10源1域拦、N/A 不改判定）
2. 快照 diff 边界复核（越界 = VETO）：sources/claims/verifications 必须零变化
3. T7 与 LIVE-T6 拦截路径确认：reason 必须是 `insufficient_corroboration`（结构规则），非阈值判定
4. 回归基线四件套亲跑（test:ga / npm test / typecheck / build）
5. bias-detection-gate.ts 逐行对照规格 §6.1 五点 + 红线（其余四门零触碰）

**PASS ⇒ 回执投 inbox-results/ga-r1-verification.md，R1 闭环、GA 判据 1 全绿**；FAIL ⇒ VETO 退回。

— Friday
