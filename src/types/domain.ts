// src/types/domain.ts
// Modelos de dados centrais do OnTabs. O módulo Play consome um GameChart
// (ver src/features/play/types.ts) derivado de uma Tab — este é o modelo
// "fonte", que a futura conversão de música vai popular.

export type Instrument = 'guitar' | 'acoustic_guitar' | 'bass' | 'ukulele';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface TabSection {
  id: string;
  name: 'intro' | 'verse' | 'chorus' | 'solo' | 'bridge' | 'outro' | string;
  startTime: number; // segundos
  endTime: number;
}

export interface TabNoteEvent {
  timestamp: number;
  strings: number[]; // cordas/casas tocadas simultaneamente
  sustainMs?: number;
}

export interface Tab {
  id: string;
  title: string;
  artist: string;
  instrument: Instrument;
  tuning: string[]; // ex: ['E','A','D','G','B','E']
  bpm: number;
  durationSeconds: number;
  difficulty: Difficulty;
  sections: TabSection[];
  notes: TabNoteEvent[];
  createdAt: string;
  updatedAt: string;
  source: 'upload' | 'youtube' | 'spotify' | 'manual';
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  audioUrl?: string;       // presente quando já processado
  coverUrl?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  tabId?: string;           // referência à Tab gerada, quando existir
}

export interface UserSettings {
  keyBindings: string[];   // teclas por lane
  audioVolume: number;     // 0-1
  reducedMotion: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  settings: UserSettings;
}
