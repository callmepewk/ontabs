// src/server/db.ts
// Motor de Persistência Independente do Ontabs
// Transacional, atômico e durável em disco (data/ontabs-store.json) com isolamento multiusuário.

import fs from 'node:fs';
import path from 'node:path';
import { UserAccessRecord } from './accessStateMachine';

export interface UserRecord extends UserAccessRecord {
  passwordHash: string;
  salt: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface VisitorUsageRecord {
  visitorId: string;
  consumedAt: string;
}

export interface SongRecord {
  id: string;
  userId: string;
  title: string;
  artist: string;
  durationSeconds: number;
  bpm: number;
  songKey: string;
  tuning: string[];
  instrument: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  audioUrl?: string;
  coverUrl?: string;
  tabId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TabNoteRecord {
  timestamp: number;
  stringNumber: number;
  fret: number;
  duration?: number;
  finger?: number;
}

export interface TabRecord {
  id: string;
  songId: string;
  userId: string;
  title: string;
  artist: string;
  instrument: string;
  tuning: string[];
  bpm: number;
  difficulty: string;
  sections: { id: string; name: string; startTime: number; endTime: number }[];
  notes: TabNoteRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PracticeRecord {
  id: string;
  userId: string;
  songId: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  createdAt: string;
}

export interface SetlistRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  items: {
    id: string;
    songId: string;
    title: string;
    artist: string;
    targetInstrument: string;
    tuning: string;
    bpm: number;
    targetBpm: number;
    key: string;
    stageNotes?: string;
    cueInSeconds?: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  version: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  visitorUsage: VisitorUsageRecord[];
  songs: SongRecord[];
  tablatures: TabRecord[];
  practiceSessions: PracticeRecord[];
  setlists?: SetlistRecord[];
}

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'ontabs-store.json');

export class Database {
  private filePath: string;
  private data: DatabaseSchema;

  constructor(filePath = DEFAULT_DB_PATH) {
    this.filePath = filePath;
    this.data = {
      version: 1,
      users: [],
      sessions: [],
      visitorUsage: [],
      songs: [],
      tablatures: [],
      practiceSessions: [],
    };
    this.init();
  }

  private init(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Erro ao ler banco de dados. Restaurando snapshot vazio.', err);
        this.save();
      }
    } else {
      this.seedDefaultData();
      this.save();
    }
  }

