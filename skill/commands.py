"""
ResearchClaw Command Handler
Implements OpenClaw slash commands for ResearchClaw
"""

import re
import json
from typing import Dict, Any, List, Optional
from skill.interface import ResearchClawSkill, ResearchResult, SearchResult


class CommandParser:
    """Parse and validate ResearchClaw commands"""

    # Command patterns
    RESEARCH_PATTERN = re.compile(r'^/research\s+(.+?)(?:\s+--(\w+)\s+(\S+))*$')
    SEARCH_PATTERN = re.compile(r'^/search\s+(.+?)(?:\s+--(\w+)\s+(\S+))*$')
    LLM_PATTERN = re.compile(r'^/llm\s+(.+?)(?:\s+--(\w+)\s+(\S+))*$')

    @staticmethod
    def parse_research_args(args_str: str) -> Dict[str, Any]:
        """Parse /research command arguments

        Args:
            args_str: Arguments string after /research

        Returns:
            Dict: Parsed arguments
        """
        # Simple parsing: topic and key=value pairs
        # Handle: topic with spaces, --key value, key=value, --flag
        result = {'depth': 3}

        # Find the topic (everything up to first -- or key=)
        import re
        match = re.match(r'^([^-][^=]*?)(?:\s+--|\s+\w+=|$)', args_str.strip())
        if match:
            result['topic'] = match.group(1).strip()
        else:
            result['topic'] = args_str.strip()

        # Parse key=value pairs (with or without --)
        kv_pattern = re.compile(r'(?:--)?(\w+)=(\S+)')
        for match in kv_pattern.finditer(args_str):
            key, value = match.groups()
            if value.isdigit():
                value = int(value)
            elif value.lower() in ('true', 'false'):
                value = value.lower() == 'true'
            result[key] = value

        # Parse --flag format (no =)
        flag_pattern = re.compile(r'\s+--(\w+)(?:\s+|$)')
        for match in flag_pattern.finditer(args_str):
            result[match.group(1)] = True

        return result

    @staticmethod
    def parse_search_args(args_str: str) -> Dict[str, Any]:
        """Parse /search command arguments"""
        result = {'limit': 10}

        # Find the query (everything up to first -- or key=)
        import re
        match = re.match(r'^([^-][^=]*?)(?:\s+--|\s+\w+=|$)', args_str.strip())
        if match:
            result['query'] = match.group(1).strip()
        else:
            result['query'] = args_str.strip()

        # Parse key=value pairs (with or without --)
        kv_pattern = re.compile(r'(?:--)?(\w+)=(\S+)')
        for match in kv_pattern.finditer(args_str):
            key, value = match.groups()
            if value.isdigit():
                value = int(value)
            result[key] = value

        return result


