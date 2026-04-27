#!/usr/bin/env python3
"""
Example 6: Claw-Mem Integration
Run: python examples/06_clawmem_integration.py

This example shows how to integrate ResearchClaw with claw-mem
for persistent memory of research findings.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def simulate_clawmem_save(topic, content, sources):
    """
    Simulate saving to claw-mem.
    In real usage, this would call the claw-mem API.
    """
    print(f"\n[claw-mem] Saving research about '{topic}'")
    print(f"  - Content length: {len(content)} chars")
    print(f"  - Sources: {len(sources)} items")

    # Simulated memory entry
    memory_entry = {
        "type": "research",
        "topic": topic,
        "sources": sources,
        "timestamp": "2026-04-27T10:00:00Z"
    }

    print(f"  - Memory entry created: {memory_entry['timestamp']}")
    return memory_entry


def main():
    print("=" * 50)
    print("Example 6: Claw-Mem Integration")
    print("=" * 50)

    skill = ResearchClawSkill()
    skill.on_load()

    # Research a topic
    print("\n1. Performing research on 'AI ethics'...")
    result = skill.research("AI ethics", depth=3)

    # Save to claw-mem
    print("\n2. Integrating with claw-mem...")
    memory = simulate_clawmem_save(
        result.topic,
        result.content,
        result.sources
    )

    # Research another topic
    print("\n3. Performing research on 'quantum computing'...")
    result2 = skill.research("quantum computing", depth=2)

    # Save to claw-mem
    print("\n4. Integrating with claw-mem...")
    memory2 = simulate_clawmem_save(
        result2.topic,
        result2.content,
        result2.sources
    )

    print("\n5. Research complete! Both topics saved to memory.")

    skill.on_unload()
    print("\n✓ Claw-Mem integration demo complete!")


if __name__ == "__main__":
    main()
