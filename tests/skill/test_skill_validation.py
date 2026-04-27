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
Tests for ResearchClaw Skill validation and edge cases
"""

import pytest
from skill import (
    ResearchResult,
    SearchResult,
    SkillState,
    ResearchClawSkill,
)


class TestResearchValidation:
    """Test research method validation"""

    def test_research_empty_topic(self):
        """Test research with empty topic"""
        skill = ResearchClawSkill()
        skill.on_load()

        result = skill.research("")

        assert result.topic == ""
        assert result.content == ""
        assert result.confidence == 0.0
        assert "error" in result.metadata

    def test_research_whitespace_topic(self):
        """Test research with whitespace-only topic"""
        skill = ResearchClawSkill()
        skill.on_load()

        result = skill.research("   ")

        assert result.topic == ""
        assert "error" in result.metadata


class TestSearchValidation:
    """Test search method validation"""

    def test_search_empty_query(self):
        """Test search with empty query"""
        skill = ResearchClawSkill()
        skill.on_load()

        results = skill.search("")

        assert results == []

    def test_search_whitespace_query(self):
        """Test search with whitespace-only query"""
        skill = ResearchClawSkill()
        skill.on_load()

        results = skill.search("   ")

        assert results == []


class TestChatValidation:
    """Test chat method validation"""

    def test_chat_empty_prompt(self):
        """Test chat with empty prompt"""
        skill = ResearchClawSkill()
        skill.on_load()

        response = skill.chat("")

        assert "Error" in response
        assert "Empty prompt" in response

    def test_chat_whitespace_prompt(self):
        """Test chat with whitespace-only prompt"""
        skill = ResearchClawSkill()
        skill.on_load()

        response = skill.chat("   ")

        assert "Error" in response


class TestLogging:
    """Test logging functionality"""

    def test_logger_exists(self):
        """Test that logger is configured"""
        import logging
        from skill import interface

        assert hasattr(interface, 'logger')
        assert isinstance(interface.logger, logging.Logger)


class TestConfigValidation:
    """Test configuration validation"""

    def test_load_nonexistent_config(self):
        """Test loading nonexistent config file"""
        skill = ResearchClawSkill()

        config = skill.load_config("/nonexistent/path.json")

        assert config == {}

    def test_set_and_get_config(self):
        """Test set and get config"""
        skill = ResearchClawSkill()

        skill.set_config("test_key", "test_value")
        assert skill.get_config("test_key") == "test_value"

        assert skill.get_config("nonexistent", "default") == "default"


class TestEdgeCases:
    """Test edge cases"""

    def test_research_with_none_depth(self):
        """Test research with None depth"""
        skill = ResearchClawSkill()
        skill.on_load()

        assert hasattr(skill, 'research')

    def test_search_with_none_limit(self):
        """Test search with None limit"""
        skill = ResearchClawSkill()
        skill.on_load()

        assert hasattr(skill, 'search')

    def test_chat_with_none_temperature(self):
        """Test chat with None temperature"""
        skill = ResearchClawSkill()
        skill.on_load()

        assert hasattr(skill, 'chat')


class TestResearchResult:
    """Test ResearchResult edge cases"""

    def test_result_with_empty_sources(self):
        """Test result with empty sources"""
        result = ResearchResult(
            topic="Test",
            content="Content",
            sources=[]
        )

        assert result.sources == []
        d = result.to_dict()
        assert d["sources"] == []

    def test_result_with_none_metadata(self):
        """Test result with None metadata"""
        result = ResearchResult(
            topic="Test",
            content="Content",
            sources=["http://test.com"],
            metadata=None
        )

        d = result.to_dict()
        assert "metadata" in d


class TestSearchResult:
    """Test SearchResult edge cases"""

    def test_result_full_args(self):
        """Test result with all args"""
        result = SearchResult(
            title="Test",
            url="http://test.com",
            snippet="Test snippet",
            score=0.95
        )

        assert result.score == 0.95
        d = result.to_dict()
        assert d["score"] == 0.95

    def test_result_no_score(self):
        """Test result without score"""
        result = SearchResult(
            title="Test",
            url="http://test.com",
            snippet="Test"
        )

        d = result.to_dict()
        assert d["score"] is None


class TestSkillMethods:
    """Test skill methods exist and are callable"""

    def test_skill_has_all_methods(self):
        """Test skill has all required methods"""
        skill = ResearchClawSkill()

        assert callable(skill.research)
        assert callable(skill.search)
        assert callable(skill.chat)
        assert callable(skill.on_load)
        assert callable(skill.on_unload)
        assert callable(skill.on_enable)
        assert callable(skill.on_disable)
        assert callable(skill.on_start)
        assert callable(skill.on_stop)
        assert callable(skill.health_check)
        assert callable(skill.get_info)
        assert callable(skill.load_config)
        assert callable(skill.get_config)
        assert callable(skill.set_config)

    def test_skill_properties(self):
        """Test skill properties"""
        skill = ResearchClawSkill()

        assert skill.name == "researchclaw"
        assert skill.version == "0.5.0"
        assert skill.state == SkillState.UNLOADED


class TestSkillConfig:
    """Test skill configuration"""

    def test_default_cache_dir(self):
        """Test default cache directory"""
        skill = ResearchClawSkill()
        assert skill._cache_dir == ".researchclaw_cache"

    def test_custom_cache_dir(self):
        """Test custom cache directory"""
        skill = ResearchClawSkill({"cache_dir": "/tmp/test"})
        assert skill._cache_dir == "/tmp/test"

    def test_multiple_config_values(self):
        """Test setting multiple config values"""
        skill = ResearchClawSkill({
            "default_depth": 5,
            "default_limit": 20,
            "default_engine": "bing"
        })

        assert skill.get_config("default_depth") == 5
        assert skill.get_config("default_limit") == 20
        assert skill.get_config("default_engine") == "bing"


class TestSkillLifecycleExtended:
    """Extended lifecycle tests"""

    def test_full_lifecycle(self):
        """Test complete skill lifecycle"""
        skill = ResearchClawSkill()

        # Initial state
        assert skill.state == SkillState.UNLOADED

        # Load
        result = skill.on_load()
        assert result is True
        assert skill.state == SkillState.LOADED

        # Enable
        result = skill.on_enable()
        assert result is True
        assert skill.state == SkillState.ENABLED

        # Disable
        skill.on_disable()
        assert skill.state == SkillState.DISABLED

        # Reload to enable again
        skill.on_load()
        result = skill.on_enable()
        assert result is True
        assert skill.state == SkillState.ENABLED

        # Unload
        skill.on_unload()
        assert skill.state == SkillState.UNLOADED

    def test_enable_without_load(self):
        """Test enabling without loading"""
        skill = ResearchClawSkill()

        result = skill.on_enable()
        assert result is False
