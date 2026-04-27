#!/usr/bin/env python3
"""
Example 2: Search with Custom Options
Run: python examples/02_search.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def main():
    print("=" * 50)
    print("Example 2: Search with Options")
    print("=" * 50)

    skill = ResearchClawSkill()
    skill.on_load()

    # Search with limit
    print("\nSearching: quantum computing (limit=5)")
    results = skill.search("quantum computing", limit=5)

    print(f"\nFound {len(results)} results:")
    for i, r in enumerate(results, 1):
        print(f"\n{i}. {r.title}")
        print(f"   URL: {r.url}")
        print(f"   Score: {r.score}")
        print(f"   Snippet: {r.snippet[:100]}...")

    skill.on_unload()
    print("\n✓ Search complete!")


if __name__ == "__main__":
    main()
