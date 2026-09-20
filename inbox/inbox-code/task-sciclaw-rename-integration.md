# DeepClaw → SciClaw 整合改名（Peter 2026-09-21 00:48 定名；整合方案已批）

**From**: Friday (ArchitectAgent) ｜ **To**: Jarvis (CodeAgent)
**Date**: 2026-09-21
**背景**: deepclaw / autoclaw / deepclaw-core 三仓实为一体（autoclaw = v3.7.0 改名实验的 2-commit 镜像；两种 Flow 已在 deepclaw v3.8+ 同仓）。整合为 **SciClaw**——AI4S 方向主导产品，对标 DevClaw（AI4SWE）。演进叙事 = 两 Flow 阶段化：DeepResearchFlow（当前：深度检索与综合）→ AutoResearchFlow（演进：自主研究循环）。

## Phase 1 — 仓内改名（你执行）

1. **package 身份**：`name: deepclaw → sciclaw`；`@deepclaw/core → @sciclaw/core`（本仓 + lock 同步）
2. **品牌字符串全量替换**：README / docs / SKILL.md / 代码内 "DeepClaw" → "SciClaw"（`DeepResearchFlow`/`AutoResearchFlow` **类名不动**——它们是阶段语义，不是品牌）
3. **README 重写定位段**：对标 DevClaw 句式——"SciClaw — the AI4S counterpart of DevClaw: research you can verify." 两 Flow 阶段演进写进 roadmap 节
4. **版本 3.9.0 → 4.0.0**：身份/包名变更为 breaking，跳 major 让历史可查（私仓零外部消费者，安全）
5. CHANGELOG 4.0.0 段：改名声明 + 与 DeepClaw/AutoClaw 的历史关系说明

## 红线

- 只动身份/品牌/文档面；Flow 类名、src 逻辑、测试断言语义零改动（品牌字符串出现在断言里的随动改，语义不变）
- 全量测试 + typecheck 零削弱
- openclaw.plugin.json 身份面同步

## Phase 2 — 仓级操作（你完成后交回，admin 动作 Peter/Karen 执行）

Phase 1 回执后，Friday 安排：
- GitHub rename：`opensourceclaw/deepclaw → sciclaw`、`deepclaw-core → sciclaw-core`（保历史，旧 URL 自动重定向）
- `opensourceclaw/autoclaw` **archive** + README 头部加「superseded by sciclaw」指向（不删不并——无可合并代码）
- npm 侧：本仓包不发 registry 则无 registry 动作；`@sciclaw/core` 若需发布另行任务书

## 完成标准

Phase 1 全绿 + 回执注明品牌字符串清零（grep DeepClaw/AutoClaw 余留 = 0，历史文件如 CHANGELOG 旧段除外）；Phase 2 清单交回。
