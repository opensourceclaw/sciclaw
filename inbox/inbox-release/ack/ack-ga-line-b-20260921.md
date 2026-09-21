# Ack: v4.0.0-ga B 线 —— 发布合规与 CI

**Status**: **B1/B3/B4 complete**；**B2 已实现但阻塞于 1 个 repo secret**；**npm 占位挂起（无 npmjs 凭证）**
**From**: Karen (ReleaseAgent) ｜ **To**: Friday (ArchitectAgent) / Peter (Owner)
**Date**: 2026-09-21 ｜ **Task**: `inbox/inbox-release/task-ga-line-b-release-compliance.md` ｜ **Plan**: `docs/plans/sciclaw-v4.0.0-ga-plan.md` §B
**Commit**: `6c708b1`（已推 main）

---

## B1 合规面 ✅ complete

| 项 | 结果 |
|----|------|
| `LICENSE` | ✅ Apache-2.0 全文（201 行），与 claw-rsi/claw-eva 家族文本**逐字节相同**（`diff` 空） |
| `SECURITY.md` | ✅ 重写：支持线 **4.0.x**（删除默认模板里自相矛盾的 5.1.x）、私有报告渠道（Security Advisories + 邮箱）、3 工作日确认 / 10 工作日评估 / 协调披露、第三方服务范围注记 |
| `CODE_OF_CONDUCT.md` | ✅ Contributor Covenant v2.1（执行联络人 + 四级处置） |
| issue 模板集 | ✅ `bug_report.yml` / `feature_request.yml` / `research_report.yml`（家族特有：**研究报告质量面**——无引文/引文不可达/gate 与报告不一致/verifier 结论缺失）/ `config.yml`（`blank_issues_enabled: false` + security、contributing 入口） |
| 散落文件清理 | ✅ 删除 `.github/ISSUE_TEMPLATE/v3.0.3-cache-improvement.md` 与 `.github/issues/`（该文件是计划书而非模板，会污染模板选择器；内容在 git 历史可溯） |
| CONTRIBUTING 品牌清理 | ✅ 3 处 → **0**（clone URL 顺带修正为 `opensourceclaw/sciclaw`） |

**刻意未改（不是遗漏）**：README 中的 `DEEPCLAW_LLM_PROVIDER` —— 属 CHANGELOG 4.0.0 明示的**运行期契约保留面**，非品牌残留。

## B2 CI 转绿 ⚠️ 阻塞（1 个 secret）／方案已定并落地

**方案选定：sibling-clone（非 vendored）**。依据：① 家族已在 claw-rsi `release.yml` 实证同款做法；② vendored 会把三个兄弟包的集成面复制进本仓并引入漂移锁成本；③ `claw-ctx` 在 `src/context/ContextManager.ts` 是**静态类型导入**（`ModelAwareOptimizer` / `modelProfileRegistry` / `ModelProfile` / `OptimizationHint` / `OptimizationStrategy`），必须真包在位。

**两个实测约束（任务书未预料，是本次阻塞的根因）**：

1. **`claw-cog` 是 private 仓** ⇒ 默认 `GITHUB_TOKEN` 无法 clone（跨私有仓需 PAT）。
2. **`claw-mem` 虽 public，但其依赖来自 GitHub Packages**（`@opensourceclaw/claw-ctx`、`claw-gov`）⇒ 它的 `npm ci` 需 **packages:read**。

⇒ 结论：**即便不 clone 私有仓也需要 token**；CI 转绿至少需要 1 个 secret，而本仓 `gh secret list` **为空**（对照：claw-rsi 有 `PACKAGES_TOKEN`，恰为此因）。

**已落地**（`.github/workflows/ci.yml` 重写）：

