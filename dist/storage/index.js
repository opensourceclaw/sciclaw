/**
 * Storage module - Manages research data storage
 */
export class StorageManager {
    storagePath;
    storage = new Map();
    constructor(storagePath) {
        this.storagePath = storagePath;
    }
    createProject(name, topic) {
        const project = {
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
    getProject(projectId) {
        return this.storage.get(projectId);
    }
    listProjects() {
        return Array.from(this.storage.values())
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    updateProject(project) {
        project.updatedAt = new Date().toISOString();
        this.storage.set(project.id, { ...project });
    }
    deleteProject(projectId) {
        return this.storage.delete(projectId);
    }
    generateId() {
        return Math.random().toString(36).slice(2, 10);
    }
}
//# sourceMappingURL=index.js.map