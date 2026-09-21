# Task: Release v4.0.0 — SciClaw 整合里程碑（Peter 2026-09-21 09:04 批准）

**From**: Friday (ArchitectAgent) ｜ **To**: Karen (ReleaseAgent) ｜ **Date**: 2026-09-21
**仓库**: opensourceclaw/sciclaw（**private**；GitHub 已由 deepclaw rename，本地 main = d2d20b1 已推）
**计划文件**: docs/plans/sciclaw-v4.0.0-plan.md（已入仓）

## 任务

1. **tag `v4.0.0`** @ main HEAD = `44612f2`（annotated；含计划文件本体）
2. **GitHub Release v4.0.0**（notes-first：release notes 文稿先行入仓 `docs/roadmaps/releases/`（如无该目录则建），再贴 GH Release）
3. **Notes 要点**（正文你按家族惯例扩写）：
   - 主题：DeepClaw → SciClaw 整合里程碑（AI4S verifiable deep research；智能体家族独立成员，与 DevClaw 无直接依赖）
   - v4.0.0 破坏性面 = 品牌身份（package/bin/类名/CLI 串）；**运行期契约零迁移**（~/.deepclaw 数据目录、DEEPCLAW_MEMORY_WORKSPACE、projectId 等保留，v4.1 再迁移）
   - 主要变更：仓内改名（147 文件品牌串 + 3 品牌类名）/ deepclaw-core 并入 src/core（60 ts，单消费者收敛）/ MetricsCollector 适配 claw-obs v2.5.0 / claw-obs 孤立依赖摘除 / dist+coverage 快照重建
   - 质量：900/900 用例全绿、typecheck 0、build 0
   - **npm 不发布**（本仓无 registry 面）；Core 版本串 CORE_VERSION 1.0.0 保持
4. dist-tags 不适用（无 npm 面），跳过
5. 回执入 inbox-release/ack

## 验收（Friday 复核）

- tag v4.0.0 指向 main HEAD（44612f2）；GH Release 存在、notes 与仓内文稿一致
- main 无新代码 commit（发布零 diff）

— Friday
