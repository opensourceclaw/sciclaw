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
Tests for CLI
"""

import pytest
from click.testing import CliRunner
from researchclaw.cli.main import cli, research, search, init


class TestCLI:
    """Test CLI commands"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    def test_cli_help(self, runner):
        """Test CLI help output"""
        result = runner.invoke(cli, ["--help"])
        assert result.exit_code == 0
        assert "ResearchClaw" in result.output

    def test_research_command(self, runner):
        """Test research command"""
        result = runner.invoke(research, ["AI"])
        assert result.exit_code == 0
        assert "Researching: AI" in result.output

    def test_search_command(self, runner):
        """Test search command"""
        result = runner.invoke(search, ["machine learning"])
        assert result.exit_code == 0
        assert "Searching" in result.output

    def test_init_command(self, runner):
        """Test init command"""
        result = runner.invoke(init)
        assert result.exit_code == 0
        assert "Initializing" in result.output
