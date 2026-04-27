#!/usr/bin/env python3
"""
ResearchClaw Search Command for OpenClaw Skill
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import argparse
from researchclaw.research.search import SearchEngine


def main():
    parser = argparse.ArgumentParser(description='Search for information')
    parser.add_argument('query', help='Search query')
    parser.add_argument('--limit', '-n', type=int, default=10, help='Number of results')
    parser.add_argument('--engine', '-e', default='duckduckgo', help='Search engine')

    args = parser.parse_args()

    engine = SearchEngine(provider=args.engine)
    results = engine.search(args.query, limit=args.limit)

    print(f"Found {len(results)} results for: {args.query}\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. {result.title}")
        print(f"   {result.url}")
        print(f"   {result.snippet[:150]}...")
        print()


if __name__ == '__main__':
    main()
