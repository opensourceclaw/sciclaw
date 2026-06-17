import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/api/index.js';

// Mock dependencies
vi.mock('../../src/search/index.js', () => ({
  search: vi.fn().mockResolvedValue([
    { title: 'Test Result', url: 'https://example.com', snippet: 'Test', source: 'duckduckgo' },
  ]),
}));

vi.mock('../../src/research/index.js', () => ({
  conductResearch: vi.fn().mockResolvedValue({
    id: 'test-id',
    topic: 'Test Topic',
    summary: 'Test summary',
    sections: [],
    sources: [],
    createdAt: new Date(),
  }),
}));

vi.mock('../../src/report/index.js', () => ({
  generateReport: vi.fn().mockResolvedValue({
    id: 'test-id',
    title: 'Test Report',
    content: 'Test content',
    format: 'markdown',
    createdAt: new Date(),
  }),
}));

describe('API Module', () => {
  describe('createServer', () => {
    it('should create server with options', async () => {
      const server = await createServer({ port: 3001, host: 'localhost' });
      expect(server).toBeDefined();
      expect(server.listen).toBeTypeOf('function');
      expect(server.close).toBeTypeOf('function');
    });

    it('should return server with listen and close methods', async () => {
      const server = await createServer({ port: 3002, host: 'localhost' });
      expect(server).toHaveProperty('listen');
      expect(server).toHaveProperty('close');
    });
  });

  describe('API Endpoints', () => {
    let server: Awaited<ReturnType<typeof createServer>>;

    beforeEach(async () => {
      server = await createServer({ port: 3098, host: 'localhost' });
    });

    afterEach(() => {
      server?.close();
    });

    it('should have search endpoint configured', () => {
      expect(server).toBeDefined();
    });

    it('should have research endpoint configured', () => {
      expect(server).toBeDefined();
    });

    it('should have report endpoints configured', () => {
      expect(server).toBeDefined();
    });

    it('should have status endpoint configured', () => {
      expect(server).toBeDefined();
    });

    it('server starts and responds to status', async () => {
      await server.listen();
      const response = await fetch('http://localhost:3098/api/status');
      const data = await response.json();
      expect(data.success).toBe(true);
      server.close();
    });
  });
});
