# 六要素评审（Karen 视角）—— 发布/分发面 + 节奏

**From**: Karen (ReleaseAgent) ｜ **To**: Friday (ArchitectAgent) / Peter (Owner)
**Date**: 2026-09-21 ｜ **总纲**: `inbox/inbox-govern/review-six-elements-brief-20260921.md`
**方法**: 本仓实测（现场跑）＋ 家族仓先例（claw-rsi / claw-eva / devclaw）＋ 公开 registry 与 GitHub API 探针；每条结论附证据行，不做泛论。
**前置**: v4.0.0 tag/Release 已完成（`dbf263c`，见 `inbox-release/ack/ack-release-v4.0.0-20260921.md`），本评审不改变该事实。

---

## 0. 结论先行

| # | 结论 | 级别 |
|---|------|------|
| 1 | **LICENSE 文件缺失**，而 `package.json` / README 徽章 / `openclaw.plugin.json` 三处均声明 Apache-2.0 | **P0（公开前必修）** |
| 2 | **CI 长期全红**（file: 兄弟依赖在 runner 内不可解析），公开仓的「CI 可见性」目前是负资产 | **P0（GA 前必修）** |
| 3 | GA 版本策略建议：**独立 `v4.0.0-ga` tag**（devclaw 先例），**不重标 v4.0.0** | 决策建议 |
| 4 | 分发建议：**短期 clone-only + 插件形态**；npm 面**GA 后再开**，若开用 **`@sciclaw` scope**（公开 registry 两名字均未被占） | 决策建议 |
| 5 | 公开节奏建议：**分两段**——GA 判定完成前保持 private，GA 判定通过当日转 public（转 public 本身即 GA 的对外动作） | 决策建议 |

---

## 1. 六要素逐项（同意 / 修正 + 理由）

| 要素 | 结论 | 理由与修正 |
|------|------|-----------|
| ① 定位与目标用户 | **同意**（补 1 条修正） | 「verifiable deep research for AI4S / 家族独立成员」口径清楚，用户三分（科研人员 / AI4S 工程团队 / OpenClaw 生态用户）可操作。**修正**：三类用户的**入口不同**（CLI / API serve / 插件），而 README 目前只有 CLI+API 的 clone 路径；对外叙事应显式给出「你属于哪类 → 从哪进」。 |
| ② 核心价值 | **同意**（Edith 主评，我不越位） | 「research you can verify」方向成立；我只补发布面一条：**可验证性目前没有对外可跑的样例**（无 demo 仓/样例报告），GA 前应有「一次可复现的研究运行 + 证据链产物」作为公开证据，否则主张不可证。 |
| ③ 功能范围 | **同意**（Jarvis 主评） | 主链完整、次级面良莠不齐的判断与实测一致（206 src ts / 71 test ts / 900 用例）。**修正**：`observe/monitoring` 双 MetricsCollector 并存属**对外可感知的架构重复**（同一个指标两处写），GA 前若不动，应在文档显式声明「monitoring 面为实验性」以免被当稳定面消费。 |
| ④ 差异化 | **同意** | 家族基建（obs/cog/mem/ctx）现成集成是真实抓手。**修正**：差异化目前**不可被外部验证**（无对比、无基准）；GA 的对外动作应至少给一个「与通用 deep research 工具相比，过程/证据面多给了什么」的可读案例（不必是跑分）。 |
| ⑤ 商业模式 | **见 §2（主评）** | 现状 private + 无 npm 面；给两段式公开建议 + 开源前 checklist 实测 + 三种分发形态排序。 |
| ⑥ 节奏与里程碑 | **见 §3（主评）** | 给 `v4.0.0` vs `v4.0.0-ga` 的 tag 策略裁定建议（含家族先例依据）＋ 守卫链落地状态与 GA 必要性。 |

---

## 2. 主评⑤：商业模式（发布 / 分发面）

### 2.1 现状实测（现场取证）

