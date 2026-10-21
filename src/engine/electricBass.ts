// src/engine/electricBass.ts
// Ontabs Electric Bass Engine (Phase Gate 2 & 3)
// Modelagem idiomática de contrabaixo elétrico convencional (distinto do contrabaixo acústico/upright).
// Suporte a 4, 5 e 6 cordas, ergonomia de escala (long scale 34", short scale 30"), técnicas e afinações.

import { MusicalNoteEvent } from './intermediateRepresentation';

export type ElectricBassStringCount = 4 | 5 | 6;

export type BassTechnique =
  | 'fingerstyle_pluck'
  | 'pick_strike'
  | 'slap_thumb'
  | 'pop_index'
  | 'ghost_note'
  | 'hammer_on'
  | 'pull_off'
  | 'slide'
  | 'vibrato';

export interface BassTuningModel {
  name: string;
  stringCount: ElectricBassStringCount;
  stringNotes: string[]; // Do mais grave ao mais agudo (ex: B0, E1, A1, D2, G2)
  stringMidis: number[]; // MIDI pitch correspondente
  fundamentalFrequencies: number[]; // Hz
}

export const ELECTRIC_BASS_TUNINGS: Record<string, BassTuningModel> = {
  // 4 Cordas
  standard_4: {
    name: 'Standard 4 Cordas (EADG)',
    stringCount: 4,
    stringNotes: ['E1', 'A1', 'D2', 'G2'],
    stringMidis: [28, 33, 38, 43],
    fundamentalFrequencies: [41.2, 55.0, 73.42, 98.0],
  },
  drop_d_4: {
    name: 'Drop D 4 Cordas (DADG)',
    stringCount: 4,
    stringNotes: ['D1', 'A1', 'D2', 'G2'],
    stringMidis: [26, 33, 38, 43],
    fundamentalFrequencies: [36.71, 55.0, 73.42, 98.0],
  },
  half_step_down_4: {
    name: 'Eb Standard 4 Cordas (Eb-Ab-Db-Gb)',
    stringCount: 4,
    stringNotes: ['Eb1', 'Ab1', 'Db2', 'Gb2'],
    stringMidis: [27, 32, 37, 42],
    fundamentalFrequencies: [38.89, 51.91, 69.3, 92.5],
  },
  whole_step_down_4: {
    name: 'D Standard 4 Cordas (DGCF)',
    stringCount: 4,
    stringNotes: ['D1', 'G1', 'C2', 'F2'],
    stringMidis: [26, 31, 36, 41],
    fundamentalFrequencies: [36.71, 49.0, 65.41, 87.31],
  },

  // 5 Cordas
  standard_5: {
    name: 'Standard 5 Cordas (BEADG)',
    stringCount: 5,
    stringNotes: ['B0', 'E1', 'A1', 'D2', 'G2'],
    stringMidis: [23, 28, 33, 38, 43],
    fundamentalFrequencies: [30.87, 41.2, 55.0, 73.42, 98.0],
  },
  high_c_5: {
    name: 'Tenor 5 Cordas (EADGC)',
    stringCount: 5,
    stringNotes: ['E1', 'A1', 'D2', 'G2', 'C3'],
    stringMidis: [28, 33, 38, 43, 48],
    fundamentalFrequencies: [41.2, 55.0, 73.42, 98.0, 130.81],
  },

  // 6 Cordas
  standard_6: {
    name: 'Standard 6 Cordas (BEADGC)',
    stringCount: 6,
    stringNotes: ['B0', 'E1', 'A1', 'D2', 'G2', 'C3'],
    stringMidis: [23, 28, 33, 38, 43, 48],
    fundamentalFrequencies: [30.87, 41.2, 55.0, 73.42, 98.0, 130.81],
  },
};

export interface BassFretboardPosition {
  stringIndex: number; // 1 = corda mais aguda, 4/5/6 = corda mais grave
  fret: number; // 0 = corda solta, 1..24
  midi: number;
  frequencyHz: number;
  ergonomicHandPosition: number; // casa base da mão esquerda
  reachDifficulty: number; // 0..10 de esforço de abertura de mão
}

export interface BassTabNote {
  timestamp: number;
  duration: number;
  stringIndex: number;
  fret: number;
  midi: number;
  technique: BassTechnique;
  ghostNote?: boolean;
}

export interface BassTrackTranscription {
  tuning: BassTuningModel;
  scaleLengthInches: 30 | 32 | 34 | 35;
  totalNotes: number;
  notes: BassTabNote[];
  techniqueDistribution: Record<BassTechnique, number>;
  averageFret: number;
  warnings: string[];
}

/**
 * Mapeia todas as posições possíveis no braço do baixo elétrico para um determinado pitch MIDI.
 */
export function getBassPositionsForMidi(
  midi: number,
  tuning: BassTuningModel = ELECTRIC_BASS_TUNINGS.standard_4,
  maxFrets = 24
): BassFretboardPosition[] {
  const positions: BassFretboardPosition[] = [];

  // Percorre as cordas. Por convenção de tablatura de baixo:
  // Corda 1 = mais aguda (G no 4 cordas)
  // Corda N = mais grave (E no 4 cordas, B no 5 cordas)
  for (let s = 0; s < tuning.stringCount; s++) {
    // stringMidis[0] é o mais grave; na tablatura a corda mais aguda é a 1
    const openMidi = tuning.stringMidis[s];
    const fret = midi - openMidi;

    if (fret >= 0 && fret <= maxFrets) {
      const stringIndex = tuning.stringCount - s; // 1 = mais aguda, N = mais grave
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      // Ergonomia de baixo elétrico (escala 34"): casas 1 a 5 têm espaçamento largo (~3.5cm a 2.7cm)
      // O esforço diminui conforme sobe o braço
      const fretDistanceFactor = fret === 0 ? 0 : Math.max(1, 10 - fret * 0.35);
      const stringCrossFactor = (tuning.stringCount - stringIndex) * 0.5;

      positions.push({
        stringIndex,
        fret,
        midi,
        frequencyHz: Number(freq.toFixed(2)),
        ergonomicHandPosition: fret === 0 ? 0 : Math.max(1, fret - 2),
        reachDifficulty: Number((fretDistanceFactor + stringCrossFactor).toFixed(2)),
      });
    }
  }

  return positions;
}

