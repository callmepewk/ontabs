// src/services/tabService.ts
// Serviço de Tablaturas do Ontabs - Integrado com backend soberano

import { Tab } from '@/types/domain';
import { authService } from './authService';

export interface TabService {
  get(id: string): Promise<Tab | null>;
  save(tab: Tab): Promise<Tab>;
  duplicate(id: string): Promise<Tab | null>;
  remove(id: string): Promise<void>;
}

class SovereignTabService implements TabService {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Visitor-Id': authService.getVisitorId(),
    };
    const token = authService.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async get(id: string): Promise<Tab | null> {
    const res = await fetch(`/api/tabs/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  async save(tab: Tab): Promise<Tab> {
    const res = await fetch('/api/tabs', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tab),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao salvar tablatura.');
    }

    return await res.json();
  }

  async duplicate(id: string): Promise<Tab | null> {
    const original = await this.get(id);
    if (!original) return null;

    const copy: Tab = {
      ...original,
      id: `tab_${Date.now()}_copy`,
      title: `${original.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.save(copy);
  }

  async remove(id: string): Promise<void> {
    await fetch(`/api/tabs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export const tabService: TabService = new SovereignTabService();
