// src/engine/__tests__/mathAndDijkstra.test.ts
// Ontabs FASE MAT — Validação Matemática, Invariantes Numéricos e Prova de Otimização Dijkstra

import { describe, it, expect } from 'vitest';
import {
  midiToFrequency,
  frequencyToMidi,
} from '../notes';
import {
  estimatePitchAutocorrelation,
} from '../audioAnalysis';
import {
  optimizeFretSequenceGlobal,
  exhaustiveSearchFretSequence,
  NoteEventToMap,
} from '../fretOptimization';
import {
  sanitizeEqualizerGain,
  computeBiquadMagnitudeResponse,
} from '../equalizer';

describe('FASE MAT 2.2: Frequência, Afinação e Fórmulas de Conversão', () => {
  it('A4 = 440 Hz produz exatamente MIDI 69 com 0 cents de desvio', () => {
    const res = frequencyToMidi(440.0, 440);
    expect(res.midi).toBe(69);
    expect(res.cents).toBe(0);
    expect(midiToFrequency(69, 440)).toBeCloseTo(440.0, 6);
  });

  it('A2 = 110 Hz produz exatamente MIDI 45 com 0 cents de desvio', () => {
    const res = frequencyToMidi(110.0, 440);
    expect(res.midi).toBe(45);
    expect(res.cents).toBe(0);
    expect(midiToFrequency(45, 440)).toBeCloseTo(110.0, 6);
  });

  it('C4 (~261.63 Hz) produz MIDI 60 com tolerância de desvio < 1 cent', () => {
    const c4Freq = 440 * Math.pow(2, (60 - 69) / 12); // ~261.625565 Hz
    const res = frequencyToMidi(c4Freq, 440);
    expect(res.midi).toBe(60);
    expect(Math.abs(res.cents)).toBeLessThanOrEqual(1);
  });

  it('Calcula desvio em cents para microtons (442.5 Hz e 437.5 Hz)', () => {
    // 1200 * log2(442.5 / 440) = +9.81 cents
    const sharpRes = frequencyToMidi(442.5, 440);
    expect(sharpRes.midi).toBe(69);
    expect(sharpRes.cents).toBe(10); // arredondado de +9.81

    // 1200 * log2(437.5 / 440) = -9.89 cents
    const flatRes = frequencyToMidi(437.5, 440);
    expect(flatRes.midi).toBe(69);
    expect(flatRes.cents).toBe(-10); // arredondado de -9.89
  });

  it('Propriedade: Invariante de Oitava f(midi + 12) === 2 * f(midi)', () => {
    for (let midi = 21; midi <= 108; midi += 7) {
      const f1 = midiToFrequency(midi, 440);
      const f2 = midiToFrequency(midi + 12, 440);
      expect(f2 / f1).toBeCloseTo(2.0, 5);
    }
  });

  it('Propriedade: Reversibilidade f -> midi -> f com erro menor que 0.05% para notas inteiras', () => {
    for (let midi = 24; midi <= 96; midi += 5) {
      const freq = midiToFrequency(midi, 440);
      const converted = frequencyToMidi(freq, 440);
      const reconstructedFreq = midiToFrequency(converted.midi, 440);
      const relError = Math.abs(reconstructedFreq - freq) / freq;
      expect(relError).toBeLessThan(0.0005);
    }
  });

  it('Rejeita frequências negativas ou zero lançando erro matemático', () => {
    expect(() => frequencyToMidi(0)).toThrow();
    expect(() => frequencyToMidi(-440)).toThrow();
  });
});

describe('FASE MAT 2.2: Precisão da Estimativa F0 por Autocorrelação & Interpolação', () => {
  function generateSineWave(freq: number, durationSeconds = 0.25, sampleRate = 44100): Float32Array {
    const numSamples = Math.floor(durationSeconds * sampleRate);
    const buffer = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buffer[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    }
    return buffer;
  }

  it('Estima senoide pura de 440 Hz com erro < 1% e desvio < 5 cents', () => {
    const sr = 44100;
    const audio = generateSineWave(440, 0.2, sr);
    const result = estimatePitchAutocorrelation(audio, sr);

    expect(result).not.toBeNull();
    if (result) {
      const relError = Math.abs(result.frequency - 440) / 440;
      expect(relError).toBeLessThan(0.01); // erro relativo < 1%
      expect(Math.abs(result.cents)).toBeLessThanOrEqual(5); // erro < 5 cents
      expect(result.midi).toBe(69);
      expect(result.clarity).toBeGreaterThan(0.7);
    }
  });

  it('Estima senoide pura de 110 Hz (A2) com erro < 1%', () => {
    const sr = 44100;
    const audio = generateSineWave(110, 0.25, sr);
    const result = estimatePitchAutocorrelation(audio, sr);

    expect(result).not.toBeNull();
    if (result) {
      const relError = Math.abs(result.frequency - 110) / 110;
      expect(relError).toBeLessThan(0.01);
      expect(result.midi).toBe(45);
    }
  });

  it('Estima senoide de 220 Hz (A3) com erro < 1%', () => {
    const sr = 44100;
    const audio = generateSineWave(220, 0.2, sr);
    const result = estimatePitchAutocorrelation(audio, sr);

    expect(result).not.toBeNull();
    if (result) {
      const relError = Math.abs(result.frequency - 220) / 220;
      expect(relError).toBeLessThan(0.01);
      expect(result.midi).toBe(57);
    }
  });

  it('Rejeita ruído branco aleatório sem falso positivo de fundamental estável', () => {
    const sr = 44100;
    const noise = new Float32Array(sr * 0.2);
    for (let i = 0; i < noise.length; i++) {
      noise[i] = (Math.random() - 0.5) * 0.8;
    }
    const result = estimatePitchAutocorrelation(noise, sr, 0, noise.length, 70, 1000, 0.5);
    expect(result).toBeNull();
  });

  it('Rejeita silêncio absoluto (< 0.005 RMS)', () => {
    const sr = 44100;
    const silence = new Float32Array(sr * 0.1);
    const result = estimatePitchAutocorrelation(silence, sr);
    expect(result).toBeNull();
  });
});

