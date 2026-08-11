// ontabs-play/chartGenerator.ts
// Converte a tablatura real (TabEvent[]) do OnTabs em um GameChart jogável.
// Isto é o ponto de integração com o parser de tabs já existente no app:
// troque `tabEventsFromOnTabsTrack` pela função real que hoje gera a tab.

import { ChartNote, Difficulty, GameChart, TabEvent } from './types';

interface GenerateOptions {
  songId: string;
  title: string;
  artist: string;
  bpm: number;
  laneCount: 5 | 6;
  difficulty: Difficulty;
  durationSeconds: number;
}

// Cada dificuldade define: densidade de notas mantidas, se aceita acordes,
// e se aceita sustains. Isso preserva fidelidade musical real (não é aleatório:
// sempre um subconjunto do que foi de fato tocado).
const DIFFICULTY_RULES: Record<Difficulty, { keepRatio: number; allowChords: boolean; allowSustain: boolean; minGapMs: number }> = {
  easy:   { keepRatio: 0.35, allowChords: false, allowSustain: true,  minGapMs: 260 },
  medium: { keepRatio: 0.6,  allowChords: true,  allowSustain: true,  minGapMs: 180 },
  hard:   { keepRatio: 0.85, allowChords: true,  allowSustain: true,  minGapMs: 110 },
  expert: { keepRatio: 1.0,  allowChords: true,  allowSustain: true,  minGapMs: 60  },
};

function stringToLane(stringIndex: number, laneCount: number): number {
  // Mapeia a corda/posição da tab para uma lane do highway.
  return ((stringIndex - 1) % laneCount + laneCount) % laneCount;
}

export function generateGameChart(tabEvents: TabEvent[], opts: GenerateOptions): GameChart {
  const rules = DIFFICULTY_RULES[opts.difficulty];
  const sorted = [...tabEvents].sort((a, b) => a.timestamp - b.timestamp);

  const notes: ChartNote[] = [];
  let lastKeptMs = -Infinity;
  let keepCounter = 0;

  sorted.forEach((ev, i) => {
    const nowMs = ev.timestamp * 1000;

    // Filtro de densidade por dificuldade (mantém distribuição uniforme, não aleatória)
    keepCounter += rules.keepRatio;
    const shouldKeepByDensity = keepCounter >= 1;
    if (shouldKeepByDensity) keepCounter -= 1;
    if (!shouldKeepByDensity) return;

    // Evita notas grudadas demais para a dificuldade (jogabilidade real)
    if (nowMs - lastKeptMs < rules.minGapMs) return;

    const isChord = ev.strings.length > 1;
    if (isChord && !rules.allowChords) {
      // Em dificuldades baixas, acorde vira apenas a nota mais grave
      const lane = stringToLane(Math.min(...ev.strings), opts.laneCount);
      notes.push({
        id: `n${i}`,
        timestamp: ev.timestamp,
        lane,
        type: 'note',
      });
    } else if (isChord) {
      const lanes = Array.from(new Set(ev.strings.map((s) => stringToLane(s, opts.laneCount))));
      notes.push({
        id: `n${i}`,
        timestamp: ev.timestamp,
        lane: lanes[0],
        lanes,
        type: 'chord',
      });
    } else if (ev.sustainMs && ev.sustainMs > 200 && rules.allowSustain) {
      notes.push({
        id: `n${i}`,
        timestamp: ev.timestamp,
        lane: stringToLane(ev.strings[0], opts.laneCount),
        type: 'sustain',
        duration: ev.sustainMs,
      });
    } else {
      notes.push({
        id: `n${i}`,
        timestamp: ev.timestamp,
        lane: stringToLane(ev.strings[0], opts.laneCount),
        type: 'note',
      });
    }

    lastKeptMs = nowMs;
  });

  return {
    songId: opts.songId,
    title: opts.title,
    artist: opts.artist,
    bpm: opts.bpm,
    laneCount: opts.laneCount,
    difficulty: opts.difficulty,
    notes,
    durationSeconds: opts.durationSeconds,
  };
}
