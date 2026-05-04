"""
DeepClaw Plugin Hooks

Registers OpenClaw plugin hooks for session lifecycle events.
Integrates with DeepClaw's research engine and memory/learning adapters.
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional


class DeepClawPluginHooks:
    """
    OpenClaw plugin hooks for DeepClaw.

    Provides onSessionStart, onSessionEnd, and command handlers
    for the DeepClaw research agent within the OpenClaw plugin runtime.
    """

    def __init__(self, workspace_dir: Optional[Path] = None):
        self.workspace = workspace_dir or Path(os.getcwd())
        self._session_hook = None
        self._initialized = False

    def on_load(self) -> Dict[str, Any]:
        """Called when the plugin is loaded into OpenClaw."""
        return {"status": "loaded", "plugin": "deepclaw"}

    def on_unload(self) -> Dict[str, Any]:
        """Called when the plugin is unloaded."""
        self._session_hook = None
        self._initialized = False
        return {"status": "unloaded"}

    def on_session_start(self, params: Dict[str, Any]) -> str:
        """
        Called at session start. Returns context to inject into the agent.

        Args:
            params: Session parameters (scenario, topic, etc.)

        Returns:
            Context string to inject into the agent's prompt.
        """
        from deepclaw.integration.session_start import ResearchSessionStartHook

        self._session_hook = ResearchSessionStartHook(workspace_dir=self.workspace)
        self._initialized = True

        scenario = params.get("scenario", "research")
        topic = params.get("topic", "")
        query = params.get("query", topic)

        return self._session_hook.run(scenario=scenario, topic=topic, query=query)

    def on_session_end(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Called at session end. Processes learning and persists results.

        Args:
            params: Session end parameters.

        Returns:
            Status dict.
        """
        result = {"status": "ok"}

        if self._session_hook:
            topic = params.get("topic", "")
            findings_count = params.get("findings_count", 0)

            # Process learning from the session
            self._session_hook.on_research_complete(
                topic=topic,
                findings_count=findings_count,
            )

            # Trigger RL learning cycle
            try:
                from deepclaw.integration.memory_integration import DeepClawMemoryIntegration
                integration = DeepClawMemoryIntegration(workspace_dir=self.workspace)
                if integration.rl_available:
                    learning_result = integration.process_learning()
                    if learning_result:
                        result["learning"] = learning_result
            except Exception:
                pass

        return result

    def on_feedback(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle user feedback for learning.

        Args:
            params: Feedback parameters (feedback text, rating, etc.)

        Returns:
            Status dict.
        """
        try:
            from deepclaw.integration.memory_integration import DeepClawMemoryIntegration

            integration = DeepClawMemoryIntegration(workspace_dir=self.workspace)
            feedback = params.get("feedback", "")
            action = params.get("action", "feedback")

            if integration.rl_available and feedback:
                result = integration.learn_from_feedback(
                    feedback=feedback,
                    action=action,
                    context=params.get("context", ""),
                )
                if result:
                    return {"status": "ok", "learning": result}
            return {"status": "skipped", "reason": "rl_not_available"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        """Return plugin status."""
        status = {
            "initialized": self._initialized,
            "workspace": str(self.workspace),
        }
        if self._session_hook:
            status["hook_status"] = self._session_hook.get_status()
        return status


def register_hooks(workspace_dir: Optional[Path] = None) -> DeepClawPluginHooks:
    """
    Factory function to create and register DeepClaw plugin hooks.

    Args:
        workspace_dir: Optional workspace path override.

    Returns:
        Configured DeepClawPluginHooks instance.
    """
    return DeepClawPluginHooks(workspace_dir=workspace_dir)
