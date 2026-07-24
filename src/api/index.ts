/**
 * API module - REST API server
 */

import express, { type Express, type Request, type Response } from 'express';
import { search } from '@deepclaw/core';
import { conductResearch } from '../research/index.js';
import { generateReport } from '../report/index.js';
import type { ApiResponse } from '@deepclaw/core';

export interface ServerOptions {
  port: number;
  host: string;
}

export async function createServer(options: ServerOptions): Promise<{
  listen: () => Promise<void>;
  close: () => void;
}> {
  const app: Express = express();
  app.use(express.json());

  // Search endpoint
  app.post('/api/search', async (req: Request, res: Response) => {
    try {
      const results = await search(req.body);
      res.json(successResponse(results));
    } catch (error) {
      res.status(500).json(errorResponse(error));
    }
  });

  // Research endpoint
  app.post('/api/research', async (req: Request, res: Response) => {
    try {
      const result = await conductResearch(req.body);
      res.json(successResponse(result));
    } catch (error) {
      res.status(500).json(errorResponse(error));
    }
  });

  // Get report
  app.get('/api/report/:id', async (req: Request, res: Response) => {
    try {
      const report = await generateReport(req.params.id, {});
      res.json(successResponse(report));
    } catch (error) {
      res.status(500).json(errorResponse(error));
    }
  });

  // Generate report
  app.post('/api/report/:id', async (req: Request, res: Response) => {
    try {
      const report = await generateReport(req.params.id, req.body);
      res.json(successResponse(report));
    } catch (error) {
      res.status(500).json(errorResponse(error));
    }
  });

  // Status endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json(
      successResponse({
        status: 'ok',
        version: '2.0.0-beta.1',
        uptime: process.uptime(),
      })
    );
  });

  return {
    listen: () =>
      new Promise((resolve) => {
        app.listen(options.port, options.host, () => resolve());
      }),
    close: () => app.emit('close'),
  };
}

function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date(),
  };
}

function errorResponse(error: unknown): ApiResponse<never> {
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date(),
  };
}

export { createServer as default };
