// src/server/__tests__/referentialIntegrity.test.ts
// Validação de Integridade Referencial (Lote V.2A): songId <-> tabId, Contratos de Rota e 404s Limpos

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { Database } from '../db';
import { dispatchApiRequest } from '../routes';

const TEST_PORT = 3198;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_DB_PATH = path.resolve(process.cwd(), 'data', 'test-ref-integrity.json');

describe('Lote V.2A - Integridade Referencial songId <-> tabId e Resolução de Rotas', () => {
  let server: http.Server;
  let testDb: Database;

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    testDb = new Database(TEST_DB_PATH);

    server = http.createServer(async (req, res) => {
      await dispatchApiRequest(req, res, testDb);
    });

    await new Promise<void>((resolve) => {
      server.listen(TEST_PORT, '127.0.0.1', () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  it('1. GET /api/songs/:id resolve música por song.id canônico', async () => {
    const res = await fetch(`${BASE_URL}/api/songs/song_demo_canon_rock`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.song.id).toBe('song_demo_canon_rock');
    expect(body.song.tabId).toBe('tab_demo_canon_rock');
  });

  it('2. GET /api/songs/:id resolve música quando cliente passa tab.id associado', async () => {
    const res = await fetch(`${BASE_URL}/api/songs/tab_demo_canon_rock`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.song.id).toBe('song_demo_canon_rock');
    expect(body.song.title).toBe('Canon Rock Theme');
  });

  it('3. GET /api/tabs/:id resolve tablatura por tab.id canônico', async () => {
    const res = await fetch(`${BASE_URL}/api/tabs/tab_demo_canon_rock`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('tab_demo_canon_rock');
    expect(body.songId).toBe('song_demo_canon_rock');
  });

  it('4. GET /api/tabs/:id resolve tablatura quando cliente passa song.id associado', async () => {
    const res = await fetch(`${BASE_URL}/api/tabs/song_demo_canon_rock`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('tab_demo_canon_rock');
    expect(body.songId).toBe('song_demo_canon_rock');
    expect(body.notes.length).toBeGreaterThan(0);
  });

  it('5. GET /api/songs/:id retorna 404 limpo e recuperável para song inexistente', async () => {
    const res = await fetch(`${BASE_URL}/api/songs/song_inexistente_99999`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Música não encontrada.');
  });

  it('6. GET /api/tabs/:id retorna 404 limpo e recuperável para tab inexistente', async () => {
    const res = await fetch(`${BASE_URL}/api/tabs/tab_inexistente_99999`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Tablatura não encontrada.');
  });

  it('7. Preserva contratos de direitos: /api/catalog retorna obras auditadas com direitos preservados', async () => {
    const res = await fetch(`${BASE_URL}/api/catalog`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assets.length).toBe(9);
    // Verifica que Beethoven preserva direitos e proveniência sem virar música sem áudio por presunção
    const beethoven = body.assets.find((a: any) => a.id === 'asset_musopen_beethoven_sym5');
    expect(beethoven).toBeDefined();
    expect(beethoven.isPublicDomain).toBe(true);
    expect(beethoven.licenseId).toBe('CC0-1.0');
  });
});
