"""Tests for ResearchSessionStartHook."""

from unittest.mock import MagicMock, patch

import pytest

from deepclaw.integration.session_start import ResearchSessionStartHook


class MockIntegration:
    def __init__(self):
        self.mem_available = True
        self.rl_available = True

    def search_memories(self, query, top_k=10):
        return [{"text": f"memory about {query}", "score": 0.9, "metadata": {}}]

    def get_learned_rules(self, context="", top_k=10):
        return [{"content": "learned rule", "score": 0.8, "source": "hint"}]

    def store_memory(self, text, memory_type="episodic", metadata=None):
        return "stored-id"

    def store_research(self, topic, findings):
        return self.store_memory(f"research: {topic}", memory_type="semantic",
                                 metadata={"type": "research"})

    def learn_from_feedback(self, feedback, action="", context=""):
        return {"status": "success", "reward": 1}


class TestResearchSessionStartHook:

    @pytest.fixture
    def hook(self):
        with patch(
            "deepclaw.integration.session_start.DeepClawMemoryIntegration",
            return_value=MockIntegration(),
        ):
            return ResearchSessionStartHook()

    def test_run_research_scenario(self, hook):
        ctx = hook.run(
            scenario="research",
            topic="AI Safety",
            query="How to align AI?",
        )
        assert "Current Research Focus" in ctx
        assert "Related Memories" in ctx
        assert "Learned Preferences" in ctx
        assert "learned rule" in ctx

    def test_run_search_scenario(self, hook):
        ctx = hook.run(scenario="search", query="latest papers")
        assert "Current Research Focus" in ctx
        assert "latest papers" in ctx

    def test_run_general_scenario(self, hook):
        ctx = hook.run(scenario="general")
        assert "Related Memories" in ctx
        assert "Learned Preferences" in ctx

    def test_get_status(self, hook):
        status = hook.get_status()
        assert status["mem_available"] is True
        assert status["rl_available"] is True
        assert "workspace" in status

    def test_get_session_injection_path(self, hook):
        path = hook.get_session_injection_path()
        assert "injections" in path

    def test_on_research_complete(self, hook):
        result = hook.on_research_complete(
            topic="AI",
            findings_count=5,
            feedback="good research",
        )
        assert result is not None
        assert result["status"] == "success"

    def test_run_research_no_dependencies(self):
        mock_integration = MagicMock()
        mock_integration.mem_available = False
        mock_integration.rl_available = False
        mock_integration.search_memories.return_value = []
        mock_integration.get_learned_rules.return_value = []

        with patch(
            "deepclaw.integration.session_start.DeepClawMemoryIntegration",
            return_value=mock_integration,
        ):
            hook = ResearchSessionStartHook()
            ctx = hook.run(scenario="research", topic="test")
            assert "Current Research Focus" in ctx
            assert "Related Memories" not in ctx  # No memories available
            assert "Learned Preferences" not in ctx  # No rules available
