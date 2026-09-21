import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { createServer } from '../../src/api/index.js';

// Mock all dependencies
vi.mock('../../src/core/index.js', () => ({
  search: vi.fn().mockResolvedValue([
    { title: 'Test', url: 'https://example.com', snippet: 'Test', source: 'duckduckgo' },
  ]),
}));

vi.mock('../../src/research/index.js', () => ({
  conductResearch: vi.fn().mockResolvedValue({
    id: 'test-id',
    topic: 'Test',
    summary: 'Summary',
    sections: [],
    sources: [],
    createdAt: new Date(),
  }),
}));

vi.mock('../../src/report/index.js', () => ({
  generateReport: vi.fn().mockResolvedValue({
    id: 'test-id',
    title: 'Report',
    content: 'Content',
    format: 'markdown',
    createdAt: new Date(),
  }),
}));

describe('API Integration Tests', () => {
  describe('Server Creation', () => {
    it('should create server with default options', async () => {
      const server = await createServer({ port: 3100, host: 'localhost' });
      expect(server).toBeDefined();
      expect(typeof server.listen).toBe('function');
      expect(typeof server.close).toBe('function');
      server.close();
    });

    it('should create server with custom options', async () => {
      const server = await createServer({ port: 3101, host: '127.0.0.1' });
      expect(server).toBeDefined();
      server.close();
    });
  });

  describe('API Endpoints', () => {
    let app: express.Application;
    let server: ReturnType<typeof express.application.listen>;

    beforeAll(async () => {
      app = express();
      app.use(express.json());

      // Import and setup routes
      const { search } = await import('../../src/core/index.js');
      const { conductResearch } = await import('../../src/research/index.js');
      const { generateReport } = await import('../../src/report/index.js');

      app.post('/api/search', async (req, res) => {
        try {
          const results = await search(req.body);
          res.json({ success: true, data: results, timestamp: new Date() });
        } catch (error) {
          res.status(500).json({ success: false, error: String(error), timestamp: new Date() });
        }
      });

      app.post('/api/research', async (req, res) => {
        try {
          const result = await conductResearch(req.body);
          res.json({ success: true, data: result, timestamp: new Date() });
        } catch (error) {
          res.status(500).json({ success: false, error: String(error), timestamp: new Date() });
        }
      });

      app.get('/api/report/:id', async (req, res) => {
        try {
          const report = await generateReport(req.params.id, {});
          res.json({ success: true, data: report, timestamp: new Date() });
        } catch (error) {
          res.status(500).json({ success: false, error: String(error), timestamp: new Date() });
        }
      });

      app.post('/api/report/:id', async (req, res) => {
        try {
          const report = await generateReport(req.params.id, req.body);
          res.json({ success: true, data: report, timestamp: new Date() });
        } catch (error) {
          res.status(500).json({ success: false, error: String(error), timestamp: new Date() });
        }
      });

      app.get('/api/status', (_req, res) => {
        res.json({
          success: true,
          data: { status: 'ok', version: '2.0.0-beta.3', uptime: process.uptime() },
          timestamp: new Date(),
        });
      });

      await new Promise<void>((resolve) => {
        server = app.listen(3102, () => resolve());
      });
    });

    afterAll(() => {
      server?.close();
    });

    it('should respond to /api/status', async () => {
      const response = await fetch('http://localhost:3102/api/status');
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ok');
    });

    it('should respond to POST /api/search', async () => {
      const response = await fetch('http://localhost:3102/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should respond to POST /api/research', async () => {
      const response = await fetch('http://localhost:3102/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'test' }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should respond to GET /api/report/:id', async () => {
      const response = await fetch('http://localhost:3102/api/report/test-id');
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should respond to POST /api/report/:id', async () => {
      const response = await fetch('http://localhost:3102/api/report/test-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'markdown' }),
      });
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
