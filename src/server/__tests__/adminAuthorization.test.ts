// src/server/__tests__/adminAuthorization.test.ts
// Ontabs FASE ADMIN — Testes de Acesso Administrativo Ilimitado e Segurança Server-Side

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Database } from '../db';
import { dispatchApiRequest } from '../routes';
import { evaluateAccessState, authorizeProtectedOperation, UserAccessRecord } from '../accessStateMachine';

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-admin-store.json');

describe('FASE ADMIN: Acesso Ilimitado e Autorização Segura no Servidor', () => {
  let db: Database;
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    db = new Database(TEST_DB_PATH);
    server = http.createServer(async (req, res) => {
      await dispatchApiRequest(req, res, db);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    delete process.env.ONTABS_ADMIN_SECRET;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  });

  async function apiPost(endpoint: string, body: any, headers: Record<string, string> = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  async function apiGet(endpoint: string, headers: Record<string, string> = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  it('1. Administrador autenticado continua com acesso ativo mesmo após expiração das 168h do trial', () => {
    const adminUser: UserAccessRecord = {
      id: 'admin_1',
      email: 'admin@ontabs.com',
      role: 'admin',
      status: 'active',
      trialStartedAt: '2026-01-01T00:00:00Z',
      trialEndsAt: '2026-01-08T00:00:00Z', // Expirado há meses
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: 'free',
      analysesThisMonth: 1500,
    };

    const state = evaluateAccessState(adminUser, true, () => new Date('2026-10-19T00:00:00Z'));
    expect(state).toBe('ADMIN_UNLIMITED');

    const auth = authorizeProtectedOperation(adminUser, true, 'audio_analysis', () => new Date('2026-10-19T00:00:00Z'));
    expect(auth.isAuthorized).toBe(true);
    expect(auth.state).toBe('ADMIN_UNLIMITED');
    expect(auth.plan.analysesPerMonth).toBeGreaterThan(90000);
  });

  it('2. Usuário comum NÃO recebe privilégios administrativos durante o cadastro', async () => {
    const res = await apiPost('/api/auth/register', {
      email: 'normal_musician@gmail.com',
      password: 'password123',
      name: 'Músico Regular',
      role: 'admin', // Tentativa maliciosa de auto-promoção
    });

    expect(res.status).toBe(201);
    expect(res.data.user.role).toBe('user'); // Servidor ignorou o role enviado pelo cliente!
  });

  it('3. Usuário comum tem acesso bloqueado à rota administrativa /api/admin/metrics (HTTP 403)', async () => {
    const reg = await apiPost('/api/auth/register', {
      email: 'student@gmail.com',
      password: 'password123',
    });
    const token = reg.data.token;

    const metricsRes = await apiGet('/api/admin/metrics', {
      Authorization: `Bearer ${token}`,
    });

    expect(metricsRes.status).toBe(403);
    expect(metricsRes.data.error).toContain('restrito a administradores');
  });

  it('4. Requisição anônima sem autenticação é rejeitada em rotas administrativas (HTTP 403/401)', async () => {
    const unauth = await apiGet('/api/admin/metrics');
    expect(unauth.status).toBe(403);
  });

  it('5. Bootstrap administrativo desabilita com 503 sem chave no ambiente e requer segredo estrito configurado', async () => {
    // Registra usuário comum
    await apiPost('/api/auth/register', {
      email: 'dev_lead@ontabs.com',
      password: 'password123',
    });

    // 1. Sem ONTABS_ADMIN_SECRET configurado no ambiente, endpoint deve falhar de forma segura (503)
    delete process.env.ONTABS_ADMIN_SECRET;
    const disabledRes = await apiPost(
      '/api/admin/bootstrap',
      { email: 'dev_lead@ontabs.com', role: 'admin' },
      { 'X-Ontabs-Admin-Key': 'ontabs-admin-secure-key-2026' }
    );
    expect(disabledRes.status).toBe(503);
    expect(disabledRes.data.error).toContain('desabilitado');

    // 2. Configura segredo estrito no ambiente
    const CONFIGURED_SECRET = 'sovereign_hardened_secret_key_8849';
    process.env.ONTABS_ADMIN_SECRET = CONFIGURED_SECRET;

    // Tentativa com chave errada ou com a chave antiga descontinuada
    const badKeyRes = await apiPost(
      '/api/admin/bootstrap',
      { email: 'dev_lead@ontabs.com', role: 'admin' },
      { 'X-Ontabs-Admin-Key': 'ontabs-admin-secure-key-2026' }
    );
    expect(badKeyRes.status).toBe(401);

    // Bootstrap legítimo com o segredo correto do ambiente
    const validRes = await apiPost(
      '/api/admin/bootstrap',
      { email: 'dev_lead@ontabs.com', role: 'admin' },
      { 'X-Ontabs-Admin-Key': CONFIGURED_SECRET }
    );
    expect(validRes.status).toBe(200);
    expect(validRes.data.success).toBe(true);
    expect(validRes.data.user.role).toBe('admin');

    // Faz login e acessa rota administrativa com sucesso
    const loginRes = await apiPost('/api/auth/login', {
      email: 'dev_lead@ontabs.com',
      password: 'password123',
    });
    expect(loginRes.data.user.role).toBe('admin');

    const metrics = await apiGet('/api/admin/metrics', {
      Authorization: `Bearer ${loginRes.data.token}`,
    });
    expect(metrics.status).toBe(200);
    expect(metrics.data.systemState).toBe('SOVEREIGN_OPERATIONAL');
  });

  it('6. Cotas mensais comerciais NÃO bloqueiam operações de usuário admin', () => {
    const heavyAdmin: UserAccessRecord = {
      id: 'owner_pedro',
      email: 'pedro@ontabs.com',
      role: 'owner',
      status: 'active',
      trialStartedAt: '2026-01-01T00:00:00Z',
      trialEndsAt: '2026-01-08T00:00:00Z',
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: 'free',
      analysesThisMonth: 9999, // Muito além de qualquer cota comercial
    };

    const auth = authorizeProtectedOperation(heavyAdmin, true, 'audio_analysis');
    expect(auth.isAuthorized).toBe(true);
    expect(auth.state).toBe('ADMIN_UNLIMITED');
  });

  it('7. Revogação de papel administrativo para "user" desativa imediatamente o acesso ilimitado', () => {
    const formerAdmin: UserAccessRecord = {
      id: 'revoked_user',
      email: 'former_staff@ontabs.com',
      role: 'user', // Revogado
      status: 'active',
      trialStartedAt: '2026-01-01T00:00:00Z',
      trialEndsAt: '2026-01-08T00:00:00Z', // Trial expirado
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: 'free',
      analysesThisMonth: 10,
    };

    const auth = authorizeProtectedOperation(formerAdmin, true, 'audio_analysis');
    expect(auth.isAuthorized).toBe(false);
    expect(auth.state).toBe('TRIAL_EXPIRED');
  });

  it('8. Estado administrativo persiste de forma segura após recarregamento do banco em disco', () => {
    const userRec = db.createUser({
      id: 'stored_owner',
      email: 'owner@ontabs.com',
      name: 'Proprietário',
      role: 'owner',
      passwordHash: 'hash',
      salt: 'salt',
      status: 'active',
      trialStartedAt: null,
      trialEndsAt: null,
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: 'premium',
      analysesThisMonth: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Cria nova instância do DB lendo o mesmo arquivo
    const reloadedDb = new Database(TEST_DB_PATH);
    const loaded = reloadedDb.findUserById(userRec.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.role).toBe('owner');
  });
});
