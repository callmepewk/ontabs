// src/services/tabService.ts
// MOCK — persistência em memória. Trocar por API real quando existir backend.

import { Tab } from '@/types/domain';

export interface TabService {
  list(): Promise<Tab[]>;
  get(id: string): Promise<Tab | null>;
  save(tab: Tab): Promise<Tab>;
  duplicate(id: string): Promise<Tab | null>;
  remove(id: string): Promise<void>;
}

class MockTabService implements TabService {
  private tabs = new Map<string, Tab>();

  async list(): Promise<Tab[]> {
    return Array.from(this.tabs.values());
  }

  async get(id: string): Promise<Tab | null> {
    return this.tabs.get(id) ?? null;
  }

  async save(tab: Tab): Promise<Tab> {
    const now = new Date().toISOString();
    const next: Tab = { ...tab, updatedAt: now, createdAt: tab.createdAt ?? now };
    this.tabs.set(next.id, next);
    return next;
  }

  async duplicate(id: string): Promise<Tab | null> {
    const original = this.tabs.get(id);
    if (!original) return null;
    const copy: Tab = {
      ...original,
      id: crypto.randomUUID(),
      title: `${original.title} (cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tabs.set(copy.id, copy);
    return copy;
  }

  async remove(id: string): Promise<void> {
    this.tabs.delete(id);
  }
}

export const tabService: TabService = new MockTabService();
