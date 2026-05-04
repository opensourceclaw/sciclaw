"""Tests for DeepClawPluginHooks."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from deepclaw.plugin.hooks import DeepClawPluginHooks, register_hooks


class TestDeepClawPluginHooks:
    def test_plugin_creation(self):
        hooks = DeepClawPluginHooks()
        assert hooks._initialized is False

    def test_on_load(self):
        hooks = DeepClawPluginHooks()
        result = hooks.on_load()
        assert result["status"] == "loaded"

    def test_on_unload(self):
        hooks = DeepClawPluginHooks()
        hooks._initialized = True
        result = hooks.on_unload()
        assert result["status"] == "unloaded"
        assert hooks._initialized is False

    def test_get_status_before_init(self):
        hooks = DeepClawPluginHooks()
        status = hooks.get_status()
        assert status["initialized"] is False
        assert "workspace" in status

    def test_on_feedback_no_rl(self):
        with patch(
            "deepclaw.integration.memory_integration.DeepClawMemoryIntegration"
        ) as mock_mi:
            mock_mi.return_value.rl_available = False
            hooks = DeepClawPluginHooks()
            result = hooks.on_feedback({"feedback": "good"})
            assert result["status"] == "skipped"

    def test_on_feedback_with_rl(self):
        mock_mi = MagicMock()
        mock_mi.rl_available = True
        mock_mi.learn_from_feedback.return_value = {"status": "success", "reward": 1}

        with patch(
            "deepclaw.integration.memory_integration.DeepClawMemoryIntegration",
            return_value=mock_mi,
        ):
            hooks = DeepClawPluginHooks()
            result = hooks.on_feedback({
                "feedback": "great job!",
                "action": "thumbs_up",
                "context": "research",
            })
            assert result["status"] == "ok"
            assert "learning" in result
            mock_mi.learn_from_feedback.assert_called_once_with(
                feedback="great job!",
                action="thumbs_up",
                context="research",
            )

    def test_on_feedback_exception(self):
        with patch(
            "deepclaw.integration.memory_integration.DeepClawMemoryIntegration",
            side_effect=RuntimeError("fail"),
        ):
            hooks = DeepClawPluginHooks()
            result = hooks.on_feedback({"feedback": "test"})
            assert result["status"] == "error"

    def test_on_session_start(self):
        mock_hook = MagicMock()
        mock_hook.run.return_value = "## Injected Context"

        with patch(
            "deepclaw.integration.session_start.ResearchSessionStartHook",
            return_value=mock_hook,
        ):
            hooks = DeepClawPluginHooks()
            ctx = hooks.on_session_start({
                "scenario": "research",
                "topic": "AI Ethics",
            })
            assert ctx == "## Injected Context"
            assert hooks._initialized is True
            mock_hook.run.assert_called_once_with(
                scenario="research", topic="AI Ethics", query="AI Ethics"
            )

    def test_register_hooks(self):
        hooks = register_hooks(Path("/tmp/test"))
        assert isinstance(hooks, DeepClawPluginHooks)
        assert str(hooks.workspace) == "/tmp/test"

    def test_register_hooks_default(self):
        hooks = register_hooks()
        assert isinstance(hooks, DeepClawPluginHooks)