| 项 | 实测 | 证据 |
|---|---|---|
| 仓库可见性 | **private** | `gh repo view opensourceclaw/sciclaw --json isPrivate` → `true` |
| npm 面 | **无**（本仓不发包） | 无 registry 发布流程；`package.json` 无 `files`/`repository` 字段 |
| 许可声明 | 声明 Apache-2.0 **三处**，但**无 LICENSE 文件** | `package.json.license` / README 徽章 `License-Apache 2.0` / `openclaw.plugin.json.license`；`ls LICENSE` → **MISSING** |
| SECURITY.md | **GitHub 默认模板未改写**，且内容自相矛盾 | 正文含 `5.1.x ✅ / < 4.0 ❌`（本仓版本线为 4.0.0，无 5.x）；无私有报告渠道 |
| CONTRIBUTING.md | 存在（5186B），**残留旧品牌串 3 处** | `grep -ci deepclaw` → 3 |
| README.md | 存在，**残留旧品牌串 1 处**；且**对外数字失真** | 徽章写 `Tests-1140+`，实测 **900**（71 files）；插件清单 description 仍为旧定位「Deep Research Framework」 |
| issue 模板 | **无标准模板集**，仅散落文件 | `.github/ISSUE_TEMPLATE/v3.0.3-cache-improvement.md` + `.github/issues/v3.0.3-cache-improvement.md`（非 bug/feature 模板） |
| CODE_OF_CONDUCT | **缺失** | `ls CODE_OF_CONDUCT.md` → MISSING |
| CI | **长期全红**（见 §3.2），故「CI 公开可见性」当前不成立 | 最近 4 次 push run 全 failure；v3.7.0 起持续 |
| 分发叙事 | README 已宣告 npm 路径「Coming Soon」 | README §Installation「Method 2: Via npm (Coming Soon) `npm install -g sciclaw`」 |
| 公开 registry 命名 | **`sciclaw` 与 `@sciclaw/core` 在 npmjs 均未被占用** | `npm view sciclaw version` → 404；`npm view @sciclaw/core version` → 404 |

### 2.2 GA 是否应转 public —— 建议：**分两段，转 public 即 GA 的对外动作**

- **v4.0.0 → GA 判定前：保持 private。** 理由：公开是一次**单向外向动作**（一旦公开，历史可被索引/引用），而当前 P0 未清（LICENSE 缺失属法律面瑕疵；CI 全红会让首个外部访客直接看到红叉）。
- **GA 判定通过当日：转 public。** 理由：GA 的语义是「对外可用」，private 仓无法承载这一语义；同时把「转 public」当作 GA 的**单一对外开关**，避免出现「已 GA 但仍 clone 不到」的中间态。
- 若 Peter 希望更早获取外部反馈，可先转 public 但**在 README 顶部标注 pre-GA / API 可能变动**——此路径需接受 P0 项在公开状态下补齐（我不建议：LICENSE 缺失期间公开，等于对外声明与仓内事实不一致）。

### 2.3 开源发布前 checklist（实测状态）

| # | 项 | 状态 | 工作量 |
|---|----|------|--------|
| 1 | `LICENSE` 文件（Apache-2.0 全文，与三处声明一致） | ❌ 缺失 | **S** |
| 2 | `SECURITY.md` 改写（真实支持版本线 4.0.x、私有报告渠道、响应预期） | ❌ 默认模板 | **S** |
| 3 | `CONTRIBUTING.md` 品牌串清理（3 处）+ 贡献流程核对（build/test 命令可用） | ⚠️ 部分 | **S** |
| 4 | issue 模板集（bug / feature / research-report）+ 清理散落文件 | ❌ 无 | **S** |
| 5 | `CODE_OF_CONDUCT.md`（或明确不需要） | ❌ 缺失 | **S** |
| 6 | README 事实校准（Tests 徽章 1140+ → 900；定位串；npm 现状口径） | ⚠️ 失真 | **S** |
| 7 | `package.json` 元数据（`repository` / `homepage` / `bugs` / `files`） | ❌ 缺失 | **S** |
| 8 | **CI 转绿**（file: 依赖方案）——公开后 CI 徽章/历史即门面 | ❌ 全红 | **M**（见 §3.2） |
| 9 | CI 公开可见性核对（公开仓 Actions 默认可见；矩阵 18/20/22 是否保留） | ⏸ 依赖 8 | **S** |
| 10 | 版本/许可/依赖面一致性（plugin manifest `main` 与 package `bin` 均为 dist 面、engines 口径一致） | ⚠️ 待核 | **S** |

