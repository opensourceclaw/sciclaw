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
Tests for Storage Module
"""

import pytest
import tempfile
from pathlib import Path
from researchclaw.storage.manager import StorageManager, ResearchProject


class TestResearchProject:
    """Test ResearchProject"""

    def test_creation(self):
        """Test ResearchProject creation"""
        project = ResearchProject(
            id="test-001",
            name="Test Project",
            topic="AI Research"
        )

        assert project.id == "test-001"
        assert project.name == "Test Project"
        assert project.topic == "AI Research"

    def test_to_dict(self):
        """Test to_dict method"""
        project = ResearchProject(
            id="test-001",
            name="Test",
            topic="Test topic"
        )

        d = project.to_dict()
        assert d["id"] == "test-001"
        assert "created_at" in d


class TestStorageManager:
    """Test StorageManager"""

    @pytest.fixture
    def storage(self):
        """Create temporary storage"""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield StorageManager(storage_path=Path(tmpdir))

    def test_creation(self, storage):
        """Test StorageManager creation"""
        assert storage.storage_path.exists()

    def test_create_project(self, storage):
        """Test project creation"""
        project = storage.create_project("Test Project", "AI")

        assert project.name == "Test Project"
        assert project.topic == "AI"
        assert project.id is not None

    def test_get_project(self, storage):
        """Test getting a project"""
        created = storage.create_project("Test", "Topic")
        retrieved = storage.get_project(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id

    def test_get_nonexistent_project(self, storage):
        """Test getting nonexistent project"""
        result = storage.get_project("nonexistent")
        assert result is None

    def test_list_projects(self, storage):
        """Test listing projects"""
        storage.create_project("Project 1", "Topic 1")
        storage.create_project("Project 2", "Topic 2")

        projects = storage.list_projects()
        assert len(projects) >= 2

    def test_update_project(self, storage):
        """Test updating a project"""
        project = storage.create_project("Test", "Topic")
        project.data = {"key": "value"}

        storage.update_project(project)

        retrieved = storage.get_project(project.id)
        assert retrieved.data["key"] == "value"

    def test_delete_project(self, storage):
        """Test deleting a project"""
        project = storage.create_project("Test", "Topic")

        result = storage.delete_project(project.id)
        assert result is True

        retrieved = storage.get_project(project.id)
        assert retrieved is None
