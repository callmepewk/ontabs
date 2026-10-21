// src/engine/harmonicSieve.ts
// Ontabs Deterministic Music Engine — Crivo Harmônico Recursivo (Harmonic Sieve)
// FORM-DSP-HARM-SIEVE-001: Decomposição Polifônica Determinística sem Redes Neurais
// Autor da Hipótese: Chief Scientific Architect / OnTabs DSP Engineering

import { frequencyToMidi } from './notes';

export interface SieveCandidateVoice {
  frequency: number;
  midi: number;
  cents: number;
  saliency: number; // 0..1
  harmonicsFound: number;
  harmonicEnergies: number[];
}

export interface HarmonicSieveOptions {
  sampleRate?: number;
  windowSize?: number; // Padrão: 2048
  maxVoices?: number; // Padrão: 4 (díades, tríades, tétrades)
  minFreq?: number; // Padrão: 70 Hz (E2)
  maxFreq?: number; // Padrão: 1000 Hz (B5)
  harmonicsCount?: number; // Padrão: 6 harmônicos por fundamental
  inharmonicityBeta?: number; // Padrão: 8.0 (penalidade de desvio de corda)
  minSaliencyRatio?: number; // Padrão: 0.15 (15% da saliência da fundamental mais forte)
  minRms?: number; // Padrão: 0.003 (limiar de energia audível)
  minPeakToNoiseRatio?: number; // Padrão: 4.0 (rejeição de ruído estocástico aperiódico)
}

export interface PolyphonicEvaluationResult {
  groundTruth: number[];
  detected: number[];
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
  correctAbstention: boolean;
  centsErrors: number[];
  meanCentsError: number;
}

/**
 * Implementação Radix-2 Cooley-Tukey FFT in-place determinística.
 * Janelamento de Hann integrado para supressão de vazamento espectral.
 */
export function computeFftMagnitudes(samples: Float32Array, windowSize = 2048): Float32Array {
  // Ajusta para potência de 2
  const N = windowSize;
  const real = new Float32Array(N);
  const imag = new Float32Array(N);

  // Aplicação da Janela de Hann e cópia
  const len = Math.min(samples.length, N);
  for (let i = 0; i < len; i++) {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    real[i] = samples[i] * hann;
    imag[i] = 0;
  }

  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < N - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;

      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = N >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Cooley-Tukey Radix-2
  for (let lenStep = 2; lenStep <= N; lenStep <<= 1) {
    const halfLen = lenStep >> 1;
    const angle = (-2 * Math.PI) / lenStep;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < N; i += lenStep) {
      let wR = 1.0;
      let wI = 0.0;

      for (let k = 0; k < halfLen; k++) {
        const pos1 = i + k;
        const pos2 = i + k + halfLen;

        const uR = real[pos1];
        const uI = imag[pos1];
        const vR = real[pos2] * wR - imag[pos2] * wI;
        const vI = real[pos2] * wI + imag[pos2] * wR;

        real[pos1] = uR + vR;
        imag[pos1] = uI + vI;
        real[pos2] = uR - vR;
        imag[pos2] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        const nextWI = wR * wStepI + wI * wStepR;
        wR = nextWR;
        wI = nextWI;
      }
    }
  }

  // Magnitudes normalizadas (espectro unilateral N/2)
  const numBins = N >> 1;
  const magnitudes = new Float32Array(numBins);
  for (let i = 0; i < numBins; i++) {
    magnitudes[i] = (2.0 * Math.sqrt(real[i] * real[i] + imag[i] * imag[i])) / N;
  }

  return magnitudes;
}

export interface SpectralPeak {
  bin: number;
  freq: number;
  magnitude: number;
}

/**
 * Extração de picos espectrais com refinamento parabólico de frequência.
 */
