// ontabs-play/progressStore.ts
// Interface plugável: no seu backend real, troque LocalStorageAdapter por um
// adapter que salva na API/DB do OnTabs (mesmo padrão, outra implementação).

import { ProgressRecord, Difficulty, GameStats } from './types';

export interface ProgressAdapter {
  get(songId: string, difficulty: Difficulty): Promise<ProgressRecord | null>;
  save(record: ProgressRecord): Promise<void>;
  addPracticeSeconds(songId: string, difficulty: Difficulty, seconds: number): Promise<void>;
}

const STORAGE_PREFIX = 'ontabs:play:progress:';

export class LocalStorageAdapter implements ProgressAdapter {
  private key(songId: string, difficulty: Difficulty) {
    return `${STORAGE_PREFIX}${songId}:${difficulty}`;
  }

  async get(songId: string, difficulty: Difficulty): Promise<ProgressRecord | null> {
    const raw = localStorage.getItem(this.key(songId, difficulty));
    return raw ? (JSON.parse(raw) as ProgressRecord) : null;
  }

  async save(record: ProgressRecord): Promise<void> {
    localStorage.setItem(this.key(record.songId, record.difficulty), JSON.stringify(record));
  }

  async addPracticeSeconds(songId: string, difficulty: Difficulty, seconds: number): Promise<void> {
    const existing = await this.get(songId, difficulty);
    const base: ProgressRecord = existing ?? {
      songId,
      difficulty,
      bestScore: 0,
      bestAccuracy: 0,
      maxCombo: 0,
      completed: false,
      practiceSeconds: 0,
      updatedAt: Date.now(),
    };
    base.practiceSeconds += seconds;
    base.updatedAt = Date.now();
    await this.save(base);
  }
}

export class ProgressService {
  constructor(private adapter: ProgressAdapter = new LocalStorageAdapter()) {}

  async recordRun(songId: string, difficulty: Difficulty, stats: GameStats, completed: boolean): Promise<ProgressRecord> {
    const existing = await this.adapter.get(songId, difficulty);
    const record: ProgressRecord = {
      songId,
      difficulty,
      bestScore: Math.max(existing?.bestScore ?? 0, stats.score),
      bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, stats.accuracy),
      maxCombo: Math.max(existing?.maxCombo ?? 0, stats.maxCombo),
      completed: (existing?.completed ?? false) || completed,
      practiceSeconds: existing?.practiceSeconds ?? 0,
      updatedAt: Date.now(),
    };
    await this.adapter.save(record);
    return record;
  }

  async get(songId: string, difficulty: Difficulty) {
    return this.adapter.get(songId, difficulty);
  }

  async addPracticeTime(songId: string, difficulty: Difficulty, seconds: number) {
    return this.adapter.addPracticeSeconds(songId, difficulty, seconds);
  }
}
