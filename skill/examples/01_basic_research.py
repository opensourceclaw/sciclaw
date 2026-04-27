#!/usr/bin/env python3
"""
Example 1: Basic Research
Run: python examples/01_basic_research.py
"""

import sys
import os

# Add skill to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def main():
    print("=" * 50)
    print("Example 1: Basic Research")
    print("=" * 50)

    # Create and load skill
    skill = ResearchClawSkill()
    skill.on_load()

    # Simple research
    print("\nResearching: artificial intelligence")
    result = skill.research("artificial intelligence", depth=2)

    print(f"\nTopic: {result.topic}")
    print(f"Confidence: {result.confidence:.2f}")
    print(f"Sources: {len(result.sources)}")
    print(f"\nContent Preview:")
    print(result.content[:500])
    print("...")

    # Cleanup
    skill.on_unload()
    print("\n✓ Research complete!")


if __name__ == "__main__":
    main()
