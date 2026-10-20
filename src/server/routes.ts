// src/server/routes.ts
// Router de APIs REST do Ontabs - Decoupled & Sovereign Backend
// Suporte a CORS, parsing JSON, autenticação por Bearer/Cookie e autorização estrita.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Database, UserRecord, SongRecord, TabRecord } from './db';
import { hashPassword, verifyPassword, createSessionForUser, getSessionFromToken } from './auth';
import {
  evaluateAccessState,
  authorizeProtectedOperation,
  initializeUserTrial,
  PLAN_CATALOG,
  PlanCode,
} from './accessStateMachine';
import { Instrument } from '@/types/domain';
import { optimizeFretSequence } from '../engine/fretOptimization';
import { resolveExternalConnectorUrl } from '../engine/connectors';

export interface RequestContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  url: URL;
  body: any;
  user: UserRecord | null;
  visitorId: string;
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any): void {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Visitor-Id',
  });
  res.end(json);
}

export function handleCors(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Visitor-Id',
    });
    res.end();
    return true;
  }
  return false;
}

export async function parseRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Proteção contra payload gigantesco (> 10MB)
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

const STATIC_MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

function tryServeStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): boolean {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  if (pathname.startsWith('/api')) return false;

  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) return false;

  // 1. Arquivo exato requisitado (ex: /assets/index-xxx.js)
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(distDir, normalized);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = STATIC_MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(content);
    return true;
  }

  // 2. SPA Fallback: rotas de aplicação (/, /library, /converter, /setlists, etc.)
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': content.length,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
    return true;
  }

  return false;
}

export function extractAuthUser(req: http.IncomingMessage, db: Database): UserRecord | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  const session = getSessionFromToken(db, token);
  return session ? session.user : null;
}

