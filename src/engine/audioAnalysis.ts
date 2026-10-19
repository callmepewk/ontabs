// src/engine/audioAnalysis.ts
// Motor de Análise de Áudio (DSP) - Ontabs Music Engine
// Envelope RMS, Novelty Flux, Autocorrelação de BPM, Detecção de Compassos e Goertzel Chroma.

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
