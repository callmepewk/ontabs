// src/engine/__tests__/f0StressAndAcoustics.test.ts
// Testes de Estresse Acústico e Limites do Active Listener (Gate D)
// Avalia sinais com múltiplos harmônicos, ruído aditivo, histerese de vibrato e polifonia.

import { describe, it, expect } from 'vitest';
import { estimatePitchAutocorrelation } from '../audioAnalysis';
import { analyzePitchTrajectory } from '../techniques';

describe('Active Listener Gate D: Estresse Acústico & Limites de F0', () => {
  const sampleRate = 44100;

  it('Rastreia F0 correto em sinal com múltiplos harmônicos (espectro tipo corda de guitarra)', () => {
    const f0 = 220; // A3
    const duration = 0.25;
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Fundamental + 2º harmônico forte (80%) + 3º harmônico (40%)
      buffer[i] =
        0.5 * Math.sin(2 * Math.PI * f0 * t) +
        0.4 * Math.sin(2 * Math.PI * (f0 * 2) * t) +
        0.2 * Math.sin(2 * Math.PI * (f0 * 3) * t);
    }

    const res = estimatePitchAutocorrelation(buffer, sampleRate);
    expect(res).not.toBeNull();
    if (res) {
      expect(res.midi).toBe(57); // A3 (MIDI 57)
      expect(Math.abs(res.frequency - f0) / f0).toBeLessThan(0.01); // erro < 1%
      expect(res.clarity).toBeGreaterThan(0.65);
    }
  });

  it('Mantém estimativa de F0 sob presença de ruído branco aditivo moderado (SNR ~18 dB)', () => {
    const f0 = 440; // A4
    const duration = 0.2;
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const cleanSine = 0.8 * Math.sin(2 * Math.PI * f0 * t);
      const noise = (Math.random() - 0.5) * 0.15; // ruído aditivo
      buffer[i] = cleanSine + noise;
    }

    const res = estimatePitchAutocorrelation(buffer, sampleRate);
    expect(res).not.toBeNull();
    if (res) {
      expect(res.midi).toBe(69); // A4
      expect(Math.abs(res.frequency - f0) / f0).toBeLessThan(0.015);
    }
  });

  it('Rejeita sinal de baixíssima energia (RMS < 0.005) como silêncio acústico', () => {
    const numSamples = Math.floor(0.2 * sampleRate);
    const faintSignal = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      faintSignal[i] = 0.001 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }

    const res = estimatePitchAutocorrelation(faintSignal, sampleRate);
    expect(res).toBeNull();
  });

  it('Comprova o limite acústico: sinal polifônico denso (tríade C-E-G) não isola notas individuais sem separação de fonte', () => {
    const duration = 0.25;
    const numSamples = Math.floor(duration * sampleRate);
    const triad = new Float32Array(numSamples);

    // Tríade C4 (261.63), E4 (329.63), G4 (392.00)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      triad[i] =
        0.33 * Math.sin(2 * Math.PI * 261.63 * t) +
        0.33 * Math.sin(2 * Math.PI * 329.63 * t) +
        0.33 * Math.sin(2 * Math.PI * 392.00 * t);
    }

    const res = estimatePitchAutocorrelation(triad, sampleRate);
    // Em mistura polifônica densa, o estimador monofônico detecta apenas o pico resultante de batimento/interferência
    // (ex: 65 = F4), comprovando matematicamente que não consegue separar as notas reais da tríade (C4=60, E4=64, G4=67)
    // sem separação prévia de stems.
    expect(res).not.toBeNull();
    if (res) {
      expect([60, 64, 67]).not.toContain(res.midi);
    }
  });
});

describe('Active Listener Gate D: Histerese de Trajetória e Imunidade a Ruído', () => {
  it('Schmitt Trigger ignora micro-jitter de ruído (±4 cents) e NÃO detecta vibrato falso', () => {
    // 40 pontos com pitch médio 64.0 (E4) e ruído oscilante de ±0.04 semitons (±4 cents)
    const noisyTrajectory = [];
    for (let i = 0; i < 40; i++) {
      const t = i * 0.015;
      const noise = (i % 2 === 0 ? 1 : -1) * 0.04; // oscilação rápida dentro da banda morta de 8 cents
      noisyTrajectory.push({
        time: t,
        midi: 64.0 + noise,
        clarity: 0.9,
      });
    }

    const res = analyzePitchTrajectory(noisyTrajectory);
    // Histerese rejeita o ruído -> zero_crossings não atinge o limiar
    expect(res.vibratoDetected).toBe(false);
    expect(res.detectedTechniques).not.toContain('vibrato');
  });

  it('Schmitt Trigger detecta com precisão vibrato legítimo que ultrapassa a banda de histerese (±35 cents a 5 Hz)', () => {
    const vibratoTrajectory = [];
    for (let i = 0; i < 40; i++) {
      const t = i * 0.015; // 0.6s total
      // Modulação de ±0.35 semitons (±35 cents) a 5.0 Hz
      const osc = 0.35 * Math.sin(2 * Math.PI * 5 * t);
      vibratoTrajectory.push({
        time: t,
        midi: 69.0 + osc,
        clarity: 0.95,
      });
    }

    const res = analyzePitchTrajectory(vibratoTrajectory);
    expect(res.vibratoDetected).toBe(true);
    expect(res.vibratoRateHz).toBeCloseTo(5.0, 0);
    expect(res.vibratoDepthCents).toBeGreaterThanOrEqual(30);
    expect(res.detectedTechniques).toContain('vibrato');
  });
});