describe('FASE MAT 2.4: Otimização de Digitação (Dijkstra vs Busca Exaustiva)', () => {
  const testPhrase: NoteEventToMap[] = [
    { timestamp: 0.0, midi: 60 }, // C4
    { timestamp: 0.5, midi: 64 }, // E4
    { timestamp: 1.0, midi: 67 }, // G4
    { timestamp: 1.5, midi: 71 }, // B4
  ];

  it('Dijkstra Global alcança custo idêntico à Busca Exaustiva independente no mesmo grafo', () => {
    const dijkstraResult = optimizeFretSequenceGlobal(testPhrase, 'guitar');
    const exhaustiveResult = exhaustiveSearchFretSequence(testPhrase, 'guitar');

    expect(dijkstraResult.path.length).toBe(testPhrase.length);
    expect(exhaustiveResult.path.length).toBe(testPhrase.length);
    // Custo total deve coincidir matematicamente (comprovação de ótimo global)
    expect(dijkstraResult.totalCost).toBeCloseTo(exhaustiveResult.totalCost, 3);
  });

  it('Garante que todas as posições geradas respeitam os limites físicos do braço (casas <= 24)', () => {
    const result = optimizeFretSequenceGlobal(testPhrase, 'guitar');
    for (const note of result.path) {
      expect(note.fret).toBeGreaterThanOrEqual(0);
      expect(note.fret).toBeLessThanOrEqual(24);
      expect(note.stringNumber).toBeGreaterThanOrEqual(1);
      expect(note.stringNumber).toBeLessThanOrEqual(6);
    }
  });

  it('Determinismo: Múltiplas execuções com a mesma entrada produzem o mesmo caminho', () => {
    const res1 = optimizeFretSequenceGlobal(testPhrase, 'guitar');
    const res2 = optimizeFretSequenceGlobal(testPhrase, 'guitar');
    expect(res1.totalCost).toBe(res2.totalCost);
    expect(res1.path.map((n) => `${n.stringNumber}:${n.fret}`)).toEqual(
      res2.path.map((n) => `${n.stringNumber}:${n.fret}`)
    );
  });
});

describe('FASE MAT 2.5: EQ Digital e Estabilidade Numérica', () => {
  it('Sanitiza ganhos extremos, NaN e Infinity para a faixa segura [-12, +12] dB', () => {
    expect(sanitizeEqualizerGain(5)).toBe(5);
    expect(sanitizeEqualizerGain(25)).toBe(12);
    expect(sanitizeEqualizerGain(-30)).toBe(-12);
    expect(sanitizeEqualizerGain(NaN)).toBe(0);
    expect(sanitizeEqualizerGain(Infinity)).toBe(0);
    expect(sanitizeEqualizerGain(-Infinity)).toBe(0);
  });

  it('Filtro Peaking em f0 produz exatamente o ganho configurado (+6 dB)', () => {
    const gainAtCenter = computeBiquadMagnitudeResponse('peaking', 1000, 6, 1.0, 1000, 44100);
    expect(gainAtCenter).toBeCloseTo(6.0, 1);
  });

  it('Filtro Peaking atenua em frequências distantes tendendo a 0 dB', () => {
    const gainFarAway = computeBiquadMagnitudeResponse('peaking', 1000, 6, 1.0, 100, 44100);
    expect(Math.abs(gainFarAway)).toBeLessThan(1.5);
  });

  it('Filtro Lowshelf em 80Hz reforça subgraves e preserva agudos próximos a 0 dB', () => {
    const gainSub = computeBiquadMagnitudeResponse('lowshelf', 80, 5, 0.7, 40, 44100);
    const gainHigh = computeBiquadMagnitudeResponse('lowshelf', 80, 5, 0.7, 5000, 44100);

    expect(gainSub).toBeGreaterThan(4.0); // ganho de prateleira na faixa grave
    expect(Math.abs(gainHigh)).toBeLessThan(0.8); // sem ganho em agudos
  });
});
