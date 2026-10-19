// src/server/server.ts
// Servidor HTTP Soberano e Independente do Ontabs
// Inicializa na porta 3001 e escuta requisições de API REST.

import http from 'node:http';
import { db } from './db';
import { dispatchApiRequest } from './routes';

export const PORT = parseInt(process.env.PORT || '3001', 10);
export const HOST = process.env.HOST || '127.0.0.1';

export function createOntabsServer() {
  return http.createServer(async (req, res) => {
    try {
      await dispatchApiRequest(req, res, db);
    } catch (err: any) {
      console.error('Unhandled Server Error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro interno no servidor.', details: err?.message }));
    }
  });
}

export function startServer(port = PORT, host = HOST): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = createOntabsServer();
    server.listen(port, host, () => {
      console.log(`[Ontabs Server] Servidor soberano rodando em http://${host}:${port}`);
      resolve(server);
    });
  });
}

// Se executado diretamente
if (process.argv[1]?.includes('server.ts') || process.argv[1]?.includes('server.js')) {
  startServer();
}
