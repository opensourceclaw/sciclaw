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
Tests for Rich CLI Output
"""

import pytest
from io import StringIO
from deepclaw.tools.rich_output import (
    OutputLevel,
    CLIConfig,
    RichConsole,
    get_console,
    set_verbose,
    set_quiet,
    RICH_AVAILABLE,
)


class TestOutputLevel:
    """Test OutputLevel enum"""

    def test_values(self):
        """Test output level values"""
        assert OutputLevel.QUIET.value == 0
        assert OutputLevel.NORMAL.value == 1
        assert OutputLevel.VERBOSE.value == 2
        assert OutputLevel.DEBUG.value == 3


class TestCLIConfig:
    """Test CLIConfig"""

    def test_default_values(self):
        """Test default config"""
        config = CLIConfig()
        assert config.output_level == OutputLevel.NORMAL
        assert config.use_colors is True
        assert config.use_progress is True

    def test_custom_values(self):
        """Test custom config"""
        config = CLIConfig(
            output_level=OutputLevel.QUIET,
            use_colors=False,
            width=100,
        )
        assert config.output_level == OutputLevel.QUIET
        assert config.use_colors is False
        assert config.width == 100


class TestRichConsole:
    """Test RichConsole class"""

    @pytest.fixture
    def console(self):
        """Create console with no colors for testing"""
        config = CLIConfig(use_colors=False, use_progress=False)
        return RichConsole(config)

    def test_creation(self):
        """Test creating console"""
        config = CLIConfig()
        console = RichConsole(config)
        assert console is not None

    def test_print_basic(self, console, capsys):
        """Test basic print"""
        console.print("Test message")
        captured = capsys.readouterr()
        assert "Test message" in captured.out

    def test_print_success(self, console, capsys):
        """Test success print"""
        console.print_success("Operation completed")
        captured = capsys.readouterr()
        assert "Operation completed" in captured.out
        assert "✓" in captured.out

    def test_print_error(self, console, capsys):
        """Test error print"""
        console.print_error("Operation failed")
        captured = capsys.readouterr()
        assert "Operation failed" in captured.out

    def test_print_warning(self, console, capsys):
        """Test warning print"""
        console.print_warning("Warning message")
        captured = capsys.readouterr()
        assert "Warning message" in captured.out

    def test_print_info(self, console, capsys):
        """Test info print"""
        console.print_info("Info message")
        captured = capsys.readouterr()
        assert "Info message" in captured.out

    def test_print_header(self, console, capsys):
        """Test header print"""
        console.print_header("Test Section")
        captured = capsys.readouterr()
        assert "Test Section" in captured.out
        assert "=" in captured.out

    def test_print_table_basic(self, console, capsys):
        """Test table print"""
        data = [
            {"name": "Alice", "age": "30"},
            {"name": "Bob", "age": "25"},
        ]
        console.print_table(data, "People")
        captured = capsys.readouterr()
        assert "People" in captured.out
        assert "Alice" in captured.out
        assert "Bob" in captured.out

    def test_print_table_empty(self, console, capsys):
        """Test empty table"""
        console.print_table([], "Empty")
        captured = capsys.readouterr()
        assert captured.out == ""  # Nothing printed for empty table

    def test_print_panel_basic(self, console, capsys):
        """Test panel print"""
        console.print_panel("Panel content", "Panel Title")
        captured = capsys.readouterr()
        assert "Panel content" in captured.out
        assert "Panel Title" in captured.out

    def test_create_progress_dummy(self, console):
        """Test creating dummy progress"""
        progress = console.create_progress("Processing...")
        # Should work without errors
        assert progress is not None


class TestGlobalConsole:
    """Test global console functions"""

    def test_get_console(self):
        """Test getting global console"""
        console = get_console()
        assert console is not None

    def test_get_console_with_config(self):
        """Test getting console with config"""
        config = CLIConfig(output_level=OutputLevel.QUIET)
        console = get_console(config)
        assert console.config.output_level == OutputLevel.QUIET

    def test_set_verbose(self):
        """Test set_verbose"""
        config = CLIConfig(output_level=OutputLevel.NORMAL)
        console = get_console(config)
        set_verbose(True)
        assert console.config.output_level == OutputLevel.VERBOSE
        set_verbose(False)
        assert console.config.output_level == OutputLevel.NORMAL

    def test_set_quiet(self):
        """Test set_quiet"""
        config = CLIConfig(output_level=OutputLevel.NORMAL)
        console = get_console(config)
        set_quiet(True)
        assert console.config.output_level == OutputLevel.QUIET
        set_quiet(False)
        assert console.config.output_level == OutputLevel.NORMAL


class TestRichAvailability:
    """Test rich availability"""

    def test_rich_available_flag(self):
        """Test RICH_AVAILABLE flag exists"""
        # Just check the flag exists
        assert isinstance(RICH_AVAILABLE, bool)
