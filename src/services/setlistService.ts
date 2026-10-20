// src/services/setlistService.ts
// Ontabs Band Rehearsal & Live Setlist Service
// Integrado com o backend soberano Node.js

import { authService } from './authService';
import { Setlist, SetlistItem } from '@/engine/setlists';

export interface CreateSetlistInput {
  name: string;
  description?: string;
  items?: SetlistItem[];
}

export interface UpdateSetlistInput {
  name?: string;
  description?: string;
  items?: SetlistItem[];
}

class SovereignSetlistService {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Visitor-Id': authService.getVisitorId(),
    };
    const token = authService.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async list(): Promise<Setlist[]> {
    const res = await fetch('/api/setlists', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Falha ao listar repertórios/setlists.');
    }
    return await res.json();
  }

  async get(id: string): Promise<Setlist> {
    const res = await fetch(`/api/setlists/${encodeURIComponent(id)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Repertório não encontrado.');
    }
    return await res.json();
  }

  async create(data: CreateSetlistInput): Promise<Setlist> {
    const res = await fetch('/api/setlists', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao criar repertório.');
    }
    return await res.json();
  }

  async update(id: string, data: UpdateSetlistInput): Promise<Setlist> {
    const res = await fetch(`/api/setlists/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar repertório.');
    }
    return await res.json();
  }

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`/api/setlists/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }
}

export const setlistService = new SovereignSetlistService();
