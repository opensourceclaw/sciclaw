#!/usr/bin/env python3
"""
Example 5: Research with Output
Run: python examples/05_output.py
"""

import sys
import os
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from skill import ResearchClawSkill


def main():
    print("=" * 50)
    print("Example 5: Research with Output")
    print("=" * 50)

    skill = ResearchClawSkill()
    skill.on_load()

    # Create temp directory for output
    with tempfile.TemporaryDirectory() as tmpdir:
        # Save as markdown
        md_path = os.path.join(tmpdir, "report.md")
        print(f"\nResearching with markdown output...")
        result = skill.research(
            "climate change",
            depth=2,
            output=md_path,
            format="markdown"
        )
        print(f"  Saved to: {md_path}")

        # Check file exists
        if os.path.exists(md_path):
            size = os.path.getsize(md_path)
            print(f"  File size: {size} bytes")

        # Save as JSON
        json_path = os.path.join(tmpdir, "report.json")
        print(f"\nResearching with JSON output...")
        result = skill.research(
            "climate change",
            depth=2,
            output=json_path,
            format="json"
        )
        print(f"  Saved to: {json_path}")

        if os.path.exists(json_path):
            size = os.path.getsize(json_path)
            print(f"  File size: {size} bytes")

    skill.on_unload()
    print("\n✓ Output demo complete!")


if __name__ == "__main__":
    main()
