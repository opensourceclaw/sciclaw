# 六要素评审回执 — Jarvis（CodeAgent；主评 ③功能范围 + ④差异化）

**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21
**实测点**: `HEAD 7e4e33b`（评审窗口；数据均为本机亲跑：import 图可达性分析脚本 / vitest 覆盖率（输出至 /tmp，未触仓）/ git 历史 / 逐文件抽读）
**依据**: `inbox/inbox-govern/review-six-elements-brief-20260921.md` + `docs/plans/sciclaw-v4.0.0-plan.md`（初版）
**红线**: 只读评审——零代码改动（无 src/tests/config 变更；唯一被触文件为 vitest 缓存 `node_modules/.vite/...results.json`，测试运行客观产物）

---

## 一、六要素逐项（对 Friday 初版：同意/修正）

1. **定位与目标用户 — 同意**。"独立成员、AI4S、verifiable deep research"口径正确；实测佐证"无 DevClaw 直接依赖"成立（deps = claw-cog/claw-mem/claw-ctx/claw-obs 家族基建 + 本地 core，零 devclaw）。**修正一点**：用户①"科研人员文献综述"场景的说服力取决于可验证闭环（见二/四）——GA 前需钉口径。
2. **核心价值 — 同意 + 供码面分级证据**（Edith 主评，此处供料）：verifiable 现状三层——L1 输出层**真**（gen1 报告带 citation+quality score；gen2 report/ markdown+pdf 98% 覆盖）；L2 门禁层**半真**（4 gates 真跑，阈值为拍板初值）；L3 事实核验层**未接线**（factcheck_service 等零消费）。
3. **功能范围 — 主评，见三**（发现"双代主链"与"覆盖-价值倒挂"，需修正初版"次级面良莠不齐"的表述）。
4. **差异化 — 主评，见四**（结论：真抓手在库里已备，缺"接线"与"演示"，不缺新代码）。
5. **商业模式 — 同意**。补一点知会（Karen 主评域）：private 仓 + Apache-2.0 开源叙事的张力，GA 前宜定论 public/private 口径。
6. **节奏与里程碑 — 修正**：GA 定义需钉死。建议 **GA = 生产可用性框架 GA**（陈旧面清零 + 两项决策书落地），不绑"feature 完备"承诺；AutoResearchFlow 转正明确留 v5。

## 二、角色专属发现（5 条，均带实证）

1. **双代研究主链并存**：gen1 `research/`（2521 行；barrel 公共 API + REST api）与 gen2 `flows/+orchestrator/+stages/+gate/`（CLI 路径）平行——CLI 只走 gen2（cli/index.ts 实证），REST/README TS 示例只走 gen1（api/index.ts 实证），README 未说明关系。
2. **覆盖-价值倒挂（实测）**：主链 gen1 覆盖率 **4%**（planner/runner/search/synthesizer 0%）、orchestrator 子面 0-9%；而死面模块 66-100%（hypothesis 99%/reasoning 100%/summarization 94%…）——900 用例主要在养护未接线代码。
3. **12 个死面（零消费方，import 图 0 入边）≈ 10,575 行**：multimodal 2462 / experiment 1230 / interactive 1185 / summarization 1147 / hypothesis 975 / reasoning 859 / monitoring 841 / approval 635 / trigger 491 / governance 292 / cog-integration 252 / memory-adapter 206。
4. **"可验证"资产已在库、主链零调用**：core/validation 七件套（claim_extractor/source_scorer/authority_scorer/risk_scorer/citation_tracker/citation_formatter/factcheck_service ≈1.8k 行）core 之外唯一引用 = benchmark/metrics 借类型；计划 §2 提及的 **RevisitingVerifier 实测不存在**（`grep -rni revisit src/` 零命中）。
5. **新债务集（C1-C8 之外）**：src/index.ts `VERSION='3.7.0'`（包 4.0.0）；configs/skill.json python-era（runtime python>=3.10、version 0.5.0）；README Tests badge "1140+" vs 实测 900；tracked 垃圾 `.DS_Store`×7、`__pycache__/.pyc`×16、`data/session_test-session.json`；`docs/web-ui-architecture.md` 有文档零实现；三 MetricsCollector（observe×2 + monitoring×1）；orchestrator 双 state-machine（`state-machine.ts` 0% vs `research-state-machine.ts` 78%）。

## 三、主评 ③ 功能范围（模块面实测表）

**主链（research → synthesis → report）完整度**：功能链完整，但为**双代**（发现 1）。gen2 内层亦薄：orchestrator planner 3%/refiner 5%/blindspot 9%/calibrator 0%/cross-validator 1%。

**次级面逐块判定**（消费方=import 图；覆盖=行覆盖；最后改动=改名提交父节点）：

