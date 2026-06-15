/**
 * Storage module - Manages research data storage
 */

export interface ResearchProjectData {
  id: string;
  name: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
}

export class StorageManager {
  private storage: Map<string, ResearchProjectData> = new Map();

  constructor(private storagePath?: string) {}

  createProject(name: string, topic: string): ResearchProjectData {
    const project: ResearchProjectData = {
      id: this.generateId(),
      name,
      topic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {},
    };
    this.storage.set(project.id, project);
    return project;
  }

  getProject(projectId: string): ResearchProjectData | undefined {
    return this.storage.get(projectId);
  }

  listProjects(): ResearchProjectData[] {
    return Array.from(this.storage.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  updateProject(project: ResearchProjectData): void {
    project.updatedAt = new Date().toISOString();
    this.storage.set(project.id, { ...project });
  }

  deleteProject(projectId: string): boolean {
    return this.storage.delete(projectId);
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}
