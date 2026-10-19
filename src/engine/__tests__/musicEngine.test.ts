// src/engine/__tests__/musicEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  scientificToMidi,
  midiToScientific,
  midiToFrequency,
  frequencyToMidi,
  areEnharmonic,
} from '../notes';
import {
  INSTRUMENT_CONFIGS,
  findPositionsForMidi,
  positionToMidi,
} from '../tunings';
import {
  identifyChordFromChroma,
  notesToChroma,
} from '../chords';
import {
  detectKeyFromChroma,
  KRUMHANSL_MAJOR,
} from '../keyDetection';
import {
  optimizeFretSequence,
} from '../fretOptimization';
import {
  validateTabNotes,
} from '../tabValidation';
import {
  computeEnvelopeAndFlux,
  estimateBpmFromFlux,
} from '../audioAnalysis';

describe('Music Engine - Teoria e Notas', () => {
  it('converte notas científicas em números MIDI canônicos', () => {
    expect(scientificToMidi('C4')).toBe(60); // C central
    expect(scientificToMidi('A4')).toBe(69); // Diapasão A440
    expect(scientificToMidi('E2')).toBe(40); // 6ª corda solta guitarra
    expect(scientificToMidi('E4')).toBe(64); // 1ª corda solta guitarra
    expect(scientificToMidi('E1')).toBe(28); // 4ª corda solta baixo
  });

  it('converte MIDI de volta para notas científicas (sustenidos e bemóis)', () => {
    expect(midiToScientific(60)).toBe('C4');
    expect(midiToScientific(69)).toBe('A4');
    expect(midiToScientific(61, false)).toBe('C#4');
    expect(midiToScientific(61, true)).toBe('Db4');
  });

  it('reconhece enarmonia estrita', () => {
    expect(areEnharmonic('C#', 'Db')).toBe(true);
    expect(areEnharmonic('F#', 'Gb')).toBe(true);
    expect(areEnharmonic('B#', 'C')).toBe(true);
    expect(areEnharmonic('E#', 'F')).toBe(true);
    expect(areEnharmonic('G#', 'Ab')).toBe(true);
    expect(areEnharmonic('C', 'D')).toBe(false);
  });

  it('converte frequências físicas para números MIDI e vice-versa', () => {
    expect(midiToFrequency(69, 440)).toBeCloseTo(440.0, 4);
    expect(midiToFrequency(60, 440)).toBeCloseTo(261.6256, 2); // C4

    const result = frequencyToMidi(440.0, 440);
    expect(result.midi).toBe(69);
    expect(result.cents).toBe(0);

    const slightlySharp = frequencyToMidi(442.0, 440);
    expect(slightlySharp.midi).toBe(69);
    expect(slightlySharp.cents).toBeGreaterThan(0);
  });
});

describe('Music Engine - Instrumentos e Braço', () => {
  it('mapeia posições válidas de corda e casa na guitarra padrão', () => {
    const guitarTuning = INSTRUMENT_CONFIGS.guitar.defaultTuningMidi; // [40, 45, 50, 55, 59, 64]
    
    // E4 (64) pode ser:
    // Corda 1 (mais aguda) na casa 0
    // Corda 2 na casa 5 (59 + 5 = 64)
    // Corda 3 na casa 9 (55 + 9 = 64)
    // Corda 4 na casa 14 (50 + 14 = 64)
    // Corda 5 na casa 19 (45 + 19 = 64)
    // Corda 6 na casa 24 (40 + 24 = 64)
    const positions = findPositionsForMidi(64, guitarTuning, 24);
    expect(positions).toHaveLength(6);
    expect(positions.some((p) => p.stringNumber === 1 && p.fret === 0)).toBe(true);
    expect(positions.some((p) => p.stringNumber === 2 && p.fret === 5)).toBe(true);
    expect(positions.some((p) => p.stringNumber === 3 && p.fret === 9)).toBe(true);
  });

  it('calcula o número MIDI a partir de corda e casa', () => {
    const guitarTuning = INSTRUMENT_CONFIGS.guitar.defaultTuningMidi;
    // Corda 6 (E2=40), casa 5 = A2 (45)
    expect(positionToMidi(6, 5, guitarTuning)).toBe(45);
    // Corda 1 (E4=64), casa 3 = G4 (67)
    expect(positionToMidi(1, 3, guitarTuning)).toBe(67);
  });
});

