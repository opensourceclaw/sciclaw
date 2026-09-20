# Ack: deepclaw → SciClaw 整合改名（Phase 1 仓内，完成）

**Status**: completed —— 品牌串 living 面清零；★ 两处上报（预存 claw-obs 断裂 / dist 清洁重建）；测试与 typecheck 与基线完全持平
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent)
**Date**: 2026-09-21 ｜ **任务文件**: `inbox/inbox-code/task-sciclaw-rename-integration.md`（Peter 2026-09-21 00:48 定名）

---

## 交付物（按任务书五项）

1. **package 身份**：`name: sciclaw`、`bin: sciclaw`、依赖 `@sciclaw/core`（`file:../deepclaw-core` 原路径）；lock 以 `npm install --package-lock-only` 重生成（顺带刷新 sibling 链接条目至其真实当前名/版本：claw-cog 6.6.1、claw-mem 7.8.0、claw-obs 2.5.0 等——live file: 依赖副作用，非手改）；`node_modules/@deepclaw/core → @sciclaw/core` 符号链接重链（npm 10.9.8 对名称不匹配 file: 依赖的链接行为已 scratch 实证）。
2. **品牌串替换**：`DeepClaw → SciClaw` 自动面 147 文件 264 处（src 106 / tests 16 / living docs 20 / 根文件 5）+ 手工面（README/SKILL/plugin/CHANGELOG/skill.json 等）；品牌类名随动 3 个——**SciClawObserver / SciClawCogIntegration / SciClawLearningEngine**（含全部引用与导出）+ console 前缀 + JSDoc 头 + CLI 帮助串（`sciclaw pipeline …`）。
3. **README**：定位段重写（**"SciClaw — the AI4S counterpart of DevClaw: research you can verify."**）+ 新增 **🗺️ Roadmap 节**（两 Flow 阶段表：DeepResearchFlow ✅ current → AutoResearchFlow 🔄 evolving）+ 版本徽章 4.0.0 + clone/API 示例切 sciclaw。
4. **版本 3.9.0 → 4.0.0**（package.json / lock / openclaw.plugin.json【原滞留 3.0.0 一并同步】/ CLI `.version`【原滞留 3.8.0】/ README 徽章）。
5. **CHANGELOG [4.0.0]**：改名声明 + DeepClaw/AutoClaw/deepclaw-core 历史关系说明 + 「本次不改」运行期契约清单。

## ★ 上报 1（预存阻断，非本次引入）：claw-obs v2.5.0 重构后 `TokenCounter`/`EventBus` 导出已不存在

- 现象：`src/observe/MetricsCollector.ts:6` 经 live symlink 引用 claw-obs **旧 API** → 模块级单例初始化即崩 → **改动前基线即红**：7 failed files / 64 passed（71）、848 tests passed；tsc 15 错（13 在 ../claw-obs 源内 + 2 即本行）。失败文件：`cli/mode-flag`、`flows/deep_research_flow`、`flows/deep_research_flow_stages`、`index`、`observe/MetricsCollector`、`orchestrator/ResearchStateMachine`、`stages/validate`。
- 本次改名前后失败集合**逐文件一致**：零新增失败、848 passed 持平、tsc 错误集不变。
- 建议裁定：a) 固定 claw-obs 至含旧 API 版本；b) 开 port 任务适配 claw-obs v2.5.x 新面（MetricsAggregator 等）；c) 明确移除 observe 面。

## ★ 上报 2：dist 清洁重建（交付物侧效应）

- dist 为 **tracked 且陈旧**：旧 1048 文件含大量历史孤儿（cache/、agents/、skill/、tools/、types/、config/loader 等已删模块产物；其中 18 个孤儿带 DeepClaw 串）。
- 处理：先备份 → clean 重建 → **580 文件（旧集全含、0 新增）+ 468 孤儿删除**；dist 品牌串清零。git diff 以该批删除为大头（约 -1.6 万行）——**如需可将 dist 清洁单独成 commit**。
- 关键运行文件在位：dist/index.js、dist/cli/index.js、dist/observe/MetricsCollector.js、dist/flows/deep_research_flow.js。

## 边界声明（有意保留，逐类）

- **运行期契约串**（红线「src 逻辑零改动」）：`~/.deepclaw/*` 数据目录 ×5、`DEEPCLAW_MEMORY_WORKSPACE`、memory adapter 默认 projectId `"deepclaw"`、claw-cog broadcast 标签 `"deepclaw"`、metrics sessionId 前缀 `deepclaw-`——保留（如需迁移建议独立任务 + 数据迁移叙事）。
- **历史豁免**：docs/{reports,discussion,execution,archive,comm,design,detailed,plans,roadmaps/releases}/、`DEPRECATED-*`、`DEEPCLAW-v3.9.0` 计划（含您未提交的 GA 状态行，未动）、`p0-architecture-separation-decision.md`（决策记录）、`.github/issues/`、inbox/**、CHANGELOG 旧段（品牌串 9 处 = 旧段 5 + 新段 4 处历史指称声明）。docs 历史区共 69 文件带品牌串。
- **coverage/**（tracked 旧快照，48 文件带品牌串）未重生成（避免测试红态下刷快照）；如需清零可跑 `test:coverage`。
- **URL 面**：仅 README 切新名（…/sciclaw.git）；其余文件 URL 待 Phase 2 统一（旧 URL 自动重定向；**新 URL 在 Phase 2 完成前不可达**，请注意合并时序）。
- **SKILL.md python-era 块**（pip 依赖、`deepclaw.*` 导入示例）保留——陈旧内容而非品牌面，另议。tests 内 `deepclaw-*` tmpdir 前缀保留（脚手架）。

## Phase 2 清单（交回）

1. GitHub rename：`opensourceclaw/deepclaw → sciclaw`、`deepclaw-core → sciclaw-core`
2. `opensourceclaw/autoclaw` archive + README 头部「superseded by sciclaw」指向
3. **deepclaw-core 仓自身 package.json `name` 仍为 `@deepclaw/core`**——本仓引用已切 `@sciclaw/core` 且链接实证可用（file: 链接不受 target name 影响）；core 仓内是否同步改名请裁，如改则本仓零改动
4. npm 侧：本仓不发 registry（无动作）；`@sciclaw/core` 若需发布另行任务书
5. （可选）全仓 URL 清扫 + coverage 快照刷新

## 验证（亲跑）

- `npm test`：**848 passed**；7 failed files——与基线逐文件一致（上报 1 根因），零新增失败
- `npm run typecheck`：15 errors——与基线同源（claw-obs），改名面 0 新增
- `npm run build`：exit 2（同源预存）+ dist 完整产出（580 文件、品牌清零）
- 品牌普查：living 面（src / tests / scripts / configs / living docs / 根文件 / CI）`DeepClaw|AutoClaw` = **0**；余留仅历史豁免区 + coverage 快照
- Flow 类名不动实证：`DeepResearchFlow` / `AutoResearchFlow` 零改动

## 红线核对

Flow 类名零改动 ✓；除品牌串/品牌类名/CLI 身份串外 src 逻辑零改动（运行期契约串保留）✓；测试断言语义零改动（品牌随动改）✓；`openclaw.plugin.json` 身份面同步 ✓；未 commit（收口归你）。

— Jarvis (CodeAgent)
