// src/engine/notes.ts
// Motor Teórico Musical - Ontabs Independent Music Engine
// Tratamento exato de notas, enarmonia, frequências, intervalos e oitavas.

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type PitchClass = typeof CHROMATIC_SHARPS[number] | typeof CHROMATIC_FLATS[number];

const ENHARMONIC_MAP: Record<string, number> = {
  'B#': 0, 'C': 0,
  'C#': 1, 'DB': 1,
  'D': 2,
  'D#': 3, 'EB': 3,
  'E': 4, 'FB': 4,
  'E#': 5, 'F': 5,
  'F#': 6, 'GB': 6,
  'G': 7,
  'G#': 8, 'AB': 8,
  'A': 9,
  'A#': 10, 'BB': 10,
  'B': 11, 'CB': 11,
};

/**
 * Converte nome de pitch class (ex: 'C#', 'Db') para índice cromático 0-11 (C = 0).
 */
export function pitchClassToChromaticIndex(pitch: string): number {
  const norm = pitch.trim().toUpperCase();
  const index = ENHARMONIC_MAP[norm];
  if (index === undefined) {
    throw new Error(`Pitch class inválido: "${pitch}"`);
  }
  return index;
}

/**
 * Normaliza qualquer representação de nota para sustenido canônico (C, C#, D, etc.).
 */
export function normalizeToSharp(pitch: string): typeof CHROMATIC_SHARPS[number] {
  return CHROMATIC_SHARPS[pitchClassToChromaticIndex(pitch)];
}

/**
 * Normaliza qualquer representação de nota para bemol (C, Db, D, etc.).
 */
export function normalizeToFlat(pitch: string): typeof CHROMATIC_FLATS[number] {
  return CHROMATIC_FLATS[pitchClassToChromaticIndex(pitch)];
}

/**
 * Verifica se duas notas são enarmônicas (ex: C# e Db).
 */
export function areEnharmonic(noteA: string, noteB: string): boolean {
  try {
    return pitchClassToChromaticIndex(noteA) === pitchClassToChromaticIndex(noteB);
  } catch {
    return false;
  }
}

/**
 * Converte string de nota científica (ex: 'A4', 'C#3', 'Eb2') para MIDI note number (0-127).
 * A4 = 69, C4 = 60.
 */
export function scientificToMidi(scientificNote: string): number {
  const match = scientificNote.trim().match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Formato de nota científica inválido: "${scientificNote}". Exemplo esperado: "A4", "C#3".`);
  }
  const [, pitch, octaveStr] = match;
  const chromatic = pitchClassToChromaticIndex(pitch);
  const octave = parseInt(octaveStr, 10);
  const midi = (octave + 1) * 12 + chromatic;
  if (midi < 0 || midi > 127) {
    throw new Error(`Nota científica "${scientificNote}" resulta em MIDI fora da faixa 0-127 (${midi}).`);
  }
  return midi;
}

/**
 * Converte MIDI note number (0-127) para nota científica (ex: 69 -> 'A4', 60 -> 'C4').
 */
export function midiToScientific(midi: number, useFlats = false): string {
  if (midi < 0 || midi > 127 || !Number.isInteger(midi)) {
    throw new Error(`MIDI inválido: ${midi}. Deve ser inteiro entre 0 e 127.`);
  }
  const chromatic = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const pitch = useFlats ? CHROMATIC_FLATS[chromatic] : CHROMATIC_SHARPS[chromatic];
  return `${pitch}${octave}`;
}

/**
 * Converte MIDI note number para frequência em Hertz (padrão de afinação A4 = 440 Hz).
 * f = 440 * 2^((m - 69) / 12)
 */
export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Converte frequência em Hertz para o número MIDI mais próximo com desvio em centésimos (cents).
 */
export function frequencyToMidi(freq: number, a4 = 440): { midi: number; cents: number; frequency: number } {
  if (freq <= 0) {
    throw new Error(`Frequência deve ser positiva: ${freq} Hz.`);
  }
  const exactMidi = 69 + 12 * Math.log2(freq / a4);
  const midi = Math.round(exactMidi);
  const cents = Math.round((exactMidi - midi) * 100);
  return { midi, cents, frequency: freq };
}

/**
 * Calcula a distância em semitons entre duas notas.
 */
export function semitoneDistance(fromMidi: number, toMidi: number): number {
  return toMidi - fromMidi;
}

/**
 * Transpõe um número MIDI por semitons.
 */
export function transposeMidi(midi: number, semitones: number): number {
  const next = midi + semitones;
  if (next < 0 || next > 127) {
    throw new Error(`Transposição de ${midi} por ${semitones} semitons resulta em ${next}, fora da faixa MIDI.`);
  }
  return next;
}

