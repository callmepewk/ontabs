// src/services/musicService.ts
//
// MOCK — sem backend real ainda.
// Interface pronta para ser trocada por chamadas HTTP reais (fetch/axios)
// para a API do OnTabs quando ela existir. Nenhuma função aqui finge
// processar áudio de verdade.

import { Song } from '@/types/domain';

export interface MusicService {
  listLibrary(): Promise<Song[]>;
  getSong(id: string): Promise<Song | null>;
  uploadAudioFile(file: File): Promise<Song>;
  submitYoutubeUrl(url: string): Promise<Song>;
}

class MockMusicService implements MusicService {
  private library: Song[] = [];

  async listLibrary(): Promise<Song[]> {
    return this.library;
  }

  async getSong(id: string): Promise<Song | null> {
    return this.library.find((s) => s.id === id) ?? null;
  }

  async uploadAudioFile(file: File): Promise<Song> {
    // MOCK: não há processamento de áudio real aqui. Isso apenas registra
    // a música como "pending" até a etapa de conversão ser implementada.
    const song: Song = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Desconhecido',
      durationSeconds: 0,
      status: 'pending',
    };
    this.library.push(song);
    return song;
  }

  async submitYoutubeUrl(url: string): Promise<Song> {
    // MOCK: integração com YouTube ainda não implementada.
    // Isso só registra a intenção — não baixa nem processa nada.
    const song: Song = {
      id: crypto.randomUUID(),
      title: `Música de ${url}`,
      artist: 'Desconhecido',
      durationSeconds: 0,
      status: 'pending',
    };
    this.library.push(song);
    return song;
  }
}

export const musicService: MusicService = new MockMusicService();
