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

    // Confirma que a música ainda existe para o proprietário legítimo (Usuário A)
    const getRes = await fetch(`${BASE_URL}/api/songs/${songAId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(getRes.status).toBe(200);

    // Proteção IDOR: Usuário B ou anônimo não podem ler a música privada do Usuário A (HTTP 403)
    const getBRes = await fetch(`${BASE_URL}/api/songs/${songAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(getBRes.status).toBe(403);

    const getAnonRes = await fetch(`${BASE_URL}/api/songs/${songAId}`);
    expect(getAnonRes.status).toBe(403);
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

  it('GET /api/catalog retorna catálogo soberano verificado com 9 ativos e metadados de direitos', async () => {
    const res = await fetch(`${BASE_URL}/api/catalog`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.version).toBe('1.0.0');
    expect(data.totalAssets).toBe(9);
    expect(data.assets).toHaveLength(9);
    expect(data.collectionsCount).toBeDefined();

    // Filtro por coleção
    const resDemo = await fetch(`${BASE_URL}/api/catalog?collection=public_demo`);
    expect(resDemo.status).toBe(200);
    const demoData = await resDemo.json();
    expect(demoData.totalAssets).toBe(5);
    expect(demoData.assets.every((a: any) => a.targetCollection === 'public_demo')).toBe(true);
  });

  it('POST /api/media/validate aceita MP3 autêntico com ID3 e rejeita arquivo mascarado com erro descritivo', async () => {
    // 1. Buffer MP3 autêntico com ID3v2
    const mp3Buf = Buffer.concat([
      Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20]),
      Buffer.alloc(128),
    ]);

    const validRes = await fetch(`${BASE_URL}/api/media/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'solo_guitarra.mp3',
        dataBase64: mp3Buf.toString('base64'),
      }),
    });

    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.isValid).toBe(true);
    expect(validData.detectedFormat).toBe('mp3');
    expect(validData.reasonCode).toBe('ACCEPTED_SAFE');
    expect(validData.sanitizedFilename).toBe('solo_guitarra.mp3');

    // 2. Arquivo falso/mascarado (texto renomeado para .mp3)
    const spoofBuf = Buffer.from('ESTE E UM ARQUIVO DE TEXTO E NAO UM MP3');
    const spoofRes = await fetch(`${BASE_URL}/api/media/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'falso_audio.mp3',
        dataBase64: spoofBuf.toString('base64'),
      }),
    });

    expect(spoofRes.status).toBe(400);
    const spoofData = await spoofRes.json();
    expect(spoofData.isValid).toBe(false);
    expect(spoofData.reasonCode).toBe('SIGNATURE_MISMATCH');
    expect(spoofData.error).toContain('Assinatura binária do arquivo não corresponde');
  });

  it('GET /api/tabs/:id protege contra IDOR em tablaturas privadas e permite acesso a tablaturas do sistema', async () => {
    // 1. Tablatura pública de demonstração do sistema
    const demoTabRes = await fetch(`${BASE_URL}/api/tabs/tab_demo_canon_rock`);
    expect(demoTabRes.status).toBe(200);
    const demoTab = await demoTabRes.json();
    expect(demoTab.id).toBe('tab_demo_canon_rock');
    expect(demoTab.userId).toBe('system');

    // 2. Cria usuário e tablatura privada
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `tab_owner_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const token = (await regRes.json()).token;

    const convRes = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Tablatura Secreta de Guitarra' }),
    });
    const { tab } = await convRes.json();
    expect(tab.id).toBeDefined();

    // Proprietário lê com sucesso
    const ownerRes = await fetch(`${BASE_URL}/api/tabs/${tab.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(ownerRes.status).toBe(200);
    expect((await ownerRes.json()).id).toBe(tab.id);

    // Visitante anônimo tem acesso negado (403)
    const anonRes = await fetch(`${BASE_URL}/api/tabs/${tab.id}`);
    expect(anonRes.status).toBe(403);
    expect((await anonRes.json()).error).toContain('recurso privado restrito');

    // Outro usuário registrado tem acesso negado (403)
    const otherUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `tab_intruder_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const intruderToken = (await otherUserRes.json()).token;

    const intruderRes = await fetch(`${BASE_URL}/api/tabs/${tab.id}`, {
      headers: { Authorization: `Bearer ${intruderToken}` },
    });
    expect(intruderRes.status).toBe(403);
  });

  it('POST /api/music/convert suporta idempotência estrita via Idempotency-Key sem duplicar registros ou cotas', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `idemp_user_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const { token, user } = await regRes.json();

    const idempotencyKey = `idemp_key_${Date.now()}_abc`;
    const payload = {
      title: 'Solo Épico Idempotente',
      artist: 'Guitar Master',
      instrument: 'guitar',
      durationSeconds: 30,
      bpm: 128,
    };

    // 1. Primeira execução: processa e cria registros
    const initialSongsCount = testDb.listSongs({}).total;
    const res1 = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    expect(data1.song.title).toBe('Solo Épico Idempotente');
    const songId = data1.song.id;
    const tabId = data1.tab.id;

    // Verifica que 1 música foi adicionada
    expect(testDb.listSongs({}).total).toBe(initialSongsCount + 1);
    const userAfterFirst = testDb.findUserById(user.id);
    const analysesAfterFirst = userAfterFirst?.analysesThisMonth || 0;
    expect(analysesAfterFirst).toBe(1);

    // 2. Segunda execução idêntica com a MESMA chave de idempotência
    const res2 = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    expect(res2.status).toBe(200);
    expect(res2.headers.get('idempotent-replayed')).toBe('true');
    expect(res2.headers.get('x-cache-lookup')).toBe('HIT');
    const data2 = await res2.json();

    // Confirma que retorna exatamente a mesma música e tablatura
    expect(data2.song.id).toBe(songId);
    expect(data2.tab.id).toBe(tabId);
    expect(data2.job.resultTabId).toBe(tabId);

    // Confirma que NÃO criou registro duplicado no banco
    expect(testDb.listSongs({}).total).toBe(initialSongsCount + 1);

    // Confirma que NÃO incrementou contagem de análises novamente
    const userAfterSecond = testDb.findUserById(user.id);
    expect(userAfterSecond?.analysesThisMonth).toBe(analysesAfterFirst);
  });

  it('POST /api/music/convert rejeita reuso de Idempotency-Key com payload divergente (HTTP 409 Conflict)', async () => {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `idemp_conflict_${Date.now()}@ontabs.app`, password: 'password123' }),
    });
    const { token } = await regRes.json();

    const idempotencyKey = `conflict_key_${Date.now()}`;
    const payload1 = {
      title: 'Versão Original',
      bpm: 100,
    };
    const payload2 = {
      title: 'Versão Modificada com Mesmo Key',
      bpm: 160,
    };

    // Primeira requisição com payload 1
    const res1 = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload1),
    });
    expect(res1.status).toBe(200);

    // Segunda requisição com mesma chave mas payload 2 (divergente)
    const res2 = await fetch(`${BASE_URL}/api/music/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload2),
    });

    expect(res2.status).toBe(409);
    const data2 = await res2.json();
    expect(data2.error).toContain('Conflito de idempotência');
    expect(data2.idempotencyKey).toBe(idempotencyKey);
  });

  describe('Gate J.4B.4: Remediação de Identidade Reservada e Defesa em Profundidade', () => {
    it('1. Visitante com ID aleatório válido cria música e tablatura com namespace seguro (não system)', async () => {
      const visitorId = `vis_legit_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': visitorId,
        },
        body: JSON.stringify({ title: 'Música Visitante Legítimo' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.song.userId).toBe(visitorId);
      expect(data.tab.userId).toBe(visitorId);
      expect(data.song.userId).not.toBe('system');
    });

    it('2. X-Visitor-Id: system não permite criar recursos públicos (atribui namespace seguro e bloqueia acesso público)', async () => {
      const spoofRes = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': 'system', // TENTATIVA DE SPOOF DE SISTEMA
        },
        body: JSON.stringify({ title: 'Tentativa de Injeção no Catálogo Público' }),
      });

      expect(spoofRes.status).toBe(200);
      const data = await spoofRes.json();

      // Confirma que o servidor neutralizou o ID 'system' e gerou um ID seguro com prefixo vis_
      expect(data.song.userId).not.toBe('system');
      expect(data.song.userId.startsWith('vis_')).toBe(true);
      expect(data.tab.userId).not.toBe('system');
      expect(data.tab.userId.startsWith('vis_')).toBe(true);

      // Confirma que terceiro anônimo NÃO consegue ler a música (HTTP 403)
      const anonSongRes = await fetch(`${BASE_URL}/api/songs/${data.song.id}`);
      expect(anonSongRes.status).toBe(403);

      // Confirma que terceiro anônimo NÃO consegue ler a tablatura (HTTP 403)
      const anonTabRes = await fetch(`${BASE_URL}/api/tabs/${data.tab.id}`);
      expect(anonTabRes.status).toBe(403);
    });

    it('3. Identificadores privilegiados e reservados (admin, owner, root, public, etc.) são neutralizados', async () => {
      const reservedAttempts = ['admin', 'owner', 'root', 'visitor', 'public', 'system_core', 'admin_power'];

      for (const reserved of reservedAttempts) {
        const res = await fetch(`${BASE_URL}/api/music/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Visitor-Id': reserved,
          },
          body: JSON.stringify({ title: `Teste Reservado ${reserved}` }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.song.userId).not.toBe(reserved);
        expect(data.song.userId.startsWith('vis_')).toBe(true);
        expect(data.song.userId).not.toBe('system');
        expect(data.song.userId).not.toBe('admin');
        expect(data.song.userId).not.toBe('owner');
      }
    });

    it('4. Visitante terceiro não consegue ler recursos privados criados por outro visitante', async () => {
      const creatorId = `vis_creator_${Date.now()}`;
      const intruderId = `vis_intruder_${Date.now()}`;

      const createRes = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': creatorId,
        },
        body: JSON.stringify({ title: 'Música Privada de Criador A' }),
      });
      const { song, tab } = await createRes.json();

      // Criador lê com sucesso (200)
      const ownerRes = await fetch(`${BASE_URL}/api/songs/${song.id}`, {
        headers: { 'X-Visitor-Id': creatorId },
      });
      expect(ownerRes.status).toBe(200);

      // Intruso recebe 403
      const intruderRes = await fetch(`${BASE_URL}/api/songs/${song.id}`, {
        headers: { 'X-Visitor-Id': intruderId },
      });
      expect(intruderRes.status).toBe(403);

      const intruderTabRes = await fetch(`${BASE_URL}/api/tabs/${tab.id}`, {
        headers: { 'X-Visitor-Id': intruderId },
      });
      expect(intruderTabRes.status).toBe(403);
    });

    it('5. Campos userId e role no corpo da requisição não conseguem forjar titularidade ou privilégios', async () => {
      const normalVisitorId = `vis_normal_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': normalVisitorId,
        },
        body: JSON.stringify({
          title: 'Tentativa de Forja via Body',
          userId: 'usr_spoofed_victim_123',
          role: 'admin',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.song.userId).toBe(normalVisitorId);
      expect(data.song.userId).not.toBe('usr_spoofed_victim_123');
      expect(data.tab.userId).toBe(normalVisitorId);
    });

    it('6. Recursos legítimos do catálogo system continuam acessíveis conforme contrato soberano', async () => {
      // Música demo do sistema é acessível publicamente (200)
      const demoRes = await fetch(`${BASE_URL}/api/songs/song_demo_canon_rock`);
      expect(demoRes.status).toBe(200);
      const demoData = await demoRes.json();
      expect(demoData.song.id).toBe('song_demo_canon_rock');
      expect(demoData.song.userId).toBe('system');

      // Tablatura demo do sistema é acessível publicamente (200)
      const tabDemoRes = await fetch(`${BASE_URL}/api/tabs/tab_demo_canon_rock`);
      expect(tabDemoRes.status).toBe(200);
      const tabDemoData = await tabDemoRes.json();
      expect(tabDemoData.id).toBe('tab_demo_canon_rock');
      expect(tabDemoData.userId).toBe('system');

      // Catálogo soberano permanece íntegro com 9 ativos
      const catRes = await fetch(`${BASE_URL}/api/catalog`);
      expect(catRes.status).toBe(200);
      const catData = await catRes.json();
      expect(catData.totalAssets).toBe(9);
    });

    it('7. Músicas e tablaturas mantêm comportamento de autorização consistente', async () => {
      // Recurso inexistente retorna 404 consistente
      const notFoundSong = await fetch(`${BASE_URL}/api/songs/song_non_existent_${Date.now()}`);
      expect(notFoundSong.status).toBe(404);

      const notFoundTab = await fetch(`${BASE_URL}/api/tabs/tab_non_existent_${Date.now()}`);
      expect(notFoundTab.status).toBe(404);
    });

    it('8. Idempotência, isolamento entre usuários e quotas não sofrem regressão', async () => {
      const visitorId = `vis_idemp_check_${Date.now()}`;
      const idempotencyKey = `idemp_reg_${Date.now()}`;

      // 1ª execução
      const res1 = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': visitorId,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ title: 'Música Idempotente J4B4' }),
      });
      expect(res1.status).toBe(200);
      const data1 = await res1.json();

      // 2ª execução (replay com mesma chave e payload)
      const res2 = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': visitorId,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ title: 'Música Idempotente J4B4' }),
      });
      expect(res2.status).toBe(200);
      expect(res2.headers.get('idempotent-replayed')).toBe('true');
      const data2 = await res2.json();
      expect(data2.song.id).toBe(data1.song.id);
    });

    it('9. Cabeçalho ausente, vazio, malformado ou excessivamente longo é tratado de forma segura', async () => {
      // 1. Sem cabeçalho
      const resNoHeader = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Sem Header Visitor' }),
      });
      expect(resNoHeader.status).toBe(200);
      const dataNoHeader = await resNoHeader.json();
      expect(dataNoHeader.song.userId.startsWith('vis_')).toBe(true);

      // 2. Cabeçalho vazio
      const resEmpty = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': '' },
        body: JSON.stringify({ title: 'Header Vazio' }),
      });
      expect(resEmpty.status).toBe(200);
      const dataEmpty = await resEmpty.json();
      expect(dataEmpty.song.userId.startsWith('vis_')).toBe(true);

      // 3. Cabeçalho malformado com path traversal / caracteres ilegais
      const resMalicious = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': '../../etc/passwd<script>' },
        body: JSON.stringify({ title: 'Header Malicioso' }),
      });
      expect(resMalicious.status).toBe(200);
      const dataMalicious = await resMalicious.json();
      expect(dataMalicious.song.userId.startsWith('vis_')).toBe(true);
      expect(dataMalicious.song.userId).not.toContain('..');

      // 4. Cabeçalho excessivamente longo (> 64 caracteres)
      const excessivelyLong = 'a'.repeat(256);
      const resLong = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': excessivelyLong },
        body: JSON.stringify({ title: 'Header Gigante' }),
      });
      expect(resLong.status).toBe(200);
      const dataLong = await resLong.json();
      expect(dataLong.song.userId.startsWith('vis_')).toBe(true);
      expect(dataLong.song.userId.length).toBeLessThan(60);
    });

    it('10. Repetição de requisições não muda inadvertidamente a titularidade de recursos existentes', async () => {
      const originalVisitor = `vis_orig_${Date.now()}`;
      const resCreate = await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': originalVisitor,
        },
        body: JSON.stringify({ title: 'Música Titularidade Imutável' }),
      });
      const { song } = await resCreate.json();
      expect(song.userId).toBe(originalVisitor);

      // Outro visitante tenta reenviar ou converter outra música
      const secondVisitor = `vis_other_${Date.now()}`;
      await fetch(`${BASE_URL}/api/music/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Visitor-Id': secondVisitor,
        },
        body: JSON.stringify({ title: 'Música do Outro Visitante' }),
      });

      // Confirma que a primeira música permanece intacta com a titularidade original
      const verifyRes = await fetch(`${BASE_URL}/api/songs/${song.id}`, {
        headers: { 'X-Visitor-Id': originalVisitor },
      });
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.song.userId).toBe(originalVisitor);
    });
  });
});
