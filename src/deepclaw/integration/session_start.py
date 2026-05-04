"""
Research Session Start Hook

Injects memory context and learned preferences into DeepClaw research sessions.
This hook runs at session start to provide the agent with relevant historical context.
"""

from pathlib import Path
from typing import Any, Dict, Optional

from .memory_integration import DeepClawMemoryIntegration
from .research_context import ResearchContextBuilder


class ResearchSessionStartHook:
    """
    Session start hook for DeepClaw research sessions.

    Loads relevant memories and learned rules at session start,
    formats them into an injectable context string for the agent.

    Usage:
        hook = ResearchSessionStartHook(workspace_dir=Path("/workspace"))
        context = hook.run(scenario="research")
        # context is a string ready for prompt injection
    """

    def __init__(self, workspace_dir: Optional[Path] = None):
        self.workspace = workspace_dir or Path.cwd()
        self.integration = DeepClawMemoryIntegration(workspace_dir=self.workspace)
        self.context_builder = ResearchContextBuilder()

    def run(self, scenario: str = "research", **kwargs) -> str:
        """
        Execute the session start hook and return injectable context.

        Args:
            scenario: Session scenario type (research, search, general).
            **kwargs: Additional context (topic, query, etc.)

        Returns:
            Formatted context string for prompt injection.
        """
        if scenario == "research":
            return self._run_research_scenario(**kwargs)
        elif scenario == "search":
            return self._run_search_scenario(**kwargs)
        else:
            return self._run_general_scenario(**kwargs)

    def _run_research_scenario(self, topic: str = "", query: str = "",
                               depth: str = "standard", **kwargs) -> str:
        """Build context for research scenario."""
        search_query = query or topic or "research best practices"

        # 1. Load relevant memories
        memories = []
        if self.integration.mem_available:
            memories = self.integration.search_memories(search_query, top_k=10)

        # 2. Load learned preferences/rules
        rules = []
        if self.integration.rl_available:
            rules = self.integration.get_learned_rules(context=search_query, top_k=10)

        # 3. Build combined context
        context = self.context_builder.build_full_context(
            query=topic or query,
            memories=memories,
            rules=rules,
        )

        # 4. Record context injection metadata
        if self.integration.mem_available:
            self._record_context_injection(topic, len(memories), len(rules))

        return context

    def _run_search_scenario(self, query: str = "", **kwargs) -> str:
        """Build context for search scenario."""
        memories = []
        rules = []

        if self.integration.mem_available:
            memories = self.integration.search_memories(
                query or "search techniques", top_k=5
            )

        if self.integration.rl_available:
            rules = self.integration.get_learned_rules(context=query, top_k=5)

        return self.context_builder.build_full_context(
            query=query, memories=memories, rules=rules
        )

    def _run_general_scenario(self, **kwargs) -> str:
        """Build context for general scenario (minimal injection)."""
        memories = []
        rules = []

        if self.integration.mem_available:
            memories = self.integration.search_memories("important context", top_k=5)
        if self.integration.rl_available:
            rules = self.integration.get_learned_rules(top_k=5)

        return self.context_builder.build_full_context(memories=memories, rules=rules)

    def _record_context_injection(self, topic: str, mem_count: int, rule_count: int):
        """Record that context was injected for audit trail."""
        try:
            metadata = {
                "source": "deepclaw-session-start",
                "type": "research-context",
                "topic": topic or "unknown",
                "memories_injected": mem_count,
                "rules_injected": rule_count,
                "scenario": "research",
            }
            self.integration.store_memory(
                f"DeepClaw research session started. "
                f"Loaded {mem_count} memories and {rule_count} rules.",
                memory_type="episodic",
                metadata=metadata,
            )
        except Exception:
            pass  # Non-critical; log silently

    def get_status(self) -> Dict[str, Any]:
        """Return hook status for monitoring."""
        return {
            "mem_available": self.integration.mem_available,
            "rl_available": self.integration.rl_available,
            "workspace": str(self.workspace),
        }

    def get_session_injection_path(self) -> str:
        """Return the path where session injections are stored."""
        return str(self.workspace / "data" / "deepclaw" / "injections")

    # ---- Convenience for storing research feedback -----------------------

    def on_research_complete(self, topic: str, findings_count: int,
                             feedback: str = "") -> Optional[Dict]:
        """Store research results and optionally learn from feedback."""
        if self.integration.mem_available:
            self.integration.store_research(topic, [
                {"title": f"Research completed: {topic}",
                 "content": f"Generated {findings_count} findings."}
            ])

        if feedback and self.integration.rl_available:
            return self.integration.learn_from_feedback(
                feedback=feedback,
                action="research_complete",
                context=topic,
            )
        return None
