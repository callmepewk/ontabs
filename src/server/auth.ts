// src/server/auth.ts
// Autenticação Criptográfica Segura do Ontabs
// PBKDF2/scrypt password hashing com sal único e sessões com tokens criptograficamente seguros.

import crypto from 'node:crypto';
import { Database, UserRecord, SessionRecord } from './db';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64);
  return {
    hash: derived.toString('hex'),
    salt,
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const hashBuffer = Buffer.from(hash, 'hex');
    return crypto.timingSafeEqual(derived, hashBuffer);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSessionForUser(db: Database, userId: string): SessionRecord {
  const token = generateSessionToken();
  const now = new Date();
  const session: SessionRecord = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  db.createSession(session);
  return session;
}

export function getSessionFromToken(db: Database, token: string): { user: UserRecord; session: SessionRecord } | null {
  if (!token) return null;
  const session = db.findSession(token);
  if (!session) return null;
  const user = db.findUserById(session.userId);
  if (!user) return null;
  return { user, session };
}
