// src/services/musicService.ts
// Serviço de Músicas do Ontabs - Integrado com backend soberano

import { Song } from '@/types/domain';
import { authService } from './authService';

export interface PaginatedSongs {
  items: Song[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MusicService {
  listLibrary(page?: number, pageSize?: number, search?: string, instrument?: string): Promise<PaginatedSongs>;
  getSong(id: string): Promise<Song | null>;
  deleteSong(id: string): Promise<boolean>;
  uploadAudioFile(file: File, instrument?: string): Promise<Song>;
  submitYoutubeUrl(url: string, instrument?: string): Promise<Song>;
}

class SovereignMusicService implements MusicService {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Visitor-Id': authService.getVisitorId(),
    };
    const token = authService.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async listLibrary(page = 1, pageSize = 10, search?: string, instrument?: string): Promise<PaginatedSongs> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search) params.set('search', search);
    if (instrument) params.set('instrument', instrument);

    const res = await fetch(`/api/songs?${params.toString()}`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error('Falha ao listar biblioteca de músicas.');
    }

    return await res.json();
  }

  async getSong(id: string): Promise<Song | null> {
    const res = await fetch(`/api/songs/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.song;
  }

  async deleteSong(id: string): Promise<boolean> {
    const res = await fetch(`/api/songs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  async uploadAudioFile(file: File, instrument = 'guitar'): Promise<Song> {
    const title = file.name.replace(/\.[^/.]+$/, '');
    const res = await fetch('/api/music/convert', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        title,
        artist: 'Arquivo de Áudio',
        instrument,
        durationSeconds: 60,
        bpm: 120,
        songKey: 'C',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao converter áudio.');
    }

    const data = await res.json();
    return data.song;
  }

  async submitYoutubeUrl(url: string, instrument = 'guitar'): Promise<Song> {
    const resolveRes = await fetch('/api/connectors/resolve', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ url }),
    });

    if (!resolveRes.ok) {
      const err = await resolveRes.json();
      throw new Error(err.error || 'Falha ao validar URL externa.');
    }

    const resolved = await resolveRes.json();

    const res = await fetch('/api/music/convert', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        title: resolved.title,
        artist: `${resolved.provider.toUpperCase()} Import`,
        instrument,
        durationSeconds: 60,
        bpm: 120,
        songKey: 'C',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Falha ao processar link.');
    }

    const data = await res.json();
    return data.song;
  }
}

export const musicService: MusicService = new SovereignMusicService();
