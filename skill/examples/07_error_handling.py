#!/usr/bin/env python3
"""
Example 7: Error Handling
Run: python examples/07_error_handling.py
"""

import sys
import os

# Add skill to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def main():
    print("=" * 50)
    print("Example 7: Error Handling")
    print("=" * 50)

    skill = ResearchClawSkill()
    skill.on_load()

    # Example 1: Check health before operation
    print("\n1. Checking skill health...")
    health = skill.health_check()
    if health["healthy"]:
        print("   ✓ Skill is healthy")
    else:
        print(f"   ✗ Skill error: {health.get('error')}")

    # Example 2: Handle empty topic
    print("\n2. Handling empty topic...")
    try:
        result = skill.research("")
        print(f"   Result: {result.topic}")
    except Exception as e:
        print(f"   ✗ Error (expected): {type(e).__name__}")

    # Example 3: Handle invalid engine
    print("\n3. Handling invalid engine...")
    try:
        # This will use default engine since invalid one is ignored
        result = skill.search("test", engine="invalid_engine")
        print(f"   ✓ Search worked (used default engine)")
    except Exception as e:
        print(f"   ✗ Error: {e}")

    # Example 4: Check state
    print("\n4. Checking skill state...")
    print(f"   Current state: {skill.state.value}")

    # Example 5: Graceful disable
    print("\n5. Graceful disable...")
    skill.on_disable()
    print(f"   State after disable: {skill.state.value}")

    skill.on_unload()
    print("\n✓ Error handling demo complete!")


if __name__ == "__main__":
    main()
