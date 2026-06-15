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
export declare class StorageManager {
    private storagePath?;
    private storage;
    constructor(storagePath?: string | undefined);
    createProject(name: string, topic: string): ResearchProjectData;
    getProject(projectId: string): ResearchProjectData | undefined;
    listProjects(): ResearchProjectData[];
    updateProject(project: ResearchProjectData): void;
    deleteProject(projectId: string): boolean;
    private generateId;
}
//# sourceMappingURL=index.d.ts.map