# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Configuration Module
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict


DEFAULT_CONFIG = {
    "research": {
        "default_depth": 3,
        "max_results": 10,
        "max_content": 5,
        "timeout": 30,
    },
    "search": {
        "cache_enabled": True,
        "cache_ttl": 3600,
        "default_language": "en",
    },
    "output": {
        "default_format": "markdown",
        "default_dir": "./reports",
    },
    "storage": {
        "default_path": "./data",
    },
}


@dataclass
class Config:
    """Configuration data class"""
    default_depth: int = 3
    max_results: int = 10
    max_content: int = 5
    timeout: int = 30
    cache_enabled: bool = True
    cache_ttl: int = 3600
    default_language: str = "en"
    default_format: str = "markdown"
    default_dir: str = "./reports"
    storage_path: str = "./data"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ConfigManager:
    """Manages configuration for ResearchClaw"""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize config manager

        Args:
            config_path: Path to config file (JSON)
        """
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Config:
        """Load configuration from file or defaults

        Returns:
            Config: Configuration object
        """
        if self.config_path and Path(self.config_path).exists():
            try:
                with open(self.config_path, "r") as f:
                    data = json.load(f)
                    return self._merge_with_defaults(data)
            except Exception:
                pass

        return self._merge_with_defaults({})

    def _merge_with_defaults(self, data: Dict[str, Any]) -> Config:
        """Merge user config with defaults

        Args:
            data: User configuration

        Returns:
            Config: Merged configuration
        """
        # Flatten nested config for simplicity
        research = data.get("research", {})
        search = data.get("search", {})
        output = data.get("output", {})
        storage = data.get("storage", {})

        return Config(
            default_depth=research.get("default_depth", DEFAULT_CONFIG["research"]["default_depth"]),
            max_results=research.get("max_results", DEFAULT_CONFIG["research"]["max_results"]),
            max_content=research.get("max_content", DEFAULT_CONFIG["research"]["max_content"]),
            timeout=research.get("timeout", DEFAULT_CONFIG["research"]["timeout"]),
            cache_enabled=search.get("cache_enabled", DEFAULT_CONFIG["search"]["cache_enabled"]),
            cache_ttl=search.get("cache_ttl", DEFAULT_CONFIG["search"]["cache_ttl"]),
            default_language=search.get("default_language", DEFAULT_CONFIG["search"]["default_language"]),
            default_format=output.get("default_format", DEFAULT_CONFIG["output"]["default_format"]),
            default_dir=output.get("default_dir", DEFAULT_CONFIG["output"]["default_dir"]),
            storage_path=storage.get("default_path", DEFAULT_CONFIG["storage"]["default_path"]),
        )

    def get(self, key: str, default: Any = None) -> Any:
        """Get config value

        Args:
            key: Config key
            default: Default value

        Returns:
            Any: Config value
        """
        return getattr(self.config, key, default)

    def set(self, key: str, value: Any) -> None:
        """Set config value

        Args:
            key: Config key
            value: Value to set
        """
        setattr(self.config, key, value)

    def save(self, path: Optional[str] = None) -> None:
        """Save configuration to file

        Args:
            path: Path to save to (default: original path)
        """
        save_path = path or self.config_path
        if not save_path:
            raise ValueError("No config path specified")

        # Convert to nested structure
        data = {
            "research": {
                "default_depth": self.config.default_depth,
                "max_results": self.config.max_results,
                "max_content": self.config.max_content,
                "timeout": self.config.timeout,
            },
            "search": {
                "cache_enabled": self.config.cache_enabled,
                "cache_ttl": self.config.cache_ttl,
                "default_language": self.config.default_language,
            },
            "output": {
                "default_format": self.config.default_format,
                "default_dir": self.config.default_dir,
            },
            "storage": {
                "default_path": self.config.storage_path,
            },
        }

        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, "w") as f:
            json.dump(data, f, indent=2)

    @staticmethod
    def create_default(path: str) -> None:
        """Create default config file

        Args:
            path: Path to create config at
        """
        data = DEFAULT_CONFIG
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)


def get_config(config_path: Optional[str] = None) -> Config:
    """Get configuration

    Args:
        config_path: Path to config file

    Returns:
        Config: Configuration object
    """
    return ConfigManager(config_path).config


__all__ = ["Config", "ConfigManager", "get_config", "DEFAULT_CONFIG"]
