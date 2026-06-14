/**
 * API module - REST API server (standalone entry)
 */

import { createServer } from './index.js';

const port = parseInt(process.env.PORT ?? '3000', 10);
const host = process.env.HOST ?? 'localhost';

async function main() {
  const server = await createServer({ port, host });

  console.log(`DeepClaw API server running at http://${host}:${port}`);
  console.log();
  console.log('Endpoints:');
  console.log('  POST /api/search     - Search across sources');
  console.log('  POST /api/research   - Deep research');
  console.log('  GET  /api/report/:id - Get report');
  console.log('  POST /api/report/:id - Generate report');
  console.log('  GET  /api/status     - Server status');

  await server.listen();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
