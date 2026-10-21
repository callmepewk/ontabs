// src/engine/audioAnalysis.ts
// Motor de Análise de Áudio (DSP) - Ontabs Music Engine
// Envelope RMS, Novelty Flux, Autocorrelação de BPM, Detecção de Compassos e Goertzel Chroma.

import { extractHarmonicSieveVoices } from './harmonicSieve';

export interface AudioEnvelopeResult {
  env: Float32Array;
  flux: Float32Array;
  fps: number; // quadros por segundo
}

/**
 * Calcula o envelope RMS de energia e o fluxo espectral (spectral flux) a partir de amostras de áudio mono.
 */
export function computeEnvelopeAndFlux(
  audioSamples: Float32Array,
  sampleRate: number,
  frameSize = 512
): AudioEnvelopeResult {
  const numFrames = Math.floor(audioSamples.length / frameSize);
  const env = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    let sumSquares = 0;
    const offset = i * frameSize;
    for (let j = 0; j < frameSize; j++) {
      const val = audioSamples[offset + j] || 0;
      sumSquares += val * val;
    }
    env[i] = Math.sqrt(sumSquares / frameSize);
  }

  // Flux: derivada positiva da energia (onsets candidatos)
  const flux = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    flux[i] = Math.max(0, env[i] - env[i - 1]);
  }

  return {
    env,
    flux,
    fps: sampleRate / frameSize,
  };
}

export interface BpmDetectionResult {
  bpm: number;
  confidence: number;
}

/**
 * Estima o BPM de um sinal por autocorrelação do vetor de fluxo entre 60 e 190 BPM.
 */
export function estimateBpmFromFlux(
  flux: Float32Array,
  fps: number,
  minBpm = 60,
  maxBpm = 190
): BpmDetectionResult {
  let bestBpm = 120;
  let maxScore = -1;
  const scores: number[] = [];

  for (let candidateBpm = minBpm; candidateBpm <= maxBpm; candidateBpm += 1.0) {
    const lag = Math.round((60 / candidateBpm) * fps);
    if (lag < 2 || lag >= flux.length) continue;

    let corr = 0;
    const count = flux.length - lag;
    for (let i = lag; i < flux.length; i++) {
      corr += flux[i] * flux[i - lag];
    }
    const score = corr / count;
    scores.push(score);

    if (score > maxScore) {
      maxScore = score;
      bestBpm = candidateBpm;
    }
  }

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 1;
  const confidence = avgScore > 0 ? Math.min(1.0, Math.max(0.15, (maxScore / avgScore - 1) / 2)) : 0.2;

  return {
    bpm: Math.round(bestBpm),
    confidence: Number(confidence.toFixed(2)),
  };
}

/**
 * Gera a grade regular de batidas (beat grid) em segundos baseada no BPM e alinhamento do primeiro onset forte.
 */
export function generateBeatGrid(
  bpm: number,
  durationSeconds: number,
  flux: Float32Array,
  fps: number
): number[] {
  const beatInterval = 60 / Math.max(30, bpm);
  let bestOffset = 0;
  let maxEnergy = -1;

  // Busca o offset de fase ideal no primeiro compasso
  for (let offset = 0; offset < beatInterval; offset += 0.01) {
    let energy = 0;
    for (let t = offset; t < Math.min(durationSeconds, 30); t += beatInterval) {
      const idx = Math.round(t * fps);
      energy += flux[idx] || 0;
    }
    if (energy > maxEnergy) {
      maxEnergy = energy;
      bestOffset = offset;
    }
  }

  const beats: number[] = [];
  for (let t = bestOffset; t < durationSeconds; t += beatInterval) {
    beats.push(Number(t.toFixed(3)));
  }

  return beats;
}

/**
 * Algoritmo de Goertzel simplificado para extrair energia de uma frequência específica k.
 */
