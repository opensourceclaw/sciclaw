#!/usr/bin/env python3
"""
ResearchClaw LLM Chat Command for OpenClaw Skill
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import argparse
from researchclaw.llm.engine import LLMEngine
from researchclaw.llm import ChatMessage, MessageRole


def main():
    parser = argparse.ArgumentParser(description='Chat with LLM')
    parser.add_argument('prompt', help='Prompt for LLM')
    parser.add_argument('--provider', '-p', default='deepseek', help='LLM provider')
    parser.add_argument('--model', '-m', help='Model name')
    parser.add_argument('--temperature', '-t', type=float, default=0.7, help='Temperature')

    args = parser.parse_args()

    # Get API key from environment
    api_key = os.environ.get(f"{args.provider.upper()}_API_KEY")

    engine = LLMEngine(provider=args.provider, model=args.model, api_key=api_key)

    messages = [ChatMessage(role=MessageRole.USER, content=args.prompt)]
    response = engine.chat(messages, temperature=args.temperature)

    print(f"Provider: {args.provider}")
    print(f"Model: {engine.model}")
    print(f"\n{response.content}")


if __name__ == '__main__':
    main()
