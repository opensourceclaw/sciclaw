# SciClaw v4.0.0-ga 迭代计划（四方六要素评审汇总稿）

**From**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21 ｜ **Status**: 待 Peter 终审
**依据**: 四方评审回执（inbox-results/review-{jarvis,edith,karen}-six-elements.md）+ 总纲
**前置确认**: v4.0.0 tag/Release 已完成（Karen `dbf263c`）——GA 为独立判定，不重标

---

## 一、四方共识与分歧裁决

**共识**（三方一致）：
- 定位口径成立；但「verifiable」**今天不可证明**（Edith 实测：主链占位实现、`GATE RESULTS: []`、benchmark 0/12 pass 且 citation 结构性恒 0、门禁输入硬编码）
- 真实检索能力**已存在**（core/search 实测 1.4s/5 条真结果）——缺口是**接线**，不是研发
- 对外事实失真（README badge 1140+ vs 实测 900、VERSION 3.7.0、LICENSE 缺失但三处声明 Apache-2.0、CI 自 v3.7.0 结构性全红）
- 版本策略：**独立 `v4.0.0-ga` tag**（devclaw 先例），版本号不变；GA 判定通过当日转 public
- 不进 GA：C3 契约迁移、C4 observe 收敛、AutoResearchFlow、npm 发布

**Friday 裁决**（分歧/取舍点）：
1. **Edith N7 采纳为红线**：G1/G3/G6 完成前，任何对外面（README 卖点区/release notes）不得宣称 "verifiable"——要么做成，要么降级为 "evidence-ready"
2. **接线最小闭环进 GA**（Jarvis 建议项 6 + Edith G2 合并）：真实检索接主链是本期投入产出比最高项（M 档），不做则 GA 失去灵魂
3. **死面只出决策书不实现**（Jarvis）：12 死面 ~10,575 行逐块裁定进 GA（M 档文档），删除/收敛实现落 v4.0.x
4. **双主链（gen1/gen2）裁定书进 GA**：README 必须说明两代关系，否则对外即混乱

## 二、GA 任务清单（合并去重后）

### A. 硬门槛（GA 判据核心，Edith §三 + Jarvis）
| # | 任务 | 档 | 源 |
|---|------|:--:|----|
| A1 | **端到端研究验收套件 ≥5 题**：fixture 离线模式（CI 稳）+ nightly 真网可选；断言五项证据链（来源非 example.com / claim 有引文 / gate 结果随报告且失败阻断 / verifier 结论在场 / 引用可回溯） | M | Edith G1 |
| A2 | **真实路径接主链**：CLI research 走 core/search + LLM 综合；mock 收进 --mock 专用；web_search.ts 与 core/search 二收一 | M | Edith G2 + Jarvis 接线 |
| A3 | **benchmark 真接线 + 基准报告入库**：computeScores 消费编排结果、删字面量、version 取 package.json、加 npm run benchmark 入口、CI 非回归门 | M | Edith G3 |
| A4 | **证据链用户可见**：报告内嵌来源清单+claim 引文+gate/verifier 结论块；golden-output 快照测试 | S-M | Edith G6 |
| A5 | **构建冒烟进 CI**：dist 入口 import + CLI --version 必须成功（修 NodeNext 无扩展名导入——`main` 入口当前运行时加载失败而 CI 全绿） | S | Edith G4 |
| A6 | **验证门禁输入真实化**：pipeline verify 提交体由真实 typecheck/test/build 产物生成 | S | Edith G5 |

### B. 发布与合规（Karen §四）
| # | 任务 | 档 |
|---|------|:--:|
| B1 | LICENSE 文件（Apache-2.0 全文）+ SECURITY.md 重写（真实版本线 4.0.x）+ CODE_OF_CONDUCT + issue 模板集 + CONTRIBUTING 品牌清理 | S |
| B2 | CI 转绿：file: 兄弟依赖方案（claw-rsi sibling-clone 先例）或 vendored/registry 化 | M |
| B3 | 发布守卫链（裁剪版）：tag↔版本互等 + Release body==仓内 notes，fail-closed | S |
| B4 | package.json 元数据（repository/homepage/bugs/files）——files 面顺带为未来 npm 收口（tracked node_modules 9994 文件是现实威胁） | S |

### C. 一致性与叙事（三方合并）
| # | 任务 | 档 |
|---|------|:--:|
| C1 | ROADMAP.md 重写（C1）+ test-foo 清除（C2） | S |
| C2 | 事实校准：README badge 900、VERSION→4.0.0、plugin manifest description、SKILL.md python-era 块（C5） | S |
| C3 | **死面决策书**（12 块：保留/收敛/移除逐块裁定+依据） | M |
| C4 | **双主链裁定书**（gen1/gen2 关系定论 + README 说辞） | M |
| C5 | 双 MetricsCollector：GA 前文档声明 monitoring 为实验性（收敛实现留 v4.1） | S |
| C6 | .gitignore 修正 + node_modules/dist 出库 + .DS_Store/pycache/悬空 symlink 清除（Edith 附带观察，P1） | S |

### D. GA 说服力项（建议进，时间紧可标注「GA 后 2 周内」）
| # | 任务 | 档 |
|---|------|:--:|
| D1 | 一份可复现的对外样例：真实研究运行 + 证据链产物（含 gate 溯源），脚本化 | L |
| D2 | benchmark 语料 3-5 真实 task（黄金答案/来源白名单）——A3 的最小实料 | M |

## 三、GA 判据（六条，Karen §4.3 为基 + Edith 硬门槛合并）

1. A1 验收套件全绿 + A3 基准报告入库 + A4 证据链可见（Edith 一句话判据）
2. 干净机器 clone → install → build → research 三步通过（可复核记录）
3. CI 全矩阵绿且公开可见
4. 守卫链在位并实证一次
5. 对外声明与实测一致（版本/测试数/许可/支持线四处无矛盾）
6. 无 P0 open；剩余项显式标注「GA 后」

**红线**：以上未达成前，对外宣称上限为 "evidence-ready deep research framework"，不得使用 "verifiable" 作为已达成卖点（Edith N7）。

## 四、OUT（明确不进 GA）

C3 运行期契约迁移（v4.1）/ C4 observe 收敛实现（v4.1，只留声明）/ AutoResearchFlow 转正（v5.0.0）/ npm 发布（GA 后，先占位 `sciclaw` + `@sciclaw` scope）/ REST api 面（除非进 A1 验收路径）/ 真网真 LLM 进 CI 主链（nightly 可选）

## 五、执行序与分工

1. **Peter 裁定**：① 本计划批准/修改；② GA 当日转 public 的时机授权；③ npm scope 占位授权（需凭证）；④死面/双主链裁定书的终审角色（建议 Peter 终审、Friday 起草）
2. B1/B2（Karen CI 方案）与 A2/A5（Jarvis 接线）并行启动 —— 两者都不依赖裁定书
3. A1/A3/A4/A6（Jarvis+Edith 协同）→ C 面文档（Friday 起草裁定书，Peter 终审）→ T7 全量验收（Edith）→ `v4.0.0-ga` tag + Release（Karen）→ 当日转 public

— Friday, 2026-09-21
