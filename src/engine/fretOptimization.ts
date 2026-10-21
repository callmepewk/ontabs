// src/engine/fretOptimization.ts
// Otimizador de digitação (Fret Assignment Optimizer)
// Mapeia notas musicais em posições de braço minimizando custos ergonômicos e mecânicos.

import { FretboardPosition, findPositionsForMidi, INSTRUMENT_CONFIGS, FrettedInstrument } from './tunings';
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
export function evaluatePositionCost(
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
  const config = INSTRUMENT_CONFIGS[instrument as FrettedInstrument] ?? INSTRUMENT_CONFIGS.guitar;
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

/**
 * Otimizador Global (Dijkstra / Trellis Viterbi) que garante custo matematicamente mínimo
 * em toda a frase musical, ponderando transições de mão e posições no braço.
 */
export function optimizeFretSequenceGlobal(
  notes: NoteEventToMap[],
  instrument: Instrument = 'guitar',
  _tuningNotes?: string[],
  weights: FretOptimizationWeights = DEFAULT_OPTIMIZATION_WEIGHTS
): { path: OptimizedFretNote[]; totalCost: number } {
  if (notes.length === 0) return { path: [], totalCost: 0 };

  const config = INSTRUMENT_CONFIGS[instrument as FrettedInstrument] ?? INSTRUMENT_CONFIGS.guitar;
  const tuningMidi = config.defaultTuningMidi;
  const maxFret = config.maxFret;

  // 1. Gera candidatos por etapa temporal
  const stages: { note: NoteEventToMap; candidates: FretboardPosition[] }[] = [];
  for (const n of notes) {
    const cands = findPositionsForMidi(n.midi, tuningMidi, maxFret);
    if (cands.length > 0) {
      stages.push({ note: n, candidates: cands });
    }
  }

  if (stages.length === 0) return { path: [], totalCost: 0 };

  // 2. Programação Dinâmica / Dijkstra sobre a Trellis
  // dp[stageIndex][candIndex] = { minCost, prevCandIndex }
  type DPNode = { cost: number; prevIdx: number };
  const dp: DPNode[][] = [];

  // Inicializa estágio 0
  dp[0] = stages[0].candidates.map((cand) => {
    const initialCost = evaluatePositionCost(cand, null, 5, weights);
    return { cost: initialCost, prevIdx: -1 };
  });

  // Itera estágios subsequentes
  for (let s = 1; s < stages.length; s++) {
    const prevCands = stages[s - 1].candidates;
    const curCands = stages[s].candidates;
    dp[s] = [];

    for (let c = 0; c < curCands.length; c++) {
      const curCand = curCands[c];
      let minTransitionCost = Infinity;
      let bestPrevIdx = -1;

      for (let p = 0; p < prevCands.length; p++) {
        const prevNodeObj: OptimizedFretNote = {
          timestamp: stages[s - 1].note.timestamp,
          midi: stages[s - 1].note.midi,
          stringNumber: prevCands[p].stringNumber,
          fret: prevCands[p].fret,
          finger: 1,
        };
        const stepCost = evaluatePositionCost(curCand, prevNodeObj, 5, weights);
        const totalSoFar = dp[s - 1][p].cost + stepCost;

        if (totalSoFar < minTransitionCost) {
          minTransitionCost = totalSoFar;
          bestPrevIdx = p;
        }
      }

      dp[s][c] = { cost: minTransitionCost, prevIdx: bestPrevIdx };
    }
  }

  // 3. Identifica o nó terminal com menor custo
  const lastStage = dp[stages.length - 1];
  let minFinalCost = Infinity;
  let bestFinalIdx = -1;
  for (let c = 0; c < lastStage.length; c++) {
    if (lastStage[c].cost < minFinalCost) {
      minFinalCost = lastStage[c].cost;
      bestFinalIdx = c;
    }
  }

  // 4. Backtracking do caminho ótimo
  const path: OptimizedFretNote[] = new Array(stages.length);
  let curIdx = bestFinalIdx;
  for (let s = stages.length - 1; s >= 0; s--) {
    const cand = stages[s].candidates[curIdx];
    path[s] = {
      timestamp: stages[s].note.timestamp,
      midi: stages[s].note.midi,
      stringNumber: cand.stringNumber,
      fret: cand.fret,
      finger: cand.fret > 0 ? Math.min(4, Math.max(1, cand.fret % 4 + 1)) : 0,
      duration: stages[s].note.duration,
    };
    curIdx = dp[s][curIdx].prevIdx;
  }

  return { path, totalCost: Number(minFinalCost.toFixed(4)) };
}

/**
 * Busca Exaustiva para pequenos grafos (oráculo independente para validar Dijkstra).
 */
export function exhaustiveSearchFretSequence(
  notes: NoteEventToMap[],
  instrument: Instrument = 'guitar',
  weights: FretOptimizationWeights = DEFAULT_OPTIMIZATION_WEIGHTS
): { path: OptimizedFretNote[]; totalCost: number } {
  const config = INSTRUMENT_CONFIGS[instrument as FrettedInstrument] ?? INSTRUMENT_CONFIGS.guitar;
  const tuningMidi = config.defaultTuningMidi;
  const maxFret = config.maxFret;

  const candidateLists = notes.map((n) => ({
    note: n,
    cands: findPositionsForMidi(n.midi, tuningMidi, maxFret),
  }));

  let bestCombination: FretboardPosition[] = [];
  let minCost = Infinity;

  function recurse(index: number, currentCombo: FretboardPosition[], currentCost: number) {
    if (index === candidateLists.length) {
      if (currentCost < minCost) {
        minCost = currentCost;
        bestCombination = [...currentCombo];
      }
      return;
    }

    const { cands } = candidateLists[index];
    for (const cand of cands) {
      const prevCand = index > 0 ? currentCombo[index - 1] : null;
      const prevNote: OptimizedFretNote | null = prevCand
        ? {
            timestamp: candidateLists[index - 1].note.timestamp,
            midi: candidateLists[index - 1].note.midi,
            stringNumber: prevCand.stringNumber,
            fret: prevCand.fret,
            finger: 1,
          }
        : null;

      const stepCost = evaluatePositionCost(cand, prevNote, 5, weights);
      recurse(index + 1, [...currentCombo, cand], currentCost + stepCost);
    }
  }

  recurse(0, [], 0);

  const path = bestCombination.map((cand, idx) => ({
    timestamp: candidateLists[idx].note.timestamp,
    midi: candidateLists[idx].note.midi,
    stringNumber: cand.stringNumber,
    fret: cand.fret,
    finger: cand.fret > 0 ? 1 : 0,
    duration: candidateLists[idx].note.duration,
  }));

  return { path, totalCost: Number(minCost.toFixed(4)) };
}