> 合计：8 个 S + 1 个 M；**除 CI 外全部是文档/元数据面，无代码风险**——这是「GA 前两周可清完」的量级。

### 2.4 分发形态建议（三选一 → 建议组合）

| 形态 | 适配度 | 判断 |
|------|--------|------|
| **A. clone-only**（现状） | ★★★ 立即可用 | 对「AI4S 工程团队 + 科研人员」够用：`clone → npm install → build → sciclaw research`。缺点：插件生态用户门槛高。 |
| **B. OpenClaw 插件形态** | ★★★ 生态内最顺 | 本仓已有 `openclaw.plugin.json`（commands search/research/report/serve + API 面），**这是家族内最短路径**：平台侧安装即可，无需 registry。建议 GA 期作为**主推**，与 A 并存。 |
| **C. npm 发布** | ★★ 后期 | 对「`npm install -g sciclaw`」叙事最完整，但代价链条长：需决定首发 registry（public npmjs vs 私有 GH Packages）、CI 发布通道、`files` 白名单（当前无 `files` 字段 → 会连带发布 docs/inbox/tests，本仓还跟踪 `node_modules` 9994 文件，**必须先在 package `files` 面收口**）、以及发布凭证与守卫链。**建议 GA 后再开**。 |

**scope 策略（若走 C）**：`sciclaw` 与 `@sciclaw/core` 在 npmjs 均未被占用 ⇒ 建议 **GA 前先占位**（发 0.0.1 或保留名），避免公开后撞名；scope 口径建议 **`@sciclaw/*` 作为家族 AI4S 线命名空间**，与 `@opensourceclaw/*`（既有基础设施线）区分——两条线并存比把 sciclaw 塞进 `@opensourceclaw` 更清晰。

---

## 3. 主评⑥：节奏与里程碑

### 3.1 版本策略：`v4.0.0` 与 `v4.0.0-ga` —— 建议**独立 tag，不重标**

**家族先例（实测）**：

| 仓 | 做法 | 证据 |
|----|------|------|
| **devclaw** | **独立 `-ga` tag**，且落在**比版本 tag 更晚的 commit** 上 | `v9.0.0` → `c67b48a`；`v9.0.0-ga` → `3080f15`（2026-08-17，later commit）；另有 `v9.0.0-ga-phase1/-phase2` |
| claw-rsi | GA = **版本 tag 本身**（`v6.0.0`），GA 为文档/验收语义，无 `-ga` 后缀 tag | 仓内无任何 `*ga*` tag |
| claw-eva | minor 正式版（`v2.7.0`）无 GA 概念 | 仓内无 `*ga*` tag |

**建议**：采用 **devclaw 先例（独立 tag）**，理由三条：
1. **`v4.0.0` 已发布且不可变**：tag 已推、GH Release 已建、外部引用已可能产生（Release URL）。**重标 = 改写已发布历史**，破坏可回放性（家族一贯的红线）。
2. **GA 是「判定」而非「版本」**：GA 的含义是「达到对外可用判据」，其达成点必然**晚于** v4.0.0 的 commit（本仓 GA 判据含 §4 的清理线）。
3. devclaw 已把 `-ga` 用成家族可读的里程碑后缀，语义一致、无需新发明。

**具体形式（按 GA 是否含代码变更二分）**：

| 情形 | 推荐 tag | 说明 |
|------|---------|------|
| GA 仅由**文档/元数据/CI** 清理达成（§4 的 IN 清单，无 src 行为变更） | **`v4.0.0-ga`** @ GA 达成 commit | 不改版本号（`package.json` 仍 4.0.0）；tag 即里程碑标记。**推荐此路**（当前 IN 清单正是这一类） |
| GA 需要**行为/契约变更**（如 C3 运行期契约迁移提前、C4 observe 收敛） | **`v4.1.0-ga`** @ 该版本 bump commit | 版本号承载真实变更，`-ga` 承载「对外可用」判定；避免「4.0.0 里塞进 4.1 的内容」 |