export function goertzelFrequencyEnergy(
  samples: Float32Array,
  start: number,
  length: number,
  targetFreq: number,
  sampleRate: number
): number {
  if (length <= 0 || start + length > samples.length) return 0;

  const k = (length * targetFreq) / sampleRate;
  const omega = (2 * Math.PI * k) / length;
  const coeff = 2 * Math.cos(omega);

  let q0 = 0;
  let q1 = 0;
  let q2 = 0;

  for (let i = 0; i < length; i++) {
    q0 = coeff * q1 - q2 + samples[start + i];
    q2 = q1;
    q1 = q0;
  }

  const power = q1 * q1 + q2 * q2 - coeff * q1 * q2;
  return Math.sqrt(Math.max(0, power)) / length;
}

/**
 * Calcula vetor chroma de 12 posições sobre uma janela temporal de áudio usando filtros Goertzel.
 */
export function extractWindowChroma(
  samples: Float32Array,
  start: number,
  length: number,
  sampleRate: number
): Float32Array {
  const chroma = new Float32Array(12);
  if (length < 256) return chroma;

  // Varre frequências fundamentais correspondentes a notas MIDI 40 (E2) até 84 (C7)
  for (let midi = 40; midi <= 84; midi++) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const energy = goertzelFrequencyEnergy(samples, start, length, freq, sampleRate);
    chroma[midi % 12] += energy;
  }

  // Normalização do vetor
  let maxVal = 0;
  for (let i = 0; i < 12; i++) {
    if (chroma[i] > maxVal) maxVal = chroma[i];
  }
  if (maxVal > 0) {
    for (let i = 0; i < 12; i++) {
      chroma[i] /= maxVal;
    }
  }

  return chroma;
}

export interface PitchDetectionResult {
  frequency: number;
  midi: number;
  cents: number;
  clarity: number; // 0..1
}

/**
 * Estimador de Frequência Fundamental (Pitch) por Autocorrelação de Domínio de Tempo.
 * Rastreia a frequência fundamental F0 de sinais monofônicos (voz, corda individual, solo).
 */
export function estimatePitchAutocorrelation(
  samples: Float32Array,
  sampleRate: number,
  start = 0,
  length = samples.length,
  minFreq = 70,  // ~C#2 (baixo/guitarra grave)
  maxFreq = 1000, // ~B5 (guitarra aguda)
  clarityThreshold = 0.35
): PitchDetectionResult | null {
  const actualLen = Math.min(length, samples.length - start);
  if (actualLen < 256) return null;

  // 1. Calcula energia RMS da janela para rejeitar silêncio
  let sumSq = 0;
  for (let i = 0; i < actualLen; i++) {
    const val = samples[start + i];
    sumSq += val * val;
  }
  const rms = Math.sqrt(sumSq / actualLen);
  if (rms < 0.005) return null; // silêncio acústico

  // 2. Limites de lag de autocorrelação
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.ceil(sampleRate / minFreq);

  if (maxLag >= actualLen) return null;

  // R(0) - autocorrelação no lag zero
  let r0 = 0;
  for (let i = 0; i < actualLen - maxLag; i++) {
    const v = samples[start + i];
    r0 += v * v;
  }
  if (r0 <= 1e-9) return null;

  let bestLag = -1;
  let maxCorr = -Infinity;

  // Busca o pico de autocorrelação no intervalo [minLag, maxLag]
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const count = actualLen - lag;
    for (let i = 0; i < count; i++) {
      corr += samples[start + i] * samples[start + i + lag];
    }
    const normCorr = corr / r0;

    if (normCorr > maxCorr) {
      maxCorr = normCorr;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || maxCorr < clarityThreshold) {
    return null; // Sinal aperiódico ou ruído
  }

  // 3. Interpolação parabólica para refinar o lag fracionário
  let exactLag = bestLag;
  if (bestLag > minLag && bestLag < maxLag) {
    let prev = 0;
    let next = 0;
    for (let i = 0; i < actualLen - (bestLag + 1); i++) {
      prev += samples[start + i] * samples[start + i + bestLag - 1];
      next += samples[start + i] * samples[start + i + bestLag + 1];
    }
    prev /= r0;
    next /= r0;

    const delta = (next - prev) / (2 * (2 * maxCorr - prev - next) + 1e-9);
    if (Math.abs(delta) < 1) {
      exactLag = bestLag + delta;
    }
  }

  const frequency = sampleRate / exactLag;
  if (frequency < minFreq * 0.9 || frequency > maxFreq * 1.1) {
    return null;
  }

  const exactMidi = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(exactMidi);
  const cents = Math.round((exactMidi - midi) * 100);

  return {
    frequency: Number(frequency.toFixed(2)),
    midi,
    cents,
    clarity: Number(Math.min(1.0, Math.max(0.0, maxCorr)).toFixed(2)),
  };
}

