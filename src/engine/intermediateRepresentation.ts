// src/engine/intermediateRepresentation.ts
// Ontabs Intermediate Musical Representation (IR)
// Formato unificado, versionado e agnóstico de instrumento para desacoplar a análise da apresentação.

import { Instrument, MusicalProvenance, FunctionalRole } from '@/types/domain';

export interface MusicalNoteEvent {
  id: string;
  timestamp: number; // segundos com precisão
  duration: number; // segundos
  midi: number; // número canônico 0-127
  frequency: number; // Hz
  velocity?: number; // 0-127
  cents?: number; // desvio microtonal (-50 a +50)
  clarity?: number; // 0..1 (confiança espectral)
  sourceStem?: 'vocals' | 'drums' | 'bass' | 'other' | 'mix';
  techniques?: string[]; // 'bend' | 'slide' | 'hammer_on' | 'pull_off' | 'vibrato' | 'palm_mute' | 'ghost'
  provenance: MusicalProvenance;
  confidence: number; // 0..1
}

export interface MusicalChordEvent {
  id: string;
  timestamp: number;
  duration: number;
  chordName: string;
  root: string;
  bassNote?: string;
  pitches: number[];
  provenance: MusicalProvenance;
  confidence: number;
}

export interface MusicalSection {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  bpm: number;
  timeSignature: [number, number]; // ex: [4, 4] ou [6, 8]
  key: string;
  activeInstruments: Instrument[];
  provenance: MusicalProvenance;
}

export interface IntermediateTrack {
  id: string;
  instrument: Instrument;
  name: string;
  role: FunctionalRole;
  tuning: string[];
  notes: MusicalNoteEvent[];
  sourceStem?: string;
}

export interface IntermediateMusicalRepresentation {
  version: 1;
  songId: string;
  title: string;
  artist: string;
  durationSeconds: number;
  bpm: number;
  songKey: string;
  timeSignature: [number, number];
  sections: MusicalSection[];
  chords: MusicalChordEvent[];
  tracks: Record<string, IntermediateTrack>;
  provenance: MusicalProvenance;
  createdAt: string;
}

/**
 * Utilitário canônico para criar instâncias de MusicalNoteEvent com valores padronizados.
 */
export function createMusicalNoteEvent(params: {
  timestamp: number;
  duration: number;
  midi: number;
  confidence?: number;
  id?: string;
  provenance?: MusicalProvenance;
}): MusicalNoteEvent {
  const freq = 440 * Math.pow(2, (params.midi - 69) / 12);
  return {
    id: params.id || `n_${Math.round(params.timestamp * 1000)}_${params.midi}`,
    timestamp: params.timestamp,
    duration: params.duration,
    midi: params.midi,
    frequency: Number(freq.toFixed(2)),
    confidence: params.confidence ?? 0.95,
    provenance: params.provenance || 'OBSERVED',
  };
}

/**
 * Constrói uma representação musical intermediária básica a partir de parâmetros analisados.
 */
export function createEmptyIntermediateRepresentation(params: {
  songId: string;
  title: string;
  artist: string;
  durationSeconds: number;
  bpm?: number;
  songKey?: string;
  timeSignature?: [number, number];
}): IntermediateMusicalRepresentation {
  return {
    version: 1,
    songId: params.songId,
    title: params.title,
    artist: params.artist,
    durationSeconds: params.durationSeconds,
    bpm: params.bpm || 120,
    songKey: params.songKey || 'C',
    timeSignature: params.timeSignature || [4, 4],
    sections: [
      {
        id: 'sec_full',
        name: 'Geral',
        startTime: 0,
        endTime: params.durationSeconds,
        bpm: params.bpm || 120,
        timeSignature: params.timeSignature || [4, 4],
        key: params.songKey || 'C',
        activeInstruments: ['guitar', 'bass'],
        provenance: 'INFERRED',
      },
    ],
    chords: [],
    tracks: {},
    provenance: 'INFERRED',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Adiciona uma pista instrumental à representação intermediária.
 */
export function addTrackToRepresentation(
  ir: IntermediateMusicalRepresentation,
  track: IntermediateTrack
): IntermediateMusicalRepresentation {
  return {
    ...ir,
    tracks: {
      ...ir.tracks,
      [track.id]: track,
    },
  };
}