export function extractSpectralPeaks(
  magnitudes: Float32Array,
  sampleRate: number,
  windowSize: number,
  threshold = 0.005
): SpectralPeak[] {
  const peaks: SpectralPeak[] = [];
  const binResolution = sampleRate / windowSize;

  for (let i = 2; i < magnitudes.length - 2; i++) {
    const mag = magnitudes[i];
    if (mag > threshold && mag > magnitudes[i - 1] && mag > magnitudes[i + 1]) {
      // Interpolação parabólica sub-bin
      const alpha = magnitudes[i - 1];
      const beta = magnitudes[i];
      const gamma = magnitudes[i + 1];
      const delta = (0.5 * (alpha - gamma)) / (alpha - 2 * beta + gamma);
      const refinedBin = i + delta;
      const refinedFreq = refinedBin * binResolution;

      peaks.push({
        bin: refinedBin,
        freq: refinedFreq,
        magnitude: beta,
      });
    }
  }

  // Ordena por magnitude decrescente
  return peaks.sort((a, b) => b.magnitude - a.magnitude);
}

/**
 * FORM-DSP-HARM-SIEVE-001: Crivo Harmônico Recursivo.
 * Decompõe um espectro polifônico em até N vozes fundamentais por acoplamento harmônico e subtração espectral.
 */
