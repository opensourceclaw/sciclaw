#!/usr/bin/env python3
"""
OpenClaw 版本追踪脚本 (DeepClaw)
用法: python scripts/track_openclaw.py

功能:
1. 检测 OpenClaw 版本变化
2. 评估对 DeepClaw 的兼容性影响
3. 记录到 CHANGELOG_TRACKING.md
"""

import subprocess
import json
import os
from datetime import datetime
from pathlib import Path

# 配置
REPO_DIR = Path(__file__).parent.parent
VERSION_FILE = REPO_DIR / ".last_openclaw_version"


def get_version(package: str) -> str:
    """获取包版本"""
    try:
        if package == "openclaw":
            result = subprocess.run(
                ["openclaw", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            output = result.stdout.strip()
            if "OpenClaw" in output:
                return output.split()[1] if len(output.split()) > 1 else "unknown"
        elif package == "deepclaw":
            # 读取 pyproject.toml
            pyproject = REPO_DIR / "pyproject.toml"
            if pyproject.exists():
                content = pyproject.read_text()
                for line in content.split('\n'):
                    if line.startswith("version"):
                        return line.split("=")[1].strip().strip('"')
    except Exception as e:
        print(f"获取 {package} 版本失败: {e}")
    return None


def get_all_versions() -> dict:
    """获取所有相关版本"""
    return {
        "openclaw": get_version("openclaw"),
        "deepclaw": get_version("deepclaw"),
    }


def load_last_versions() -> dict:
    """读取上次记录的版本"""
    if VERSION_FILE.exists():
        import json
        return json.loads(VERSION_FILE.read_text())
    return {}


def save_versions(versions: dict):
    """保存当前版本"""
    import json
    VERSION_FILE.write_text(json.dumps(versions, indent=2))


def run_compatibility_check():
    """运行兼容性检查"""
    try:
        # 基础导入测试 - 需要设置 sys.path
        result = subprocess.run(
            ["python3", "-c", 
             "import sys; sys.path.insert(0, 'src'); import deepclaw; print('OK')"],
            capture_output=True,
            text=True,
            cwd=REPO_DIR,
            timeout=30
        )
        
        if result.returncode == 0 and "OK" in result.stdout:
            return True, "模块导入正常"
        else:
            return False, f"导入失败: {result.stderr[:200]}"
    except Exception as e:
        return False, str(e)


def check_skill():
    """检查 Skill 接口"""
    try:
        # 检查 skill 目录是否存在
        skill_dir = REPO_DIR / "skill"
        if skill_dir.exists():
            return True, f"Skill 目录存在"
        return False, "Skill 目录不存在"
    except Exception as e:
        return False, str(e)


def main():
    print(f"🔍 检查 DeepClaw 依赖版本...")
    
    current_versions = get_all_versions()
    last_versions = load_last_versions()
    
    print(f"\n  当前版本:")
    for pkg, ver in current_versions.items():
        print(f"    {pkg}: {ver}")
    
    print(f"\n  上次版本:")
    for pkg, ver in last_versions.items():
        print(f"    {pkg}: {ver}")
    
    # 检查是否有变化
    has_changes = current_versions != last_versions
    
    if not has_changes:
        print("\n✅ 版本无变化")
        return
    
    print(f"\n⚠️ 检测到版本变化，触发兼容性检查...")
    
    # 检查各项功能
    results = []
    
    # 1. 模块导入
    ok, msg = run_compatibility_check()
    results.append(("模块导入", ok, msg))
    print(f"  {'✅' if ok else '❌'} 模块导入: {msg}")
    
    # 2. Skill 接口
    ok, msg = check_skill()
    results.append(("Skill", ok, msg))
    print(f"  {'✅' if ok else '❌'} Skill: {msg}")
    
    # 总结
    all_ok = all(r[1] for r in results)
    
    print(f"\n{'✅ 兼容性检查通过' if all_ok else '⚠️ 兼容性检查发现问题'}")
    
    # 保存新版本
    save_versions(current_versions)
    print(f"\n已保存版本信息")


if __name__ == "__main__":
    main()