> 反面选项（不推荐）：把 `v4.0.0` 重标到更晚 commit、或删tag重建 —— 破坏已被引用的发布物。

### 3.2 守卫链落地状态 + GA 前是否必需

**实测：sciclaw 仓根本没有 `release.yml`**（`.github/workflows/` 仅 `ci.yml`）。故 claw-eva `f292c4e` 那种「发布守卫链」在本仓**不存在**。

**但 CI 本身长期全红，这是比守卫链更前置的问题**：

- 现象：最近 4 次 push（含 `7e4e33b` 评审 kickoff）全 `failure`；矩阵 `build-and-test(18/20/22)` 三档同因失败（fail-fast 连带 cancel）。
- 根因（CI 日志原文）：`npm ci` 后 `tsc` 报 `TS2307 Cannot find module 'claw-cog' / 'claw-ctx' / 'claw-mem'` —— 三个家族依赖以 `file:../claw-cog`、`file:../claw-ctx`、`file:../claw-mem` 声明，GitHub runner 内**不存在兄弟目录**。
- 性质：**非 v4.0.0 回归**。回溯 run 历史，`v3.7.0`（07-24）、`v3.8.0`（07-26）、`v3.9.0`（07-27）以来持续红，仅 scheduled 的 Code Quality 有成功记录。
- 影响：本地「900/900 全绿」真实（非沙箱复跑实证），但**CI 不能背书**；公开仓场景下这是门面级负资产。

**GA 前是否必需（我的裁断）**：

| 项 | 是否需要 | 理由 |
|----|---------|------|
| **CI 转绿** | **必需（P0）** | 公开仓的 CI 状态是外部第一印象；且 GA 判据「可 clone-install-run」需要 CI 背书才可复核。方案：照 **claw-rsi `release.yml` 先例加 sibling clone 步骤**（家族已实证可行），或把三个 `file:` 依赖改为 vendored / registry 面。 |
| **发布守卫链（notes-first）** | **必需（P1，但可裁剪）** | 本仓无 npm 发布 ⇒ claw-eva 的两道守卫中「publish 短路」不适用；**留下两道必需的**：① tag ↔ `package.json` 版本互等；② Release 必须存在且 body == 仓内 notes 文件（fail-closed，杜绝机器生成 body）。本次 v4.0.0 是**人工保证**了这两点（我逐字节核过），但人工保证不可持续——GA 是对外承诺，值得自动化。 |
| 版本一致性守卫（plugin manifest / VERSION 常量 / package.json 三处） | 建议 | 本仓历史上已有 stale 先例（plugin json 曾停留 3.0.0、CLI 串 3.8.0），值得加一条 tag 触发的三处一致性检查。 |

---

## 4. GA 范围建议（进 / 不进 + 工作量 + 判据）

### 4.1 进（IN）

| 项 | 内容 | 档 | 依据 |
|----|------|----|------|
| G1 | **许可与合规面**：LICENSE 文件、SECURITY.md 改写、CONTRIBUTING 品牌清理、issue 模板集、CODE_OF_CONDUCT | **S** | §2.3；公开的法定/信任面，零代码风险 |
| G2 | **CI 转绿**（file: 依赖方案落地） | **M** | §3.2；GA 判据的前置 |
| G3 | **对外事实校准**：README 徽章/定位串、plugin manifest description、package 元数据（repository/homepage/bugs/files） | **S** | 实测失真（1140+ vs 900 等） |
| G4 | **发布守卫链（裁剪版）**：tag↔版本互等 + Release body==仓内 notes（fail-closed） | **S** | §3.2；本次已人工达成，GA 前自动化 |
| G5 | **C1 ROADMAP 重写 + C2 `test-foo` 清除** | **S** | 计划 P0；公开后 ROADMAP 是叙事主入口，现停留在 v2.1 与现实脱节 |
| G6 | **C5 SKILL.md python-era 块清理** | **S** | 实测残留 `pip install` / `deepclaw.*` 示例（3 处） |
| G7 | **一份可复现的对外样例**（一次研究运行 + 证据链产物，最好含 gate 溯源） | **L** | 「可验证」主张的可证性；也是 ④ 差异化的展示面 |

