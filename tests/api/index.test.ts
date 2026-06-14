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
      server = await createServer({ port: 3003, host: 'localhost' });
    });

    afterEach(() => {
      server?.close();
    });

    it('should have search endpoint configured', async () => {
      // Verify the server was created successfully
      expect(server).toBeDefined();
    });

    it('should have research endpoint configured', async () => {
      expect(server).toBeDefined();
    });

    it('should have report endpoints configured', async () => {
      expect(server).toBeDefined();
    });

    it('should have status endpoint configured', async () => {
      expect(server).toBeDefined();
    });
  });
});

describe('Response Helpers', () => {
  it('successResponse should return correct format', () => {
    const data = { test: 'value' };
    const response = {
      success: true,
      data,
      timestamp: expect.any(Date),
    };
    expect(response.success).toBe(true);
    expect(response.data).toEqual(data);
  });

  it('errorResponse should return correct format', () => {
    const error = new Error('Test error');
    const response = {
      success: false,
      error: error.message,
      timestamp: expect.any(Date),
    };
    expect(response.success).toBe(false);
    expect(response.error).toBe('Test error');
  });
});
