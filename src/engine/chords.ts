// src/engine/chords.ts
// Teoria Harmônica - Reconhecimento de acordes, fórmulas e projeção cromática.

import { pitchClassToChromaticIndex, CHROMATIC_SHARPS } from './notes';

export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | '7' | 'maj7' | 'min7' | 'sus2' | 'sus4' | '5';

export interface ChordFormula {
  name: string;
  suffix: string;
  intervals: number[]; // semitons a partir da tônica
  chromaTemplate: number[]; // vetor de 12 dimensões (1 se presente, 0 se ausente)
}

function intervalsToChroma(intervals: number[]): number[] {
  const vec = new Array(12).fill(0);
  intervals.forEach((i) => {
    vec[i % 12] = 1;
  });
  return vec;
}

export const CHORD_TEMPLATES: Record<ChordQuality, ChordFormula> = {
  maj: {
    name: 'Maior',
    suffix: '',
    intervals: [0, 4, 7],
    chromaTemplate: intervalsToChroma([0, 4, 7]),
  },
  min: {
    name: 'Menor',
    suffix: 'm',
    intervals: [0, 3, 7],
    chromaTemplate: intervalsToChroma([0, 3, 7]),
  },
  '7': {
    name: 'Sétima dominante',
    suffix: '7',
    intervals: [0, 4, 7, 10],
    chromaTemplate: intervalsToChroma([0, 4, 7, 10]),
  },
  maj7: {
    name: 'Sétima maior',
    suffix: 'maj7',
    intervals: [0, 4, 7, 11],
    chromaTemplate: intervalsToChroma([0, 4, 7, 11]),
  },
  min7: {
    name: 'Menor com sétima',
    suffix: 'm7',
    intervals: [0, 3, 7, 10],
    chromaTemplate: intervalsToChroma([0, 3, 7, 10]),
  },
  dim: {
    name: 'Diminuto',
    suffix: 'dim',
    intervals: [0, 3, 6],
    chromaTemplate: intervalsToChroma([0, 3, 6]),
  },
  aug: {
    name: 'Aumentado',
    suffix: 'aug',
    intervals: [0, 4, 8],
    chromaTemplate: intervalsToChroma([0, 4, 8]),
  },
  sus2: {
    name: 'Sus2',
    suffix: 'sus2',
    intervals: [0, 2, 7],
    chromaTemplate: intervalsToChroma([0, 2, 7]),
  },
  sus4: {
    name: 'Sus4',
    suffix: 'sus4',
    intervals: [0, 5, 7],
    chromaTemplate: intervalsToChroma([0, 5, 7]),
  },
  '5': {
    name: 'Power Chord',
    suffix: '5',
    intervals: [0, 7],
    chromaTemplate: intervalsToChroma([0, 7]),
  },
};

export interface ChordCandidate {
  name: string;
  root: string;
  quality: ChordQuality;
  score: number; // 0..1
}

/**
 * Roda template matching de cosseno entre um chroma vetor de 12 posições e todos os templates de acordes.
 */
export function identifyChordFromChroma(chroma: number[] | Float32Array, topK = 3): ChordCandidate[] {
  let normChroma = 0;
  for (let i = 0; i < 12; i++) {
    normChroma += chroma[i] * chroma[i];
  }
  normChroma = Math.sqrt(normChroma);
  if (normChroma < 1e-6) {
    return [];
  }

  const candidates: ChordCandidate[] = [];

  for (let rootIndex = 0; rootIndex < 12; rootIndex++) {
    const rootName = CHROMATIC_SHARPS[rootIndex];

    for (const [qualityKey, formula] of Object.entries(CHORD_TEMPLATES) as [ChordQuality, ChordFormula][]) {
      // Rotaciona o template para a tônica atual
      let dot = 0;
      let normTemplate = 0;
      for (let i = 0; i < 12; i++) {
        const templateVal = formula.chromaTemplate[(i - rootIndex + 12) % 12];
        dot += chroma[i] * templateVal;
        normTemplate += templateVal * templateVal;
      }
      normTemplate = Math.sqrt(normTemplate);

      const cosineSim = normTemplate > 0 ? dot / (normChroma * normTemplate) : 0;
      const chordName = `${rootName}${formula.suffix}`;

      candidates.push({
        name: chordName,
        root: rootName,
        quality: qualityKey,
        score: Math.max(0, Math.min(1, cosineSim)),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, topK);
}

/**
 * Converte notas explícitas (ex: ['C4', 'E4', 'G4']) em vetor chroma de 12 dimensões.
 */
export function notesToChroma(notes: string[]): number[] {
  const chroma = new Array(12).fill(0);
  notes.forEach((n) => {
    const pitch = n.replace(/-?\d+$/, '');
    const idx = pitchClassToChromaticIndex(pitch);
    chroma[idx] = 1;
  });
  return chroma;
}