> 合计：S×5 + M×1 + L×1。**S/M 面 = GA 的硬底线；L 面是「GA 的说服力」**（建议进 GA，若时间紧可标为「GA 后 2 周内」但需在 GA 声明里写明）。

### 4.2 不进（OUT）

| 项 | 归属 | 理由 |
|----|------|------|
| C3 运行期契约迁移（`~/.deepclaw` → `~/.sciclaw` 等 7 文件） | **v4.1** | 引入**用户数据迁移面**（含旧目录兼容读取）——GA 前引入等于把迁移风险绑在「首次对外可用」上；且 v4.0.0 的「零迁移」卖点是干净的 |
| C4 observe/monitoring 双 MetricsCollector 收敛 | **v4.1** | 架构收敛会触碰指标输出面；GA 前宜冻结行为、只补文档声明（见 §1 ③ 修正） |
| AutoResearchFlow 转正 | **v5.0.0** | 与外层计划一致 |
| C7 coverage 低覆盖横评 / C8 docs 历史归档策略 | **v4.0.x 后续** | 内部质量面，不阻塞对外可用 |
| npm 发布（形态 C） | **GA 之后** | §2.4：需先收口 `files` 白名单与凭证/守卫链，且要处理本仓跟踪 `node_modules`（9994 文件）的现实 |

### 4.3 GA 判据（什么状态才许打 `-ga`）

1. **可跑通**：干净机器上 `clone → npm install → npm run build → sciclaw research <topic>` 三步通过（可复核记录）。
2. **CI 绿且公开可见**：`ci.yml` 在 main 全矩阵通过；转 public 后 Actions 历史无红叉堆积。
3. **守卫链在位并实证一次**：tag↔版本互等 + Release body==仓内 notes（fail-closed），且有一次真实发布走过该链。
4. **对外声明与实测一致**：版本号、测试数、许可、支持版本线（README/SECURITY/plugin manifest/package.json 四处无矛盾）。
5. **可验证性有对外的证物**：至少一份带证据链的研究样例。
6. **无 P0 open**：G1/G2/G3 清单清零；剩余项显式标注「GA 后」并写进声明。

---

## 5. 角色专属发现（发布/分发面，≤5）

1. **LICENSE 文件缺失但三处声明 Apache-2.0**（`package.json` / README 徽章 / `openclaw.plugin.json`）——**唯一的 P0 法定面缺口**，成本却只有一个文件。（S）
2. **CI 自 v3.7.0 起结构性全红**（`file:../claw-*` 兄弟依赖在 runner 不存在）——发布可信度的根问题，且与 v4.0.0 无关，属**历史债**。修法家族已有先例（claw-rsi 的 sibling clone 步骤）。（M）
3. **SECURITY.md 是未改写的 GitHub 默认模板**，且声称支持 `5.1.x`、把 `< 4.0` 标为不支持——与本仓版本线直接矛盾；公开前必须重写。（S）
4. **对外数字失真**：README 徽章 `Tests-1140+` vs 实测 **900**；插件清单 description 仍是旧定位。公开前属「一读即破」的信任面问题。（S）
5. **npm 命名空间未占位**（`sciclaw` / `@sciclaw/core` 在 npmjs 均 404）——若走 npm 路线，公开前后存在被抢注风险；建议 GA 前占位并确定 `@sciclaw/*`（AI4S 线）与 `@opensourceclaw/*`（基建线）的分工。（S）

---

## 6. 对 v4.0.0-ga 计划的明确建议（一句话版）

- **范围**：IN = G1-G7（S×5 / M×1 / L×1）；OUT = C3/C4/AutoResearchFlow/npm；**GA 判据 6 条**见 §4.3。
- **版本**：打 **`v4.0.0-ga`**（独立 tag，不改版本号）——除非把 C3/C4 提前进 GA，那才升 `v4.1.0-ga`。
- **公开**：GA 判定通过当日转 public；此前保持 private（不建议带 P0 公开）。
- **分发**：GA 期主推 **clone + OpenClaw 插件**；npm 面 GA 后开，scope 用 `@sciclaw`。

— Karen (ReleaseAgent), 2026-09-21
