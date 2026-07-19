# Task: DeepClaw v3.6.0 — DevClaw 方法论改进

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-19
**Priority**: High
**Version**: v3.6.0
**Project**: deepclaw
**Project Location**: /Users/liantian/workspace/osprojects/deepclaw

---

## Background

DeepClaw 需要对齐 DevClaw 方法论，提升工程质量。

---

## Scope

### P0: 集成 claw-mem

添加依赖并使用：

```json
{
  "dependencies": {
    "claw-mem": "file:../claw-mem"
  }
}
```

新增 `src/memory-adapter.ts` — 使用 claw-mem 进行记忆管理。

---

### P1: 集成 claw-cog

```json
{
  "dependencies": {
    "claw-cog": "file:../claw-cog"
  }
}
```

新增 `src/cog-integration.ts` — 使用 claw-cog 进行认知增强。

---

### P2: 完善 Quality Gates

完善 inbox 目录结构：
- inbox-design-review/ — 设计审查
- inbox-code-review/ — 代码审查

---

### P3: 添加 ESLint + Prettier

新增配置文件：
- `.eslintrc.json`
- `.prettierrc`
- `.eslintignore`

添加 npm 脚本：
```json
{
  "lint": "eslint src --ext .ts",
  "format": "prettier --write src/**/*.ts"
}
```

---

### P4: 添加 OBSERVE + GOVERN 阶段

新增模块：
- `src/observe/metrics-collector.ts` — 指标收集
- `src/governance/` — 治理模块

---

## Version Update

更新 `package.json` 版本: `3.5.0` → `3.6.0`

---

## Acceptance Criteria

- [ ] npm run build 通过
- [ ] npm test 通过 (无回归)
- [ ] CHANGELOG.md 添加条目
- [ ] git status clean

---

## Important

- ❌ 不要创建 GitHub Release
- ✅ 只需提交代码到本地分支
- ✅ 更新 CHANGELOG.md
