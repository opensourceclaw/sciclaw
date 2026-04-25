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
Storage Manager - Manages research data storage
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field, asdict


@dataclass
class ResearchProject:
    """Research project representation"""
    id: str
    name: str
    topic: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    data: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "topic": self.topic,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "data": self.data,
        }


class StorageManager:
    """Manages research project storage"""

    def __init__(self, storage_path: Optional[Path] = None):
        """Initialize storage manager

        Args:
            storage_path: Path to storage directory
        """
        if storage_path is None:
            storage_path = Path.home() / ".deepclaw" / "projects"

        self.storage_path = storage_path
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def create_project(self, name: str, topic: str) -> ResearchProject:
        """Create a new research project

        Args:
            name: Project name
            topic: Research topic

        Returns:
            ResearchProject: Created project
        """
        import uuid
        project_id = str(uuid.uuid4())[:8]

        project = ResearchProject(
            id=project_id,
            name=name,
            topic=topic,
        )

        self._save_project(project)
        return project

    def get_project(self, project_id: str) -> Optional[ResearchProject]:
        """Get a project by ID

        Args:
            project_id: Project ID

        Returns:
            Optional[ResearchProject]: Project if found
        """
        project_file = self.storage_path / f"{project_id}.json"

        if not project_file.exists():
            return None

        try:
            data = json.loads(project_file.read_text())
            return ResearchProject(
                id=data["id"],
                name=data["name"],
                topic=data["topic"],
                created_at=datetime.fromisoformat(data["created_at"]),
                updated_at=datetime.fromisoformat(data["updated_at"]),
                data=data.get("data", {}),
            )
        except (json.JSONDecodeError, KeyError):
            return None

    def list_projects(self) -> List[ResearchProject]:
        """List all projects

        Returns:
            List[ResearchProject]: List of projects
        """
        projects = []

        for project_file in self.storage_path.glob("*.json"):
            try:
                data = json.loads(project_file.read_text())
                projects.append(ResearchProject(
                    id=data["id"],
                    name=data["name"],
                    topic=data["topic"],
                    created_at=datetime.fromisoformat(data["created_at"]),
                    updated_at=datetime.fromisoformat(data["updated_at"]),
                    data=data.get("data", {}),
                ))
            except (json.JSONDecodeError, KeyError):
                continue

        return sorted(projects, key=lambda p: p.updated_at, reverse=True)

    def update_project(self, project: ResearchProject) -> None:
        """Update a project

        Args:
            project: Project to update
        """
        project.updated_at = datetime.now()
        self._save_project(project)

    def delete_project(self, project_id: str) -> bool:
        """Delete a project

        Args:
            project_id: Project ID

        Returns:
            bool: True if deleted
        """
        project_file = self.storage_path / f"{project_id}.json"

        if project_file.exists():
            project_file.unlink()
            return True

        return False

    def _save_project(self, project: ResearchProject) -> None:
        """Save project to disk

        Args:
            project: Project to save
        """
        project_file = self.storage_path / f"{project.id}.json"
        project_file.write_text(
            json.dumps(project.to_dict(), indent=2),
            encoding="utf-8"
        )


__all__ = ["ResearchProject", "StorageManager"]
