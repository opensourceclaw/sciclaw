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
Tests for ResearchClaw Skill Module
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from skill import (
    ResearchResult,
    SearchResult,
    SkillState,
    BaseResearchSkill,
    ResearchClawSkill,
    create_skill,
)


class TestResearchResult:
    """Test ResearchResult dataclass"""

    def test_creation(self):
        """Test creating ResearchResult"""
        result = ResearchResult(
            topic="Test Topic",
            content="Test content",
            sources=["http://example.com"],
            confidence=0.8,
            metadata={"version": "0.5.0"}
        )

        assert result.topic == "Test Topic"
        assert result.content == "Test content"
        assert result.sources == ["http://example.com"]
        assert result.confidence == 0.8

    def test_to_dict(self):
        """Test to_dict method"""
        result = ResearchResult(
            topic="Test",
            content="Content",
            sources=["source1"],
            confidence=0.5
        )

        d = result.to_dict()
        assert d["topic"] == "Test"
        assert d["content"] == "Content"
        assert d["sources"] == ["source1"]
        assert d["confidence"] == 0.5


class TestSearchResult:
    """Test SearchResult dataclass"""

    def test_creation(self):
        """Test creating SearchResult"""
        result = SearchResult(
            title="Test Title",
            url="http://example.com",
            snippet="Test snippet",
            score=0.9
        )

        assert result.title == "Test Title"
        assert result.url == "http://example.com"
        assert result.snippet == "Test snippet"
        assert result.score == 0.9

    def test_to_dict(self):
        """Test to_dict method"""
        result = SearchResult(
            title="Title",
            url="http://test.com",
            snippet="Snippet"
        )

        d = result.to_dict()
        assert d["title"] == "Title"
        assert d["url"] == "http://test.com"
        assert d["snippet"] == "Snippet"
        assert d["score"] is None


class TestSkillState:
    """Test SkillState enum"""

    def test_states(self):
        """Test all skill states"""
        assert SkillState.UNLOADED.value == "unloaded"
        assert SkillState.LOADED.value == "loaded"
        assert SkillState.ENABLED.value == "enabled"
        assert SkillState.DISABLED.value == "disabled"
        assert SkillState.ERROR.value == "error"


class TestBaseResearchSkill:
    """Test BaseResearchSkill abstract class"""

    def test_cannot_instantiate_directly(self):
        """Test that BaseResearchSkill cannot be instantiated"""
        with pytest.raises(TypeError):
            BaseResearchSkill()

    def test_get_info(self):
        """Test get_info method"""

        class TestSkill(BaseResearchSkill):
            def research(self, topic, **kwargs):
                pass

            def search(self, query, **kwargs):
                pass

            def chat(self, prompt, **kwargs):
                pass

        skill = TestSkill()
        info = skill.get_info()

        assert info["name"] == "deepclaw"
        assert info["version"] == "0.5.0"
        assert "description" in info


class TestResearchClawSkill:
    """Test ResearchClawSkill class"""

    def test_creation(self):
        """Test creating ResearchClawSkill"""
        skill = ResearchClawSkill()
        assert skill.name == "deepclaw"
        assert skill.version == "0.5.0"
        assert skill.state == SkillState.UNLOADED

    def test_creation_with_config(self):
        """Test creating with config"""
        config = {"default_depth": 5, "cache_dir": "/tmp/test"}
        skill = ResearchClawSkill(config)

        assert skill.get_config("default_depth") == 5
        assert skill.get_config("cache_dir") == "/tmp/test"

    def test_config_methods(self):
        """Test configuration methods"""
        skill = ResearchClawSkill()

        skill.set_config("test_key", "test_value")
        assert skill.get_config("test_key") == "test_value"
        assert skill.get_config("nonexistent", "default") == "default"

    def test_lifecycle(self):
        """Test lifecycle methods"""
        skill = ResearchClawSkill()

        # Test on_load
        result = skill.on_load()
        assert result is True
        assert skill.state == SkillState.LOADED

        # Test on_enable
        result = skill.on_enable()
        assert result is True
        assert skill.state == SkillState.ENABLED

        # Test on_disable
        skill.on_disable()
        assert skill.state == SkillState.DISABLED

        # Test on_unload
        skill.on_unload()
        assert skill.state == SkillState.UNLOADED

    def test_health_check(self):
        """Test health_check method"""
        skill = ResearchClawSkill()
        skill.on_load()

        health = skill.health_check()
        assert health["healthy"] is True
        assert health["state"] == "loaded"
        assert "modules_loaded" in health


class TestCreateSkill:
    """Test create_skill factory function"""

    def test_create_skill(self):
        """Test factory function"""
        skill = create_skill()
        assert isinstance(skill, ResearchClawSkill)

    def test_create_with_config(self):
        """Test factory with config"""
        config = {"default_depth": 10}
        skill = create_skill(config)
        assert skill.get_config("default_depth") == 10


class TestSkillIntegration:
    """Integration tests for skill module"""

    def test_full_workflow(self):
        """Test complete skill workflow"""
        # Create skill with config
        config = {
            "default_depth": 3,
            "default_limit": 5,
            "default_engine": "duckduckgo"
        }
        skill = ResearchClawSkill(config)

        # Load skill
        assert skill.on_load() is True
        assert skill.state == SkillState.LOADED

        # Enable skill
        assert skill.on_enable() is True
        assert skill.state == SkillState.ENABLED

        # Get info
        info = skill.get_info()
        assert info["name"] == "deepclaw"
        assert info["version"] == "0.5.0"

        # Health check
        health = skill.health_check()
        assert health["healthy"] is True

        # Disable and unload
        skill.on_disable()
        assert skill.state == SkillState.DISABLED

        skill.on_unload()
        assert skill.state == SkillState.UNLOADED
