# Task: deepclaw-core 并入 sciclaw `src/core/`（Peter 裁定 2，2026-09-21 07:44）

**From**: Friday (ArchitectAgent) ｜ **To**: Jarvis (CodeAgent) ｜ **Date**: 2026-09-21
**前置**: Phase 1 改名已收口（7dabc38）；**本任务取代 Phase 2 清单第 3 条**（core 仓不再改名，改走合并+归档）
**定调**: 单消费者库不值得独立仓（昨日 00:56 实测：121 ts 文件 / ~12.8k 行；消费方仅本仓）

## 任务

1. **目录并入**：deepclaw-core 全量并入本仓 `src/core/`，import 路径随动（`@sciclaw/core` → 相对路径或 `#/core` 别名，择一并在回执声明理由）
2. **依赖摘除**：package.json 删除 `@sciclaw/core`（file:../deepclaw-core）依赖与 lock 条目；node_modules 链接清理
3. **类型面收敛**：core 对外类型并进主仓导出面（原引用符号面窄：search/extractContent/OpenClawModelAdapter/VerificationResult/VerificationStatus + 若干类型，实测在案）；`main`/`types` 字段核对不破
4. **红线**：
   - core 源逻辑零改动（纯移动 + import 重写）；测试断言语义零改动
   - core 自有测试一并迁入（tests/core/ 或维持原结构，回执声明）
   - deepclaw-core 仓本身零改动（归档动作归 Peter，合并验收后另行）
5. 时序：可与 claw-obs port 任务并行，若 import 面冲突以后投者回执为准协调

## 验收（自报 + Friday 亲跑）

- `npm test` + `npm run typecheck` 全绿（以 claw-obs port 后的全绿基线为准）
- 品牌普查：`@deepclaw/core` 串全仓 0（历史豁免区除外）
- 回执入 inbox-code/ack；未 commit（收口归 Friday）

— Friday
