"""Tests for DeepClawMemoryIntegration."""

import os
from unittest.mock import MagicMock, patch

import pytest

from deepclaw.integration.memory_integration import DeepClawMemoryIntegration


class TestMemoryIntegration:
    def test_init_no_dependencies(self):
        """Integration should work even without claw-mem/claw-rl installed."""
        with patch.dict(os.environ, {}, clear=True):
            with patch("deepclaw.integration.memory_integration.DeepClawMemoryIntegration._init_mem",
                       return_value=None):
                with patch("deepclaw.integration.memory_integration.DeepClawMemoryIntegration._init_rl",
                           return_value=None):
                    mi = DeepClawMemoryIntegration()
                    mi._mem_available = False
                    mi._rl_available = False
                    assert mi.mem_available is False
                    assert mi.rl_available is False

    def test_search_memories_unavailable(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = False
        assert mi.search_memories("test") == []

    def test_search_memories_available(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.search.return_value = [
            {"id": "1", "text": "memory one", "score": 0.9, "metadata": {}}
        ]
        mi._mem_adapter = mock_adapter

        results = mi.search_memories("test", top_k=5)
        assert len(results) == 1
        assert results[0]["text"] == "memory one"
        mock_adapter.search.assert_called_once()

    def test_store_memory_unavailable(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = False
        assert mi.store_memory("test") is None

    def test_store_memory_available(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.store.return_value = {"id": "new-id", "status": "stored"}
        mi._mem_adapter = mock_adapter

        result = mi.store_memory("test content", memory_type="semantic",
                                 metadata={"tag": "x"})
        assert result == "new-id"
        mock_adapter.store.assert_called_once()

    def test_get_memory_found(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.get.return_value = {"id": "1", "text": "found"}
        mi._mem_adapter = mock_adapter

        assert mi.get_memory("1") == {"id": "1", "text": "found"}

    def test_get_memory_not_found(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.get.return_value = {"error": "Memory not found"}
        mi._mem_adapter = mock_adapter

        assert mi.get_memory("x") is None

    def test_get_learned_rules_unavailable(self):
        mi = DeepClawMemoryIntegration()
        mi._rl_available = False
        assert mi.get_learned_rules() == []

    def test_get_learned_rules_available(self):
        mi = DeepClawMemoryIntegration()
        mi._rl_available = True
        mock_adapter = MagicMock()
        mock_adapter.get_rules.return_value = {
            "status": "success",
            "rules": [{"content": "rule1", "score": 0.8}],
            "count": 1
        }
        mi._rl_adapter = mock_adapter

        rules = mi.get_learned_rules(context="research", top_k=5)
        assert len(rules) == 1
        assert rules[0]["content"] == "rule1"
        mock_adapter.get_rules.assert_called_once_with(top_k=5, context="research")

    def test_learn_from_feedback_unavailable(self):
        mi = DeepClawMemoryIntegration()
        mi._rl_available = False
        assert mi.learn_from_feedback("bad") is None

    def test_learn_from_feedback_available(self):
        mi = DeepClawMemoryIntegration()
        mi._rl_available = True
        mock_adapter = MagicMock()
        mock_adapter.collect_feedback.return_value = {"status": "success", "reward": 1}
        mi._rl_adapter = mock_adapter

        result = mi.learn_from_feedback("good job!", "action1", "ctx")
        assert result["status"] == "success"
        mock_adapter.collect_feedback.assert_called_once_with("good job!", "action1", "ctx")

    def test_process_learning_unavailable(self):
        mi = DeepClawMemoryIntegration()
        mi._rl_available = False
        assert mi.process_learning() is None

    def test_process_learning_available(self):
        mi = DeepClawMemoryIntegration()
        mi._rl_available = True
        mock_adapter = MagicMock()
        mock_adapter.process_learning.return_value = {"status": "success", "statistics": {}}
        mi._rl_adapter = mock_adapter

        result = mi.process_learning()
        assert result["status"] == "success"
        mock_adapter.process_learning.assert_called_once()

    def test_store_research(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.store.return_value = {"id": "research-1", "status": "stored"}
        mi._mem_adapter = mock_adapter

        result = mi.store_research("AI Safety", [
            {"title": "Finding 1", "content": "details"}
        ])
        assert result == "research-1"
        call_args = mock_adapter.store.call_args[0][0]
        assert call_args["memory_type"] == "semantic"
        assert call_args["metadata"]["source"] == "deepclaw"
        assert call_args["metadata"]["type"] == "research"

    def test_get_research_context(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mi._rl_available = True

        mock_mem = MagicMock()
        mock_mem.search.return_value = [{"id": "1", "text": "memory"}]
        mi._mem_adapter = mock_mem

        mock_rl = MagicMock()
        mock_rl.get_rules.return_value = {"rules": [{"content": "rule"}]}
        mi._rl_adapter = mock_rl

        result = mi.get_research_context("AI", top_k=3)
        assert result["memory_count"] == 1
        assert result["rule_count"] == 1

    def test_search_memories_exception(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.search.side_effect = RuntimeError("fail")
        mi._mem_adapter = mock_adapter
        assert mi.search_memories("test") == []

    def test_store_memory_exception(self):
        mi = DeepClawMemoryIntegration()
        mi._mem_available = True
        mock_adapter = MagicMock()
        mock_adapter.store.side_effect = RuntimeError("fail")
        mi._mem_adapter = mock_adapter
        assert mi.store_memory("test") is None
