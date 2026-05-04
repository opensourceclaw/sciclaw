"""
DeepClaw Integration Layer

Bridges DeepClaw with claw-mem (memory) and claw-rl (learning) adapters.
Provides session start hooks and research context injection for the OpenClaw plugin.
"""

from .session_start import ResearchSessionStartHook
from .memory_integration import DeepClawMemoryIntegration
from .research_context import ResearchContextBuilder

__all__ = [
    "ResearchSessionStartHook",
    "DeepClawMemoryIntegration",
    "ResearchContextBuilder",
]
