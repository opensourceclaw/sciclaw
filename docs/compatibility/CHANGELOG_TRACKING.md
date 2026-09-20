# 变更追踪流程 (SciClaw)

> 如何跟踪 OpenClaw 变化并保持兼容

## 🎯 目标

- 监控 OpenClaw 变化对 SciClaw 的影响
- 保持「纵向整合」定位：增强而非改变
- 确保 Skill 接口和 SDK 兼容性

---

## 📡 依赖链

SciClaw 通过两层依赖 OpenClaw：

```
OpenClaw (底层)
    ├── Skill 接口 (/research 命令)
    └── openclaw SDK (Python 包)
           ↓
      SciClaw (应用层)
```

---

## 📡 信息来源

### 1. 官方渠道

| 渠道 | 频率 | 关注内容 |
|------|------|----------|
| [OpenClaw GitHub Releases](https://github.com/openclaw/openclaw/releases) | 每天 | Release Notes, Breaking Changes |
| [OpenClaw Docs](https://docs.openclaw.ai) | 随时 | Skill API 变更, SDK 变更 |
| [ClawHub](https://clawhub.ai) | 每周 | Skill 注册/配置变更 |

### 2. 版本检测

```bash
# 检查 OpenClaw 版本
openclaw --version

# 检查 SciClaw 版本
deepclaw --version 2>/dev/null || grep version pyproject.toml
```

---

## 🔄 追踪频率

| 策略 | 频率 | 适用场景 |
|------|------|----------|
| 每日检查 | 每天一次 | 快速迭代期 |
| 双周检查 | 每两周 | 稳定期 |

**建议**：采用「双周检查 + 紧急响应」模式

---

## 📋 响应流程

### Step 1: 检测变化

```bash
python scripts/track_openclaw.py
```

### Step 2: 评估影响

| 变更来源 | 影响程度 | 响应 |
|----------|----------|------|
| Skill 命令格式变化 | 🔴 高 | 立即适配 /research 命令 |
| openclaw SDK API 变化 | 🔴 高 | 更新 SDK 调用代码 |
| 插件接口变化 | 🟡 中 | 评估后适配 |
| Bug Fix | 🟢 低 | 记录，测试后更新 |

### Step 3: 执行适配

1. 更新 `COMPATIBILITY_MATRIX.md`
2. 适配代码
3. 运行测试
4. 发布新版本

---

## 📊 追踪记录模板

```markdown
## 2026-05-05

### OpenClaw 检查
- 版本: 2026.5.3-1
- 变更: Skill v3 接口

### 兼容性评估
- [x] /research 命令: ✅ 正常
- [x] CLI: ✅ 正常
- [x] SDK: ✅ 兼容

### 结论
- SciClaw v0.5.0 兼容，无需更新
```

---

## 🛠️ 自动化脚本

创建 `scripts/track_openclaw.py`（见下）

---

## 📅 定期回顾

每月进行一次兼容性回顾。

---

## 🔗 相关文件

- `COMPATIBILITY_MATRIX.md` - 版本兼容表
- `scripts/track_openclaw.py` - 追踪脚本
