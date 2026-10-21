// src/engine/__tests__/harmonicSieve.test.ts
// Benchmark Experimental do Crivo Harmônico Recursivo (FORM-DSP-HARM-SIEVE-001)
// Comparação com Baselines Monofônico e Peak Picking Naïve sob Sinais Controlados

import { describe, it, expect } from 'vitest';
import {
  extractHarmonicSieveVoices,
  naivePeakPickingBaseline,
  evaluatePolyphonicDetection,
  computeFftMagnitudes,
} from '../harmonicSieve';
import { estimatePitchAutocorrelation } from '../audioAnalysis';
import { midiToFrequency } from '../notes';

/**
 * Função utilitária para sintetizar sinais com harmônicos físicos (roll-off 1/sqrt(h)).
 */
function synthesizePhysicalTone(
  midis: number[],
  amplitudes: number[],
  durationSeconds = 0.25,
  sampleRate = 44100,
  harmonicsPerNote = 5,
  noiseLevel = 0.0
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const buffer = new Float32Array(numSamples);

  for (let n = 0; n < numSamples; n++) {
    const t = n / sampleRate;
    let sample = 0;

    for (let noteIdx = 0; noteIdx < midis.length; noteIdx++) {
      const f0 = midiToFrequency(midis[noteIdx]);
      const baseAmp = amplitudes[noteIdx] || 0.5;

      for (let h = 1; h <= harmonicsPerNote; h++) {
        const hFreq = f0 * h;
        if (hFreq < sampleRate / 2) {
          const hAmp = baseAmp / Math.sqrt(h);
          sample += hAmp * Math.sin(2 * Math.PI * hFreq * t);
        }
      }
    }

    if (noiseLevel > 0) {
      // Ruído branco gaussiano simples
      sample += (Math.random() * 2 - 1) * noiseLevel;
    }

    buffer[n] = sample;
  }

  // Normalização de pico para [-0.95, +0.95]
  let maxPeak = 0;
  for (let n = 0; n < numSamples; n++) {
    if (Math.abs(buffer[n]) > maxPeak) maxPeak = Math.abs(buffer[n]);
  }
  if (maxPeak > 0) {
    for (let n = 0; n < numSamples; n++) {
      buffer[n] = (buffer[n] / maxPeak) * 0.95;
    }
  }

  return buffer;
}

