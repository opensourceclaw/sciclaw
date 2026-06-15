import { describe, it, expect } from 'vitest';
import { StorageManager } from '../../src/storage/index.js';

describe('StorageManager', () => {
  it('should create a project', () => {
    const sm = new StorageManager();
    const project = sm.createProject('Test', 'AI research');
    expect(project.name).toBe('Test');
    expect(project.topic).toBe('AI research');
    expect(project.id).toBeDefined();
  });

  it('should get a project', () => {
    const sm = new StorageManager();
    const created = sm.createProject('Test', 'AI');
    const retrieved = sm.getProject(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Test');
  });

  it('should return undefined for missing project', () => {
    const sm = new StorageManager();
    expect(sm.getProject('nonexistent')).toBeUndefined();
  });

  it('should list projects sorted by updatedAt', () => {
    const sm = new StorageManager();
    sm.createProject('A', 'Topic A');
    sm.createProject('B', 'Topic B');
    const projects = sm.listProjects();
    expect(projects).toHaveLength(2);
  });

  it('should update a project', () => {
    const sm = new StorageManager();
    const project = sm.createProject('Test', 'AI');
    project.data = { key: 'value' };
    sm.updateProject(project);
    const updated = sm.getProject(project.id);
    expect(updated!.data.key).toBe('value');
  });

  it('should delete a project', () => {
    const sm = new StorageManager();
    const project = sm.createProject('Test', 'AI');
    expect(sm.deleteProject(project.id)).toBe(true);
    expect(sm.getProject(project.id)).toBeUndefined();
  });

  it('should return false when deleting nonexistent project', () => {
    const sm = new StorageManager();
    expect(sm.deleteProject('nonexistent')).toBe(false);
  });
});