export type PitchAnalysisStrategy = 'monophonic' | 'polyphonic_sieve' | 'auto';

export interface FrameNotesExtractionOptions {
  strategy?: PitchAnalysisStrategy; // Padrão: 'monophonic' (preserva compatibilidade absoluta)
  sampleRate?: number;
  clarityThreshold?: number; // Para autocorrelação monofônica (padrão 0.35)
  maxPolyphonicVoices?: number; // Para Crivo Harmônico (padrão 4)
  inharmonicityBeta?: number; // Para Crivo Harmônico (padrão 8.0)
  minRms?: number; // Limiar de silêncio (padrão 0.003)
  minPeakToNoiseRatio?: number; // Para Crivo Harmônico (padrão 4.0)
}

export interface ExtractedFrameNote {
  midi: number;
  frequency: number;
  cents: number;
  confidence: number;
  strategyUsed: 'monophonic' | 'polyphonic_sieve';
}

export interface FrameNotesResult {
  notes: ExtractedFrameNote[];
  strategySelected: 'monophonic' | 'polyphonic_sieve';
  decisionReason: string;
  isAbstention: boolean;
}

/**
 * Ponto de entrada unificado para extração determinística de notas em uma janela temporal de áudio.
 * Permite seleção explícita entre o pipeline monofônico ultrarrápido e o Crivo Harmônico polifônico,
 * com modo 'auto' determinístico e fallback garantido.
 */