export function extractHarmonicSieveVoices(
  samples: Float32Array,
  options: HarmonicSieveOptions = {}
): SieveCandidateVoice[] {
  const sampleRate = options.sampleRate || 44100;
  const windowSize = options.windowSize || 2048;
  const maxVoices = options.maxVoices || 4;
  const minFreq = options.minFreq || 70;
  const maxFreq = options.maxFreq || 1000;
  const H = options.harmonicsCount || 6;
  const beta = options.inharmonicityBeta || 8.0;
  const minSaliencyRatio = options.minSaliencyRatio || 0.15;
  const minRms = options.minRms !== undefined ? options.minRms : 0.003;
  const minPeakToNoise = options.minPeakToNoiseRatio !== undefined ? options.minPeakToNoiseRatio : 4.0;

  // 0. Gate de Silêncio e Energia Mínima (RMS)
  let sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSq += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sumSq / (samples.length || 1));
  if (rms < minRms) {
    // Silêncio digital ou energia inaudível -> Abstenção explícita honesta
    return [];
  }

  // 1. Transformada Rápida de Fourier (FFT) e Cálculo de Magnitudes
  const magnitudes = computeFftMagnitudes(samples, windowSize);
  const binRes = sampleRate / windowSize;

  // 2. Gate de Tonicidade e Rejeição de Ruído Estocástico (Peak-to-Mean Ratio)
  let magSum = 0;
  let maxMag = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    magSum += magnitudes[i];
    if (magnitudes[i] > maxMag) maxMag = magnitudes[i];
  }
  const meanMag = magSum / (magnitudes.length || 1);
  const peakToMeanRatio = meanMag > 1e-9 ? maxMag / meanMag : 0;
  if (peakToMeanRatio < minPeakToNoise) {
    // Ruído estocástico aperiódico sem proeminência harmônica -> Abstenção explícita
    return [];
  }

  // Cópia mutável para subtração espectral progressiva
  const workingMags = new Float32Array(magnitudes);
  const extractedVoices: SieveCandidateVoice[] = [];
  let maxInitialSaliency = 0;

  for (let voiceIdx = 0; voiceIdx < maxVoices; voiceIdx++) {
    // 3. Extrai picos no espectro de trabalho atual
    const peakThreshold = Math.max(0.002, meanMag * 1.5);
    const peaks = extractSpectralPeaks(workingMags, sampleRate, windowSize, peakThreshold);
    if (peaks.length === 0) break;

    // 4. Avalia saliência de candidatos a fundamental f0
    let bestF0 = 0;
    let bestSaliency = -1;
    let bestHarmonicsFound = 0;
    let bestHarmonicEnergies: number[] = [];

    // Frequências candidatas baseadas nos picos existentes e sub-múltiplos
    const candidateFrequencies: number[] = [];
    for (const peak of peaks) {
      if (peak.freq >= minFreq && peak.freq <= maxFreq) {
        candidateFrequencies.push(peak.freq);
      }
      for (const div of [2, 3]) {
        const subFreq = peak.freq / div;
        if (subFreq >= minFreq && subFreq <= maxFreq) {
          candidateFrequencies.push(subFreq);
        }
      }
    }

    // Varredura de Saliência do Crivo Harmônico
    for (const f0 of candidateFrequencies) {
      let score = 0;
      let harmonicsCount = 0;
      const energies: number[] = [];

      for (let h = 1; h <= H; h++) {
        const targetHarmonicFreq = h * f0;
        if (targetHarmonicFreq >= (sampleRate / 2) - 100) break;

        const targetBin = targetHarmonicFreq / binRes;
        const binInt = Math.round(targetBin);
        if (binInt >= workingMags.length) break;

        // Procura pico mais próximo na vizinhança de ±2 bins
        let localMax = 0;
        let localMaxFreq = targetHarmonicFreq;
        const searchRange = 2;
        for (let b = Math.max(0, binInt - searchRange); b <= Math.min(workingMags.length - 1, binInt + searchRange); b++) {
          if (workingMags[b] > localMax) {
            localMax = workingMags[b];
            localMaxFreq = b * binRes;
          }
        }

        const minHarmonicThreshold = Math.max(0.001, meanMag * 1.5);
        if (localMax > minHarmonicThreshold) {
          const freqDist = Math.abs(localMaxFreq - targetHarmonicFreq) / targetHarmonicFreq;
          // Ponderação física: 1/sqrt(h) * energia / (1 + beta * desvio)
          const weight = 1.0 / Math.sqrt(h);
          const contribution = (weight * localMax) / (1.0 + beta * freqDist);
          score += contribution;
          harmonicsCount++;
          energies.push(localMax);
        } else {
          energies.push(0);
        }
      }

      if (score > bestSaliency && harmonicsCount >= 2) {
        bestSaliency = score;
        bestF0 = f0;
        bestHarmonicsFound = harmonicsCount;
        bestHarmonicEnergies = energies;
      }
    }

    // Se nenhuma fundamental plausível foi encontrada
    if (bestSaliency <= 0 || bestF0 === 0) break;

    // Calibração de corte dinâmico
    if (voiceIdx === 0) {
      maxInitialSaliency = bestSaliency;
    } else if (bestSaliency < maxInitialSaliency * minSaliencyRatio) {
      // Energia residual abaixo do limiar de voz musical independente
      break;
    }

    const midiInfo = frequencyToMidi(bestF0);

    // Evita duplicatas dentro do mesmo semitom
    const alreadyExtracted = extractedVoices.some((v) => Math.abs(v.midi - midiInfo.midi) === 0);
    if (!alreadyExtracted) {
      extractedVoices.push({
        frequency: Number(bestF0.toFixed(2)),
        midi: midiInfo.midi,
        cents: midiInfo.cents,
        saliency: Number((bestSaliency / (maxInitialSaliency || 1)).toFixed(3)),
        harmonicsFound: bestHarmonicsFound,
        harmonicEnergies: bestHarmonicEnergies,
      });
    }

    // 3. Subtração Espectral dos harmônicos da voz identificada
    for (let h = 1; h <= H; h++) {
      const hFreq = h * bestF0;
      const centerBin = Math.round(hFreq / binRes);
      if (centerBin >= workingMags.length) break;

      // Subtração gaussiana sobre 3 bins em torno do centro harmônico
      const sigma = 1.2;
      for (let offset = -2; offset <= 2; offset++) {
        const bin = centerBin + offset;
        if (bin >= 0 && bin < workingMags.length) {
          const attenuation = Math.exp(-(offset * offset) / (2 * sigma * sigma));
          const subAmount = (bestHarmonicEnergies[h - 1] || 0) * attenuation * 0.90; // 90% de remoção para evitar over-subtraction
          workingMags[bin] = Math.max(0, workingMags[bin] - subAmount);
        }
      }
    }
  }

  // Ordena por nota MIDI crescente (baixo para agudo)
  return extractedVoices.sort((a, b) => a.midi - b.midi);
}

