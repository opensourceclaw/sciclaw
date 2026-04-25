# Copyright 2026 OpenClaw
"""
Search Module
"""

from .providers import (
    SearchResult,
    SearchProvider,
    SearchProviderRegistry,
    register_provider,
)

__all__ = [
    "SearchResult",
    "SearchProvider",
    "SearchProviderRegistry",
    "register_provider",
    "providers",
]
