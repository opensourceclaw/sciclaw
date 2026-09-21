# SciClaw v4.0.0 迭代计划（整合里程碑 + 清理优化）

**From**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21 ｜ **Status**: 执行中
**背景**: DeepClaw → SciClaw 整合已完成仓内三步（改名 4.0.0 / claw-obs port / core 并入）+ 仓级（rename / autoclaw·deepclaw-core 删除）。本计划收束 v4.0.0 正式里程碑，并规划 4.x 清理优化线。

---

## 一、产品六要素分析

### 1. 定位与目标用户
- **定位**: "SciClaw — the AI4S counterpart of DevClaw: research you can verify."（AI4S 深度研究框架，对标 DevClaw 的可信工程阶梯）
- **目标用户**: ① 科研人员/博士生（文献综述、证据链报告）；② AI4S 工程团队（可验证研究 pipeline 集成）；③ OpenClaw 生态用户（插件形态 serve/search/research CLI）
- **问题**: 实为三项目一体（DeepResearchFlow ✅ / AutoResearchFlow 🔄 / core 已并），叙事已统一但**下游文档未跟上**（ROADMAP 停在 v2.1，版本表仍写「v4.0.0+ 2027+ 预留」）

### 2. 核心价值（Value Proposition）
- 可验证研究：Source Validation / RevisitingVerifier / gate 门禁 / 证据链输出
- 阶段化演进叙事：DeepResearchFlow → AutoResearchFlow（README Roadmap 节已立）
- 与 DevClaw 家族协同：core（cache/llm/search/validation）与 claw-* 家族共享血缘
- **缺口**: AutoResearchFlow 仍在 evolving，"research you can verify" 的量化背书（benchmark 面）未在 README 显性化

### 3. 功能范围（What）
- 实测 206 src ts / 71 test ts / 900 用例全绿；模块面 30+ 目录
- **完整性**: research → synthesis → report 主链完整；experiment/personalization/hypothesis/learning 等次级面良莠不齐（index.ts 0% 覆盖多处）
- **债务**: observe/monitoring 双 MetricsCollector 并存（src/observe 与 src/monitoring）；SKILL.md 残留 python-era 块（pip 依赖、`deepclaw.*` 导入示例）

### 4. 差异化（Why us）
- 对标 DevClaw 的「过程可信」叙事 + claw-* 家族基础设施（obs/cog/mem/ctx）现成集成
- AI4S 赛道公开命名空间已占位（撞名风险已记录，org scope 缓解）
- **风险**: AutoResearchFlow 未完成前，与成熟 Deep Research 产品（商业与开源）正面竞争缺差异化抓手 → 4.x 应把「可验证」做成可演示的硬特性（benchmark 报告、gate 溯源输出）

### 5. 商业模式（How）
- 开源框架（Apache-2.0）+ 私有仓（current private）——与 DevClaw「可信AI工程」事业协同：sciclaw 作为 AI4S 垂直实证，反哺方法论与案例
- 无独立收费面；价值路径 = 方法论输出 + 服务咨询背书（与 USER.md 事业定位一致）

### 6. 节奏与里程碑（When）
- 当前: v4.0.0 = **整合里程碑**（改名 + core 并入 + 基线全绿）——本计划发布
- 下一步: v4.0.x 清理线（本计划第二节）→ v4.1.0 运行期契约迁移 + observe 面收敛 → v5.0.0 AutoResearchFlow 转正

---

## 二、清理优化清单（v4.0.x 执行）

| # | 项 | 级别 | 说明 |
|---|-----|------|------|
| C1 | ROADMAP.md 重写 | P0 | 停在 v2.1/06-25；版本表与现实严重脱节（v4.0.0 已是当下）；以本计划为基重写 |
| C2 | docs/roadmaps/test-foo 清除 | P0 | 垃圾目录 |
| C3 | 运行期契约迁移叙事 | P1 | `~/.deepclaw` 数据目录、`DEEPCLAW_MEMORY_WORKSPACE`、projectId、broadcast 标签、sessionId 前缀（7 文件）→ v4.1 迁移任务（含用户数据迁移路径 `~/.deepclaw` → `~/.sciclaw`，兼容读取旧目录一版） |
| C4 | observe/monitoring 收敛 | P1 | 双 MetricsCollector 并存 → 收敛单面 |
| C5 | SKILL.md python-era 块 | P1 | 陈旧 pip/`deepclaw.*` 示例清除或重写 |
| C6 | docs 面核对 | P2 | api.md/DEPLOYMENT.md/MIGRATION.md 中 deepclaw URL/串核对（MIGRATION 尤其应是 sciclaw 叙事） |
| C7 | coverage 低覆盖模块 | P2 | index.ts/types.ts 0% 面横评，决定补测或显式豁免 |
| C8 | docs 历史区归档策略 | P2 | 69 文件历史品牌串保留（历史豁免），但在 docs/README 标注 archive 边界说明 |

## 三、v4.0.0 里程碑发布（本次执行）

- tag `v4.0.0` @ 当前 main（d2d20b1），GitHub Release，notes-first 入仓
- Release notes 主题：整合里程碑（rename 定名 SciClaw / core 并入 / claw-obs 适配 / 依赖摘除 / 900 用例全绿）
- **非破坏说明**: 运行期契约串保留（~/.deepclaw 等），升级用户零迁移；npm 不发布（无 registry 面）
- 发布动作归 Karen（任务书已投 inbox-release）

— Friday, 2026-09-21
