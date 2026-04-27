#!/usr/bin/env python3
"""
Example 4: Custom Configuration
Run: python examples/04_config.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def main():
    print("=" * 50)
    print("Example 4: Custom Configuration")
    print("=" * 50)

    # Custom configuration
    config = {
        "default_depth": 5,
        "default_limit": 20,
        "default_engine": "duckduckgo",
        "default_provider": "deepseek",
        "default_temperature": 0.5,
        "cache_dir": "/tmp/researchclaw_cache"
    }

    skill = ResearchClawSkill(config)
    skill.on_load()

    print(f"\nConfig loaded:")
    print(f"  default_depth: {skill.get_config('default_depth')}")
    print(f"  default_limit: {skill.get_config('default_limit')}")
    print(f"  default_engine: {skill.get_config('default_engine')}")
    print(f"  cache_dir: {skill._cache_dir}")

    # Update config at runtime
    skill.set_config("custom_setting", "my_value")
    print(f"\n  custom_setting: {skill.get_config('custom_setting')}")

    # Health check
    health = skill.health_check()
    print(f"\nHealth: {health}")

    skill.on_unload()
    print("\n✓ Config demo complete!")


if __name__ == "__main__":
    main()
