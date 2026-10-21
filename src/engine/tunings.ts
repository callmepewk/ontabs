// src/engine/tunings.ts
// Configurações de instrumentos, afinações e características do braço (fretboard).

import { Instrument } from '@/types/domain';
import { scientificToMidi } from './notes';

export interface InstrumentConfig {
  instrument: Instrument;
  name: string;
  stringsCount: number;
  maxFret: number;
  defaultTuningNotes: string[]; // Corda mais grave (corda 6 ou 4) até mais aguda
  defaultTuningMidi: number[];
}

export type FrettedInstrument =
  | 'guitar'
  | 'rhythm_guitar'
  | 'lead_guitar'
  | 'acoustic_guitar'
  | 'bass'
  | 'ukulele';

export const INSTRUMENT_CONFIGS: Record<FrettedInstrument, InstrumentConfig> & Record<string, InstrumentConfig | undefined> = {
  guitar: {
    instrument: 'guitar',
    name: 'Guitarra Elétrica',
    stringsCount: 6,
    maxFret: 24,
    defaultTuningNotes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    defaultTuningMidi: [40, 45, 50, 55, 59, 64],
  },
  rhythm_guitar: {
    instrument: 'rhythm_guitar',
    name: 'Guitarra Rítmica',
    stringsCount: 6,
    maxFret: 24,
    defaultTuningNotes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    defaultTuningMidi: [40, 45, 50, 55, 59, 64],
  },
  lead_guitar: {
    instrument: 'lead_guitar',
    name: 'Guitarra Solo / Riff',
    stringsCount: 6,
    maxFret: 24,
    defaultTuningNotes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    defaultTuningMidi: [40, 45, 50, 55, 59, 64],
  },
  acoustic_guitar: {
    instrument: 'acoustic_guitar',
    name: 'Violão Acústico',
    stringsCount: 6,
    maxFret: 20,
    defaultTuningNotes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    defaultTuningMidi: [40, 45, 50, 55, 59, 64],
  },
  bass: {
    instrument: 'bass',
    name: 'Baixo Elétrico (4 cordas)',
    stringsCount: 4,
    maxFret: 24,
    defaultTuningNotes: ['E1', 'A1', 'D2', 'G2'],
    defaultTuningMidi: [28, 33, 38, 43],
  },
  ukulele: {
    instrument: 'ukulele',
    name: 'Ukulele Soprano/Concerto (Afinação Reentrante)',
    stringsCount: 4,
    maxFret: 18,
    // G4 (Corda 4), C4 (Corda 3), E4 (Corda 2), A4 (Corda 1)
    defaultTuningNotes: ['G4', 'C4', 'E4', 'A4'],
    defaultTuningMidi: [67, 60, 64, 69],
  },
};

/**
 * Converte um array de notas de afinação em notas MIDI (ordem: corda grave -> aguda).
 */
export function parseTuningToMidi(tuningNotes: string[]): number[] {
  return tuningNotes.map((note) => scientificToMidi(note));
}

/**
 * Retorna as afinações alternativas populares para cada instrumento.
 */
export const ALTERNATIVE_TUNINGS: Record<string, { name: string; instrument: Instrument; notes: string[] }> = {
  guitar_drop_d: {
    name: 'Drop D',
    instrument: 'guitar',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  },
  guitar_half_step_down: {
    name: 'Eb Standard (Meio tom abaixo)',
    instrument: 'guitar',
    notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
  },
  guitar_open_d: {
    name: 'Open D',
    instrument: 'guitar',
    notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'],
  },
  bass_drop_d: {
    name: 'Drop D',
    instrument: 'bass',
    notes: ['D1', 'A1', 'D2', 'G2'],
  },
};

/**
 * Encontra todas as posições válidas de corda e casa que produzem uma nota MIDI específica.
 * As cordas são numeradas no padrão de tablaturas:
 * Corda 1 = Mais aguda (ex: E4 na guitarra)
 * Corda 6 = Mais grave (ex: E2 na guitarra)
 */
export interface FretboardPosition {
  stringNumber: number; // 1-indexado (1 = mais aguda, 6/4 = mais grave)
  fret: number;         // 0 = corda solta, 1..maxFret
  midi: number;
}

export function findPositionsForMidi(
  midi: number,
  tuningMidi: number[],
  maxFret = 24
): FretboardPosition[] {
  const positions: FretboardPosition[] = [];
  const stringCount = tuningMidi.length;

  // tuningMidi está em ordem: [corda N (mais grave), ..., corda 1 (mais aguda)]
  tuningMidi.forEach((baseMidi, indexFromLow) => {
    // stringNumber convencional: 1 é a mais aguda (indexFromLow = stringCount - 1)
    const stringNumber = stringCount - indexFromLow;
    const fret = midi - baseMidi;
    if (fret >= 0 && fret <= maxFret) {
      positions.push({ stringNumber, fret, midi });
    }
  });

  return positions;
}

/**
 * Dado um número de corda (1-indexado) e casa, calcula o MIDI produzido.
 */
export function positionToMidi(stringNumber: number, fret: number, tuningMidi: number[]): number {
  const stringCount = tuningMidi.length;
  const indexFromLow = stringCount - stringNumber;
  if (indexFromLow < 0 || indexFromLow >= stringCount) {
    throw new Error(`Número de corda inválido: ${stringNumber} (instrumento possui ${stringCount} cordas).`);
  }
  const baseMidi = tuningMidi[indexFromLow];
  return baseMidi + fret;
}