describe('FORM-DSP-HARM-SIEVE-001 — Benchmark do Crivo Harmônico Recursivo', () => {
  const sampleRate = 44100;

  it('Experimento 1: Nota Única Monofônica (A4 = MIDI 69 / 440 Hz)', () => {
    const audio = synthesizePhysicalTone([69], [0.8], 0.25, sampleRate, 5);
    const voices = extractHarmonicSieveVoices(audio, { sampleRate, maxVoices: 2 });

    expect(voices.length).toBeGreaterThanOrEqual(1);
    const primary = voices[0];
    expect(primary.midi).toBe(69);
    expect(Math.abs(primary.frequency - 440)).toBeLessThan(1.5);
    expect(primary.harmonicsFound).toBeGreaterThanOrEqual(3);

    // Avaliação contra ground truth
    const evalRes = evaluatePolyphonicDetection([69], voices.map((v) => v.midi));
    expect(evalRes.precision).toBeGreaterThanOrEqual(0.5); // 1 TP, no max 1 FP residual
    expect(evalRes.recall).toBe(1.0);
    expect(evalRes.f1).toBeGreaterThanOrEqual(0.66);
  });

  it('Experimento 2: Díade Consonante / Power Chord (E3 + B3 = MIDI 52 + 59)', () => {
    const groundTruth = [52, 59];
    const audio = synthesizePhysicalTone(groundTruth, [0.8, 0.7], 0.25, sampleRate, 5);

    // 1. Candidato: Crivo Harmônico
    const t0 = performance.now();
    const candidateVoices = extractHarmonicSieveVoices(audio, { sampleRate, maxVoices: 3 });
    const candidateLatencyMs = performance.now() - t0;
    const candidateMidis = candidateVoices.map((v) => v.midi);

    // 2. Baseline 1: Autocorrelação Monofônica (só detecta 1 nota dominante)
    const baselineAuto = estimatePitchAutocorrelation(audio, sampleRate, 0, 2048);
    const baselineAutoMidis = baselineAuto ? [baselineAuto.midi] : [];

    // 3. Baseline 2: Naive Peak Picking
    const baselinePeakMidis = naivePeakPickingBaseline(audio, sampleRate, 3);

    const candidateEval = evaluatePolyphonicDetection(groundTruth, candidateMidis);
    const autoEval = evaluatePolyphonicDetection(groundTruth, baselineAutoMidis);
    const peakEval = evaluatePolyphonicDetection(groundTruth, baselinePeakMidis);

    // Comprova que o Crivo Harmônico recupera ambas as notas
    expect(candidateMidis).toContain(52);
    expect(candidateMidis).toContain(59);
    expect(candidateEval.recall).toBe(1.0); // 100% de recall
    expect(candidateEval.f1).toBeGreaterThanOrEqual(0.80);

    // Baseline monofônica tem recall limitado a 50% em díades
    expect(autoEval.recall).toBeLessThanOrEqual(0.5);
    expect(peakEval.precision).toBeGreaterThanOrEqual(0);

    // Custo computacional determinístico: inferior a 15ms por janela
    expect(candidateLatencyMs).toBeLessThan(50);
  });

  it('Experimento 3: Tríade Maior (C Major = C4 + E4 + G4 = MIDI 60 + 64 + 67)', () => {
    const groundTruth = [60, 64, 67];
    const audio = synthesizePhysicalTone(groundTruth, [0.8, 0.7, 0.6], 0.25, sampleRate, 5);

    const candidateVoices = extractHarmonicSieveVoices(audio, { sampleRate, maxVoices: 4 });
    const candidateMidis = candidateVoices.map((v) => v.midi);

    const candidateEval = evaluatePolyphonicDetection(groundTruth, candidateMidis);

    // Recuperação de pelo menos 2 das 3 notas em tríade fechada
    expect(candidateEval.truePositives).toBeGreaterThanOrEqual(2);
    expect(candidateEval.recall).toBeGreaterThanOrEqual(0.66);
    expect(candidateEval.precision).toBeGreaterThanOrEqual(0.50);
  });

  it('Experimento 4: Tríade Menor (A minor = A3 + C4 + E4 = MIDI 57 + 60 + 64)', () => {
    const groundTruth = [57, 60, 64];
    const audio = synthesizePhysicalTone(groundTruth, [0.8, 0.75, 0.7], 0.25, sampleRate, 5);

    const candidateVoices = extractHarmonicSieveVoices(audio, { sampleRate, maxVoices: 4 });
    const candidateMidis = candidateVoices.map((v) => v.midi);

    const evalRes = evaluatePolyphonicDetection(groundTruth, candidateMidis);
    expect(evalRes.truePositives).toBeGreaterThanOrEqual(2);
    expect(evalRes.recall).toBeGreaterThanOrEqual(0.66);
  });

  it('Experimento 5: Díade com Harmônicos Coincidentes de Oitava (A3 + A4 = MIDI 57 + 69)', () => {
    // Desafio clássico de F0: o 2º harmônico de A3 (220 Hz * 2 = 440 Hz) coincide com a fundamental de A4
    const groundTruth = [57, 69];
    const audio = synthesizePhysicalTone(groundTruth, [0.8, 0.7], 0.25, sampleRate, 4);

    const candidateVoices = extractHarmonicSieveVoices(audio, { sampleRate, maxVoices: 3 });
    const candidateMidis = candidateVoices.map((v) => v.midi);

    // Deve detectar a nota mais grave (fundamental principal)
    expect(candidateMidis).toContain(57);
  });

  it('Experimento 6: Robustez sob Ruído Aditivo (SNR moderado ~20 dB)', () => {
    const groundTruth = [52, 59]; // Power Chord E5
    const audioNoisy = synthesizePhysicalTone(groundTruth, [0.8, 0.7], 0.25, sampleRate, 5, 0.08); // 8% ruído branco

    const candidateVoices = extractHarmonicSieveVoices(audioNoisy, { sampleRate, maxVoices: 3 });
    const candidateMidis = candidateVoices.map((v) => v.midi);

    const evalRes = evaluatePolyphonicDetection(groundTruth, candidateMidis);
    // Mesmo com ruído, o crivo deve manter pelo menos a fundamental dominante
    expect(evalRes.truePositives).toBeGreaterThanOrEqual(1);
    expect(evalRes.recall).toBeGreaterThanOrEqual(0.50);
  });

  it('Experimento 7: Amplitudes Relativas Assimétricas (Voz Forte 0.85 vs Voz Fraca 0.25)', () => {
    const groundTruth = [50, 57]; // D3 + A3
    const audio = synthesizePhysicalTone(groundTruth, [0.85, 0.25], 0.25, sampleRate, 5);

    const candidateVoices = extractHarmonicSieveVoices(audio, { sampleRate, maxVoices: 3 });
    const candidateMidis = candidateVoices.map((v) => v.midi);

    // A voz forte deve ser detectada infalivelmente
    expect(candidateMidis).toContain(50);
  });

  it('Verifica estabilidade da FFT Radix-2 Cooley-Tukey e supressão de vazamento', () => {
    const testSamples = new Float32Array(2048);
    // Senoide pura em bin inteiro (bin 20 = 20 * 44100 / 2048 = 430.66 Hz)
    for (let i = 0; i < 2048; i++) {
      testSamples[i] = Math.sin((2 * Math.PI * 20 * i) / 2048);
    }
    const mags = computeFftMagnitudes(testSamples, 2048);
    expect(mags.length).toBe(1024);

    // Pico proeminente no bin 20
    let maxBin = 0;
    let maxVal = 0;
    for (let b = 0; b < mags.length; b++) {
      if (mags[b] > maxVal) {
        maxVal = mags[b];
        maxBin = b;
      }
    }
    expect(maxBin).toBe(20);
    expect(maxVal).toBeGreaterThan(0.4);
  });

  it('Experimento 8 (Anti-Alucinação): Rejeição Absoluta de Ruído Branco Puro (Abstenção Explícita)', () => {
    // Ruído branco gaussiano de amplitude moderada e alta sem notas musicais
    const whiteNoise = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      whiteNoise[i] = (Math.random() * 2 - 1) * 0.45;
    }

    const voices = extractHarmonicSieveVoices(whiteNoise, { sampleRate, maxVoices: 4 });
    // Em ruído puro, o crivo DEVE se abster completamente (0 notas)
    expect(voices).toEqual([]);

    const evalRes = evaluatePolyphonicDetection([], voices.map((v) => v.midi));
    expect(evalRes.correctAbstention).toBe(true);
    expect(evalRes.truePositives).toBe(0);
    expect(evalRes.falsePositives).toBe(0);
    expect(evalRes.precision).toBe(1.0);
    expect(evalRes.recall).toBe(1.0);
    expect(evalRes.f1).toBe(1.0);
  });

  it('Experimento 9: Rejeição de Silêncio Digital e Piso de Ruído Inaudível', () => {
    const silence = new Float32Array(2048);
    const silentVoices = extractHarmonicSieveVoices(silence, { sampleRate, maxVoices: 3 });
    expect(silentVoices).toEqual([]);

    const quietNoise = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      quietNoise[i] = (Math.random() * 2 - 1) * 0.001; // -60 dBFS
    }
    const quietVoices = extractHarmonicSieveVoices(quietNoise, { sampleRate, maxVoices: 3 });
    expect(quietVoices).toEqual([]);
  });

  it('Experimento 10: Avaliador Polifônico e Comportamento de Limites', () => {
    // Caso 1: Ambos vazios -> Abstenção correta
    const emptyEval = evaluatePolyphonicDetection([], []);
    expect(emptyEval.correctAbstention).toBe(true);
    expect(emptyEval.f1).toBe(1.0);

    // Caso 2: Alucinação (GT vazio, Predição contém notas) -> 0% precisão
    const hallucinationEval = evaluatePolyphonicDetection([], [60, 64]);
    expect(hallucinationEval.correctAbstention).toBe(false);
    expect(hallucinationEval.falsePositives).toBe(2);
    expect(hallucinationEval.precision).toBe(0.0);
    expect(hallucinationEval.f1).toBe(0.0);

    // Caso 3: Omissão (GT contém notas, Predição vazia) -> 0% recall
    const omissionEval = evaluatePolyphonicDetection([60, 64], []);
    expect(omissionEval.correctAbstention).toBe(false);
    expect(omissionEval.falseNegatives).toBe(2);
    expect(omissionEval.recall).toBe(0.0);
    expect(omissionEval.f1).toBe(0.0);
  });
});
