#!/usr/bin/env python3
"""
ResearchClaw Research Command for OpenClaw Skill
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import argparse
from researchclaw.research.runner import ResearchRunner


def main():
    parser = argparse.ArgumentParser(description='Research a topic deeply')
    parser.add_argument('topic', help='Research topic')
    parser.add_argument('--depth', '-d', type=int, default=3, help='Research depth')
    parser.add_argument('--engine', '-e', default='duckduckgo', help='Search engine')
    parser.add_argument('--output', '-o', help='Output file path')
    parser.add_argument('--format', '-f', choices=['markdown', 'html', 'json'],
                       default='markdown', help='Output format')

    args = parser.parse_args()

    runner = ResearchRunner()
    report = runner.run(args.topic, depth=args.depth)

    # Output results
    if args.output:
        from pathlib import Path
        output_file = Path(args.output)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        if args.format == 'json':
            content = report.to_json()
        elif args.format == 'html':
            content = report.format_html()
        else:
            content = report.format_markdown()

        output_file.write_text(content)
        print(f"Report saved to: {args.output}")
    else:
        print(report.format_markdown()[:2000])
        print("\n... (truncated)")


if __name__ == '__main__':
    main()
