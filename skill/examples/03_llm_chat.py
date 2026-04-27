#!/usr/bin/env python3
"""
Example 3: LLM Chat
Run: python examples/03_llm_chat.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def main():
    print("=" * 50)
    print("Example 3: LLM Chat")
    print("=" * 50)

    skill = ResearchClawSkill()
    skill.on_load()

    # Chat with default provider (DeepSeek)
    print("\nChat with DeepSeek:")
    response = skill.chat("What is machine learning in one sentence?")
    print(f"Response: {response[:200]}...")

    # Note: Requires DEEPSEAK_API_KEY environment variable
    # Set it with: export DEEPSEEK_API_KEY=your_key

    skill.on_unload()
    print("\n✓ Chat complete!")


if __name__ == "__main__":
    main()
