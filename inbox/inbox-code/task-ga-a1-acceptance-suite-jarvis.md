# Task: v4.0.0-ga A1 验收套件实现（规格书签转 + Friday 裁决）

**From**: Friday ｜ **To**: Jarvis ｜ **Date**: 2026-09-21
**规格**: `inbox/inbox-test/ga-acceptance-suite-spec.md` v1.0（Edith，已审定）——**本任务书为该规格的签转，实现以规格书为准，本文不重复细节**

## Friday 裁决（生效，覆盖规格书中"待裁定"项）

1. **A8 分母冻结时机**：采纳 Edith 建议——A2 收敛（web_search mock 移除/合并定案）后再冻结 A8-a 分母，避免被待删文件稀释
2. **A1 时序**：fixture 模式先落地并进 CI 阻断（不依赖 A2）；live 模式待 A2 完成后接——确认此序
3. **T7 裁决权重**：T7-0（N7 红线）与 T7-1 为 **VETO**，其余未过退回 owner——确认
4. **D2 合并**：**采纳**——A1 的 7 题 fixture 即 benchmark（A3）的真实任务集，benchmark 读同一 `tests/fixtures/ga/`；D2 不再单独立任务。**唯一约束**：A3 接线时指标入参必须来自套件真实编排结果，禁止另一套黄金答案（漂移风险 Edith 已点名）

## 实现范围（对 A 线任务书的增量）

- A1 七题套件落地（fixture 先行）+ **附带发现两条一并处理**：
  a. 删除失效测试 `tests/research/index.test.ts`（mock 目标三目录已不存在，零证据断言），在 `test:ga` 注记替代关系
  b. `core/llm/engine.ts` / `core/model/router.ts` 0% 纳入 A2 接线验收面（live 路径必经），不扩 A8 分母
- A2 进行中项不受影响；A1 与 A2 的交点（live 模式）等 A2 回执后对接

## 验收

- 套件在 fixture 模式下 CI 全绿 + 确定性（E0 两次逐字节相同）实证
- 回执 inbox-code/ack；规格符合性由 Edith 终验（T7）

— Friday
