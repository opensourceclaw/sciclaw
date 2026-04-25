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
Tests for Config Module
"""

import pytest
import tempfile
from pathlib import Path
from researchclaw.config import Config, ConfigManager, DEFAULT_CONFIG


class TestConfig:
    """Test Config dataclass"""

    def test_default_values(self):
        """Test default config values"""
        config = Config()
        assert config.default_depth == 3
        assert config.max_results == 10
        assert config.cache_enabled is True

    def test_custom_values(self):
        """Test custom config values"""
        config = Config(default_depth=5, max_results=20)
        assert config.default_depth == 5
        assert config.max_results == 20

    def test_to_dict(self):
        """Test to_dict method"""
        config = Config()
        d = config.to_dict()
        assert isinstance(d, dict)
        assert "default_depth" in d


class TestConfigManager:
    """Test ConfigManager"""

    def test_default_config(self):
        """Test loading default config"""
        manager = ConfigManager()
        assert manager.config.default_depth == 3
        assert manager.config.cache_enabled is True

    def test_get_set(self):
        """Test get and set methods"""
        manager = ConfigManager()
        manager.set("default_depth", 5)
        assert manager.get("default_depth") == 5
        assert manager.get("nonexistent", "default") == "default"

    def test_save_load(self):
        """Test save and load config"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            temp_path = f.name

        try:
            manager = ConfigManager()
            manager.set("default_depth", 7)
            manager.save(temp_path)

            # Load in new manager
            manager2 = ConfigManager(temp_path)
            assert manager2.config.default_depth == 7
        finally:
            Path(temp_path).unlink()

    def test_create_default(self):
        """Test create_default method"""
        with tempfile.TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "config.json"
            ConfigManager.create_default(str(config_path))
            assert config_path.exists()


class TestDefaultConfig:
    """Test DEFAULT_CONFIG"""

    def test_has_required_keys(self):
        """Test default config has required keys"""
        assert "research" in DEFAULT_CONFIG
        assert "search" in DEFAULT_CONFIG
        assert "output" in DEFAULT_CONFIG
        assert "storage" in DEFAULT_CONFIG
