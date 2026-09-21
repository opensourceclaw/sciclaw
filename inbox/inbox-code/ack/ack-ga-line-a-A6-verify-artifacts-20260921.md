# Ack: GA-A6 验证门禁输入真实化（完成）

**Status**: completed —— 提交体全字段真实化（真跑三件套）；单元 6 用例 + 真值演示通过；全量 911/911、typecheck 0
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent)
**Date**: 2026-09-21 ｜ **任务文件**: `inbox/inbox-code/task-ga-line-a-wiring.md`（A 线第 3 项）

---

## 交付

1. **新增 `src/cli/commands/verify-artifacts.ts`**：`collectVerifySubmission()` 从真实来源构建提交体——`typecheck`/`build`/`test` **现场真跑**（spawn npm scripts；typecheck 错误数 = 真实 `error TS` 计数；tests 从 vitest 摘要行解析 passed/failed/skipped/total）；`version` 取 package.json；`regression` 基线读自上次 verify 的门禁元数据（`GateRegistry.getAllGates()`，无基线时 previousTotal=current）；`qualityChecks` 三项**实扫 src/**\*（中文/硬编码路径/缺 Apache 头）。
2. **`verify.ts` 硬编码提交体整块删除** → 调 `collectVerifySubmission`，并打印真实收集值（typecheck/build/tests/quality 四行）。
3. **`InternalVerifyGate.submit` 补 `testCount` 入 passed 元数据**（为下次 regression 提供真实基线）。

## 真值演示（亲跑，dist 直调）

```
typeCheck: {passed: true, errors: 0}   build: {passed: true}
tests: {total: 911, passed: 911, failed: 0, skipped: 0}
regression: {passed: true, previousTotal: 911, currentTotal: 911}
qualityChecks: {hasChineseChars: true, hasHardcodedPaths: false, hasMissingApacheHeaders: true}
configValid: true
```
—— 每一项皆真实：`hasChineseChars: true` 指向 `src/core/index.ts`（core 迁入带来的中注释）；`hasMissingApacheHeaders: true`（142/205 文件缺头）——两条均为**警告级**（规则 7/9，不阻断），如实上报；如要清零属 C2/清理线范围。`hasHardcodedPaths: false` 实测干净。

## 验证

- 新增 `tests/cli/verify-artifacts.test.ts`：6 用例（vitest 摘要解析三形态 + 空输出；质量扫描干净/脏树两例）。
- 全量 **73 files / 911 passed / 0 failed**；typecheck 0。

## 交接（非本项范围，标记）

- pipeline 级端到端走查（create→…→verify 实跑）未做——verify 需 pipeline 处于 VERIFY 阶段，链路编排属 pipeline 面；提交体层已用真值演示替代证明。如需 pipeline 级演示请并入 A1 的 E2E 场景。
- 本项 = `verify-artifacts.ts`(新) + `verify.ts` + `InternalVerifyGate.ts` + `tests/cli/verify-artifacts.test.ts`(新)，可独立 commit。未 commit（收口归你）。

— Jarvis (CodeAgent)
