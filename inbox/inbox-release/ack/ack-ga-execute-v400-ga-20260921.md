# Ack: GA 执行 —— tag `v4.0.0-ga` + Release + 转 public

**Status**: **complete** —— GA tag/Release 就位、守卫链**首次实证 PASS**、仓库已转 **public**，转公开后核对项全绿
**From**: Karen (ReleaseAgent) ｜ **To**: Friday (ArchitectAgent) / Peter (Owner)
**Date**: 2026-09-21 ｜ **Task**: `inbox/inbox-release/task-ga-execute-v400-ga.md`
**就绪依据**: `inbox/inbox-results/ga-readiness-declaration-20260921.md`（六判据全绿）

---

## 执行结果

| 步骤 | 结果 |
|------|------|
| 1. notes-first | ✅ `docs/roadmaps/releases/v4.0.0-ga/v4.0.0-ga.md`（4310B）入仓，commit **`d866659`**（推送前即为 main HEAD） |
| 2. tag `v4.0.0-ga` | ✅ annotated @ `d866659`（= tag 时 main HEAD）；已推远端 |
| 3. GitHub Release | ✅ https://github.com/opensourceclaw/sciclaw/releases/tag/v4.0.0-ga（非 draft、非 prerelease、body 取自仓内 notes） |
| 4. **守卫链首次实证** | ✅ **Release guard run `35608104859` success**（tag `v4.0.0-ga`，14s）——该 workflow 的全部工作就是 ① tag↔版本互等（`package.json` + `openclaw.plugin.json`，`-ga` 后缀归一）② Release body == 仓内 notes（归一化 CRLF/尾换行）**fail-closed**。**一次通过** ⇒ 判据 4「守卫链在位并实证一次」的凭证到手（此前 v4.0.0 为人工核验） |
| 5. 转 public | ✅ 见下「转公开路径」 |
| 6. 转公开后核对 | ✅ 见下「转公开后核对」 |

## 转公开路径（方法替换，1 项）

本机 `gh 2.40.1` **不支持** `gh repo edit --visibility public --accept-visibility-change-consequences`（打印 help，**未产生任何变更**）。改用 REST：

```
gh api -X PATCH repos/opensourceclaw/sciclaw -f visibility=public
→ {"full_name":"opensourceclaw/sciclaw","private":false,"visibility":"public"}
```

## 转公开后核对（以**未认证请求**为准，即外部访客视角）

| 项 | 结果 |
|----|------|
| 仓库可公开读取 | ✅ `GET /repos/opensourceclaw/sciclaw`（无 token）→ **HTTP 200** |
| Actions 历史可见 | ✅ `GET /repos/.../actions/runs`（无 token）→ **HTTP 200** |
| README 可读 | ✅ `GET raw.githubusercontent.com/.../main/README.md` → **HTTP 200** |
| issue 模板生效 | ✅ 目录可见 4 个：`bug_report.yml` / `config.yml` / `feature_request.yml` / `research_report.yml` |
| 许可被识别 | ✅ `repos/...` → `license.spdx_id = **Apache-2.0**`（LICENSE 落仓后 GitHub 已自动识别） |

## 红线遵守

- **版本号未动**：`package.json` = 4.0.0、`openclaw.plugin.json` = 4.0.0（tag 的 `-ga` 为里程碑后缀，守卫已按归一规则校验通过）。
- **npm 未发布**：无 registry 面动作；`sciclaw` / `@sciclaw` 占位仍挂起（无 npmjs 凭证，B 线遗留）。
- **措辞上限**：GA notes 内 "verifiable" **附校准局限注**（confirmation/temporal 两因子不可测并已排除在门禁判定外；live 变体只验结构不变量；不背书正文事实正确性），事实源全部取自 readiness declaration 与 A 线证据（26/26、946 passed/4 skipped、benchmark 3/3 avg 0.769、clean-clone 15 sources/29 claims/29 verdicts/4 gates PASS），**未新增任何超出声明的宣称**。

## 未做/未验（如实）

1. **main CI 对 notes commit `d866659` 的 run** 在收尾时仍在进行（前序 `2dc48e9` 的 CI 已 success），未取到该次终值；GA 判据 3 的凭证仍是 readiness declaration 所指 run @ `7745222`（绿）+ 守卫 run 绿。
2. **body == notes 未由我另行人工比对** —— 但守卫 run 已自动执行同一判定并 pass（fail-closed 自动化，强于人工抽查）。
3. **徽章渲染**未逐一点验（依赖 shields.io 第三方渲染）；已验的是 README raw 可达 + 许可/模板/ Actions 对外可见。

## GA 后遗留（非本任务范围）

- npm scope 占位（需 npmjs 凭证）——B 线遗留项。
- v4.0.x 清理线（ROADMAP 重写、死面移除、偏差语料扩充）；v4.1 运行期契约迁移与 observe 收敛；v5.0.0 AutoResearchFlow 转正。

— Karen (ReleaseAgent), 2026-09-21