export async function dispatchApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  db: Database
): Promise<void> {
  if (handleCors(req, res)) return;

  const fullUrl = `http://${req.headers.host || 'localhost'}${req.url}`;
  const url = new URL(fullUrl);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  // Servir arquivos estáticos do frontend em produção/standalone (SPA fallback para /, /library, etc.)
  if (tryServeStatic(req, res, pathname)) return;

  const user = extractAuthUser(req, db);
  const visitorId = (req.headers['x-visitor-id'] as string) || 'visitor_default';
  const visitorConsumed = db.hasVisitorConsumedFreeUse(visitorId);
  const body = method === 'POST' || method === 'PUT' ? await parseRequestBody(req) : {};

  // --- HEALTH CHECK ---
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'healthy',
      service: 'ontabs-independent-runtime',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  }

  // --- AUTH ENDPOINTS ---
  if (pathname === '/api/auth/register' && method === 'POST') {
    const { email, password, name } = body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return sendJson(res, 400, { error: 'E-mail e senha são obrigatórios.' });
    }
    if (password.length < 6) {
      return sendJson(res, 400, { error: 'A senha deve conter pelo menos 6 caracteres.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return sendJson(res, 409, { error: 'Este e-mail já está cadastrado.' });
    }

    const adminEmails = (process.env.ONTABS_ADMIN_EMAILS || 'pedro@ontabs.com,admin@ontabs.com')
      .toLowerCase()
      .split(',')
      .map((e) => e.trim());
    const isInitialAdmin = adminEmails.includes(email.toLowerCase());
    const role: 'user' | 'admin' | 'owner' = isInitialAdmin ? 'owner' : 'user';

    const trial = initializeUserTrial();
    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      name: name || email.split('@')[0],
      role,
      passwordHash: hash,
      salt,
      status: 'active',
      trialStartedAt: trial.trialStartedAt,
      trialEndsAt: trial.trialEndsAt,
      trialConsumed: true,
      subscriptionStatus: 'none',
      planCode: trial.planCode,
      analysesThisMonth: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.createUser(newUser);
    const session = createSessionForUser(db, newUser.id);

    return sendJson(res, 201, {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        planCode: newUser.planCode,
        trialEndsAt: newUser.trialEndsAt,
      },
      token: session.token,
    });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) {
      return sendJson(res, 400, { error: 'E-mail e senha são obrigatórios.' });
    }

    const existing = db.findUserByEmail(email);
    if (!existing) {
      return sendJson(res, 401, { error: 'Credenciais inválidas.' });
    }

    const isValid = verifyPassword(password, existing.passwordHash, existing.salt);
    if (!isValid) {
      return sendJson(res, 401, { error: 'Credenciais inválidas.' });
    }

    const session = createSessionForUser(db, existing.id);
    return sendJson(res, 200, {
      user: {
        id: existing.id,
        email: existing.email,
        name: existing.name,
        role: existing.role || 'user',
        planCode: existing.planCode,
        trialEndsAt: existing.trialEndsAt,
      },
      token: session.token,
    });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) db.deleteSession(match[1]);
    }
    return sendJson(res, 200, { success: true });
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!user) {
      return sendJson(res, 401, { error: 'Não autenticado.' });
    }
    const state = evaluateAccessState(user, visitorConsumed);
    return sendJson(res, 200, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        planCode: user.planCode,
        trialStartedAt: user.trialStartedAt,
        trialEndsAt: user.trialEndsAt,
        subscriptionStatus: user.subscriptionStatus,
        analysesThisMonth: user.analysesThisMonth,
      },
      accessState: state,
    });
  }

  // --- ENTITLEMENT & TRIAL STATUS ---
  if (pathname === '/api/entitlement/status' && method === 'GET') {
    const authResult = authorizeProtectedOperation(user, visitorConsumed, 'audio_analysis');
    return sendJson(res, 200, {
      accessState: authResult.state,
      isAuthorized: authResult.isAuthorized,
      role: user?.role || 'visitor',
      remainingTrialHours: authResult.remainingTrialHours || 0,
      reason: authResult.reason || null,
      plan: authResult.plan,
    });
  }

  if (pathname === '/api/entitlement/consume-free' && method === 'POST') {
    db.markVisitorFreeUseConsumed(visitorId);
    return sendJson(res, 200, { success: true, visitorConsumed: true });
  }

  // --- PLANOS & CHECKOUT READINESS ---
  if (pathname === '/api/plans' && method === 'GET') {
    return sendJson(res, 200, {
      plans: Object.values(PLAN_CATALOG),
      billingConfigured: false, // Checkout Stripe transparente para homologação
    });
  }

  if (pathname === '/api/plans/select' && method === 'POST') {
    if (!user) {
      return sendJson(res, 401, { error: 'Autenticação necessária para escolher um plano.' });
    }
    const { planCode } = body as { planCode: PlanCode };
    if (!planCode || !PLAN_CATALOG[planCode]) {
      return sendJson(res, 400, { error: 'Plano inválido.' });
    }

    if (planCode !== 'free') {
      return sendJson(res, 402, {
        error:
          'Ambiente de pagamento em homologação (Stripe/Pix não configurado para cobrança real). Utilize o período de Trial Pro de 7 dias para testar todas as funcionalidades do OnTabs.',
        code: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
      });
    }

    const updated = db.updateUser(user.id, {
      planCode: 'free',
      subscriptionStatus: 'none',
    });

    return sendJson(res, 200, {
      success: true,
      message: `Plano alterado para Gratuito.`,
      user: {
        id: updated?.id,
        planCode: updated?.planCode,
        subscriptionStatus: updated?.subscriptionStatus,
      },
    });
  }

  // --- CONECTORES DE MÍDIA EXTERNA (YOUTUBE / SPOTIFY) ---
  if (pathname === '/api/connectors/resolve' && method === 'POST') {
    const { url: mediaUrl } = body as { url?: string };
    if (!mediaUrl) {
      return sendJson(res, 400, { error: 'O parâmetro "url" é obrigatório.' });
    }
    try {
      const resolved = resolveExternalConnectorUrl(mediaUrl);
      return sendJson(res, 200, resolved);
    } catch (err: any) {
      return sendJson(res, 400, { error: err.message || 'Falha ao validar conector externo.' });
    }
  }

  // --- MÚSICAS & BIBLIOTECA (PAGINADA) ---
  if (pathname === '/api/songs' && method === 'GET') {
    const search = url.searchParams.get('search') || undefined;
    const instrument = url.searchParams.get('instrument') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

    const result = db.listSongs({
      userId: user?.id,
      search,
      instrument,
      page,
      pageSize,
    });

    return sendJson(res, 200, result);
  }

  if (pathname.startsWith('/api/songs/') && method === 'GET') {
    const songId = pathname.replace('/api/songs/', '');
    const song = db.getSong(songId);
    if (!song) {
      return sendJson(res, 404, { error: 'Música não encontrada.' });
    }
    const tab = song.tabId ? db.getTab(song.tabId) : db.getTabBySongId(song.id);
    return sendJson(res, 200, { song, tab });
  }

  if (pathname.startsWith('/api/songs/') && method === 'DELETE') {
    if (!user) {
      return sendJson(res, 401, { error: 'Autenticação necessária para excluir músicas.' });
    }
    const songId = pathname.replace('/api/songs/', '');
    const deleted = db.deleteSong(songId, user.id);
    if (!deleted) {
      return sendJson(res, 403, { error: 'Operação não autorizada ou música não encontrada.' });
    }
    return sendJson(res, 200, { success: true });
  }

  // --- PIPELINE DE CONVERSÃO PROTEGIDA ---
  if (pathname === '/api/music/convert' && method === 'POST') {
    // 1. Verificação de Entitlement Server-Side
    const auth = authorizeProtectedOperation(user, visitorConsumed, 'audio_analysis');
    if (!auth.isAuthorized) {
      return sendJson(res, 403, {
        error: auth.reason || 'Operação protegida não autorizada.',
        accessState: auth.state,
      });
    }

    // 2. Se for visitante, consome atomicamente a utilização gratuita única
    if (!user) {
      db.markVisitorFreeUseConsumed(visitorId);
    } else {
      db.updateUser(user.id, {
        analysesThisMonth: (user.analysesThisMonth || 0) + 1,
      });
    }

    const {
      title = 'Nova Análise Musical',
      artist = 'Artista Independente',
      instrument = 'guitar',
      notes = [],
      durationSeconds = 60,
      bpm = 120,
      songKey = 'C',
    } = body;

    const songId = `song_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // 3. Execução da Otimização Musical de Domínio
    const mappedNotes = notes.length > 0
      ? optimizeFretSequence(notes, instrument as Instrument)
      : [
          { timestamp: 0.5, midi: 60, stringNumber: 2, fret: 1, duration: 0.5 },
          { timestamp: 1.0, midi: 64, stringNumber: 1, fret: 0, duration: 0.5 },
          { timestamp: 1.5, midi: 67, stringNumber: 1, fret: 3, duration: 0.5 },
        ];

    const newSong: SongRecord = {
      id: songId,
      userId: user?.id || 'visitor',
      title,
      artist,
      durationSeconds: Number(durationSeconds),
      bpm: Number(bpm),
      songKey,
      tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      instrument,
      status: 'ready',
      tabId,
      createdAt: now,
      updatedAt: now,
    };

    const newTab: TabRecord = {
      id: tabId,
      songId,
      userId: user?.id || 'visitor',
      title: `${title} (${instrument})`,
      artist,
      instrument,
      tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      bpm: Number(bpm),
      difficulty: 'medium',
      sections: [{ id: 'sec_1', name: 'Parte A', startTime: 0, endTime: durationSeconds }],
      notes: mappedNotes,
      createdAt: now,
      updatedAt: now,
    };

    db.createSong(newSong);
    db.saveTab(newTab);

    return sendJson(res, 200, {
      success: true,
      job: {
        stage: 'done',
        progress: 100,
        resultTabId: tabId,
        songId,
      },
      song: newSong,
      tab: newTab,
    });
  }

  // --- TABLATURAS ---
  if (pathname.startsWith('/api/tabs/') && method === 'GET') {
    const tabId = pathname.replace('/api/tabs/', '');
    const tab = db.getTab(tabId);
    if (!tab) {
      return sendJson(res, 404, { error: 'Tablatura não encontrada.' });
    }
    return sendJson(res, 200, tab);
  }

  if (pathname === '/api/tabs' && method === 'POST') {
    if (!user) {
      return sendJson(res, 401, { error: 'Autenticação necessária para salvar tablaturas.' });
    }
    const tab = body as TabRecord;
    if (!tab || !tab.id) {
      return sendJson(res, 400, { error: 'Dados da tablatura incompletos.' });
    }
    tab.userId = user.id;
    const saved = db.saveTab(tab);
    return sendJson(res, 200, saved);
  }

  // --- PRÁTICA E PROGRESSO ---
  if (pathname === '/api/practice' && method === 'POST') {
    const { songId, score, accuracy, maxCombo } = body;
    const practice = db.recordPractice({
      id: `prc_${Date.now()}`,
      userId: user?.id || 'visitor',
      songId: songId || 'demo',
      score: score || 0,
      accuracy: accuracy || 100,
      maxCombo: maxCombo || 0,
      createdAt: new Date().toISOString(),
    });
    return sendJson(res, 201, practice);
  }

  if (pathname === '/api/practice' && method === 'GET') {
    const history = db.listPractice(user?.id || 'visitor');
    return sendJson(res, 200, history);
  }

  // --- SETLISTS & REPERTÓRIO DE BANDA ---
  if (pathname === '/api/setlists' && method === 'GET') {
    const setlists = db.listSetlists(user?.id || 'visitor');
    return sendJson(res, 200, setlists);
  }

  if (pathname.startsWith('/api/setlists/') && method === 'GET') {
    const id = pathname.replace('/api/setlists/', '');
    const setlist = db.getSetlist(id);
    if (!setlist) {
      return sendJson(res, 404, { error: 'Setlist não encontrado.' });
    }
    return sendJson(res, 200, setlist);
  }

  if (pathname === '/api/setlists' && method === 'POST') {
    const { name, description, items } = body;
    if (!name || typeof name !== 'string') {
      return sendJson(res, 400, { error: 'O nome do setlist é obrigatório.' });
    }
    const now = new Date().toISOString();
    const newSetlist = db.createSetlist({
      id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.id || 'visitor',
      name: name.trim(),
      description,
      items: items || [],
      createdAt: now,
      updatedAt: now,
    });
    return sendJson(res, 201, newSetlist);
  }

  if (pathname.startsWith('/api/setlists/') && method === 'PUT') {
    const id = pathname.replace('/api/setlists/', '');
    const updated = db.updateSetlist(id, body, user?.id || 'visitor');
    if (!updated) {
      return sendJson(res, 404, { error: 'Setlist não encontrado ou acesso não autorizado.' });
    }
    return sendJson(res, 200, updated);
  }

  if (pathname.startsWith('/api/setlists/') && method === 'DELETE') {
    const id = pathname.replace('/api/setlists/', '');
    const deleted = db.deleteSetlist(id, user?.id || 'visitor');
    if (!deleted) {
      return sendJson(res, 404, { error: 'Setlist não encontrado ou acesso não autorizado.' });
    }
    return sendJson(res, 200, { success: true });
  }

  // --- ADMINISTRAÇÃO E ACESSO ILIMITADO (FASE ADMIN) ---
  if (pathname === '/api/admin/metrics' && method === 'GET') {
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return sendJson(res, 403, { error: 'Acesso restrito a administradores autorizados.' });
    }
    return sendJson(res, 200, {
      totalUsers: db.countUsers ? db.countUsers() : 1,
      totalSongs: db.listSongs({}).total,
      totalSetlists: db.listSetlists(user.id).length,
      uptimeSeconds: Math.round(process.uptime()),
      systemState: 'SOVEREIGN_OPERATIONAL',
      timestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/api/admin/bootstrap' && method === 'POST') {
    const adminKey = req.headers['x-ontabs-admin-key'];
    const expectedKey = process.env.ONTABS_ADMIN_SECRET || 'ontabs-admin-secure-key-2026';
    if (!adminKey || adminKey !== expectedKey) {
      return sendJson(res, 401, { error: 'Chave de segurança de bootstrap administrativo inválida.' });
    }

    const { email, role } = body;
    if (!email || !role || (role !== 'admin' && role !== 'owner' && role !== 'user')) {
      return sendJson(res, 400, { error: 'Parâmetros "email" e "role" (admin|owner|user) são obrigatórios.' });
    }

    const targetUser = db.findUserByEmail(email);
    if (!targetUser) {
      return sendJson(res, 404, { error: 'Usuário não encontrado para bootstrap.' });
    }

    const updated = db.updateUser(targetUser.id, { role });
    return sendJson(res, 200, {
      success: true,
      user: {
        id: updated?.id,
        email: updated?.email,
        role: updated?.role,
      },
    });
  }

  if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/role') && method === 'POST') {
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return sendJson(res, 403, { error: 'Operação permitida exclusivamente para administradores.' });
    }
    const targetUserId = pathname.replace('/api/admin/users/', '').replace('/role', '');
    const { role } = body;
    if (!role || (role !== 'admin' && role !== 'owner' && role !== 'user')) {
      return sendJson(res, 400, { error: 'Role inválido. Deve ser admin, owner ou user.' });
    }

    const updated = db.updateUser(targetUserId, { role });
    if (!updated) {
      return sendJson(res, 404, { error: 'Usuário alvo não encontrado.' });
    }

    return sendJson(res, 200, { success: true, updatedUserId: targetUserId, newRole: role });
  }

  // Rota não encontrada
  return sendJson(res, 404, { error: 'Endpoint não encontrado.', path: pathname });
}
