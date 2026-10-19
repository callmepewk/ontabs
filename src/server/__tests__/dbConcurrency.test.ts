// src/server/__tests__/dbConcurrency.test.ts
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { Database } from '../db';

const CONCURRENCY_DB_PATH = path.resolve(process.cwd(), 'data', 'test-concurrency-store.json');

describe('Database Mutex & Atomic Persistence Under Concurrent Load', () => {
  let db: Database;

  beforeAll(() => {
    if (fs.existsSync(CONCURRENCY_DB_PATH)) fs.unlinkSync(CONCURRENCY_DB_PATH);
    db = new Database(CONCURRENCY_DB_PATH);
  });

  afterAll(() => {
    if (fs.existsSync(CONCURRENCY_DB_PATH)) fs.unlinkSync(CONCURRENCY_DB_PATH);
  });

  it('Suporta 10 gravações simultâneas sem corromper JSON ou perder registros', async () => {
    const operations = Array.from({ length: 10 }, (_, i) => {
      const visitorId = `visitor_concurrent_${i}_${Date.now()}`;
      db.markVisitorFreeUseConsumed(visitorId);
      return db.saveAsync();
    });

    await Promise.all(operations);

    // Reabre uma nova instância de Database a partir do arquivo para validar integridade em disco
    const reloadedDb = new Database(CONCURRENCY_DB_PATH);
    const consumed = reloadedDb['data'].visitorUsage;

    expect(consumed.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(consumed.some((v) => v.visitorId.startsWith(`visitor_concurrent_${i}_`))).toBe(true);
    }
  });
});
