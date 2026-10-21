// ontabs-play/gameEngine.ts
//
// Peça central do OnTabs Play.
//
// Regra de performance mais importante do módulo:
// O React NUNCA re-renderiza a cada frame. As notas são desenhadas direto
// em <canvas> por este engine, via requestAnimationFrame. O React só é
// notificado (via subscribe) quando o HUD precisa mudar de fato: um hit,
// um miss, uma mudança de combo/score — nunca a cada tick de animação.

import { GameChart, ChartNote, GameStats, HitResult, HitJudgement } from './types';

export interface IPlayAudioEngine {
  getCurrentTime(): number;
  isPlaying(): boolean;
}

export interface TimingWindowsConfig {
  perfectMs?: number;
  greatMs?: number;
  goodMs?: number;
  missMs?: number;
}

export const DEFAULT_TIMING_WINDOWS: Required<TimingWindowsConfig> = {
  perfectMs: 35,
  greatMs: 70,
  goodMs: 120,
  missMs: 160,
};

export const STRICT_PRO_WINDOWS: Required<TimingWindowsConfig> = {
  perfectMs: 25,
  greatMs: 50,
  goodMs: 100,
  missMs: 150,
};

const BASE_SCORE: Record<HitJudgement, number> = {
  perfect: 100,
  great: 70,
  good: 40,
  miss: 0,
};

const APPROACH_TIME_S = 1.8; // quanto tempo a nota leva pra descer até a hit zone
export const HIGHWAY_LENGTH = 1; // normalizado (0 = topo, 1 = hit zone)

export interface EngineCallbacks {
  onHit?: (result: HitResult, stats: GameStats) => void;
  onStatsChange?: (stats: GameStats) => void;
  onGameEnd?: (stats: GameStats) => void;
}

export interface DrawConfig {
  laneCount: number;
  width: number;
  height: number;
  hitZoneY: number; // px
  laneColors: string[];
}

export class GameEngine {
  private chart: GameChart;
  private audio: IPlayAudioEngine;
  private callbacks: EngineCallbacks;
  private windows: Required<TimingWindowsConfig>;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private drawConfig: DrawConfig | null = null;

  private notes: ChartNote[];
  private stats: GameStats;
  private rafId: number | null = null;
  private running = false;