  private seedDefaultData(): void {
    const now = new Date().toISOString();
    // Músicas de demonstração de alta fidelidade
    const demoSong: SongRecord = {
      id: 'song_demo_canon_rock',
      userId: 'system',
      title: 'Canon Rock Theme',
      artist: 'JerryC / Pachelbel',
      durationSeconds: 120,
      bpm: 130,
      songKey: 'D',
      tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      instrument: 'guitar',
      status: 'ready',
      tabId: 'tab_demo_canon_rock',
      createdAt: now,
      updatedAt: now,
    };

    const demoTab: TabRecord = {
      id: 'tab_demo_canon_rock',
      songId: 'song_demo_canon_rock',
      userId: 'system',
      title: 'Canon Rock - Lead Guitar',
      artist: 'JerryC',
      instrument: 'guitar',
      tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
      bpm: 130,
      difficulty: 'medium',
      sections: [
        { id: 'sec_intro', name: 'Intro', startTime: 0, endTime: 15 },
        { id: 'sec_verse', name: 'Tema Principal', startTime: 15, endTime: 45 },
      ],
      notes: [
        { timestamp: 0.5, stringNumber: 3, fret: 7, duration: 0.5 }, // D4
        { timestamp: 1.0, stringNumber: 2, fret: 7, duration: 0.5 }, // F#4
        { timestamp: 1.5, stringNumber: 1, fret: 5, duration: 0.5 }, // A4
        { timestamp: 2.0, stringNumber: 1, fret: 7, duration: 0.5 }, // B4
        { timestamp: 2.5, stringNumber: 1, fret: 9, duration: 0.5 }, // C#5
        { timestamp: 3.0, stringNumber: 1, fret: 10, duration: 1.0 }, // D5
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.data.songs.push(demoSong);
    this.data.tablatures.push(demoTab);
  }

  private writeQueue: Promise<void> = Promise.resolve();

  public save(): void {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.${randomSuffix}.tmp`;
    const payload = JSON.stringify(this.data, null, 2);
    try {
      fs.writeFileSync(tmpPath, payload, 'utf8');
      let retries = 5;
      while (retries > 0) {
        try {
          fs.renameSync(tmpPath, this.filePath);
          return;
        } catch (renameErr: any) {
          if ((renameErr.code === 'EPERM' || renameErr.code === 'EBUSY') && retries > 1) {
            retries--;
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15);
          } else {
            throw renameErr;
          }
        }
      }
    } catch (err) {
      if (fs.existsSync(tmpPath)) {
        try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup error */ }
      }
      throw err;
    }
  }

  public async saveAsync(): Promise<void> {
    const saveOperation = async () => {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.${randomSuffix}.tmp`;
      const payload = JSON.stringify(this.data, null, 2);
      try {
        await fs.promises.writeFile(tmpPath, payload, 'utf8');
        let retries = 5;
        while (retries > 0) {
          try {
            await fs.promises.rename(tmpPath, this.filePath);
            return;
          } catch (renameErr: any) {
            if ((renameErr.code === 'EPERM' || renameErr.code === 'EBUSY') && retries > 1) {
              retries--;
              await new Promise((resolve) => setTimeout(resolve, 20));
            } else {
              throw renameErr;
            }
          }
        }
      } catch (err) {
        if (fs.existsSync(tmpPath)) {
          try { await fs.promises.unlink(tmpPath); } catch { /* ignore cleanup error */ }
        }
        throw err;
      }
    };

    this.writeQueue = this.writeQueue.then(saveOperation, saveOperation);
    return this.writeQueue;
  }

  // --- Usuários & Sessões ---
  public findUserByEmail(email: string): UserRecord | null {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public findUserById(id: string): UserRecord | null {
    return this.data.users.find((u) => u.id === id) || null;
  }

  public countUsers(): number {
    return this.data.users.length;
  }

  public createUser(user: UserRecord): UserRecord {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.users[index];
  }

  public createSession(session: SessionRecord): void {
    this.data.sessions.push(session);
    this.save();
  }

  public findSession(token: string): SessionRecord | null {
    const sess = this.data.sessions.find((s) => s.token === token);
    if (!sess) return null;
    if (new Date(sess.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return null;
    }
    return sess;
  }

  public deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // --- Uso Gratuito do Visitante ---
  public hasVisitorConsumedFreeUse(visitorId: string): boolean {
    return this.data.visitorUsage.some((v) => v.visitorId === visitorId);
  }

  public markVisitorFreeUseConsumed(visitorId: string): void {
    if (!this.hasVisitorConsumedFreeUse(visitorId)) {
      this.data.visitorUsage.push({
        visitorId,
        consumedAt: new Date().toISOString(),
      });
      this.save();
    }
  }

  // --- Músicas ---
  public listSongs(options: {
    userId?: string;
    search?: string;
    instrument?: string;
    page?: number;
    pageSize?: number;
  }): { items: SongRecord[]; total: number; page: number; pageSize: number; totalPages: number } {
    let items = [...this.data.songs];

    // Se especificado userId, inclui músicas públicas do sistema e do usuário
    if (options.userId) {
      items = items.filter((s) => s.userId === 'system' || s.userId === options.userId);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      items = items.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
    }

    if (options.instrument) {
      items = items.filter((s) => s.instrument === options.instrument);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, options.pageSize || 10);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public getSong(id: string): SongRecord | null {
    return this.data.songs.find((s) => s.id === id) || null;
  }

  public createSong(song: SongRecord): SongRecord {
    this.data.songs.push(song);
    this.save();
    return song;
  }

  public deleteSong(id: string, userId: string): boolean {
    const prevLen = this.data.songs.length;
    this.data.songs = this.data.songs.filter((s) => !(s.id === id && (s.userId === userId || userId === 'admin')));
    const deleted = this.data.songs.length < prevLen;
    if (deleted) {
      this.data.tablatures = this.data.tablatures.filter((t) => t.songId !== id);
      this.save();
    }
    return deleted;
  }

  // --- Tablaturas ---
  public getTab(id: string): TabRecord | null {
    return this.data.tablatures.find((t) => t.id === id) || null;
  }

  public getTabBySongId(songId: string): TabRecord | null {
    return this.data.tablatures.find((t) => t.songId === songId) || null;
  }

  public saveTab(tab: TabRecord): TabRecord {
    const idx = this.data.tablatures.findIndex((t) => t.id === tab.id);
    if (idx >= 0) {
      this.data.tablatures[idx] = { ...tab, updatedAt: new Date().toISOString() };
    } else {
      this.data.tablatures.push(tab);
    }
    this.save();
    return tab;
  }

  // --- Prática & Scores ---
  public recordPractice(practice: PracticeRecord): PracticeRecord {
    this.data.practiceSessions.push(practice);
    this.save();
    return practice;
  }

  public listPractice(userId: string): PracticeRecord[] {
    return this.data.practiceSessions.filter((p) => p.userId === userId);
  }

  // --- Setlists & Ensaio de Banda ---
  public listSetlists(userId: string): SetlistRecord[] {
    const list = this.data.setlists || [];
    return list.filter((s) => s.userId === userId || s.userId === 'system');
  }

  public getSetlist(id: string): SetlistRecord | null {
    const list = this.data.setlists || [];
    return list.find((s) => s.id === id) || null;
  }

  public createSetlist(setlist: SetlistRecord): SetlistRecord {
    if (!this.data.setlists) this.data.setlists = [];
    this.data.setlists.push(setlist);
    this.save();
    return setlist;
  }

  public updateSetlist(id: string, updates: Partial<SetlistRecord>, userId: string): SetlistRecord | null {
    if (!this.data.setlists) return null;
    const idx = this.data.setlists.findIndex((s) => s.id === id && (s.userId === userId || userId === 'admin'));
    if (idx === -1) return null;
    this.data.setlists[idx] = {
      ...this.data.setlists[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.setlists[idx];
  }

  public deleteSetlist(id: string, userId: string): boolean {
    if (!this.data.setlists) return false;
    const prev = this.data.setlists.length;
    this.data.setlists = this.data.setlists.filter((s) => !(s.id === id && (s.userId === userId || userId === 'admin')));
    const deleted = this.data.setlists.length < prev;
    if (deleted) this.save();
    return deleted;
  }
}

export const db = new Database();
