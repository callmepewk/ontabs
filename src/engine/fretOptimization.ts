// src/engine/fretOptimization.ts
// Otimizador de digitação (Fret Assignment Optimizer)
// Mapeia notas musicais em posições de braço minimizando custos ergonômicos e mecânicos.

import { FretboardPosition, findPositionsForMidi, INSTRUMENT_CONFIGS } from './tunings';
import { Instrument } from '@/types/domain';

export interface NoteEventToMap {
  id?: string;
  timestamp: number; // segundos
  midi: number;
  duration?: number;
}

export interface OptimizedFretNote {
  timestamp: number;
  midi: number;
  stringNumber: number; // 1 = mais aguda, 6 = mais grave
  fret: number;
  finger: number; // 0 = corda solta, 1..4 = indicador a mindinho
  duration?: number;
}

export interface FretOptimizationWeights {
  fretRangePenalty: number;   // penaliza casas muito agudas (>12, >15, >20)
  openStringBonus: number;    // encoraja cordas soltas para iniciantes / facilidade
  displacementCost: number;   // penaliza saltos laterais de mão
  stringCrossingCost: number; // penaliza trocas desnecessárias de corda
  handSpanLimit: number;      // penaliza aberturas excessivas de mão (> 4 casas)
}

export const DEFAULT_OPTIMIZATION_WEIGHTS: FretOptimizationWeights = {
  fretRangePenalty: 1.5,
  openStringBonus: 0.3,
  displacementCost: 2.0,
  stringCrossingCost: 0.8,
  handSpanLimit: 4,
};

/**
 * Calcula o custo de escolher uma determinada posição candidata, dado o contexto da nota anterior.
 */
function evaluatePositionCost(
  cand: FretboardPosition,
  previous: OptimizedFretNote | null,
  targetPositionAnchor: number, // posição base (ex: 5ª casa)
  weights: FretOptimizationWeights
): number {
  let cost = 0;

  // 1. Penalidade por casas muito altas
  if (cand.fret > 20) {
    cost += weights.fretRangePenalty * 3.0;
  } else if (cand.fret > 15) {
    cost += weights.fretRangePenalty * 1.5;
  } else if (cand.fret > 12) {
    cost += weights.fretRangePenalty * 0.8;
  }

  // 2. Bônus para cordas soltas
  if (cand.fret === 0) {
    cost -= weights.openStringBonus;
  } else {
    // 3. Deslocamento em relação à posição âncora
    cost += (Math.abs(cand.fret - targetPositionAnchor) / 12) * 0.5;
  }

  // 4. Se houver nota anterior, calcula transição física
  if (previous) {
    if (cand.fret > 0 && previous.fret > 0) {
      const fretDistance = Math.abs(cand.fret - previous.fret);
      cost += (fretDistance / 12) * weights.displacementCost;

      if (fretDistance > weights.handSpanLimit) {
        cost += (fretDistance - weights.handSpanLimit) * 2.0;
      }
    }

    if (cand.stringNumber !== previous.stringNumber) {
      cost += weights.stringCrossingCost;
    }
  }

  return cost;
}

/**
 * Otimiza o posicionamento de uma sequência de notas melódicas no braço do instrumento.
 */
export function optimizeFretSequence(
  notes: NoteEventToMap[],
  instrument: Instrument = 'guitar',
  _tuningNotes?: string[],
  weights: FretOptimizationWeights = DEFAULT_OPTIMIZATION_WEIGHTS
): OptimizedFretNote[] {
  const config = INSTRUMENT_CONFIGS[instrument] || INSTRUMENT_CONFIGS.guitar;
  const tuningMidi = config.defaultTuningMidi;
  const maxFret = config.maxFret;

  const result: OptimizedFretNote[] = [];
  let prevNote: OptimizedFretNote | null = null;
  let runningAnchorFret = 5; // Posição neutra padrão no braço

  for (const n of notes) {
    const candidates = findPositionsForMidi(n.midi, tuningMidi, maxFret);

    if (candidates.length === 0) {
      // Nota fora do alcance do instrumento
      continue;
    }

    let bestCand = candidates[0];
    let bestCost = Infinity;

    for (const cand of candidates) {
      const cost = evaluatePositionCost(cand, prevNote, runningAnchorFret, weights);
      if (cost < bestCost) {
        bestCost = cost;
        bestCand = cand;
      }
    }

    // Estima dedo de digitação
    let finger = 0;
    if (bestCand.fret > 0) {
      const relativeOffset = bestCand.fret - Math.max(1, bestCand.fret - 3);
      finger = Math.min(4, Math.max(1, relativeOffset));
      runningAnchorFret = Math.round(runningAnchorFret * 0.8 + bestCand.fret * 0.2);
    }

    const mapped: OptimizedFretNote = {
      timestamp: n.timestamp,
      midi: n.midi,
      stringNumber: bestCand.stringNumber,
      fret: bestCand.fret,
      finger,
      duration: n.duration,
    };

    result.push(mapped);
    prevNote = mapped;
  }

  return result;
}
