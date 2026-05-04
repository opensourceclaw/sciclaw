"""
Research Context Builder

Formats memory results and learned rules into injectable context strings
for DeepClaw research sessions.
"""

from typing import Any, Dict, List, Optional


class ResearchContextBuilder:
    """Builds formatted context strings from memory and learning data."""

    MAX_MEMORY_LENGTH = 3000
    MAX_RULES_LENGTH = 1000

    @classmethod
    def build_memory_context(cls, memories: List[Dict], max_length: int = None) -> str:
        """Format memories into a context string for prompt injection."""
        if not memories:
            return ""

        max_len = max_length or cls.MAX_MEMORY_LENGTH
        lines = ["## Related Memories", ""]

        for i, mem in enumerate(memories, 1):
            text = mem.get("text", mem.get("content", ""))[:500]
            score = mem.get("score", 0)
            source = mem.get("metadata", {}).get("source", "")

            line = f"{i}. {text}"
            if score > 0:
                line += f" (relevance: {score:.2f})"
            if source:
                line += f" [{source}]"
            lines.append(line)

            if len("\n".join(lines)) > max_len:
                lines.append("... (truncated)")
                break

        return "\n".join(lines)

    @classmethod
    def build_rules_context(cls, rules: List[Dict], max_length: int = None) -> str:
        """Format learned rules into context string."""
        if not rules:
            return ""

        max_len = max_length or cls.MAX_RULES_LENGTH
        lines = ["## Learned Preferences", ""]

        for i, rule in enumerate(rules, 1):
            content = rule.get("content", rule.get("response", rule.get("pattern", "")))[:300]
            score = rule.get("score", rule.get("reward", 0))
            source = rule.get("source", "")

            line = f"{i}. {content}"
            if score:
                line += f" (confidence: {score:.2f})"
            if source:
                line += f" [{source}]"
            lines.append(line)

            if len("\n".join(lines)) > max_len:
                lines.append("... (truncated)")
                break

        return "\n".join(lines)

    @classmethod
    def build_full_context(
        cls,
        query: str = "",
        memories: Optional[List[Dict]] = None,
        rules: Optional[List[Dict]] = None,
    ) -> str:
        """Build a complete injectable context string."""
        parts = []

        if query:
            parts.append(f"## Current Research Focus: {query}")
            parts.append("")

        mem_ctx = cls.build_memory_context(memories or [])
        if mem_ctx:
            parts.append(mem_ctx)
            parts.append("")

        rules_ctx = cls.build_rules_context(rules or [])
        if rules_ctx:
            parts.append(rules_ctx)
            parts.append("")

        if not parts:
            return ""

        parts.append("---")
        return "\n".join(parts)

    @classmethod
    def get_token_estimate(cls, text: str) -> int:
        """Rough token count (~4 chars per token)."""
        return max(1, len(text) // 4)