  constructor(
    chart: GameChart,
    audio: IPlayAudioEngine,
    callbacks: EngineCallbacks = {},
    customWindows: TimingWindowsConfig = {}
  ) {
    this.chart = chart;
    this.audio = audio;
    this.callbacks = callbacks;
    this.windows = { ...DEFAULT_TIMING_WINDOWS, ...customWindows };
    this.notes = chart.notes.map((n) => ({ ...n }));
    this.stats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      multiplier: 1,
      totalNotes: chart.notes.length,
      judged: 0,
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
      accuracy: 100,
    };
  }

  attachCanvas(ctx: CanvasRenderingContext2D, config: DrawConfig) {
    this.ctx2d = ctx;
    this.drawConfig = config;
  }

  updateCanvasConfig(config: Partial<DrawConfig>) {
    if (this.drawConfig) this.drawConfig = { ...this.drawConfig, ...config };
  }

  start(): void {
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.tick();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  /**
   * Executa um ciclo de atualização do jogo.
   * Suporta currentTimeOverride para testes unitários matemáticos determinísticos.
   */
  tick(currentTimeOverride?: number): void {
    const t = currentTimeOverride !== undefined ? currentTimeOverride : this.audio.getCurrentTime();

    // Notas que passaram da janela de miss e não foram tocadas -> miss automático
    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      const diffMs = (t - note.timestamp) * 1000;
      if (diffMs > this.windows.missMs) {
        note.missed = true;
        this.registerJudgement(note, 'miss', diffMs);
      }
    }

    if (this.ctx2d && this.drawConfig) this.draw(t);

    if (t >= this.chart.durationSeconds && !this.audio.isPlaying()) {
      this.stop();
      this.callbacks.onGameEnd?.(this.stats);
    }
  }

  /** Chamado pelo InputManager quando o jogador pressiona a lane correspondente. */
  hitLane(lane: number, currentTimeOverride?: number): HitResult | null {
    const t = currentTimeOverride !== undefined ? currentTimeOverride : this.audio.getCurrentTime();

    // Encontra a nota não julgada mais próxima dessa lane dentro da janela de miss
    let best: ChartNote | null = null;
    let bestDiff = Infinity;
    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      const laneMatches = note.lane === lane || note.lanes?.includes(lane);
      if (!laneMatches) continue;
      const diffMs = Math.abs((t - note.timestamp) * 1000);
      if (diffMs < bestDiff) {
        bestDiff = diffMs;
        best = note;
      }
    }
    if (!best || bestDiff > this.windows.missMs) return null; // nenhuma nota pra acertar agora

    const judgement = this.judge(bestDiff);
    best.hit = true;
    return this.registerJudgement(best, judgement, bestDiff);
  }

  private judge(diffMs: number): HitJudgement {
    if (diffMs <= this.windows.perfectMs) return 'perfect';
    if (diffMs <= this.windows.greatMs) return 'great';
    if (diffMs <= this.windows.goodMs) return 'good';
    return 'miss';
  }

  private registerJudgement(note: ChartNote, judgement: HitJudgement, deltaMs: number): HitResult {
    this.stats.judged += 1;
    if (judgement === 'miss') {
      this.stats.miss += 1;
      this.stats.combo = 0;
      this.stats.multiplier = 1;
    } else {
      this.stats[judgement] += 1;
      this.stats.combo += 1;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
      this.stats.multiplier = this.comboToMultiplier(this.stats.combo);
      this.stats.score += Math.round(BASE_SCORE[judgement] * this.stats.multiplier);
    }
    const hit = this.stats.perfect + this.stats.great + this.stats.good;
    this.stats.accuracy = this.stats.judged > 0 ? Math.round((hit / this.stats.judged) * 1000) / 10 : 100;

    const result: HitResult = { noteId: note.id, judgement, deltaMs };
    this.callbacks.onHit?.(result, { ...this.stats });
    this.callbacks.onStatsChange?.({ ...this.stats });
    return result;
  }

  private comboToMultiplier(combo: number): 1 | 2 | 3 | 4 {
    if (combo >= 30) return 4;
    if (combo >= 20) return 3;
    if (combo >= 10) return 2;
    return 1;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getNotes(): ChartNote[] {
    return this.notes;
  }

  // ---- Renderização (fora do React) ----
  private draw(currentTime: number): void {
    const { ctx2d: ctx, drawConfig: cfg } = this;
    if (!ctx || !cfg) return;
    const { width, height, laneCount, hitZoneY, laneColors } = cfg;

    ctx.clearRect(0, 0, width, height);

    // lanes
    const laneWidth = width / laneCount;
    for (let l = 0; l < laneCount; l++) {
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(l * laneWidth, 0, laneWidth - 2, height);
    }

    // hit zone
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, hitZoneY - 4, width, 8);

    // notas visíveis na janela de aproximação
    for (const note of this.notes) {
      if (note.hit) continue;
      const timeToHit = note.timestamp - currentTime;
      if (timeToHit > APPROACH_TIME_S || timeToHit < -0.3) continue;

      const progress = 1 - timeToHit / APPROACH_TIME_S; // 0 = topo, 1 = hit zone
      const y = progress * hitZoneY;
      const lanes = note.lanes ?? [note.lane];

      for (const lane of lanes) {
        const x = lane * laneWidth + laneWidth / 2;
        const color = note.missed ? 'rgba(255,255,255,0.15)' : laneColors[lane % laneColors.length];
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = note.missed ? 0 : 14;
        const radius = note.type === 'chord' ? 20 : 16;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (note.type === 'sustain' && note.duration) {
          const tailLen = (note.duration / 1000 / APPROACH_TIME_S) * hitZoneY;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.35;
          ctx.fillRect(x - 4, y, 8, tailLen);
          ctx.globalAlpha = 1;
        }
      }
      ctx.shadowBlur = 0;
    }
  }
}
