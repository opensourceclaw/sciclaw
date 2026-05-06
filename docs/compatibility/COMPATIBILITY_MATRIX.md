# DeepClaw 兼容性矩阵

> 记录 DeepClaw 与 OpenClaw 版本的兼容关系

## 📋 版本对应表

| DeepClaw | OpenClaw | 状态 | Skill 接口 | SDK | 备注 |
|----------|----------|------|------------|-----|------|
| v0.5.0 | ≥2026.5.3 | ✅ 兼容 | v3 | openclaw SDK | 当前版本 |
| v0.4.0 | 2026.5.x | ✅ 兼容 | v3 | openclaw SDK | 上一版本 |
| v0.3.0 | 2026.4.x | ✅ 兼容 | v2 | openclaw SDK | - |
| v0.1-0.2 | 2026.3.x | ⚠️ 旧版 | v1 | openclaw SDK | 已归档 |

---

## 🔗 定位：纵向整合

```
OpenClaw (主入口，用户习惯不变)
    ↓ 纵向整合
DeepClaw (深度研究能力增强)
    ↓ 依赖
openclaw SDK + Skill 接口
    ↓
claw-mem / claw-rl (底层组件)
```

**核心理念**：不改变用户使用 OpenClaw 的习惯，为 OpenClaw 赋予深度研究能力。

---

## 🔧 Skill 接口 (openclaw.plugin.json)

### interface v3 (当前)

```json
{
  "commands": [
    {
      "name": "/research",
      "description": "Conduct deep research on any topic"
    }
  ]
}
```

### interface v2

```json
{
  "commands": [
    {
      "name": "/research"
    }
  ]
}
```

---

## ✅ 兼容性测试检查项

每次 OpenClaw 更新后，执行以下检查：

- [ ] Python 模块导入正常
- [ ] /research 命令可用
- [ ] CLI 功能正常
- [ ] Web UI 正常
- [ ] Skill 激活成功

---

## 📝 更新日志

| 日期 | DeepClaw | OpenClaw | 变更 |
|------|----------|----------|------|
| 2026-05-05 | v0.5.0 | 2026.5.3-1 | 初始记录 |

---

## 🔗 相关链接

- [DeepClaw GitHub](https://github.com/opensourceclaw/deepclaw)
- [OpenClaw Docs](https://docs.openclaw.ai)
- [ClawHub](https://clawhub.ai)
