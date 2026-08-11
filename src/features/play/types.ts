// ontabs-play/types.ts
// Tipos centrais do módulo OnTabs Play

export type NoteType = 'note' | 'chord' | 'sustain';

export interface ChartNote {
  id: string;
  timestamp: number;      // segundos, sincronizado com o áudio
  lane: number;            // lane principal (0-indexed)
  lanes?: number[];        // lanes extras, usado em 'chord'
  type: NoteType;
  duration?: number;       // ms, usado em 'sustain'
  hit?: boolean;
  missed?: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface GameChart {
  songId: string;
  title: string;
  artist: string;
  bpm: number;
  laneCount: 5 | 6;
  difficulty: Difficulty;
  notes: ChartNote[];
  durationSeconds: number;
}

// Evento de origem, derivado da tablatura real do OnTabs.
// Isso é o "input" que o ChartGenerator usa para gerar o GameChart.
export interface TabEvent {
  timestamp: number;       // segundos
  strings: number[];       // cordas/posições tocadas simultaneamente (1 = single note, 2+ = chord)
  sustainMs?: number;
}

export type HitJudgement = 'perfect' | 'great' | 'good' | 'miss';

export interface HitResult {
  noteId: string;
  judgement: HitJudgement;
  deltaMs: number;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: 1 | 2 | 3 | 4;
  totalNotes: number;
  judged: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  accuracy: number; // 0-100
}

export interface KeyBindings {
  keyboard: string[];              // 1 tecla por lane, ex: ['a','s','d','f','g']
  gamepadButtons?: number[];       // 1 índice de botão por lane
  gamepadStrumButtons?: number[];  // botões de strum (up/down)
  gamepadOverdriveButton?: number; // botão de overdrive/special
}

export interface ProgressRecord {
  songId: string;
  difficulty: Difficulty;
  bestScore: number;
  bestAccuracy: number;
  maxCombo: number;
  completed: boolean;
  practiceSeconds: number;
  updatedAt: number;
}

export type LearnMode = 'game' | 'tab' | 'chords' | 'rhythm';

export interface GamepadInfo {
  index: number;
  id: string;
  connected: boolean;
  isLikelyGuitar: boolean; // heurística: id contém "guitar" / "hero" / conhecidos
  buttons: number;
  axes: number;
}
