// src/server/__tests__/serverIntegration.test.ts
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { Database } from '../db';
import { dispatchApiRequest } from '../routes';

const TEST_PORT = 3199;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const TEST_DB_PATH = path.resolve(process.cwd(), 'data', 'test-ontabs-store.json');

describe('Ontabs Independent Server - End-to-End API Integration', () => {
  let server: http.Server;
  let testDb: Database;

  beforeAll(async () => {
    // Garante limpeza de banco de teste
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

  it('GET /api/health retorna 200 e status saudável', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('ontabs-independent-runtime');
  });

  it('GET / serve a aplicação frontend SPA (HTML) na raiz', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('text/html');
    const text = await res.text();
    expect(text).toContain('<!doctype html>');
  });

  it('Visitante anônimo possui 1 uso gratuito disponível', async () => {
    const visitorId = `vis_${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/entitlement/status`, {
      headers: { 'X-Visitor-Id': visitorId },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessState).toBe('FREE_USE_AVAILABLE');
    expect(body.isAuthorized).toBe(true);
  });

  it('Visitante executa com sucesso sua única conversão gratuita', async () => {
    const visitorId = `vis_free_test_${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-Id': visitorId,
      },
      body: JSON.stringify({
        title: 'Música Visitante 1',
        artist: 'Artista Teste',
        instrument: 'guitar',
        durationSeconds: 45,
        bpm: 110,
        notes: [
          { timestamp: 0.5, midi: 60, duration: 0.5 },
          { timestamp: 1.0, midi: 64, duration: 0.5 },
        ],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.song.title).toBe('Música Visitante 1');
    expect(body.tab.notes).toHaveLength(2);
  });

  it('Segunda conversão como visitante é BLOQUEADA pelo servidor com 403', async () => {
    // Usando o mesmo visitorId anterior que já consumiu
    const visitorId = testDb['data'].visitorUsage[0]?.visitorId;
    expect(visitorId).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-Id': visitorId,
      },
      body: JSON.stringify({
        title: 'Música Visitante 2 (Tentativa de Bypass)',
        instrument: 'guitar',
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.accessState).toBe('FREE_USE_CONSUMED');
    expect(body.error).toContain('Cadastre-se');
  });

  it('Cadastro de usuário ativa trial de 7 dias e emite token de sessão', async () => {
    const email = `pedro_${Date.now()}@ontabs.app`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'securePassword123!',
        name: 'Pedro CTO',
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(email);
    expect(body.user.planCode).toBe('pro'); // Trial no plano Pro
    expect(body.token).toBeDefined();
    expect(body.user.trialEndsAt).toBeDefined();

    // Testa GET /api/auth/me com token
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${body.token}` },
    });
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.accessState).toBe('TRIAL_ACTIVE');
    expect(meBody.user.email).toBe(email);
  });

  it('Usuário em trial ativo consegue executar conversões de música', async () => {
    // Login
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `trial_user_${Date.now()}@ontabs.app`,
        password: 'password123',
        name: 'Usuário Trial',
      }),
    });
    const { token } = await regRes.json();

    const res = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Música Trial Oficial',
        artist: 'Ontabs User',
        instrument: 'bass',
        durationSeconds: 30,
        bpm: 100,
        notes: [
          { timestamp: 0.0, midi: 28, duration: 1.0 }, // E1
          { timestamp: 1.0, midi: 33, duration: 1.0 }, // A1
        ],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.song.title).toBe('Música Trial Oficial');
    expect(body.tab.instrument).toBe('bass');
  });

  it('Conversão sem notas detectadas gera tablatura vazia sem fabricar notas sintéticas', async () => {
    const visitorId = `visitor_empty_test_${Date.now()}`;
    const res = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-Id': visitorId,
      },
      body: JSON.stringify({
        title: 'Áudio Silencioso',
        artist: 'Sem Notas',
        instrument: 'guitar',
        durationSeconds: 10,
        bpm: 120,
        notes: [],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tab.notes).toHaveLength(0);
  });

  it('GET /api/songs suporta paginação e filtros reais', async () => {
    const res = await fetch(`${BASE_URL}/api/songs?page=1&pageSize=5`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toBeInstanceOf(Array);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('Isolamento de segurança: usuário comum não pode excluir música de outro usuário', async () => {
    // Registra usuário A e cria uma música
    const resUserA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `user_a_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const tokenA = (await resUserA.json()).token;

    const createRes = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Música Privada do Usuário A' }),
    });
    const songAId = (await createRes.json()).song.id;

    // Registra usuário B
    const resUserB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `user_b_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const tokenB = (await resUserB.json()).token;

    // Usuário B tenta deletar música do Usuário A
    const deleteRes = await fetch(`${BASE_URL}/api/songs/${songAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    expect(deleteRes.status).toBe(403);
    const errBody = await deleteRes.json();
    expect(errBody.error).toContain('não autorizada');

    // Confirma que a música ainda existe
    const getRes = await fetch(`${BASE_URL}/api/songs/${songAId}`);
    expect(getRes.status).toBe(200);
  });

  it('POST /api/connectors/resolve valida links externos e bloqueia SSRF', async () => {
    // Caso válido YouTube
    const ytRes = await fetch(`${BASE_URL}/api/connectors/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
    });
    expect(ytRes.status).toBe(200);
    const ytBody = await ytRes.json();
    expect(ytBody.provider).toBe('youtube');
    expect(ytBody.id).toBe('dQw4w9WgXcQ');

    // Tentativa de SSRF
    const ssrfRes = await fetch(`${BASE_URL}/api/connectors/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data' }),
    });
    expect(ssrfRes.status).toBe(400);
    const ssrfBody = await ssrfRes.json();
    expect(ssrfBody.error).toMatch(/endereços locais ou de rede privada/i);
  });

  it('POST /api/plans/select rejeita ativação de plano pago sem gateway real (402)', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `billing_test_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const { token } = await regRes.json();

    // Tenta selecionar plano pro sem gateway de pagamento
    const selectProRes = await fetch(`${BASE_URL}/api/plans/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planCode: 'pro' }),
    });

    expect(selectProRes.status).toBe(402);
    const body = await selectProRes.json();
    expect(body.code).toBe('PAYMENT_GATEWAY_NOT_CONFIGURED');

    // Selecionar plano free é permitido (200)
    const selectFreeRes = await fetch(`${BASE_URL}/api/plans/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planCode: 'free' }),
    });

    expect(selectFreeRes.status).toBe(200);
    const freeBody = await selectFreeRes.json();
    expect(freeBody.user.planCode).toBe('free');
  });
});
