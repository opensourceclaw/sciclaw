"""Tests for ResearchContextBuilder."""

from deepclaw.integration.research_context import ResearchContextBuilder


class TestResearchContextBuilder:
    def test_build_memory_context_empty(self):
        assert ResearchContextBuilder.build_memory_context([]) == ""
        assert ResearchContextBuilder.build_memory_context(None) == ""

    def test_build_memory_context_with_memories(self):
        memories = [
            {"text": "Memory A", "score": 0.95, "metadata": {"source": "research"}},
            {"text": "Memory B", "score": 0.80, "metadata": {}},
        ]
        ctx = ResearchContextBuilder.build_memory_context(memories)
        assert "## Related Memories" in ctx
        assert "Memory A" in ctx
        assert "Memory B" in ctx
        assert "relevance: 0.95" in ctx
        assert "[research]" in ctx

    def test_build_memory_context_truncation(self):
        long_memory = {"text": "X" * 600, "score": 0.5, "metadata": {}}
        ctx = ResearchContextBuilder.build_memory_context(
            [long_memory, long_memory, long_memory],
            max_length=200,
        )
        assert "... (truncated)" in ctx
        assert len(ctx) <= 700

    def test_build_rules_context_empty(self):
        assert ResearchContextBuilder.build_rules_context([]) == ""

    def test_build_rules_context_with_rules(self):
        rules = [
            {"content": "Prefer markdown format", "score": 0.9, "source": "hint"},
            {"pattern": "learned", "response": "Use citations", "reward": 1, "source": "feedback"},
        ]
        ctx = ResearchContextBuilder.build_rules_context(rules)
        assert "## Learned Preferences" in ctx
        assert "Prefer markdown format" in ctx
        assert "confidence: 0.90" in ctx
        assert "[hint]" in ctx
        # Second rule uses response fallback
        assert "Use citations" in ctx

    def test_build_rules_context_truncation(self):
        many_rules = [{"content": f"Rule {i}", "score": 0.5} for i in range(50)]
        ctx = ResearchContextBuilder.build_rules_context(many_rules, max_length=300)
        assert "... (truncated)" in ctx
        assert len(ctx) <= 400

    def test_build_full_context_with_everything(self):
        memories = [{"text": "prev research on AI", "score": 0.9, "metadata": {}}]
        rules = [{"content": "cite sources", "score": 0.8, "source": "hint"}]
        ctx = ResearchContextBuilder.build_full_context(
            query="AI Safety",
            memories=memories,
            rules=rules,
        )
        assert "Current Research Focus" in ctx
        assert "AI Safety" in ctx
        assert "Related Memories" in ctx
        assert "Learned Preferences" in ctx

    def test_build_full_context_empty_all(self):
        ctx = ResearchContextBuilder.build_full_context()
        assert ctx == ""

    def test_build_full_context_query_only(self):
        ctx = ResearchContextBuilder.build_full_context(query="test")
        assert "Current Research Focus" in ctx
        assert "Related Memories" not in ctx

    def test_get_token_estimate(self):
        assert ResearchContextBuilder.get_token_estimate("") == 1
        assert ResearchContextBuilder.get_token_estimate("a" * 100) == 25

    def test_build_memory_context_with_content_fallback(self):
        """Memories with 'content' field should work (V1 format)."""
        memories = [{"content": "V1 format memory", "score": 0.7}]
        ctx = ResearchContextBuilder.build_memory_context(memories)
        assert "V1 format memory" in ctx