/**
 * Baseline 1: Detecção de Picos Espectrais Simples (Peak Picking Naïve).
 * Seleciona os N maiores picos sem agrupamento harmônico.
 */
export function naivePeakPickingBaseline(
  samples: Float32Array,
  sampleRate: number,
  maxPeaks = 4,
  windowSize = 2048
): number[] {
  const mags = computeFftMagnitudes(samples, windowSize);
  const peaks = extractSpectralPeaks(mags, sampleRate, windowSize, 0.01);
  const topPeaks = peaks.slice(0, maxPeaks);
  const midis = topPeaks.map((p) => frequencyToMidi(p.freq).midi);
  return Array.from(new Set(midis)).sort((a, b) => a - b);
}

/**
 * Avaliação objetiva de recuperação polifônica contra Ground Truth conhecido.
 */
export function evaluatePolyphonicDetection(
  groundTruthMidis: number[],
  detectedMidis: number[],
  toleranceSemitones = 0.5
): PolyphonicEvaluationResult {
  const gtMatched = new Set<number>();
  const detMatched = new Set<number>();
  const centsErrors: number[] = [];

  for (let i = 0; i < detectedMidis.length; i++) {
    const det = detectedMidis[i];
    for (let j = 0; j < groundTruthMidis.length; j++) {
      const gt = groundTruthMidis[j];
      if (!gtMatched.has(j) && Math.abs(det - gt) <= toleranceSemitones) {
        gtMatched.add(j);
        detMatched.add(i);
        centsErrors.push(Math.abs(det - gt) * 100);
        break;
      }
    }
  }

  const truePositives = gtMatched.size;
  const falsePositives = detectedMidis.length - truePositives;
  const falseNegatives = groundTruthMidis.length - truePositives;

  let precision = 0;
  let recall = 0;
  let f1 = 0;
  let correctAbstention = false;

  const isGtEmpty = groundTruthMidis.length === 0;
  const isDetEmpty = detectedMidis.length === 0;

  if (isGtEmpty && isDetEmpty) {
    // Ambos vazios: abstenção correta (verdadeiro negativo perfeito)
    precision = 1.0;
    recall = 1.0;
    f1 = 1.0;
    correctAbstention = true;
  } else if (isGtEmpty && !isDetEmpty) {
    // Ruído ou silêncio que gerou notas espúrias: 100% falsos positivos
    precision = 0.0;
    recall = 0.0;
    f1 = 0.0;
    correctAbstention = false;
  } else if (!isGtEmpty && isDetEmpty) {
    // Notas reais não detectadas: 100% falsos negativos
    precision = 0.0;
    recall = 0.0;
    f1 = 0.0;
    correctAbstention = false;
  } else {
    precision = detectedMidis.length > 0 ? truePositives / detectedMidis.length : 0;
    recall = groundTruthMidis.length > 0 ? truePositives / groundTruthMidis.length : 0;
    f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    correctAbstention = false;
  }

  const meanCentsError = centsErrors.length > 0 ? centsErrors.reduce((a, b) => a + b, 0) / centsErrors.length : 0;

  return {
    groundTruth: groundTruthMidis,
    detected: detectedMidis,
    truePositives,
    falsePositives,
    falseNegatives,
    precision: Number(precision.toFixed(3)),
    recall: Number(recall.toFixed(3)),
    f1: Number(f1.toFixed(3)),
    correctAbstention,
    centsErrors,
    meanCentsError: Number(meanCentsError.toFixed(1)),
  };
}
