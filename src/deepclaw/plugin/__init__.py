"""
DeepClaw OpenClaw Plugin

Plugin layer for DeepClaw as an OpenClaw plugin.
Provides hooks, lifecycle management, and command registration.
"""

from .hooks import DeepClawPluginHooks, register_hooks

__all__ = [
    "DeepClawPluginHooks",
    "register_hooks",
]
