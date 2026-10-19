// src/engine/tabValidation.ts
// Validador de Tablaturas - Regras de Domínio Físico e Musical

import { Instrument } from '@/types/domain';
import { INSTRUMENT_CONFIGS, FrettedInstrument } from './tunings';

export type TabValidationErrorType =
  | 'impossible_fret'
  | 'invalid_fret'
  | 'invalid_string'
  | 'unknown_technique'
  | 'temporal_conflict'
  | 'tuning_mismatch';

export interface TabValidationError {
  type: TabValidationErrorType;
  message: string;
  stringNumber?: number;
  fret?: number;
  timestamp?: number;
  measureIndex?: number;
}

export interface TabValidationResult {
  isValid: boolean;
  errors: TabValidationError[];
  warnings: TabValidationError[];
}

export interface RawTabNoteInput {
  stringNumber: number; // 1 = mais aguda, N = mais grave
  fret: number;
  timestamp: number;
  duration?: number;
  technique?: string;
}

const VALID_TECHNIQUES = new Set([
  'normal',
  'hammer_on',
  'pull_off',
  'slide_up',
  'slide_down',
  'bend',
  'release',
  'vibrato',
  'palm_mute',
  'harmonic',
  'tap',
  'down',
  'up',
  'pluck',
]);

/**
 * Valida uma coleção de notas de tablatura contra as restrições físicas do instrumento.
 */
export function validateTabNotes(
  notes: RawTabNoteInput[],
  instrument: Instrument = 'guitar'
): TabValidationResult {
  const errors: TabValidationError[] = [];
  const warnings: TabValidationError[] = [];
  const config = INSTRUMENT_CONFIGS[instrument as FrettedInstrument] ?? INSTRUMENT_CONFIGS.guitar;
  const maxFret = config.maxFret;
  const stringCount = config.stringsCount;

  // Mapa para detectar conflitos temporais na mesma corda
  const stringTimeline = new Map<number, { timestamp: number; duration: number }[]>();

  notes.forEach((note) => {
    // 1. Validação de Corda
    if (note.stringNumber < 1 || note.stringNumber > stringCount) {
      errors.push({
        type: 'invalid_string',
        message: `Corda ${note.stringNumber} é inválida para ${config.name} (faixa permitida: 1 a ${stringCount}).`,
        stringNumber: note.stringNumber,
        fret: note.fret,
        timestamp: note.timestamp,
      });
    }

    // 2. Validação de Casa
    if (note.fret < 0) {
      errors.push({
        type: 'invalid_fret',
        message: `Casa ${note.fret} é negativa e inválida.`,
        stringNumber: note.stringNumber,
        fret: note.fret,
        timestamp: note.timestamp,
      });
    } else if (note.fret > maxFret) {
      errors.push({
        type: 'impossible_fret',
        message: `Casa ${note.fret} excede o limite físico (${maxFret}) de ${config.name}.`,
        stringNumber: note.stringNumber,
        fret: note.fret,
        timestamp: note.timestamp,
      });
    } else if (note.fret > 20) {
      warnings.push({
        type: 'impossible_fret',
        message: `Casa ${note.fret} é de acesso difícil em violões/guitarras sem cutaway.`,
        stringNumber: note.stringNumber,
        fret: note.fret,
        timestamp: note.timestamp,
      });
    }

    // 3. Validação de Técnica
    if (note.technique && !VALID_TECHNIQUES.has(note.technique)) {
      warnings.push({
        type: 'unknown_technique',
        message: `Técnica "${note.technique}" não reconhecida no catálogo de articulações.`,
        stringNumber: note.stringNumber,
        fret: note.fret,
        timestamp: note.timestamp,
      });
    }

    // 4. Detecção de Conflitos Temporais (duas notas simultâneas na mesma corda física)
    if (note.stringNumber >= 1 && note.stringNumber <= stringCount) {
      const timeline = stringTimeline.get(note.stringNumber) || [];
      const duration = note.duration || 0.1;

      for (const existing of timeline) {
        // Se a nova nota começa exatamente no mesmo instante da nota existente na MESMA corda com frets diferentes
        if (Math.abs(existing.timestamp - note.timestamp) < 0.03) {
          errors.push({
            type: 'temporal_conflict',
            message: `Conflito temporal: duas notas na mesma corda ${note.stringNumber} em ${note.timestamp.toFixed(2)}s.`,
            stringNumber: note.stringNumber,
            fret: note.fret,
            timestamp: note.timestamp,
          });
          break;
        }
      }

      timeline.push({ timestamp: note.timestamp, duration });
      stringTimeline.set(note.stringNumber, timeline);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