- 两个 job（`build-and-test` 矩阵 + `lint`）均先 **clone 三个 sibling（带认证 URL）→ 逐个 `npm ci && npm run build``**，再做本仓 install / build / typecheck / test / coverage（顺序与 `file:` 依赖解析要求一致）。
- 缺 `FAMILY_READ_TOKEN` 时**立即 fail-closed**，并打印可直接执行的修复指令（不留 TS2307 式误导性红）。
- 新增 `fail-fast: false`：此前一条腿失败会 cancel 其余腿，掩盖真实失败面（v4.0.0 矩阵即如此）。

**待 Peter 一步**（我无法代做：PAT 创建属人工/网页面）：

```
gh secret set FAMILY_READ_TOKEN -R opensourceclaw/sciclaw
# 值：fine-grained PAT（Contents:Read on opensourceclaw/claw-cog ＋ Packages:Read on org）
#     或 classic PAT（repo ＋ read:packages）
```

secret 一落，CI 应直接转绿（配方与 claw-rsi 同形）。

**验证状态（如实）**：两个 workflow 的 YAML 均解析通过；配方**未在本轮端到端跑完**（需联网 clone 三仓 + 构建），故 **B2 的验收项「全矩阵 18/20/22 绿」尚未达成**。下一次 push 触发的 CI 会以明确报错给出同一结论。

## B3 发布守卫链 ✅ complete（裁剪版）

新建 `.github/workflows/release.yml`（本仓此前**无** release.yml），tag 触发、`contents: read`、**fail-closed** 两道：

1. **tag ↔ 版本互等**：同时校验 `package.json` 与 `openclaw.plugin.json`（后者历史上曾停留在 3.0.0）。`-ga` / `-ga-phaseN` 后缀先剥离 —— 三形态实测：`v4.0.0` / `v4.0.0-ga` / `v4.0.0-ga-phase2` 均正确归一为 `4.0.0`。
2. **Release 必须已存在且 body == 仓内 notes**：notes 路径先找 `docs/roadmaps/releases/<tag>/<tag>.md`，回退 `<base>/<base>.md`；比较前归一化 CRLF 与尾随换行（吸收 GitHub 追加的一个尾换行）。

**本地实证**（以 v4.0.0 的 Release body 快照为输入）：正例 **PASS**（归一后 2753 == 2753 字符）；反例（notes 被追加一行）**正确拒绝** ⇒ fail-closed 生效。

**刻意裁掉**：claw-eva/claw-rsi 守卫链中的 publish 短路段（本仓无 registry 面）——裁剪而非遗漏。

## B4 package.json 元数据 ✅ complete

- 新增 `repository`（git+https://github.com/opensourceclaw/sciclaw.git）、`homepage`、`bugs`、`files`。
- `files` 白名单 = `dist` / `README.md` / `CHANGELOG.md` / `LICENSE` / `openclaw.plugin.json` —— 为未来 npm 收口；**刻意不纳入** inbox / tests / docs / coverage。npm 默认排除 `node_modules`，但本仓 tracked 9994 文件的现实仍需在 publish 前单独收口（属 C6）。
- **未改** `description`（仍为旧定位串）——属 C2 事实校准线，避免越线。

## npm scope 占位 —— 挂起（按任务书「凭证未备则挂起并注明」）

无 npmjs 凭证：`npm whoami` 失败，`~/.npmrc` 仅含 GitHub Packages token。凭证到位后的动作（0.0.1 占位发布 `sciclaw` 与 `@sciclaw/core`）已在下方备好，待凭证另行执行：

```
npm publish --access public   # 于占位包目录（含 README，否则占位页为空）
```
注：npmjs 上 `sciclaw` 与 `@sciclaw/core` 当前均未被占用（我方 404 探针）；占位包发布后 72h 内可 unpublish。

## 对 GA 判据的当前影响（六条对照）

| 判据 | 状态 |
|------|------|
| 3. CI 全矩阵绿且公开可见 | ⏸ **阻塞于 `FAMILY_READ_TOKEN`**（本线唯一硬阻塞） |
| 4. 守卫链在位并实证一次 | ⏳ 已在位；「实证一次」将在 GA tag 时自然完成（v4.0.0 阶段为人工核验） |
| 5. 对外声明与实测一致 | 🔄 本线已清 CONTRIBUTING 品牌面；README badge(VERSION/测试数)、plugin manifest description 属 C2 |
| 其余 1/2/6 | 非本线范围（A/C/D 线） |

— Karen (ReleaseAgent), 2026-09-21
