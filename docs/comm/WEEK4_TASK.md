# ResearchClaw v0.5.0 - Week 4 任务指令

**执行者**: Jarvis
**验收者**: Friday (Friday AI)
**目标**: 完善 ResearchClaw 并发布 v0.5.0

---

## 任务清单

### Day 16: 文档完善

| 任务 | 验收标准 |
|------|----------|
| 完善 Skill 文档 | `skill/SKILL.md` 包含完整使用说明 |
| 完善 Hook 文档 | `~/.openclaw/hooks/researchclaw/HOOK.md` 完整 |
| API 文档 | 生成 `docs/API.md` 包含所有方法签名 |

### Day 17: 使用示例

| 任务 | 验收标准 |
|------|----------|
| 命令示例 | 提供 5+ 实际命令示例 |
| 集成示例 | 展示 claw-mem/claw-rl 联动用法 |
| 错误处理示例 | 展示常见错误和处理方式 |

### Day 18: Bug 修复

| 任务 | 验收标准 |
|------|----------|
| 错误处理增强 | Bridge 层 graceful degradation |
| 边界情况处理 | 空输入,超长输入等 |
| 日志完善 | 关键操作有日志输出 |

### Day 19: 最终测试

| 任务 | 验收标准 |
|------|----------|
| 单元测试覆盖 | > 85% |
| 集成测试 | 31/31 通过 |
| E2E 测试 | 手动验证核心流程 |

### Day 20: 发布

| 任务 | 验收标准 |
|------|----------|
| 版本更新 | CHANGELOG.md 更新 |
| GitHub Release | 创建 tag 和 release |
| ClawHub 发布 | `npx clawhub publish` |

---

## 关键文件位置

```
researchclaw/
├── skill/                    # Skill 接口 (已开发)
├── src/researchclaw/         # 核心代码
├── tests/skill/              # 单元测试 (57/57)
├── docs/roadmaps/            # 迭代计划

~/.openclaw/hooks/
└── researchclaw/             # Hook 接口 (已开发)
    ├── lib/bridge.py         # Python 桥接层
    ├── tests/                # Hook 测试 (31/31)
    └── config.json           # 配置文件
```

---

## 验收流程

1. **每日汇报**: 每天 17:00 前提交进度到 `comm/inbox-friday/`
2. **代码审查**: 提交 PR 前由 Friday 审查
3. **最终验收**: Friday 验证所有测试通过后批准发布

---

## 沟通方式

- 进度报告: `comm/inbox-friday/2026-04-27-jarvis-progress.md`
- 问题求助: 直接在当前 session 询问 Friday
- 代码提交: 推送到 master 分支

---

**开始时间**: 2026-04-27
**截止时间**: 2026-04-30 (4天)
