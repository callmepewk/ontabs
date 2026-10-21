// src/engine/canonicalEvents.ts
// Modelo Canônico e Versionado de Eventos Musicais do Active Listener
// Representação atômica e matematicamente verificável para todos os instrumentos do ecossistema OnTabs.

import { Instrument, MusicalProvenance, TabNoteEvent } from '@/types/domain';
import { AnyMusicalTechnique, DrumPiece, isTechniqueAllowed } from './techniques';

export interface CanonicalMusicalEvent {
  version: 1;
  id: string;
  timestamp: number; // segundos com precisão de ponto flutuante
  duration: number; // segundos
  instrument: Instrument;
  pitch?: number; // MIDI note number (0 a 127)
  frequency?: number; // Frequência fundamental (Hz)
  stringNumber?: number; // 1-indexado (corda mais aguda = 1)
  fret?: number; // 0 a 24 (0 = corda solta)
  drumPiece?: DrumPiece;
  articulation?: AnyMusicalTechnique;
  techniqueParams?: {
    bendSemitones?: number;
    slideTargetFret?: number;
    vibratoRateHz?: number;
    vibratoDepthCents?: number;
  };
  velocity: number; // 0 a 127
  confidence: number; // 0.0 a 1.0 (nível de certeza acústica do Active Listener)
  provenance: MusicalProvenance;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validação formal dos limites físicos e musicais de um CanonicalMusicalEvent.
 */
export function validateCanonicalEvent(event: CanonicalMusicalEvent): ValidationResult {
  const errors: string[] = [];

  if (event.version !== 1) {
    errors.push(`Versão do evento não suportada: ${event.version}`);
  }

  if (typeof event.id !== 'string' || event.id.trim().length === 0) {
    errors.push('Identificador (id) é obrigatório e não pode ser vazio.');
  }

  if (typeof event.timestamp !== 'number' || event.timestamp < 0 || isNaN(event.timestamp)) {
    errors.push(`Timestamp inválido: ${event.timestamp}. Deve ser um número >= 0.`);
  }

  if (typeof event.duration !== 'number' || event.duration <= 0 || isNaN(event.duration)) {
    errors.push(`Duração inválida: ${event.duration}. Deve ser estritamente positiva.`);
  }

  if (typeof event.velocity !== 'number' || event.velocity < 0 || event.velocity > 127) {
    errors.push(`Velocity fora dos limites MIDI (0..127): ${event.velocity}`);
  }

  if (typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 1) {
    errors.push(`Confiança fora dos limites (0..1): ${event.confidence}`);
  }

  // Validação de instrumentos de corda
  const isStringInstrument = ['guitar', 'lead_guitar', 'rhythm_guitar', 'acoustic_guitar', 'bass', 'ukulele'].includes(
    event.instrument
  );

  if (isStringInstrument) {
    if (event.fret !== undefined && (event.fret < 0 || event.fret > 24 || !Number.isInteger(event.fret))) {
      errors.push(`Traste fora da faixa física jogável (0..24): ${event.fret}`);
    }
    if (event.stringNumber !== undefined && (event.stringNumber < 1 || event.stringNumber > 8 || !Number.isInteger(event.stringNumber))) {
      errors.push(`Número de corda inválido (1..8): ${event.stringNumber}`);
    }
  }

  // Validação de Bateria
  if (event.instrument === 'drums') {
    if (!event.drumPiece) {
      errors.push('Eventos de bateria exigem a especificação de drumPiece.');
    }
  }

  // Validação da técnica para o instrumento
  if (event.articulation) {
    if (!isTechniqueAllowed(event.instrument, event.articulation)) {
      errors.push(`Técnica '${event.articulation}' é incompatível com o instrumento '${event.instrument}'.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export type GridSubdivision = 4 | 8 | 16 | 32 | 12; // 12 = tercina de colcheia

/**
 * Quantiza um timestamp em segundos para a grade rítmica musical mais próxima.
 */
export function quantizeTimestamp(timestamp: number, bpm: number, subdivision: GridSubdivision = 16): number {
  if (bpm <= 0) return timestamp;
  const beatDuration = 60 / bpm;
  // A semínima (1/4) tem duração de 1 beat
  const ticksPerBeat = subdivision / 4;
  const tickDuration = beatDuration / ticksPerBeat;
  return Math.round(timestamp / tickDuration) * tickDuration;
}

export interface MusicalPosition {
  measure: number; // 1-indexado
  beat: number; // 1-indexado
  tick: number; // 0-indexado dentro do beat (ex: 0..479 para PPQ de 480)
}

/**
 * Converte timestamp (segundos) em compasso, tempo e tick com PPQ configurável.
 */
export function secondsToMusicalPosition(
  seconds: number,
  bpm: number,
  beatsPerMeasure = 4,
  ppq = 480
): MusicalPosition {
  if (seconds < 0 || bpm <= 0) return { measure: 1, beat: 1, tick: 0 };
  const secondsPerBeat = 60 / bpm;
  const totalBeats = seconds / secondsPerBeat;

  const measure = Math.floor(totalBeats / beatsPerMeasure) + 1;
  const beatInMeasure = Math.floor(totalBeats % beatsPerMeasure) + 1;
  const fractionalBeat = totalBeats % 1;
  const tick = Math.round(fractionalBeat * ppq);

  return { measure, beat: beatInMeasure, tick };
}

/**
 * Ordena eventos cronologicamente de forma determinística por timestamp e id.
 */
export function sortCanonicalEvents(events: CanonicalMusicalEvent[]): CanonicalMusicalEvent[] {
  return [...events].sort((a, b) => {
    if (Math.abs(a.timestamp - b.timestamp) > 1e-5) {
      return a.timestamp - b.timestamp;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Converte eventos canônicos de instrumentos de corda em formato TabNoteEvent para visualizadores do OnTabs.
 */
export function canonicalEventsToTabNotes(events: CanonicalMusicalEvent[]): TabNoteEvent[] {
  const sorted = sortCanonicalEvents(events);
  const byTimestamp = new Map<number, number[]>();
  const sustainByTimestamp = new Map<number, number>();

  for (const ev of sorted) {
    if (ev.fret === undefined) continue;
    const roundedTs = Math.round(ev.timestamp * 1000) / 1000;
    const existing = byTimestamp.get(roundedTs) ?? [];
    existing.push(ev.fret);
    byTimestamp.set(roundedTs, existing);

    const durMs = Math.round(ev.duration * 1000);
    const existingDur = sustainByTimestamp.get(roundedTs) ?? 0;
    if (durMs > existingDur) {
      sustainByTimestamp.set(roundedTs, durMs);
    }
  }

  const result: TabNoteEvent[] = [];
  for (const [timestamp, frets] of byTimestamp.entries()) {
    result.push({
      timestamp,
      strings: frets,
      sustainMs: sustainByTimestamp.get(timestamp),
    });
  }

  return result.sort((a, b) => a.timestamp - b.timestamp);
}
