// src/engine/keyDetection.ts
// Algoritmo de Krumhansl-Schmuckler para detecção de tonalidade a partir de distribuição cromática.

import { CHROMATIC_SHARPS } from './notes';

// Perfis cognitivos de Krumhansl & Kessler (1982)
// Pesos percebidos para escala maior e menor
export const KRUMHANSL_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
export const KRUMHANSL_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface KeyResult {
  key: string;       // ex: 'C', 'Am', 'G#', 'Fm'
  root: string;
  mode: 'major' | 'minor';
  confidence: number; // 0..1
  correlation: number;
}

/**
 * Calcula o coeficiente de correlação de Pearson entre dois vetores de 12 dimensões.
 */
function pearsonCorrelation(x: number[] | Float32Array, y: number[]): number {
  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < 12; i++) {
    meanX += x[i];
    meanY += y[i];
  }
  meanX /= 12;
  meanY /= 12;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < 12; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom > 1e-9 ? numerator / denom : 0;
}

/**
 * Detecta a tonalidade mais provável a partir de um vetor de perfil cromático (12 posições).
 */
export function detectKeyFromChroma(chroma: number[] | Float32Array): KeyResult {
  let bestScore = -Infinity;
  let runnerUpScore = -Infinity;
  let bestRoot = 0;
  let bestMode: 'major' | 'minor' = 'major';

  for (let r = 0; r < 12; r++) {
    // Alinha perfil para tônica r
    const majorProfile = new Array(12);
    const minorProfile = new Array(12);
    for (let i = 0; i < 12; i++) {
      majorProfile[i] = KRUMHANSL_MAJOR[(i - r + 12) % 12];
      minorProfile[i] = KRUMHANSL_MINOR[(i - r + 12) % 12];
    }

    const corrMajor = pearsonCorrelation(chroma, majorProfile);
    if (corrMajor > bestScore) {
      runnerUpScore = bestScore;
      bestScore = corrMajor;
      bestRoot = r;
      bestMode = 'major';
    } else if (corrMajor > runnerUpScore) {
      runnerUpScore = corrMajor;
    }

    const corrMinor = pearsonCorrelation(chroma, minorProfile);
    if (corrMinor > bestScore) {
      runnerUpScore = bestScore;
      bestScore = corrMinor;
      bestRoot = r;
      bestMode = 'minor';
    } else if (corrMinor > runnerUpScore) {
      runnerUpScore = corrMinor;
    }
  }

  // Confiança baseada na separação entre o melhor resultado e o segundo melhor
  const separation = bestScore > 0 ? (bestScore - runnerUpScore) / Math.max(0.1, bestScore) : 0;
  const confidence = Math.max(0.15, Math.min(1.0, separation * 2));

  const rootName = CHROMATIC_SHARPS[bestRoot];
  const keyName = bestMode === 'minor' ? `${rootName}m` : rootName;

  return {
    key: keyName,
    root: rootName,
    mode: bestMode,
    confidence: Number(confidence.toFixed(2)),
    correlation: Number(bestScore.toFixed(3)),
  };
}
