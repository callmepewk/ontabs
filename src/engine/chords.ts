// src/engine/chords.ts
// Teoria Harmônica - Reconhecimento de acordes, fórmulas, projeção cromática e análise de ambiguidade harmônica.

import { pitchClassToChromaticIndex, CHROMATIC_SHARPS } from './notes';

export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | '7'
  | 'maj7'
  | 'min7'
  | 'sus2'
  | 'sus4'
  | '5'
  | 'add9'
  | '9'
  | 'maj9'
  | 'min9'
  | 'm7b5'
  | 'dim7'
  | '7sus4'
  | '6'
  | 'min6';

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
  add9: {
    name: 'Maior com Nona Adicionada',
    suffix: 'add9',
    intervals: [0, 2, 4, 7],
    chromaTemplate: intervalsToChroma([0, 2, 4, 7]),
  },
  '9': {
    name: 'Nona Dominante',
    suffix: '9',
    intervals: [0, 2, 4, 7, 10],
    chromaTemplate: intervalsToChroma([0, 2, 4, 7, 10]),
  },
  maj9: {
    name: 'Sétima Maior e Nona',
    suffix: 'maj9',
    intervals: [0, 2, 4, 7, 11],
    chromaTemplate: intervalsToChroma([0, 2, 4, 7, 11]),
  },
  min9: {
    name: 'Menor com Nona',
    suffix: 'm9',
    intervals: [0, 2, 3, 7, 10],
    chromaTemplate: intervalsToChroma([0, 2, 3, 7, 10]),
  },
  m7b5: {
    name: 'Meio-Diminuto (m7b5)',
    suffix: 'm7b5',
    intervals: [0, 3, 6, 10],
    chromaTemplate: intervalsToChroma([0, 3, 6, 10]),
  },
  dim7: {
    name: 'Sétima Diminuta',
    suffix: 'dim7',
    intervals: [0, 3, 6, 9],
    chromaTemplate: intervalsToChroma([0, 3, 6, 9]),
  },
  '7sus4': {
    name: 'Sétima Sus4',
    suffix: '7sus4',
    intervals: [0, 5, 7, 10],
    chromaTemplate: intervalsToChroma([0, 5, 7, 10]),
  },
  '6': {
    name: 'Maior com Sexta',
    suffix: '6',
    intervals: [0, 4, 7, 9],
    chromaTemplate: intervalsToChroma([0, 4, 7, 9]),
  },
  min6: {
    name: 'Menor com Sexta',
    suffix: 'm6',
    intervals: [0, 3, 7, 9],
    chromaTemplate: intervalsToChroma([0, 3, 7, 9]),
  },
};

// Prioridade canônica de desempate para conjuntos de notas enharmonicamente idênticos (MIR convention)
const QUALITY_PRIORITY: Record<ChordQuality, number> = {
  maj: 10,
  min: 10,
  '7': 9,
  min7: 9,
  maj7: 9,
  m7b5: 8,
  dim7: 8,
  dim: 7,
  aug: 7,
  sus4: 6,
  sus2: 6,
  '5': 6,
  '7sus4': 5,
  add9: 5,
  '9': 5,
  maj9: 5,
  min9: 5,
  '6': 4,
  min6: 4,
};

export interface ChordCandidate {
  name: string;
  root: string;
  quality: ChordQuality;
  score: number; // 0..1
}

export interface AdvancedChordAnalysis {
  primaryChord: ChordCandidate | null;
  candidates: ChordCandidate[];
  isAmbiguous: boolean;
  ambiguityRatio: number; // 0..1 (quanto mais próximo de 1, mais difícil distinguir os primeiros)
  slashChord?: string; // ex: 'D/F#', 'C/E'
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

  candidates.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) > 1e-5) return diff;
    return (QUALITY_PRIORITY[b.quality] ?? 0) - (QUALITY_PRIORITY[a.quality] ?? 0);
  });

  return candidates.slice(0, topK);
}

/**
 * Analisa acordes considerando inversões (baixo independente / slash chords) e calcula ambiguidade harmônica.
 */
export function identifyChordWithAmbiguity(
  chroma: number[] | Float32Array,
  bassPitchClass?: string,
  topK = 5
): AdvancedChordAnalysis {
  const candidates = identifyChordFromChroma(chroma, topK);
  if (candidates.length === 0) {
    return {
      primaryChord: null,
      candidates: [],
      isAmbiguous: false,
      ambiguityRatio: 0,
    };
  }

  const primary = candidates[0];
  let ambiguityRatio = 0;
  let isAmbiguous = false;

  if (candidates.length > 1 && primary.score > 0) {
    ambiguityRatio = candidates[1].score / primary.score;
    // Se o segundo melhor candidato estiver a menos de 5% de distância e tiver score alto
    if (ambiguityRatio >= 0.95 && candidates[1].score >= 0.75) {
      isAmbiguous = true;
    }
  }

  let slashChord: string | undefined;
  if (bassPitchClass) {
    const cleanBass = bassPitchClass.replace(/-?\d+$/, '');
    if (cleanBass && cleanBass !== primary.root) {
      slashChord = `${primary.name}/${cleanBass}`;
    }
  }

  return {
    primaryChord: primary,
    candidates,
    isAmbiguous,
    ambiguityRatio: Math.round(ambiguityRatio * 1000) / 1000,
    slashChord,
  };
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