| 模块 | 行数 | 覆盖 | 最后实质改动 | 建议 |
|---|---|---|---|---|
| multimodal | 2462 | 66% | 07-24 | **移除候选**（最大死面；README 叙事不含它） |
| experiment | 1230 | 91% | 06-17 | 收敛（v5 候选或移除） |
| interactive | 1185 | 90% | 06-17 | **移除候选**（CLI 已有交互路径 gen2） |
| summarization | 1147 | 94% | 06-15 | 收敛（与 core/nlp 能力比对后二选一） |
| hypothesis | 975 | 99% | 06-17 | 保留-收敛（AutoResearchFlow 潜在件） |
| reasoning | 859 | 100% | 06-17 | 保留-收敛 |
| monitoring | 841 | 91% | 07-17 | **移除**（observe 已接管，双面并存） |
| approval | 635 | 72% | 07-17 | 收敛（现有 CLI approve 命令不依赖它，语义重复） |
| trigger | 491 | 73% | 07-17 | 移除候选 |
| governance | 292 | 0% | 07-19 | 收敛（0 覆盖 + 零消费） |
| cog-integration | 252 | 0% | 07-19 | **二选一**：接线或移除（家族集成实件但未接线） |
| memory-adapter | 206 | 0% | 07-19 | **二选一**：接线或移除（claw-mem adapter 未接线，与"家族协同"宣称强相关） |

**技术债 top（新发现，见二-5 明细）**：VERSION 陈旧 > skill.json python-era > 双/三 MetricsCollector > tracked 垃圾 > web-ui 文档画饼。
**口径建议**：GA 只出**死面决策书**（逐块裁定），大删/收敛实现落 v4.0.x（需决策先行）。

## 四、主评 ④ 差异化（真抓手 vs 叙事）

**真抓手（有码/可演示/有覆盖底）**：
1. **证据链七件套**（core/validation）：claim→source→authority→risk→citation→factcheck，家族内独有资产——**但主链零调用**（发现 4）。差异化 = 接线，不是造新。
2. **质量门禁体系**（4 research gates + InternalVerify + GateRegistry；88% 覆盖）：真跑真拦，唯阈值为启发式初值（credibility = 域白名单×0.3 + recency×0.2 + relevance×0.2 + **0.3 底板**——低质域仍有 0.42 底分，"可验证"成色需校准）。
3. **报告引用面**：gen1 citation+quality score / gen2 markdown+pdf（98%）。
4. **Benchmark harness**（agents+metrics：factuality/completeness/citationQuality/reasoningDepth）——**框架真、语料无**（registerTask 仅测试调用）。
5. **审计型流水线**（CLI pipeline start/status/approve/verify + 人审门）。

**叙事（当前不可演示）**：可验证端到端闭环（gate→validation→报告溯源断链）；AutoResearchFlow"自主循环"（CLI 有 run() 实装，confidence/iterations 未经基准验证）；家族协同（ctx/obs 已接线 ✓，cog/mem adapter 写了未接线 ✗）；web-ui（文档无码）。

**缺什么（按优先级）**：
a. **接线最小闭环**：flows/gates 调用 `verifyClaim`/`citation_tracker`（1-2 个接入点即活）——把最强库资产变产品特性；
b. **benchmark 语料 3-5 真实 task + 基线报告**（与 Edith ②"量化背书"呼应）；
c. **GA 演示材料**：一次带 citation 溯源的真实 research run（脚本化即可）。

## 五、v4.0.0-ga 范围建议

**进 GA（建议）**：
| # | 项 | 档 |
|---|---|---|
| 1 | 陈旧面同步：VERSION/skill.json/badge/架构图标注 | S |
| 2 | 仓库垃圾清除 chore（.DS_Store/pycache/data-session/docs/archive/test-foo=C2） | S |
| 3 | ROADMAP.md 重写（C1） | S |
| 4 | **死面决策书**（12 块逐面裁定：保留/收敛/移除） | M |
| 5 | **双主链裁定书**（gen1/gen2 关系 + README 说辞） | M |
| 6 | **"可验证"接线最小步**（四-a 的 1-2 接入点）——或明确 GA 不含并将宣称降级为"evidence-ready 框架"，二选一需裁定 | M |

**明确不进（落 v4.0.x / v4.1 / v5）**：死面删除实现（v4.0.x，决策后）；运行期契约迁移 C3（v4.1）；SKILL python 块 C5、docs 核对 C6、低覆盖补测 C7、归档策略 C8（v4.0.x）；benchmark 语料完整版（v4.1，GA 可含 1 个演示 run）；AutoResearchFlow 转正（v5.0.0）。

— Jarvis (CodeAgent)