describe('Music Engine - Harmonia e Reconhecimento de Acordes', () => {
  it('reconhece tríade de Dó Maior (C, E, G)', () => {
    const chroma = notesToChroma(['C4', 'E4', 'G4']);
    const candidates = identifyChordFromChroma(chroma, 1);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].name).toBe('C');
    expect(candidates[0].quality).toBe('maj');
    expect(candidates[0].score).toBeGreaterThan(0.9);
  });

  it('reconhece acorde Menor com Sétima (Am7: A, C, E, G)', () => {
    const chroma = notesToChroma(['A3', 'C4', 'E4', 'G4']);
    const candidates = identifyChordFromChroma(chroma, 1);
    expect(candidates[0].name).toBe('Am7');
    expect(candidates[0].quality).toBe('min7');
    expect(candidates[0].score).toBeGreaterThan(0.9);
  });
});

describe('Music Engine - Detecção de Tonalidade (Krumhansl-Schmuckler)', () => {
  it('detecta C Maior a partir de perfil tonal representativo', () => {
    const keyResult = detectKeyFromChroma(KRUMHANSL_MAJOR);
    expect(keyResult.key).toBe('C');
    expect(keyResult.mode).toBe('major');
    expect(keyResult.confidence).toBeGreaterThan(0.5);
  });
});

describe('Music Engine - Otimização de Tablatura', () => {
  it('otimiza frase melódica favorecendo posições ergonômicas e cordas soltas', () => {
    // Frase: E4 (64), G4 (67), A4 (69)
    const notes = [
      { timestamp: 0.0, midi: 64, duration: 0.5 },
      { timestamp: 0.5, midi: 67, duration: 0.5 },
      { timestamp: 1.0, midi: 69, duration: 0.5 },
    ];
    const optimized = optimizeFretSequence(notes, 'guitar');
    expect(optimized).toHaveLength(3);
    // E4 deve preferir corda 1 solta (casa 0)
    expect(optimized[0].stringNumber).toBe(1);
    expect(optimized[0].fret).toBe(0);
    // G4 na corda 1 casa 3
    expect(optimized[1].stringNumber).toBe(1);
    expect(optimized[1].fret).toBe(3);
    // A4 na corda 1 casa 5
    expect(optimized[2].stringNumber).toBe(1);
    expect(optimized[2].fret).toBe(5);
  });
});

describe('Music Engine - Validação de Tablaturas', () => {
  it('aprova notas dentro dos limites físicos do instrumento', () => {
    const validNotes = [
      { stringNumber: 1, fret: 0, timestamp: 0.0 },
      { stringNumber: 2, fret: 3, timestamp: 0.5 },
      { stringNumber: 6, fret: 5, timestamp: 1.0 },
    ];
    const validation = validateTabNotes(validNotes, 'guitar');
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('rejeita casas impossíveis que excedem o braço físico', () => {
    const invalidNotes = [
      { stringNumber: 1, fret: 30, timestamp: 0.0 }, // Excede maxFret 24
    ];
    const validation = validateTabNotes(invalidNotes, 'guitar');
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.type === 'impossible_fret')).toBe(true);
  });

  it('rejeita cordas inválidas (ex: corda 7 em violão de 6 cordas)', () => {
    const invalidNotes = [
      { stringNumber: 7, fret: 2, timestamp: 0.0 },
    ];
    const validation = validateTabNotes(invalidNotes, 'acoustic_guitar');
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.type === 'invalid_string')).toBe(true);
  });

  it('detecta conflitos temporais de notas simultâneas na mesma corda', () => {
    const conflictNotes = [
      { stringNumber: 1, fret: 3, timestamp: 1.0 },
      { stringNumber: 1, fret: 7, timestamp: 1.0 }, // Impossível tocar duas casas ao mesmo tempo na mesma corda
    ];
    const validation = validateTabNotes(conflictNotes, 'guitar');
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.type === 'temporal_conflict')).toBe(true);
  });
});

describe('Music Engine - DSP e Detecção de BPM', () => {
  it('calcula envelope RMS e detecta pulso regular em sinal sintético', () => {
    const sampleRate = 44100;
    const durationSec = 6;
    const totalSamples = sampleRate * durationSec;
    const audio = new Float32Array(totalSamples);

    // Gera batidas a 120 BPM (2 batidas por segundo = a cada 0.5s = a cada 22050 amostras)
    const intervalSamples = Math.round(sampleRate * (60 / 120));
    for (let t = 0; t < totalSamples; t += intervalSamples) {
      // Pulso transiente de ataque rápido
      for (let j = 0; j < 800 && t + j < totalSamples; j++) {
        audio[t + j] = Math.sin((2 * Math.PI * 80 * j) / sampleRate) * Math.exp(-j / 200);
      }
    }

    const { flux, fps } = computeEnvelopeAndFlux(audio, sampleRate, 256);
    expect(flux.length).toBeGreaterThan(0);

    const bpmResult = estimateBpmFromFlux(flux, fps, 100, 140);
    expect(Math.abs(bpmResult.bpm - 120)).toBeLessThanOrEqual(1);
    expect(bpmResult.confidence).toBeGreaterThan(0.3);
  });
});