/**
 * Otimiza a digitação da linha de baixo elétrico usando caminho mínimo (Dijkstra idiomático para baixo).
 * Favorece a posição de mão económica (box de 4 casas), minimiza saltos verticais bruscos e
 * prefere cordas soltas ou casas 1-7 para graves encorpados característicos do instrumento.
 */
export function optimizeBassFingerings(
  notes: MusicalNoteEvent[],
  tuning: BassTuningModel = ELECTRIC_BASS_TUNINGS.standard_4,
  scaleLength: 30 | 32 | 34 | 35 = 34
): BassTabNote[] {
  if (notes.length === 0) return [];

  const scaleFactor = scaleLength / 34;
  const tabNotes: BassTabNote[] = [];
  let currentHandPosition = 3; // Posição padrão na 3ª casa (típico de groove de baixo)

  for (const n of notes) {
    const candidatePositions = getBassPositionsForMidi(n.midi, tuning);

    if (candidatePositions.length === 0) {
      // Fora da tessitura física do instrumento: registra na corda mais próxima
      tabNotes.push({
        timestamp: n.timestamp,
        duration: n.duration,
        stringIndex: 1,
        fret: 0,
        midi: n.midi,
        technique: 'fingerstyle_pluck',
      });
      continue;
    }

    // Avalia o custo de cada posição candidata em relação à posição da mão
    let bestPos = candidatePositions[0];
    let minCost = Infinity;

    for (const pos of candidatePositions) {
      let cost = 0;

      if (pos.fret === 0) {
        // Corda solta no baixo é muito bem-vinda para ancoragem e sustentação de graves
        cost += 1.5;
      } else {
        const handDistance = Math.abs(pos.fret - currentHandPosition);
        cost += handDistance * 2.0 * scaleFactor;

        // No baixo escala 34", casas além da 12 têm timbre mais percussivo e menos fundamental potente
        if (pos.fret > 12) {
          cost += (pos.fret - 12) * 1.5;
        }

        // Favorece a região grave/fundamental (casas 0 a 7)
        if (pos.fret <= 7) {
          cost -= 1.0;
        }
      }

      if (cost < minCost) {
        minCost = cost;
        bestPos = pos;
      }
    }

    if (bestPos.fret > 0) {
      currentHandPosition = bestPos.fret;
    }

    // Detecta técnica inferida: ghost note (duração minúscula < 60ms) ou pluck padrão
    let tech: BassTechnique = 'fingerstyle_pluck';
    const isGhost = n.duration < 0.06;
    if (isGhost) {
      tech = 'ghost_note';
    }

    tabNotes.push({
      timestamp: n.timestamp,
      duration: n.duration,
      stringIndex: bestPos.stringIndex,
      fret: bestPos.fret,
      midi: n.midi,
      technique: tech,
      ghostNote: isGhost,
    });
  }

  return tabNotes;
}

/**
 * Gera a transcrição e análise completa de uma pista de baixo elétrico convencional.
 */
export function transcribeElectricBass(
  notes: MusicalNoteEvent[],
  tuning: BassTuningModel = ELECTRIC_BASS_TUNINGS.standard_4,
  scaleLength: 30 | 32 | 34 | 35 = 34
): BassTrackTranscription {
  const warnings: string[] = [];
  const lowestTuningMidi = tuning.stringMidis[0];
  const highestTuningMidi = tuning.stringMidis[tuning.stringMidis.length - 1] + 24;

  const outOfRange = notes.filter((n) => n.midi < lowestTuningMidi || n.midi > highestTuningMidi);
  if (outOfRange.length > 0) {
    warnings.push(
      `${outOfRange.length} nota(s) encontram-se fora da extensão física do baixo elétrico ${tuning.name} (MIDI ${lowestTuningMidi}-${highestTuningMidi}).`
    );
  }

  const tabNotes = optimizeBassFingerings(notes, tuning, scaleLength);

  const techniqueDistribution: Record<BassTechnique, number> = {
    fingerstyle_pluck: 0,
    pick_strike: 0,
    slap_thumb: 0,
    pop_index: 0,
    ghost_note: 0,
    hammer_on: 0,
    pull_off: 0,
    slide: 0,
    vibrato: 0,
  };

  let totalFret = 0;
  for (const tn of tabNotes) {
    techniqueDistribution[tn.technique] = (techniqueDistribution[tn.technique] || 0) + 1;
    totalFret += tn.fret;
  }

  const averageFret = tabNotes.length > 0 ? Number((totalFret / tabNotes.length).toFixed(1)) : 0;

  return {
    tuning,
    scaleLengthInches: scaleLength,
    totalNotes: tabNotes.length,
    notes: tabNotes,
    techniqueDistribution,
    averageFret,
    warnings,
  };
}