export function extractFrameNotes(
  samples: Float32Array,
  sampleRate = 44100,
  options: FrameNotesExtractionOptions = {}
): FrameNotesResult {
  const strategy = options.strategy || 'monophonic';
  const minRms = options.minRms !== undefined ? options.minRms : 0.003;
  const clarityThreshold = options.clarityThreshold !== undefined ? options.clarityThreshold : 0.35;

  // 1. Verificação de Silêncio e Energia RMS Mínima
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i];
  const rms = Math.sqrt(sumSq / (samples.length || 1));
  if (rms < minRms) {
    return {
      notes: [],
      strategySelected: strategy === 'polyphonic_sieve' ? 'polyphonic_sieve' : 'monophonic',
      decisionReason: `Energia RMS (${rms.toFixed(5)}) abaixo do limiar de silêncio (${minRms}).`,
      isAbstention: true,
    };
  }

  // 2. Execução da Estratégia Monofônica Explícita
  if (strategy === 'monophonic') {
    const mono = estimatePitchAutocorrelation(samples, sampleRate, 0, samples.length, 70, 1000, clarityThreshold);
    if (!mono) {
      return {
        notes: [],
        strategySelected: 'monophonic',
        decisionReason: 'Autocorrelação monofônica abaixo do limiar de clareza ou sinal aperiódico.',
        isAbstention: true,
      };
    }
    return {
      notes: [
        {
          midi: mono.midi,
          frequency: mono.frequency,
          cents: mono.cents,
          confidence: mono.clarity,
          strategyUsed: 'monophonic',
        },
      ],
      strategySelected: 'monophonic',
      decisionReason: `Fundamental F0 detectada com clareza ${(mono.clarity * 100).toFixed(1)}%.`,
      isAbstention: false,
    };
  }

  // 3. Execução da Estratégia Polifônica por Crivo Harmônico Explícita
  if (strategy === 'polyphonic_sieve') {
    const sieveVoices = extractHarmonicSieveVoices(samples, {
      sampleRate,
      maxVoices: options.maxPolyphonicVoices || 4,
      inharmonicityBeta: options.inharmonicityBeta || 8.0,
      minRms,
      minPeakToNoiseRatio: options.minPeakToNoiseRatio || 4.0,
    });

    if (sieveVoices.length === 0) {
      // Fallback de segurança: se o crivo polifônico não encontrou vozes, aciona o estimador monofônico
      const monoFallback = estimatePitchAutocorrelation(samples, sampleRate, 0, samples.length, 70, 1000, clarityThreshold);
      if (monoFallback) {
        return {
          notes: [
            {
              midi: monoFallback.midi,
              frequency: monoFallback.frequency,
              cents: monoFallback.cents,
              confidence: monoFallback.clarity,
              strategyUsed: 'monophonic',
            },
          ],
          strategySelected: 'monophonic',
          decisionReason: 'Crivo polifônico não isolou parciais; acionado fallback monofônico de segurança com sucesso.',
          isAbstention: false,
        };
      }

      return {
        notes: [],
        strategySelected: 'polyphonic_sieve',
        decisionReason: 'Crivo polifônico e fallback monofônico abstiveram-se por ausência de parciais determinísticos audíveis.',
        isAbstention: true,
      };
    }

    return {
      notes: sieveVoices.map((v) => ({
        midi: v.midi,
        frequency: v.frequency,
        cents: v.cents,
        confidence: v.saliency,
        strategyUsed: 'polyphonic_sieve',
      })),
      strategySelected: 'polyphonic_sieve',
      decisionReason: `${sieveVoices.length} voz(es) polifônica(s) resolvida(s) pelo crivo harmônico.`,
      isAbstention: false,
    };
  }

  // 4. Estratégia 'auto': Critério Determinístico Baseado em Complexidade Espectral
  const sieveVoices = extractHarmonicSieveVoices(samples, {
    sampleRate,
    maxVoices: options.maxPolyphonicVoices || 4,
    inharmonicityBeta: options.inharmonicityBeta || 8.0,
    minRms,
    minPeakToNoiseRatio: options.minPeakToNoiseRatio || 4.0,
  });

  if (sieveVoices.length >= 2) {
    return {
      notes: sieveVoices.map((v) => ({
        midi: v.midi,
        frequency: v.frequency,
        cents: v.cents,
        confidence: v.saliency,
        strategyUsed: 'polyphonic_sieve',
      })),
      strategySelected: 'polyphonic_sieve',
      decisionReason: `Modo automático: identificadas ${sieveVoices.length} componentes polifônicas concorrentes com suporte harmônico.`,
      isAbstention: false,
    };
  }

  // Se o crivo detectou 0 ou 1 voz, valida com autocorrelação monofônica (mais robusta para solos individuais)
  const mono = estimatePitchAutocorrelation(samples, sampleRate, 0, samples.length, 70, 1000, clarityThreshold);
  if (mono) {
    return {
      notes: [
        {
          midi: mono.midi,
          frequency: mono.frequency,
          cents: mono.cents,
          confidence: mono.clarity,
          strategyUsed: 'monophonic',
        },
      ],
      strategySelected: 'monophonic',
      decisionReason: 'Modo automático: linha monofônica dominante confirmada por autocorrelação temporal.',
      isAbstention: false,
    };
  }

  if (sieveVoices.length === 1 && sieveVoices[0].harmonicsFound >= 3) {
    const v = sieveVoices[0];
    return {
      notes: [
        {
          midi: v.midi,
          frequency: v.frequency,
          cents: v.cents,
          confidence: v.saliency,
          strategyUsed: 'polyphonic_sieve',
        },
      ],
      strategySelected: 'polyphonic_sieve',
      decisionReason: 'Modo automático: nota monofônica resgatada pelo crivo harmônico com múltiplos parciais.',
      isAbstention: false,
    };
  }

  return {
    notes: [],
    strategySelected: 'monophonic',
    decisionReason: 'Modo automático: abstenção por ausência de periodicidade ou energia harmônica consistente.',
    isAbstention: true,
  };
}

