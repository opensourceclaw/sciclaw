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
Tests for ResearchClaw Command Handler
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from skill.commands import (
    CommandParser,
    ResearchCommandHandler,
    format_result_as_markdown,
)


class TestCommandParser:
    """Test CommandParser class"""

    def test_parse_research_args_simple(self):
        """Test parsing simple research command"""
        args = CommandParser.parse_research_args("AI trends")
        assert args["topic"] == "AI trends"
        assert args["depth"] == 3

    def test_parse_research_args_with_depth(self):
        """Test parsing research with depth"""
        args = CommandParser.parse_research_args("AI --depth=5")
        assert args["topic"] == "AI"
        assert args["depth"] == 5

    def test_parse_research_args_with_key_value(self):
        """Test parsing research with key=value"""
        args = CommandParser.parse_research_args("AI depth=5 engine=bing")
        assert args["topic"] == "AI"
        assert args["depth"] == 5
        assert args["engine"] == "bing"

    def test_parse_research_args_with_flag(self):
        """Test parsing research with flag"""
        args = CommandParser.parse_research_args("AI --verbose")
        assert args["topic"] == "AI"
        assert args["verbose"] is True

    def test_parse_search_args_simple(self):
        """Test parsing simple search command"""
        args = CommandParser.parse_search_args("machine learning")
        assert args["query"] == "machine learning"
        assert args["limit"] == 10

    def test_parse_search_args_with_limit(self):
        """Test parsing search with limit"""
        args = CommandParser.parse_search_args("AI --limit=20")
        assert args["query"] == "AI"
        assert args["limit"] == 20


class TestResearchCommandHandler:
    """Test ResearchCommandHandler class"""

    def test_creation(self):
        """Test creating handler"""
        handler = ResearchCommandHandler()
        assert handler.skill is not None

    def test_handle_unknown_command(self):
        """Test handling unknown command"""
        handler = ResearchCommandHandler()
        result = handler.handle_command("/unknown command")

        assert result["success"] is False
        assert "Unknown command" in result["error"]

    def test_handle_help(self):
        """Test handling /help command"""
        handler = ResearchCommandHandler()
        result = handler.handle_command("/help")

        assert result["success"] is True
        assert result["type"] == "help"
        assert "/research" in str(result["commands"])

    def test_handle_health(self):
        """Test handling /health command"""
        handler = ResearchCommandHandler()
        result = handler.handle_command("/health")

        assert result["success"] is True
        assert result["type"] == "health"
        assert "state" in result

    @patch('skill.commands.ResearchClawSkill')
    def test_handle_search(self, mock_skill_class):
        """Test handling /search command"""
        # Mock the search method
        mock_result = Mock()
        mock_result.title = "Test"
        mock_result.url = "http://test.com"
        mock_result.snippet = "Test snippet"
        mock_result.score = 0.9
        mock_result.to_dict.return_value = {
            "title": "Test",
            "url": "http://test.com",
            "snippet": "Test snippet",
            "score": 0.9
        }

        mock_skill = Mock()
        mock_skill.search.return_value = [mock_result]
        mock_skill.on_load.return_value = True

        handler = ResearchCommandHandler(mock_skill)
        result = handler.handle_command("/search test --limit=5")

        assert result["success"] is True
        assert result["type"] == "search"
        assert result["query"] == "test"

    @patch('skill.commands.ResearchClawSkill')
    def test_handle_search_error(self, mock_skill_class):
        """Test handling search error"""
        mock_skill = Mock()
        mock_skill.search.side_effect = Exception("Search failed")
        mock_skill.on_load.return_value = True

        handler = ResearchCommandHandler(mock_skill)
        result = handler.handle_command("/search test")

        assert result["success"] is False
        assert "error" in result


class TestFormatResultAsMarkdown:
    """Test format_result_as_markdown function"""

    def test_format_error_result(self):
        """Test formatting error result"""
        result = {
            "success": False,
            "error": "Test error"
        }

        formatted = format_result_as_markdown(result)
        assert "Error" in formatted
        assert "Test error" in formatted

    def test_format_help_result(self):
        """Test formatting help result"""
        result = {
            "success": True,
            "type": "help",
            "commands": {
                "/test": "Test command"
            }
        }

        formatted = format_result_as_markdown(result)
        assert "Commands" in formatted
        assert "/test" in formatted

    def test_format_health_result(self):
        """Test formatting health result"""
        result = {
            "success": True,
            "type": "health",
            "state": "loaded",
            "healthy": True
        }

        formatted = format_result_as_markdown(result)
        assert "Health" in formatted
        assert "loaded" in formatted


class TestCommandHandlerIntegration:
    """Integration tests for command handler"""

    def test_full_command_flow(self):
        """Test complete command flow"""
        handler = ResearchCommandHandler()

        # Test help
        result = handler.handle_command("/help")
        assert result["success"] is True

        # Test health
        result = handler.handle_command("/health")
        assert result["success"] is True

        # Test unknown command
        result = handler.handle_command("/invalid")
        assert result["success"] is False