class ResearchCommandHandler:
    """Handle OpenClaw commands for ResearchClaw"""

    def __init__(self, skill: Optional[ResearchClawSkill] = None):
        """Initialize command handler

        Args:
            skill: ResearchClaw skill instance
        """
        self.skill = skill or ResearchClawSkill()
        self.skill.on_load()
        self.parser = CommandParser()

    def handle_command(self, command: str) -> Dict[str, Any]:
        """Handle incoming command

        Args:
            command: Command string (e.g., "/research AI trends")

        Returns:
            Dict: Command result with status, content, and metadata
        """
        command = command.strip()

        # Route to appropriate handler
        if command.startswith('/research '):
            return self.handle_research(command)
        elif command.startswith('/search '):
            return self.handle_search(command)
        elif command.startswith('/llm '):
            return self.handle_llm(command)
        elif command == '/help':
            return self.handle_help()
        elif command == '/health':
            return self.handle_health()
        else:
            return {
                'success': False,
                'error': f'Unknown command: {command}',
                'message': 'Use /help for available commands'
            }

    def handle_research(self, command: str) -> Dict[str, Any]:
        """Handle /research command

        Args:
            command: Full command string

        Returns:
            Dict: Research result
        """
        # Extract args
        args_str = command[len('/research '):]
        args = self.parser.parse_research_args(args_str)

        try:
            result = self.skill.research(**args)
            return {
                'success': True,
                'type': 'research',
                'topic': result.topic,
                'content': result.content,
                'sources': result.sources,
                'confidence': result.confidence,
                'metadata': result.metadata
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'type': 'research'
            }

    def handle_search(self, command: str) -> Dict[str, Any]:
        """Handle /search command"""
        args_str = command[len('/search '):]
        args = self.parser.parse_search_args(args_str)

        try:
            results = self.skill.search(**args)
            return {
                'success': True,
                'type': 'search',
                'query': args.get('query'),
                'results': [r.to_dict() for r in results],
                'count': len(results)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'type': 'search'
            }

    def handle_llm(self, command: str) -> Dict[str, Any]:
        """Handle /llm command"""
        args_str = command[len('/llm '):]

        # Simple parsing: prompt and optional --provider
        parts = args_str.split(' --')
        prompt = parts[0].strip()
        kwargs = {}

        if len(parts) > 1:
            for part in parts[1:]:
                if ' ' in part:
                    key, value = part.split(' ', 1)
                    kwargs[key] = value

        try:
            response = self.skill.chat(prompt, **kwargs)
            return {
                'success': True,
                'type': 'llm',
                'prompt': prompt,
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'type': 'llm'
            }

    def handle_help(self) -> Dict[str, Any]:
        """Handle /help command"""
        return {
            'success': True,
            'type': 'help',
            'commands': {
                '/research <topic> [--depth=3] [--engine=duckduckgo] [--output=path] [--format=markdown]':
                    'Research a topic deeply',
                '/search <query> [--limit=10] [--engine=duckduckgo]':
                    'Search for information',
                '/llm <prompt> [--provider=deepseek] [--model=...] [--temperature=0.7]':
                    'Chat with LLM',
                '/health': 'Check skill health',
                '/help': 'Show this help message'
            }
        }

    def handle_health(self) -> Dict[str, Any]:
        """Handle /health command"""
        health = self.skill.health_check()
        info = self.skill.get_info()

        return {
            'success': True,
            'type': 'health',
            **health,
            'info': info
        }


def format_result_as_markdown(result: Dict[str, Any]) -> str:
    """Format command result as markdown

    Args:
        result: Command result dictionary

    Returns:
        str: Formatted markdown
    """
    if not result.get('success'):
        return f"❌ Error: {result.get('error', 'Unknown error')}"

    cmd_type = result.get('type')

    if cmd_type == 'research':
        lines = [
            f"# Research: {result['topic']}",
            "",
            f"**Confidence:** {result.get('confidence', 0):.2f}",
            f"**Sources:** {len(result.get('sources', []))}",
            "",
            "---",
            "",
            result['content'][:2000],
        ]
        return "\n".join(lines)

    elif cmd_type == 'search':
        lines = [f"# Search Results: {result['query']}", ""]
        for i, r in enumerate(result.get('results', []), 1):
            lines.append(f"{i}. **{r['title']}**")
            lines.append(f"   {r['url']}")
            lines.append(f"   {r['snippet'][:100]}...")
            lines.append("")
        return "\n".join(lines)

    elif cmd_type == 'llm':
        return f"# LLM Response\n\n{result['response']}"

    elif cmd_type == 'help':
        lines = ["# ResearchClaw Commands", ""]
        for cmd, desc in result.get('commands', {}).items():
            lines.append(f"**{cmd}**")
            lines.append(f"{desc}")
            lines.append("")
        return "\n".join(lines)

    elif cmd_type == 'health':
        return f"# Health Check\n\nStatus: {result.get('state')}\nHealthy: {result.get('healthy')}"

    return json.dumps(result, indent=2)


__all__ = [
    "CommandParser",
    "ResearchCommandHandler",
    "format_result_as_markdown"
]
